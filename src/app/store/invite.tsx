import * as Clipboard from 'expo-clipboard';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingScreen } from '@/components/onboarding-screen';
import { AppText } from '@/components/ui/app-text';
import { CopyButton } from '@/components/ui/button';
import { CodeCard } from '@/components/ui/code-card';
import { Toast } from '@/components/ui/toast';
import { storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

const TOAST_DURATION = 2500;

/** ST-02 크루 초대 (매장 코드 확인·복사) */
export default function StoreInviteScreen() {
  const { me } = useSession();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ code?: string; storeName?: string }>();
  const [code, setCode] = useState(params.code ?? '');
  const [error, setError] = useState<string | null>(null);
  // 복사할 때마다 값이 바뀌어 토스트 타이머를 다시 건다. 0 이면 숨김.
  const [copiedAt, setCopiedAt] = useState(0);

  const storeId = me?.membership?.store_id;
  const storeName = params.storeName ?? me?.membership?.store_name ?? '';

  // 매장 생성 직후가 아니라 다시 들어온 경우에는 코드를 서버에서 받아온다.
  useEffect(() => {
    if (code || !storeId) return;
    storeApi
      .inviteCode(storeId)
      .then((result) => setCode(result.code))
      .catch(() => setError('매장 코드를 불러오지 못했어요.'));
  }, [code, storeId]);

  useEffect(() => {
    if (!copiedAt) return;
    const timer = setTimeout(() => setCopiedAt(0), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  const copy = async () => {
    if (!code) return;
    try {
      await Clipboard.setStringAsync(code);
      setError(null);
      setCopiedAt(Date.now());
    } catch {
      setCopiedAt(0);
      setError('복사하지 못했어요. 코드를 길게 눌러 직접 복사해 주세요.');
    }
  };

  return (
    <View style={styles.root}>
      <OnboardingScreen
        appBar={false}
        align="center"
        title="매장이 준비됐어요"
        subtitle="함께 일하는 크루에게 초대 코드를 공유해 주세요"
        cta={{ label: '시작하기', onPress: () => router.replace('/home') }}>
        <View style={styles.content}>
          <CodeCard code={code} storeName={storeName} managerName={me?.display_name ?? ''} />
          <CopyButton onPress={copy} disabled={!code} style={styles.copy} />
          {!!error && (
            <AppText
              variant="body3M"
              color="red900"
              style={styles.error}
              accessibilityLiveRegion="polite">
              {error}
            </AppText>
          )}
        </View>
      </OnboardingScreen>
      {!!copiedAt && (
        // 상태바(53) 아래 10 (프레임 y=63)
        <View style={[styles.toast, { top: insets.top + 10 }]} pointerEvents="none">
          <Toast message="매장 코드를 복사했어요!" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    // 제목 묶음(294)과 카드(334) 사이 40 중 본문 기본 여백 16 을 뺀 값
    paddingTop: 24,
  },
  copy: {
    alignSelf: 'center',
  },
  error: {
    textAlign: 'center',
  },
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
