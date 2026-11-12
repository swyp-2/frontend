import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ProfileListItem } from '@/components/ui/list';
import type { ProfileAvatarColor } from '@/components/ui/profile-avatar';
import { Toast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';
import { EmptyState, ErrorState, LoadingState } from '@/features/requests/screen-state';

export type StoreMemberCard = {
  id: number;
  name: string;
  role: string;
  avatarLabel: string;
  avatarColor: ProfileAvatarColor;
};

export type StoreMembersState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; members: StoreMemberCard[] };

export type StoreInfoViewProps = {
  storeName: string;
  members: StoreMembersState;
  /** 매장 코드는 매니저만 볼 수 있다. 넘기지 않으면 복사 버튼을 숨긴다 */
  onCopyCode?: () => void;
  copying?: boolean;
  /** 복사 실패 안내. 버튼 아래에 보인다 */
  copyError?: string | null;
  /** true 인 동안 화면 위에 복사 완료 토스트가 뜬다 */
  copied?: boolean;
  onBack: () => void;
  onRetry: () => void;
};

/** 프로필 - 매장 정보 */
export function StoreInfoView({
  storeName,
  members,
  onCopyCode,
  copying = false,
  copyError,
  copied = false,
  onBack,
  onRetry,
}: StoreInfoViewProps) {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title="매장 정보" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heading}>
          <AppText variant="head24SB" accessibilityRole="header" style={styles.title}>
            {storeName}
          </AppText>
        </View>
        {!!onCopyCode && (
          <View style={styles.copy}>
            <Button
              variant="secondary"
              label="매장 코드 복사하기"
              onPress={onCopyCode}
              disabled={copying}
            />
            {!!copyError && (
              <AppText
                variant="body3M"
                color="red900"
                style={styles.copyError}
                accessibilityLiveRegion="polite">
                {copyError}
              </AppText>
            )}
          </View>
        )}
        {members.status === 'loading' && <LoadingState />}
        {members.status === 'error' && <ErrorState message={members.message} onRetry={onRetry} />}
        {members.status === 'ready' && members.members.length === 0 && (
          <EmptyState message="구성원이 없어요" />
        )}
        {members.status === 'ready' && members.members.length > 0 && (
          <View style={styles.list}>
            {members.members.map((member) => (
              <ProfileListItem
                key={member.id}
                name={member.name}
                role={member.role}
                avatarLabel={member.avatarLabel}
                avatarColor={member.avatarColor}
              />
            ))}
          </View>
        )}
      </ScrollView>
      {copied && (
        // 상태바(53) 아래 10 (매장 코드-복사완료 프레임 y=63)
        <View style={[styles.toast, { top: insets.top + 10 }]} pointerEvents="none">
          <Toast message="매장 코드를 복사했어요!" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  content: {
    flexGrow: 1,
  },
  heading: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  // Figma 의 Head 24 SB 는 자간 -2%(-0.48)인데 theme 토큰에는 0 으로 들어 있어 여기서 맞춘다.
  title: {
    letterSpacing: -0.48,
  },
  copy: {
    gap: 8,
    paddingHorizontal: 24,
  },
  copyError: {
    textAlign: 'center',
  },
  list: {
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  toast: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
