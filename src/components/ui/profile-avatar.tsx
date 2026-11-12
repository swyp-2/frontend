import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type ProfileAvatarColor = 'blue' | 'red' | 'purple' | 'green';

export type ProfileAvatarProps = {
  /** 원 안에 들어가는 이름(2글자 기준) */
  label: string;
  color?: ProfileAvatarColor;
  style?: StyleProp<ViewStyle>;
};

/** 이름 아바타: Icon/Profile (blue, red, purple, green) */
export function ProfileAvatar({ label, color = 'blue', style }: ProfileAvatarProps) {
  return (
    <View style={[styles.avatar, colorStyles[color], style]}>
      <AppText variant="body2SB" numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const colorStyles = StyleSheet.create({
  blue: { backgroundColor: Colors.blue100 },
  red: { backgroundColor: Colors.red100 },
  purple: { backgroundColor: Colors.purple100 },
  green: { backgroundColor: Colors.green100 },
});

const styles = StyleSheet.create({
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
});
