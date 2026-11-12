import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';
import {
  buildHeadcountLabels,
  buildMyShiftRows,
  buildRosterGroups,
  formatDateLabel,
  type LoadState,
  type MyShiftRow,
  type RosterGroup,
} from '@/features/schedule/schedule-model';
import {
  AllShiftsView,
  MyShiftsView,
  ScheduleFrame,
  type ScheduleRole,
  type ScheduleTab,
} from '@/features/schedule/schedule-views';
import type { ShiftItem } from '@/lib/api';

/* 시안과 같은 기준일: 2026년 11월 4일 (수), Asia/Seoul */
const YEAR = 2026;
const MONTH = 11;
const TODAY = new Date(YEAR, MONTH - 1, 4);
const NOW = Date.parse('2026-11-04T03:00:00Z');

let nextId = 1;

/** Asia/Seoul 기준 시각으로 목업 근무를 만든다 (서버처럼 UTC ISO 로 저장) */
function shift(day: number, startHour: number, endHour: number, name = '나'): ShiftItem {
  const at = (hour: number) =>
    new Date(Date.UTC(YEAR, MONTH - 1, day, hour - 9)).toISOString();
  return {
    shift_id: nextId++,
    starts_at: at(startHour),
    ends_at: at(endHour),
    local_date: `${YEAR}-${MONTH}-${String(day).padStart(2, '0')}`,
    assignee: { membership_id: 1, display_name: name, personal_color: 'BLUE', is_me: name === '나' },
  };
}

const myShifts = [2, 4, 6, 9, 11, 13, 16, 18, 20, 23, 25, 27, 30].map((day) => shift(day, 16, 22));
const myRows = buildMyShiftRows(myShifts, NOW);

const dayRoster = [
  shift(5, 16, 22, '이준호'),
  shift(5, 9, 13, '최수빈'),
  shift(5, 12, 18, '김서연'),
  shift(5, 9, 13, '정하은'),
  shift(5, 16, 22, '김예린'),
  shift(5, 9, 13, '박현우'),
];
// 다음 날 끝나는 근무와 네 번째 색까지 확인하는 명단
const overnightRoster = [...dayRoster, shift(5, 22, 26, '한지민'), shift(5, 23, 30, '오세훈')];

const headcounts = buildHeadcountLabels(
  Array.from({ length: 30 }, (_, i) => ({
    date: `2026-11-${String(i + 1).padStart(2, '0')}`,
    headcount: [7, 5, 5, 5, 5, 6, 7][i % 7],
  })),
);

const { 5: _fifth, ...headcountsWithoutFifth } = headcounts;

const ready = <T,>(data: T): LoadState<T> => ({ status: 'ready', data });
const LOADING = { status: 'loading' } as const;
const FAILED = {
  status: 'error',
  message: '네트워크 연결을 확인한 뒤 다시 시도해 주세요.',
} as const;

function Case({ title, height, children }: { title: string; height: number; children: ReactNode }) {
  return (
    <View style={styles.case}>
      <AppText variant="body4SB" color="gray800" style={styles.caseTitle}>
        {title}
      </AppText>
      <View style={[styles.frame, { height }]}>{children}</View>
    </View>
  );
}

function MineCase({
  title,
  height,
  role,
  state,
  initialShowAll = false,
  initialDay,
}: {
  title: string;
  height: number;
  role: ScheduleRole;
  state: LoadState<MyShiftRow[]>;
  initialShowAll?: boolean;
  initialDay?: number;
}) {
  const [showAll, setShowAll] = useState(initialShowAll);
  const [day, setDay] = useState(initialDay);
  const [pressed, setPressed] = useState('없음');
  return (
    <Case title={`${title} · 누른 근무: ${pressed}`} height={height}>
      <ScheduleFrame storeName="모닝커피 성수점" tab="mine" onTabChange={() => undefined}>
        <MyShiftsView
          role={role}
          year={YEAR}
          month={MONTH}
          today={TODAY}
          state={state}
          showAll={showAll}
          onToggleShowAll={() => setShowAll((value) => !value)}
          selectedDay={day}
          onSelectDay={setDay}
          onTodayPress={() => setDay(undefined)}
          onShiftPress={(id) => setPressed(String(id))}
          onRetry={() => setPressed('다시 시도')}
        />
      </ScheduleFrame>
    </Case>
  );
}

