import type { SocialProvider } from '@/lib/api';

/** 사용자가 소셜 로그인 창을 닫은 경우. 서버를 호출하지 않고 로그인 화면에 머문다 */
export class SocialAuthCancelled extends Error {}

/** 소셜 SDK 가 아직 연결되지 않은 경우 */
export class SocialAuthNotConfigured extends Error {}

/**
 * Google / Apple SDK 로 로그인해 id_token 을 받아온다.
 *
 * TODO: SDK 연결 전이다. 아래가 정해지면 구현한다.
 *  - Google: iOS / Android / Web OAuth 클라이언트 ID (서버 aud 검증 값과 같아야 한다)
 *  - Apple: 앱 번들 ID 와 Sign in with Apple 권한
 * 둘 다 네이티브 모듈이라 Expo Go 가 아닌 개발 빌드가 필요하다.
 */
export async function requestIdToken(provider: SocialProvider): Promise<string> {
  throw new SocialAuthNotConfigured(
    `${provider === 'google' ? 'Google' : 'Apple'} 로그인이 아직 연결되지 않았어요.`,
  );
}
