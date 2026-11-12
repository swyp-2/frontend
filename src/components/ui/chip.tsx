import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type ChipColor = 'blue' | 'orange' | 'purple' | 'green';

export type ChipProps = {
  label: string;
  color?: ChipColor;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, color = 'blue', onPress, style }: ChipProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : 'text'}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, colorStyles[color], pressed && styles.pressed, style]}>
      <AppText variant="body3SB" numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

// Figma variant 이름은 orange 지만 변수는 Secondary/Red 를 쓴다.
const colorStyles = StyleSheet.create({
  blue: { backgroundColor: Colors.blue100, borderColor: Colors.blue200 },
  orange: { backgroundColor: Colors.red100, borderColor: Colors.red200 },
  purple: { backgroundColor: Colors.purple100, borderColor: Colors.purple200 },
  green: { backgroundColor: Colors.green100, borderColor: Colors.green200 },
});

const styles = StyleSheet.create({
  chip: {
    minWidth: 66,
    height: 38,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.8,
  },
});
