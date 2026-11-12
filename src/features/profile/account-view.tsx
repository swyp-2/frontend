import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';

export type AccountViewProps = {
  name: string;
  /** 매니저 / 크루원 */
  role: string;
  storeName: string;
  /** 시안의 앱 바에는 뒤로가기가 없다. 넘기면 뒤로가기가 생긴다 */
  onBack?: () => void;
  onLeaveStore: () => void;
  onLogout: () => void;
  onWithdraw: () => void;
  /** 나가기·로그아웃·탈퇴 처리 중. 버튼을 모두 막는다 */
  busy?: boolean;
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <AppText variant="body3M" color="gray800" style={styles.rowLabel}>
        {label}
      </AppText>
      <AppText variant="body2M" numberOfLines={1} style={styles.rowValue}>
        {value}
      </AppText>
    </View>
  );
}

/** 프로필 - 계정 설정 */
export function AccountView({
  name,
  role,
  storeName,
  onBack,
  onLeaveStore,
  onLogout,
  onWithdraw,
  busy = false,
}: AccountViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title="계정 설정" onBack={onBack} />
      <View style={styles.body}>
        <View style={styles.card}>
          <InfoRow label="이름" value={name} />
          <InfoRow label="역할" value={role} />
          <InfoRow label="매장" value={storeName} />
        </View>
        <View style={styles.actions}>
          <Button variant="secondary" label="매장 나가기" onPress={onLeaveStore} disabled={busy} />
          <Button variant="secondary" label="로그아웃" onPress={onLogout} disabled={busy} />
        </View>
      </View>
      {/* Btn_S/text 의 밑줄 변형. 공용 TextButton 에는 밑줄이 없어 여기서 그린다 */}
      <Pressable
        accessibilityRole="button"
        onPress={onWithdraw}
        disabled={busy}
        style={({ pressed }) => [
          styles.withdraw,
          { marginBottom: Math.max(insets.bottom, 22) },
          pressed && styles.pressed,
        ]}>
        <AppText variant="body4M" color="gray800" style={styles.underline}>
          탈퇴하기
        </AppText>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  body: {
    flex: 1,
    gap: 24,
    paddingHorizontal: 24,
  },
  card: {
    gap: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 라벨(25) + 간격(55)
  rowLabel: {
    width: 80,
  },
  rowValue: {
    flex: 1,
  },
  actions: {
    gap: 8,
  },
  withdraw: {
    height: 30,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  underline: {
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.8,
  },
});
