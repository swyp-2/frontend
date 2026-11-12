import { Pressable, StyleSheet, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type RadioCardProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  description?: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function RadioCard({ title, description, selected = false, style, ...rest }: RadioCardProps) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      style={[styles.card, selected && styles.selected, style]}
      {...rest}>
      <AppText variant="body1SB">{title}</AppText>
      {!!description && (
        <AppText variant="body2M" color="gray800">
          {description}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    minHeight: 116,
    justifyContent: 'center',
    gap: 5,
    // Figma 여백(18/20)에서 테두리 1 을 뺀 값
    paddingHorizontal: 17,
    paddingVertical: 19,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray400,
    backgroundColor: Colors.gray100,
  },
  selected: {
    borderColor: Colors.gray900,
    backgroundColor: Colors.gray300,
  },
});
