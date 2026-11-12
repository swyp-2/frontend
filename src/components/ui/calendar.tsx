import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { TodayButton } from '@/components/ui/button';
import { Colors, FontFamily } from '@/constants/theme';

export type CalendarDayState = 'default' | 'today' | 'selected';

export type CalendarDayProps = {
  day: number;
  /** 날짜 아래 보조 텍스트(예: "3명"). 없으면 빈 줄로 높이만 유지한다 */
  label?: string;
  state?: CalendarDayState;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

/** 달력 날짜 칸: Day (X/text × default/today/selected) */
export function CalendarDay({ day, label, state = 'default', onPress, style }: CalendarDayProps) {
  const isToday = state === 'today';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ? `${day}일, ${label}` : `${day}일`}
      accessibilityState={{ selected: state === 'selected' }}
      disabled={!onPress}
      onPress={onPress}
      style={[styles.day, style]}>
      <View
        style={[
          styles.dayNumber,
          isToday && styles.dayNumberToday,
          state === 'selected' && styles.dayNumberSelected,
        ]}>
        <AppText
          variant={isToday ? 'body4SB' : 'body4M'}
          color={isToday ? 'white' : 'gray900'}
          style={styles.dayNumberLabel}
          numberOfLines={1}>
          {day}
        </AppText>
      </View>
      <AppText
        variant="caption1M"
        color={state === 'default' ? 'gray800' : 'gray900'}
        style={styles.dayLabel}
        numberOfLines={1}>
        {label ?? ''}
      </AppText>
    </Pressable>
  );
}

const defaultWeekdays = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type CalendarProps = {
  year: number;
  /** 1 ~ 12 */
  month: number;
  /** 선택된 날짜(일) */
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
  /** 오늘 표시 기준일. 표시 중인 달과 같은 달일 때만 강조된다 */
  today?: Date;
  /** 날짜(일) → 날짜 아래 텍스트 */
  dayLabels?: Readonly<Record<number, string | undefined>>;
  /** 헤더 제목. 기본값은 "YYYY년 M월" */
  title?: string;
  todayLabel?: string;
  onTodayPress?: () => void;
  weekdays?: readonly string[];
  style?: StyleProp<ViewStyle>;
};

/** 월 달력: Calendar. 표시할 달은 year/month 로 제어한다. */
export function Calendar({
  year,
  month,
  selectedDay,
  onSelectDay,
  today = new Date(),
  dayLabels,
  title = `${year}년 ${month}월`,
  todayLabel,
  onTodayPress,
  weekdays = defaultWeekdays,
  style,
}: CalendarProps) {
  const offset = new Date(year, month - 1, 1).getDay();
  const dayCount = new Date(year, month, 0).getDate();
  const todayDay =
    today.getFullYear() === year && today.getMonth() === month - 1 ? today.getDate() : undefined;

  const weeks: (number | null)[][] = [];
  for (let cell = 0; cell < offset + dayCount; cell += 7) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const day = cell + i - offset + 1;
        return day >= 1 && day <= dayCount ? day : null;
      }),
    );
  }

  return (
    <View style={[styles.calendar, style]}>
      <View style={styles.header}>
        <AppText variant="body1B" numberOfLines={1} accessibilityRole="header">
          {title}
        </AppText>
        <TodayButton label={todayLabel} onPress={onTodayPress} />
      </View>
      <View style={styles.grid}>
        <View style={styles.weekdays}>
          {weekdays.map((weekday) => (
            <Text key={weekday} style={styles.weekday}>
              {weekday}
            </Text>
          ))}
        </View>
        {weeks.map((week, index) => (
          <View key={index} style={styles.week}>
            {week.map((day, column) =>
              day === null ? (
                <View key={column} style={styles.cell} />
              ) : (
                <CalendarDay
                  key={column}
                  day={day}
                  label={dayLabels?.[day]}
                  state={day === todayDay ? 'today' : day === selectedDay ? 'selected' : 'default'}
                  onPress={onSelectDay && (() => onSelectDay(day))}
                  style={styles.cell}
                />
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: {
    width: 48,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  dayNumber: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  dayNumberToday: {
    backgroundColor: Colors.gray900,
  },
  dayNumberSelected: {
    backgroundColor: Colors.gray300,
  },
  dayNumberLabel: {
    textAlign: 'center',
  },
  dayLabel: {
    alignSelf: 'stretch',
    height: 16,
    lineHeight: 16,
    textAlign: 'center',
  },
  calendar: {
    alignSelf: 'stretch',
    gap: 12,
    padding: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  header: {
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  grid: {
    gap: 6,
  },
  weekdays: {
    height: 16,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  // 요일 줄만 토큰에 없는 11pt / 1.45 를 쓴다.
  weekday: {
    flex: 1,
    height: 16,
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    color: Colors.gray800,
  },
  week: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 354pt 카드 안쪽 폭(334pt)을 7등분한다.
  cell: {
    width: 'auto',
    flex: 1,
    height: 44,
  },
});
