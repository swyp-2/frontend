import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

const sources = {
  back: require('@/assets/icons/back.svg'),
  x: require('@/assets/icons/x.svg'),
  copy: require('@/assets/icons/copy.svg'),
  'plus-fab': require('@/assets/icons/plus-fab.svg'),
  'profile-off': require('@/assets/icons/profile-off.svg'),
  'profile-on': require('@/assets/icons/profile-on.svg'),
  'rotate-off': require('@/assets/icons/rotate-off.svg'),
  'rotate-on': require('@/assets/icons/rotate-on.svg'),
  'rotate-off-alm': require('@/assets/icons/rotate-off-alm.svg'),
  'rotate-on-alm': require('@/assets/icons/rotate-on-alm.svg'),
  bell: require('@/assets/icons/bell.svg'),
  link: require('@/assets/icons/link.svg'),
  plus: require('@/assets/icons/plus.svg'),
  'right-01': require('@/assets/icons/right-01.svg'),
  'right-02': require('@/assets/icons/right-02.svg'),
  'arrow-01': require('@/assets/icons/arrow-01.svg'),
  'arrow-02': require('@/assets/icons/arrow-02.svg'),
  'complete-green': require('@/assets/icons/complete-green.svg'),
  'complete-red': require('@/assets/icons/complete-red.svg'),
  new: require('@/assets/icons/new.svg'),
  alert: require('@/assets/icons/alert.svg'),
} as const;

export type IconName = keyof typeof sources;

/** Figma 에서 24pt 가 아닌 크기로 그려진 아이콘의 기본 크기 */
const intrinsicSize: Partial<Record<IconName, number>> = {
  'right-02': 16,
  'arrow-02': 16,
  'complete-green': 20,
  'complete-red': 20,
  new: 8,
};

/** Figma 에서 180도 돌려 놓은 컴포넌트. 내보낸 SVG 는 왼쪽을 향하므로 같이 돌린다 */
const flipped: Partial<Record<IconName, true>> = {
  'arrow-01': true,
  'arrow-02': true,
};

type IconProps = {
  name: IconName;
  /** 생략하면 Figma 원본 크기(대부분 24) */
  size?: number;
  style?: StyleProp<ImageStyle>;
};

export function Icon({ name, size = intrinsicSize[name] ?? 24, style }: IconProps) {
  return (
    <Image
      source={sources[name]}
      style={[{ width: size, height: size }, flipped[name] && styles.flipped, style]}
      contentFit="contain"
      accessible={false}
    />
  );
}

/** 숫자 배지: Icon/num */
export function NumBadge({ count, style }: { count: number | string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.num, style]}>
      <AppText variant="body4SB" style={styles.numLabel} numberOfLines={1}>
        {count}
      </AppText>
    </View>
  );
}

const calendarTick = require('@/assets/icons/calendar-vector2.svg');
const calendarLineDark = require('@/assets/icons/calendar-vector4.svg');
const calendarLineLight = require('@/assets/icons/calendar-vector5.svg');

/**
 * 근무표 탭 아이콘. Figma 에서 사각형 + 선 벡터 조합으로 그려져 있어 같은 구성으로 옮겼다.
 */
export function CalendarIcon({ active = false, style }: { active?: boolean; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.calendar, style]}>
      <View style={[styles.calendarBody, active && styles.calendarBodyActive]} />
      <Image source={calendarTick} style={[styles.calendarTick, { left: 5.47 }]} />
      <Image source={calendarTick} style={[styles.calendarTick, { left: 16.32 }]} />
      <Image
        source={active ? calendarLineLight : calendarLineDark}
        style={styles.calendarLine}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
  num: {
    width: 22,
    height: 22,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  numLabel: {
    width: 20,
    textAlign: 'center',
  },
  calendar: {
    width: 24,
    height: 24,
  },
  calendarBody: {
    position: 'absolute',
    left: 3.5,
    top: 4.08,
    width: 17,
    height: 17.485,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Colors.gray900,
  },
  calendarBodyActive: {
    backgroundColor: Colors.gray900,
  },
  calendarTick: {
    position: 'absolute',
    top: 1.44,
    width: 2,
    height: 3.63965,
  },
  calendarLine: {
    position: 'absolute',
    left: 11,
    top: 2.074,
    width: 2,
    height: 11.6919,
    transform: [{ rotate: '90deg' }],
  },
});
