import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/button';

export type SectionHeaderProps = {
  title: string;
  /** 오른쪽 텍스트 버튼 라벨. onActionPress 와 함께 넘긴다 */
  actionLabel?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function SectionHeader({ title, actionLabel, onActionPress, style }: SectionHeaderProps) {
  return (
    <View style={[styles.header, style]}>
      <AppText variant="body2SB" numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
      {!!actionLabel && <TextButton label={actionLabel} onPress={onActionPress} />}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignSelf: 'stretch',
    height: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
});
