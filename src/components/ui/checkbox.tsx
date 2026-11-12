import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

const checkOn = require('@/assets/icons/check-on.svg');
const checkOff = require('@/assets/icons/check-off.svg');
const selectOn = require('@/assets/icons/select-on.svg');
const selectOff = require('@/assets/icons/select-off.svg');

/** 네모 체크 아이콘 (Icon/check, 18pt). 약관 동의 목록에서 쓴다 */
export function CheckIcon({ checked = false }: { checked?: boolean }) {
  return <Image source={checked ? checkOn : checkOff} style={styles.check} accessible={false} />;
}

/** 동그란 선택 아이콘 (Icon/Select, 20pt) */
export function SelectIcon({ selected = false }: { selected?: boolean }) {
  return <Image source={selected ? selectOn : selectOff} style={styles.select} accessible={false} />;
}

export type CheckboxProps = Omit<PressableProps, 'style' | 'children'> & {
  title: string;
  description?: string;
  checked?: boolean;
  /**
   * default: 회색 화면 위 (흰색 → 선택 시 gray200)
   * bottom: 흰 바텀시트 위 (gray100 → 선택 시 gray300)
   */
  variant?: 'default' | 'bottom';
  style?: StyleProp<ViewStyle>;
};

export function Checkbox({
  title,
  description,
  checked = false,
  variant = 'default',
  style,
  ...rest
}: CheckboxProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={[styles.row, rowStyles[variant][checked ? 'on' : 'off'], style]}
      {...rest}>
      <SelectIcon selected={checked} />
      <View style={styles.texts}>
        <AppText variant="body1SB" numberOfLines={1}>
          {title}
        </AppText>
        {!!description && (
          <AppText variant="body3M" color="gray800" numberOfLines={1}>
            {description}
          </AppText>
        )}
      </View>
    </Pressable>
  );
}

const rowStyles = {
  default: StyleSheet.create({
    off: { backgroundColor: Colors.white },
    on: { backgroundColor: Colors.gray200 },
  }),
  bottom: StyleSheet.create({
    off: { backgroundColor: Colors.gray100 },
    on: { backgroundColor: Colors.gray300 },
  }),
};

const styles = StyleSheet.create({
  check: {
    width: 18,
    height: 18,
  },
  select: {
    width: 20,
    height: 20,
  },
  row: {
    alignSelf: 'stretch',
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  texts: {
    flex: 1,
    gap: 4,
  },
});
