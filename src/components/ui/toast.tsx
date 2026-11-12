import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';

// Toast/Success 에만 쓰이는 색. theme.ts 에 아직 토큰이 없다 (글자색은 Figma 변수 Secondary/Green/900).
const SUCCESS_TEXT = '#27A461';
const SUCCESS_BORDER = '#97D5B4';
const SUCCESS_BACKGROUND = '#EDFAF3';

export type ToastProps = {
  message: string;
  style?: StyleProp<ViewStyle>;
};

/** Toast/Success. 위치(화면 상단 가운데)는 쓰는 쪽에서 잡는다 */
export function Toast({ message, style }: ToastProps) {
  return (
    <View style={[styles.toast, style]} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <Image
        source={require('@/assets/icons/complete-green.svg')}
        style={styles.icon}
        accessible={false}
      />
      <AppText variant="body3SB" numberOfLines={1} style={styles.label}>
        {message}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: SUCCESS_BORDER,
    backgroundColor: SUCCESS_BACKGROUND,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    color: SUCCESS_TEXT,
  },
});
