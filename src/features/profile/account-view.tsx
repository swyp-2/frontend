import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ShiftListItem } from '@/components/ui/list';
import { Links } from '@/constants/links';
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
  /** 서비스 이용약관 열기. 아래 링크 콜백은 넘기지 않으면 그 행이 눌리지 않는다 */
  onOpenTerms?: () => void;
  /** 개인정보 처리방침 열기 */
  onOpenPrivacy?: () => void;
  /** 문의 메일 쓰기 */
  onContact?: () => void;
  /** 나가기·로그아웃·탈퇴 처리 중. 버튼과 링크를 모두 막는다 */
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
  onOpenTerms,
  onOpenPrivacy,
  onContact,
  busy = false,
}: AccountViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title="계정 설정" onBack={onBack} />
      {/* 링크 목록이 붙어 작은 화면에서는 넘칠 수 있어 스크롤로 감싼다 */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.body}>
        <View style={styles.card}>
          <InfoRow label="이름" value={name} />
          <InfoRow label="역할" value={role} />
          <InfoRow label="매장" value={storeName} />
        </View>
        {/* 프로필 탭 메뉴와 같은 List 행. onPress 를 비우면 눌리지 않는다 */}
        <View style={styles.links}>
          <ShiftListItem
            title="서비스 이용약관"
            description="약관 전문 보기"
            onPress={busy ? undefined : onOpenTerms}
          />
          <ShiftListItem
            title="개인정보 처리방침"
            description="처리방침 전문 보기"
            onPress={busy ? undefined : onOpenPrivacy}
          />
          <ShiftListItem
            title="문의하기"
            description={Links.contactEmail}
            onPress={busy ? undefined : onContact}
          />
        </View>
        <View style={styles.actions}>
          <Button variant="secondary" label="매장 나가기" onPress={onLeaveStore} disabled={busy} />
          <Button variant="secondary" label="로그아웃" onPress={onLogout} disabled={busy} />
        </View>
      </ScrollView>
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
  scroll: {
    flex: 1,
  },
  body: {
    gap: 24,
    paddingHorizontal: 24,
    paddingBottom: 24,
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
  links: {
    gap: 8,
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
