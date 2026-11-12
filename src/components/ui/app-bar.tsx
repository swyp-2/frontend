import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';

export type AppBarProps = {
  title?: string;
  /**
   * default: 페이지 상단 바 (뒤로가기 + 가운데 제목)
   * store: 홈 상단의 매장 이름 헤더 (상태바 영역 포함 111pt)
   * sheet: 바텀시트 상단 바 (흰 배경, 위쪽 모서리 36pt)
   */
  variant?: 'default' | 'store' | 'sheet';
  /** 넘기면 왼쪽에 뒤로가기 아이콘이 생긴다 */
  onBack?: () => void;
  /** 넘기면 오른쪽에 닫기 아이콘이 생긴다 */
  onClose?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function AppBar({ title, variant = 'default', onBack, onClose, style }: AppBarProps) {
  if (variant === 'store') {
    return (
      <View style={[styles.bar, styles.store, style]}>
        <AppText variant="body1B" numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.bar, styles.page, variant === 'sheet' && styles.sheet, style]}>
      {onBack ? (
        <Pressable accessibilityRole="button" accessibilityLabel="뒤로가기" hitSlop={12} onPress={onBack}>
          <Icon name="back" />
        </Pressable>
      ) : (
        <View style={styles.slot} />
      )}
      {!!title && (
        <AppText variant="body2SB" numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
      )}
      {onClose ? (
        <Pressable accessibilityRole="button" accessibilityLabel="닫기" hitSlop={12} onPress={onClose}>
          <Icon name="x" />
        </Pressable>
      ) : (
        <View style={styles.slot} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  page: {
    height: 58,
    alignItems: 'center',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  store: {
    height: 111,
    alignItems: 'flex-end',
    backgroundColor: Colors.gray100,
  },
  slot: {
    width: 24,
    height: 24,
  },
});
