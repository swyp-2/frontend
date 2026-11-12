import type { ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Chip } from '@/components/ui/chip';
import { ShiftListItem } from '@/components/ui/list';
import { SectionHeader } from '@/components/ui/section-header';
import { Tabs } from '@/components/ui/tabs';
import { Colors } from '@/constants/theme';

import type { LoadState, MyShiftRow, RosterGroup } from './schedule-model';

export type ScheduleTab = 'mine' | 'all';
export type ScheduleRole = 'manager' | 'crew';

const tabItems = [
  { key: 'mine', label: '내 근무' },
  { key: 'all', label: '전체 근무' },
] as const;

/** 상태바를 뺀 매장 헤더 높이 (시안 111pt = 상태바 53pt + 58pt) */
const STORE_BAR_HEIGHT = 58;

const emptyDescription: Record<ScheduleRole, string> = {
  manager: '근무 일정을 추가해주세요',
  crew: '매니저에게 근무 일정 추가를 요청해주세요',
};

/* -------------------------------------------------------------------------- */
/* 화면 틀: 매장 헤더 + 탭 바 + 스크롤 본문                                    */
/* -------------------------------------------------------------------------- */

export type ScheduleFrameProps = {
  storeName: string;
  tab: ScheduleTab;
  onTabChange: (tab: ScheduleTab) => void;
  children: ReactNode;
};

export function ScheduleFrame({ storeName, tab, onTabChange, children }: ScheduleFrameProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.screen}>
      <AppBar
        variant="store"
        title={storeName}
        style={{ height: insets.top + STORE_BAR_HEIGHT }}
      />
      <Tabs items={tabItems} value={tab} onChange={onTabChange} style={styles.tabs} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

function EmptyCard({ role }: { role: ScheduleRole }) {
  return (
    <ShiftListItem
      variant="empty"
      title="등록된 근무가 없어요"
      description={emptyDescription[role]}
      style={styles.inset}
    />
  );
}

function LoadingBlock() {
  return (
    <View style={styles.status} accessibilityRole="progressbar" accessibilityLabel="불러오는 중">
      <ActivityIndicator color={Colors.gray700} />
    </View>
  );
}