function AllCase({
  title,
  height,
  role,
  labels,
  roster,
  initialDay = 5,
}: {
  title: string;
  height: number;
  role: ScheduleRole;
  labels: LoadState<Record<number, string>>;
  roster: LoadState<RosterGroup[]>;
  initialDay?: number;
}) {
  const [day, setDay] = useState(initialDay);
  const [pressed, setPressed] = useState('없음');
  return (
    <Case title={`${title} · 누른 근무: ${pressed}`} height={height}>
      <ScheduleFrame storeName="모닝커피 성수점" tab="all" onTabChange={() => undefined}>
        <AllShiftsView
          role={role}
          year={YEAR}
          month={MONTH}
          today={TODAY}
          selectedDay={day}
          selectedDateLabel={formatDateLabel(YEAR, MONTH, day)}
          headcounts={labels}
          roster={roster}
          onSelectDay={setDay}
          onTodayPress={() => setDay(4)}
          onShiftPress={(id) => setPressed(String(id))}
          onRetry={() => setPressed('다시 시도')}
        />
      </ScheduleFrame>
    </Case>
  );
}

/** 탭 전환까지 되는 한 벌 (목업 자료) */
function Interactive() {
  const [tab, setTab] = useState<ScheduleTab>('mine');
  const [showAll, setShowAll] = useState(false);
  const [mineDay, setMineDay] = useState<number>();
  const [allDay, setAllDay] = useState(4);
  return (
    <Case title="탭 전환 (매니저)" height={782}>
      <ScheduleFrame storeName="모닝커피 성수점" tab={tab} onTabChange={setTab}>
        {tab === 'mine' ? (
          <MyShiftsView
            role="manager"
            year={YEAR}
            month={MONTH}
            today={TODAY}
            state={ready(myRows)}
            showAll={showAll}
            onToggleShowAll={() => setShowAll((value) => !value)}
            selectedDay={mineDay}
            onSelectDay={setMineDay}
            onTodayPress={() => setMineDay(undefined)}
            onShiftPress={() => undefined}
            onRetry={() => undefined}
          />
        ) : (
          <AllShiftsView
            role="manager"
            year={YEAR}
            month={MONTH}
            today={TODAY}
            selectedDay={allDay}
            selectedDateLabel={formatDateLabel(YEAR, MONTH, allDay)}
            headcounts={ready(headcounts)}
            roster={ready(buildRosterGroups(dayRoster))}
            onSelectDay={setAllDay}
            onTodayPress={() => setAllDay(4)}
            onShiftPress={() => undefined}
            onRetry={() => undefined}
          />
        )}
      </ScheduleFrame>
    </Case>
  );
}

/** 개발용: 근무표 탭의 상태별 화면 (목업 자료) */
export default function ScheduleGallery() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <MineCase title="M 내 근무 · 비어 있음" height={729} role="manager" state={ready([])} />
      <MineCase title="C 내 근무 · 비어 있음" height={729} role="crew" state={ready([])} />
      <MineCase title="M 내 근무 · 남은 근무" height={1560} role="manager" state={ready(myRows)} />
      <MineCase
        title="M 내 근무 · 전체 근무 (11일 선택)"
        height={1640}
        role="manager"
        state={ready(myRows)}
        initialShowAll
        initialDay={11}
      />
      <MineCase
        title="내 근무 · 남은 근무 없음"
        height={729}
        role="crew"
        state={ready(myRows.map((row) => ({ ...row, ended: true })))}
      />
      <MineCase title="내 근무 · 불러오는 중" height={729} role="crew" state={LOADING} />
      <MineCase title="내 근무 · 실패" height={729} role="crew" state={FAILED} />

      <AllCase
        title="M 전체 근무 · 비어 있음"
        height={729}
        role="manager"
        labels={ready({})}
        roster={ready([])}
        initialDay={4}
      />
      <AllCase
        title="C 전체 근무 · 비어 있음"
        height={729}
        role="crew"
        labels={ready({})}
        roster={ready([])}
        initialDay={4}
      />
      <AllCase
        title="전체 근무 · 등록 완료 (5일 선택)"
        height={810}
        role="manager"
        labels={ready(headcounts)}
        roster={ready(buildRosterGroups(dayRoster))}
      />
      <AllCase
        title="전체 근무 · 다음 날 끝나는 근무"
        height={990}
        role="crew"
        labels={ready(headcounts)}
        roster={ready(buildRosterGroups(overnightRoster))}
      />
      <AllCase
        title="전체 근무 · 선택한 날만 비어 있음"
        height={729}
        role="crew"
        labels={ready(headcountsWithoutFifth)}
        roster={ready([])}
      />
      <AllCase
        title="전체 근무 · 불러오는 중"
        height={729}
        role="crew"
        labels={ready(headcounts)}
        roster={LOADING}
      />
      <AllCase
        title="전체 근무 · 실패"
        height={729}
        role="crew"
        labels={ready(headcounts)}
        roster={FAILED}
      />
      <Interactive />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray400,
  },
  content: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 32,
  },
  case: {
    gap: 8,
  },
  caseTitle: {
    paddingHorizontal: 4,
  },
  // 시안 프레임 폭(402pt). 높이는 하단 내비게이션(92pt)을 뺀 값이다.
  frame: {
    width: 402,
    overflow: 'hidden',
  },
});
