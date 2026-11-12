import { Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { SocialLoginButton } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { Colors } from '@/constants/theme';
import { ApiError, type SocialProvider } from '@/lib/api';
import { useSession } from '@/lib/session';
import { requestIdToken, SocialAuthCancelled } from '@/lib/social-auth';

/** CO-01 로그인 */
export default function LoginScreen() {
  const session = useSession();
  const [pending, setPending] = useState<SocialProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (session.status === 'signedIn') return <Redirect href="/" />;

  const login = async (provider: SocialProvider) => {
    if (pending) return;
    setPending(provider);
    setMessage(null);
    try {
      const idToken = await requestIdToken(provider);
      await session.signIn(provider, idToken);
    } catch (error) {
      // 취소는 오류로 안내하지 않고 로그인 화면에 그대로 둔다.
      if (!(error instanceof SocialAuthCancelled)) {
        setMessage(
          error instanceof ApiError && error.status === 401
            ? '로그인에 실패했어요. 다시 시도해 주세요.'
            : error instanceof Error
              ? error.message
              : '로그인에 실패했어요. 다시 시도해 주세요.',
        );
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.logo} pointerEvents="none">
        <Logo color="white" />
      </View>
      <View style={styles.spacer} />
      <View style={styles.actions}>
        {!!message && (
          <AppText variant="body3M" color="red900" style={styles.message}>
            {message}
          </AppText>
        )}
        <SocialLoginButton
          provider="google"
          disabled={!!pending}
          onPress={() => login('google')}
        />
        <SocialLoginButton provider="apple" disabled={!!pending} onPress={() => login('apple')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray900,
  },
  // 로고 중심이 화면 세로 중앙보다 105.6 위에 있다 (로고 높이 56.8 의 절반을 더해 올린다).
  logo: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -134,
    alignItems: 'center',
  },
  spacer: {
    flex: 1,
  },
  actions: {
    gap: 10,
    paddingHorizontal: 24,
    // 프레임 874 중 버튼 묶음이 762 에서 끝난다.
    paddingBottom: 112,
  },
  message: {
    textAlign: 'center',
  },
});
