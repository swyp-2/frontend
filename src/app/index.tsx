import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import { screenPath, useSession } from '@/lib/session';

/**
 * 앱 진입점. 회원 상태를 서버에서 받아 로그인 / 가입 단계 / 근무표로 보낸다.
 * 어느 화면으로 갈지는 서버가 준 next_screen 을 따른다.
 */
export default function Entry() {
  const session = useSession();

  if (session.status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.gray900} />
      </View>
    );
  }

  if (session.status === 'error') {
    return (
      <View style={styles.center}>
        <AppText variant="body2M" color="gray800" style={styles.message}>
          정보를 불러오지 못했어요.{'\n'}연결 상태를 확인한 뒤 다시 시도해 주세요.
        </AppText>
        <Button size="S" label="다시 시도" onPress={session.refresh} />
      </View>
    );
  }

  if (session.status === 'signedOut') return <Redirect href="/login" />;

  return <Redirect href={screenPath[session.me.next_screen]} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
    backgroundColor: Colors.gray100,
  },
  message: {
    textAlign: 'center',
  },
});
