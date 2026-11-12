import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type TabProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 탭 한 칸: Tab */
export function Tab({ label, active = false, onPress, style }: TabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive, style]}>
      <AppText variant="body3SB" color={active ? 'gray900' : 'gray700'} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

export type TabItem<T extends string> = { key: T; label: string };

export type TabsProps<T extends string> = {
  /** 2개(Taps/2) 또는 3개(Taps/3). 칸 너비는 균등 분할된다 */
  items: readonly TabItem<T>[];
  value: T;
  onChange?: (key: T) => void;
  style?: StyleProp<ViewStyle>;
};

/** 탭 바: Taps/2, Taps/3 */
export function Tabs<T extends string>({ items, value, onChange, style }: TabsProps<T>) {
  return (
    <View accessibilityRole="tablist" style={[styles.bar, style]}>
      {items.map(({ key, label }) => (
        <Tab
          key={key}
          label={label}
          active={key === value}
          onPress={() => onChange?.(key)}
          style={styles.barTab}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  tab: {
    width: 188,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: Colors.gray100,
    backgroundColor: Colors.gray100,
  },
  tabActive: {
    borderBottomColor: Colors.gray900,
  },
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTab: {
    width: 'auto',
    flex: 1,
  },
});
