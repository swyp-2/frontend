import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { ProfileListItem } from '@/components/ui/list';
import type { ProfileAvatarColor } from '@/components/ui/profile-avatar';
import { ErrorState, LoadingState } from '@/features/requests/screen-state';
import type { LoadState } from '@/features/schedule/schedule-model';
import { Colors } from '@/constants/theme';

import type { ShiftActionButton, ShiftActionKind } from './shift-model';

const APP_BAR_TITLE = '근무 상세';

export type ShiftDetailContent = {
  /** "11월 5일 (목)" */
  dateLabel: string;
  /** "16:00-22:00" */
  timeLabel: string;
  name: string;
  /** "매니저" / "크루원". 모르면 비운다 */
  role?: string;
  avatarLabel: string;
  avatarColor: ProfileAvatarColor;
  helper?: string;
  buttons: ShiftActionButton[];
};

export type ShiftDetailViewProps = {
  state: LoadState<ShiftDetailContent>;
  onBack?: () => void;
  onRetry?: () => void;
  onAction: (kind: ShiftActionKind) => void;
  /** 처리 중인 행동. 끝날 때까지 모든 버튼을 막는다 */
  busyAction?: ShiftActionKind | null;
  /** 행동 실패 안내 */
  actionError?: string;
};

export function ShiftDetailView({
  state,
  onBack,
  onRetry,
  onAction,
  busyAction = null,
  actionError,
}: ShiftDetailViewProps) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppBar title={APP_BAR_TITLE} onBack={onBack} />
      {state.status === 'loading' && <LoadingState />}
      {state.status === 'error' && <ErrorState message={state.message} onRetry={onRetry} />}
      {state.status === 'ready' && (
        <>
          <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
            <View style={styles.heading}>
              <AppText variant="head24SB" accessibilityRole="header">
                {state.data.dateLabel}
                {'\n'}
                {state.data.timeLabel}
              </AppText>
            </View>
            <View style={styles.body}>
              <ProfileListItem
                name={state.data.name}
                role={state.data.role}
                avatarLabel={state.data.avatarLabel}
                avatarColor={state.data.avatarColor}
              />
              {!!state.data.helper && (
                <AppText variant="body3M" color="gray700">
                  {state.data.helper}
                </AppText>
              )}
            </View>
          </ScrollView>
          {(state.data.buttons.length > 0 || !!actionError) && (
            <View style={styles.footer}>
              {!!actionError && (
                <AppText
                  variant="body3M"
                  color="red900"
                  accessibilityLiveRegion="polite"
                  style={styles.actionError}>
                  {actionError}
                </AppText>
              )}
              {state.data.buttons.map((button) => (
                <Button
                  key={button.kind}
                  label={button.label}
                  variant={button.variant}
                  disabled={busyAction !== null}
                  onPress={() => onAction(button.kind)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scroll: {
    flexGrow: 1,
  },
  heading: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  body: {
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footer: {
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  actionError: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
});
