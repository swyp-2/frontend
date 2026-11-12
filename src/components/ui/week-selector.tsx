import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type DayToggleProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** 요일 토글: Toggle (on/off) */
export function DayToggle({ label, selected = false, onPress, accessibilityLabel, style }: DayToggleProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.toggle, selected && styles.toggleOn, style]}>
      <AppText variant="body2M" color={selected ? 'white' : 'gray700'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const defaultLabels = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type WeekSelectorProps = {
  /** 선택된 요일 인덱스 목록 (0 = 일요일 … 6 = 토요일) */
  value: readonly number[];
  onChange?: (value: number[]) => void;
  labels?: readonly string[];
  style?: StyleProp<ViewStyle>;
};

/** 요일 다중 선택 줄: Week Selector */
export function WeekSelector({ value, onChange, labels = defaultLabels, style }: WeekSelectorProps) {
  const toggle = (index: number) => {
    const next = value.includes(index) ? value.filter((v) => v !== index) : [...value, index];
    onChange?.(next.sort((a, b) => a - b));
  };
  return (
    <View style={[styles.row, style]}>
      {labels.map((label, index) => (
        <DayToggle
          key={index}
          label={label}
          accessibilityLabel={`${label}요일`}
          selected={value.includes(index)}
          onPress={() => toggle(index)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 27,
    backgroundColor: Colors.white,
  },
  toggleOn: {
    backgroundColor: Colors.gray900,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
  },
});
