import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';

/** 사용자가 소셜 로그인 창을 닫은 경우. 서버를 호출하지 않고 로그인 화면에 머문다 */
export class SocialAuthCancelled extends Error {}

/** 이 기기에서 소셜 로그인을 쓸 수 없는 경우(Apple 로그인 미지원 기기) */
export class SocialAuthNotConfigured extends Error {}

const FAILED = '로그인에 실패했어요. 다시 시도해 주세요.';

/**
 * 로그인은 Apple 만 쓴다(2026-11-16 결정). 서버는 Google 도 받지만 앱에는 연결하지 않는다.
 * Apple 버튼을 보여 줄지: iOS 이고 기기가 Sign in with Apple 을 지원할 때만.
 */
export async function isAppleSignInAvailable() {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync().catch(() => false);
}

/** Apple 로 로그인해 서버에 보낼 identityToken 을 받아온다. aud 는 번들 ID(com.swyp.baton)다 */
export async function requestAppleIdToken(): Promise<string> {
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
