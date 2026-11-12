import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';

type StateProps = { style?: StyleProp<ViewStyle> };

export function LoadingState({ style }: StateProps) {
  return (
    <View style={[styles.center, style]} accessibilityLabel="불러오는 중">
      <ActivityIndicator color={Colors.gray900} />
    </View>
  );
}

/** 목록이 비었을 때 가운데 안내 문구 (시안: Body2 16 M, Gray/700) */
export function EmptyState({ message, style }: StateProps & { message: string }) {
  return (
    <View style={[styles.center, style]}>
      <AppText variant="body2M" color="gray700" style={styles.message}>
        {message}
      </AppText>
    </View>
  );
}

/** onRetry 를 넘기지 않으면 다시 시도 버튼 없이 안내만 보인다 */
export function ErrorState({
  message,
  onRetry,
  style,
}: StateProps & { message: string; onRetry?: () => void }) {
  return (
    <View style={[styles.center, style]} accessibilityLiveRegion="polite">
      <AppText variant="body2M" color="gray800" style={styles.message}>
        {message}
      </AppText>
      {!!onRetry && <Button size="S" label="다시 시도" onPress={onRetry} />}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  message: {
    textAlign: 'center',
  },
});
