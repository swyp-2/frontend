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

export type SelectionFieldProps = Omit<PressableProps, 'style' | 'children'> & {
  /** 선택된 값이 없을 때 보이는 안내 문구 */
  placeholder: string;
  /** 선택된 값들. 가운뎃점으로 이어 붙인다. 비어 있으면 empty 상태 */
  values?: string[];
  /** values 뒤에 "외 N명" 으로 붙는 나머지 인원 수 */
  moreCount?: number;
  /** 오른쪽 액션 라벨 (empty / filled) */
  emptyActionLabel?: string;
  filledActionLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function SelectionField({
  placeholder,
  values = [],
  moreCount,
  emptyActionLabel = '추가',
  filledActionLabel = '변경',
  style,
  ...rest
}: SelectionFieldProps) {
  const filled = values.length > 0;
  return (
    <Pressable accessibilityRole="button" style={[styles.field, style]} {...rest}>
      {filled ? (
        <View style={styles.values}>
          <AppText variant="body2SB" numberOfLines={1} style={styles.valueText}>
            {values.join(' · ')}
          </AppText>
          {!!moreCount && <AppText variant="body2SB">외 {moreCount}명</AppText>}
        </View>
      ) : (
        <AppText variant="body2SB" color="gray700" numberOfLines={1} style={styles.valueText}>
          {placeholder}
        </AppText>
      )}
      <View style={styles.action}>
        <AppText variant="body3M" color="gray700">
          {filled ? filledActionLabel : emptyActionLabel}
        </AppText>
        <Image
          source={require('@/assets/icons/right-02.svg')}
          style={styles.chevron}
          accessible={false}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    alignSelf: 'stretch',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  values: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  valueText: {
    flexShrink: 1,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    width: 16,
    height: 16,
  },
});
