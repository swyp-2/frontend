import {
  GoogleSignin,
  isCancelledResponse,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

import type { SocialProvider } from '@/lib/api';

/** 사용자가 소셜 로그인 창을 닫은 경우. 서버를 호출하지 않고 로그인 화면에 머문다 */
export class SocialAuthCancelled extends Error {}

/** 이 빌드나 기기에서 소셜 로그인을 쓸 수 없는 경우(클라이언트 ID 미설정, Apple 로그인 미지원 기기) */
export class SocialAuthNotConfigured extends Error {}

/**
 * Google OAuth 클라이언트 ID. 둘 다 백엔드 aud 허용 목록(BATON_GOOGLE_CLIENT_IDS)에 있어야 한다.
 * webClientId 를 주면 id_token 의 aud 가 Web 클라이언트 ID 가 된다.
 */
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

const FAILED = '로그인에 실패했어요. 다시 시도해 주세요.';

/** Google 버튼을 보여 줄지. 클라이언트 ID 가 없는 빌드에서는 숨긴다 */
export const isGoogleSignInConfigured = !!GOOGLE_IOS_CLIENT_ID && !!GOOGLE_WEB_CLIENT_ID;

/** Apple 버튼을 보여 줄지. iOS 이고 기기가 Sign in with Apple 을 지원할 때만 */
export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

/** Google / Apple SDK 로 로그인해 서버에 보낼 ID 토큰(access token 아님)을 받아온다 */
export async function requestIdToken(provider: SocialProvider): Promise<string> {
  return provider === 'google' ? googleIdToken() : appleIdToken();
}

let googleConfigured = false;

async function googleIdToken(): Promise<string> {
  if (!isGoogleSignInConfigured) {
    throw new SocialAuthNotConfigured('Google 로그인이 아직 설정되지 않았어요.');
  }
  if (!googleConfigured) {
    GoogleSignin.configure({ iosClientId: GOOGLE_IOS_CLIENT_ID, webClientId: GOOGLE_WEB_CLIENT_ID });
    googleConfigured = true;
  }

  // 앱에서 로그아웃한 뒤 다른 계정을 고를 수 있도록 SDK 에 남은 이전 계정을 먼저 지운다.
  await GoogleSignin.signOut().catch(() => undefined);

  try {
    const response = await GoogleSignin.signIn();
    if (isCancelledResponse(response)) throw new SocialAuthCancelled();
    const { idToken } = response.data;
    if (!idToken) throw new Error(FAILED);
    return idToken;
  } catch (error) {
    if (error instanceof SocialAuthCancelled) throw error;
    // 진행 중인 로그인 창이 있으면 새로 띄우지 않는다. 사용자에게 알릴 오류는 아니다.
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) throw new SocialAuthCancelled();
    if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new SocialAuthCancelled();
    }
    throw new Error(FAILED);
  }
}

async function appleIdToken(): Promise<string> {
  if (!(await isAppleSignInAvailable())) {
    throw new SocialAuthNotConfigured('이 기기에서는 Apple 로그인을 쓸 수 없어요.');
  }
  try {
    // 서버는 이름·이메일을 저장하지 않으므로 추가 정보는 요청하지 않는다. 이름은 가입 단계에서 직접 입력받는다.
    const credential = await AppleAuthentication.signInAsync({ requestedScopes: [] });
    if (!credential.identityToken) throw new Error(FAILED);
    return credential.identityToken;
  } catch (error) {
    if (errorCode(error) === 'ERR_REQUEST_CANCELED') throw new SocialAuthCancelled();
    throw new Error(FAILED);
  }
}

/** Expo 모듈 오류의 code (예: ERR_REQUEST_CANCELED) */
function errorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;
}
