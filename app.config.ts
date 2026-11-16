import type { ExpoConfig } from 'expo/config';

/**
 * Google iOS OAuth 클라이언트 ID(…apps.googleusercontent.com). 백엔드 aud 허용 목록(BATON_GOOGLE_CLIENT_IDS)에도 같은 값이 있어야 한다.
 * 값이 없으면 Google 로그인 플러그인을 넣지 않는다(옵션 없이 넣으면 Firebase 설정 파일을 찾다 빌드가 실패한다).
 */
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

/** Google 로그인 콜백 URL 스킴 = iOS 클라이언트 ID를 뒤집은 값 */
const googleIosUrlScheme = googleIosClientId
  ? `com.googleusercontent.apps.${googleIosClientId.replace(/\.apps\.googleusercontent\.com$/, '')}`
  : undefined;

const config: ExpoConfig = {
  name: 'BATON',
  slug: 'baton',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'baton',
  // 화면은 라이트 테마로만 디자인돼 있다. 시스템 다크 모드에서 네이티브 UI만 어두워지지 않게 고정한다.
  userInterfaceStyle: 'light',
  ios: {
    bundleIdentifier: 'com.swyp.baton',
    supportsTablet: false,
    usesAppleSignIn: true,
    config: {
      // OS가 제공하는 암호화(HTTPS 등)만 쓴다. TestFlight의 "Missing Compliance" 대기를 없앤다.
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // 임시: 백엔드가 아직 http://<IP>라 ATS를 끈다. ATS 예외 도메인에는 IP 주소를 쓸 수 없다.
      // 백엔드에 HTTPS 도메인이 생기면 이 항목을 지우고 EXPO_PUBLIC_API_URL을 https로 바꾼다.
      NSAppTransportSecurity: { NSAllowsArbitraryLoads: true },
    },
  },
  android: {
    package: 'com.swyp.baton',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'server',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#1F2125',
        image: './assets/images/splash-icon.png',
        imageWidth: 148,
      },
    ],
    'expo-secure-store',
    'expo-apple-authentication',
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }] as [string, unknown]]
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