function ErrorBlock({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={styles.status} accessibilityRole="alert">
      <AppText variant="body3M" color="gray800" style={styles.statusText}>
        {message}
      </AppText>
      <Button label="다시 시도" size="S" variant="secondary" onPress={onRetry} />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* 내 근무                                                                     */
/* -------------------------------------------------------------------------- */

export type MyShiftsViewProps = {
  role: ScheduleRole;
  year: number;
  /** 1 ~ 12 */
  month: number;
  /** 오늘(Asia/Seoul)의 연·월·일을 담은 Date */
  today: Date;
  /** 이번 달 내 근무 전체 (시작 시각순) */
  state: LoadState<MyShiftRow[]>;
  /** false: 남은 근무만, true: 지난 근무까지 전부 */
  showAll: boolean;
  onToggleShowAll: () => void;
  selectedDay?: number;
  onSelectDay: (day: number) => void;
  onTodayPress: () => void;
  onShiftPress: (shiftId: number) => void;
  onRetry: () => void;
};

export function MyShiftsView({
  role,
  year,
  month,
  today,
  state,
  showAll,
  onToggleShowAll,
  selectedDay,
  onSelectDay,
  onTodayPress,
  onShiftPress,
  onRetry,
}: MyShiftsViewProps) {
  const rows = state.status === 'ready' ? state.data : [];
  const dayLabels: Record<number, string> = {};
  for (const row of rows) dayLabels[row.day] = '근무';

  const visible = showAll ? rows : rows.filter((row) => !row.ended);

  return (
    <>
      <Calendar
        year={year}
        month={month}
        today={today}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        onTodayPress={onTodayPress}
        dayLabels={dayLabels}
        style={styles.inset}
      />
      <Divider />
      {state.status === 'loading' && <LoadingBlock />}
      {state.status === 'error' && <ErrorBlock message={state.message} onRetry={onRetry} />}
      {state.status === 'ready' && rows.length === 0 && <EmptyCard role={role} />}
      {state.status === 'ready' && rows.length > 0 && (
        <View style={styles.mineSection}>
          <SectionHeader
            title={`${month}월 근무`}
            actionLabel={showAll ? '남은근무' : '전체근무'}
            onActionPress={onToggleShowAll}
          />
          <View style={[styles.inset, styles.list]}>
            {visible.length === 0 ? (
              <ShiftListItem
                variant="empty"
                title="남은 근무가 없어요"
                description="전체근무에서 지난 근무를 확인할 수 있어요"
              />
            ) : (
              visible.map((row) => (
                <ShiftListItem
                  key={row.shiftId}
                  variant={row.ended ? 'off' : 'on'}
                  title={row.title}
                  description={row.time}
                  onPress={() => onShiftPress(row.shiftId)}
                />
              ))
            )}
          </View>
        </View>
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* 전체 근무                                                                   */
/* -------------------------------------------------------------------------- */

export type AllShiftsViewProps = {
  role: ScheduleRole;
  year: number;
  /** 1 ~ 12 */
  month: number;
  today: Date;
  selectedDay: number;
  /** 선택한 날짜 제목: "11월 5일 (목)" */
  selectedDateLabel: string;
  /** 달력 날짜 아래 인원 라벨 (일 → "5명"). 이번 달에 근무가 하나도 없으면 빈 객체 */
  headcounts: LoadState<Readonly<Record<number, string>>>;
  /** 선택한 날짜의 시간대별 명단 */
  roster: LoadState<RosterGroup[]>;
  onSelectDay: (day: number) => void;
  onTodayPress: () => void;
  onShiftPress: (shiftId: number) => void;
  onRetry: () => void;
};

export function AllShiftsView({
  role,
  year,
  month,
  today,
  selectedDay,
  selectedDateLabel,
  headcounts,
  roster,
  onSelectDay,
  onTodayPress,
  onShiftPress,
  onRetry,
}: AllShiftsViewProps) {
  const dayLabels = headcounts.status === 'ready' ? headcounts.data : undefined;
  // 달력 요약과 그날 명단 중 하나라도 실패하면 실패로 보여 준다.
  const error =
    headcounts.status === 'error' ? headcounts : roster.status === 'error' ? roster : null;
  const loading = !error && (headcounts.status === 'loading' || roster.status === 'loading');
  const groups = !error && !loading && roster.status === 'ready' ? roster.data : null;
  const monthIsEmpty = !!dayLabels && Object.keys(dayLabels).length === 0;

  return (
    <>
      <Calendar
        year={year}
        month={month}
        today={today}
        selectedDay={selectedDay}
        onSelectDay={onSelectDay}
        onTodayPress={onTodayPress}
        dayLabels={dayLabels}
        style={styles.inset}
      />
      <Divider />
      {loading && <LoadingBlock />}
      {error && <ErrorBlock message={error.message} onRetry={onRetry} />}
      {groups && groups.length === 0 && monthIsEmpty && <EmptyCard role={role} />}
      {groups && !(groups.length === 0 && monthIsEmpty) && (
        <View style={styles.allSection}>
          <SectionHeader title={selectedDateLabel} />
          {groups.length === 0 ? (
            <EmptyCard role={role} />
          ) : (
            groups.map((group) => (
              <View key={group.key} style={[styles.inset, styles.group]}>
                <AppText variant="body1SB">{group.time}</AppText>
                <View style={styles.chips}>
                  {group.members.map((member) => (
                    <Chip
                      key={member.shiftId}
                      label={member.name}
                      color={group.color}
                      onPress={() => onShiftPress(member.shiftId)}
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  // 탭 바는 402pt 프레임에서 좌우 13pt 안쪽(376pt)에 놓인다.
  tabs: {
    alignSelf: 'stretch',
    marginHorizontal: 13,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: 20,
    paddingVertical: 20,
  },
  inset: {
    alignSelf: 'stretch',
    marginHorizontal: 24,
  },
  divider: {
    alignSelf: 'stretch',
    height: 3,
    backgroundColor: Colors.gray200,
  },
  status: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  statusText: {
    textAlign: 'center',
  },
  mineSection: {
    gap: 16,
  },
  list: {
    gap: 8,
  },
  allSection: {
    gap: 12,
  },
  group: {
    gap: 12,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});
