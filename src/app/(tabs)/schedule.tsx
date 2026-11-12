import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import {
  buildHeadcountLabels,
  buildMyShiftRows,
  buildRosterGroups,
  dateKey,
  formatDateLabel,
  monthKey,
  seoulParts,
  type LoadState,
} from '@/features/schedule/schedule-model';
import {
  AllShiftsView,
  MyShiftsView,
  ScheduleFrame,
  type ScheduleTab,
} from '@/features/schedule/schedule-views';
import { ApiError, shiftApi } from '@/lib/api';
import { useSession } from '@/lib/session';

const LOADING = { status: 'loading' } as const;

/**
 * key 가 가리키는 자료 하나를 불러온다. key 가 바뀌면 이전 결과는 버리고 로딩으로 돌아간다.
 * load 는 화면에 있던 자료를 유지한 채 다시 받고, retry 는 로딩 표시부터 다시 시작한다.
 */
function useLoad<T>(key: string, fetcher: () => Promise<T>) {
  const [result, setResult] = useState<{ key: string; state: LoadState<T> }>({
    key,
    state: LOADING,
  });
  const sequence = useRef(0);

  const load = useCallback(async () => {
    const id = ++sequence.current;
    try {
      const data = await fetcher();
      if (id === sequence.current) setResult({ key, state: { status: 'ready', data } });
    } catch (error) {
      if (id !== sequence.current) return;
      const message =
        error instanceof ApiError
          ? error.message
          : '근무표를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
      setResult({ key, state: { status: 'error', message } });
    }
  }, [key, fetcher]);

  const retry = useCallback(() => {
    setResult({ key, state: LOADING });
    void load();
  }, [key, load]);

  const state: LoadState<T> = result.key === key ? result.state : LOADING;
  return { state, load, retry };
}

/** 근무표 탭: 내 근무 / 전체 근무 */
export default function ScheduleScreen() {
  const { me } = useSession();
  const membership = me?.membership;
  const storeId = membership?.store_id ?? 0;

  const [tab, setTab] = useState<ScheduleTab>('mine');
  // 화면에 들어올 때마다 갱신하는 현재 시각. 오늘·이번 달·지난 근무 판정의 기준이다.
  const [now, setNow] = useState(() => Date.now());
  const [showAll, setShowAll] = useState(false);
  const [mineDay, setMineDay] = useState<number>();
  const [allDay, setAllDay] = useState<number>();

  const { year, month, day: todayDay } = seoulParts(now);
  const today = useMemo(() => new Date(year, month - 1, todayDay), [year, month, todayDay]);
  const selectedAllDay = allDay ?? todayDay;
  const currentMonth = monthKey(year, month);
  const selectedDate = dateKey(year, month, selectedAllDay);

  const mine = useLoad(
    `mine:${storeId}:${currentMonth}`,
    useCallback(() => shiftApi.month(storeId, currentMonth, 'mine'), [storeId, currentMonth]),
  );
  const summary = useLoad(
    `all:${storeId}:${currentMonth}`,
    useCallback(() => shiftApi.month(storeId, currentMonth, 'all'), [storeId, currentMonth]),
  );
  const roster = useLoad(
    `day:${storeId}:${selectedDate}`,
    useCallback(() => shiftApi.day(storeId, selectedDate), [storeId, selectedDate]),
  );

  const loadMine = mine.load;
  const loadSummary = summary.load;
  const loadRoster = roster.load;

  // 탭에 다시 들어오거나, 안쪽 탭·선택 날짜가 바뀌면 보이는 쪽만 다시 받는다.
  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      setNow(Date.now());
      if (tab === 'mine') {
        void loadMine();
      } else {
        void loadSummary();
        void loadRoster();
      }
    }, [storeId, tab, loadMine, loadSummary, loadRoster]),
  );

  const mineState = useMemo<LoadState<ReturnType<typeof buildMyShiftRows>>>(
    () =>
      mine.state.status === 'ready'
        ? { status: 'ready', data: buildMyShiftRows(mine.state.data.shifts, now) }
        : mine.state,
    [mine.state, now],
  );
  const headcounts = useMemo<LoadState<Record<number, string>>>(
    () =>
      summary.state.status === 'ready'
        ? { status: 'ready', data: buildHeadcountLabels(summary.state.data.days) }
        : summary.state,
    [summary.state],
  );
  const rosterState = useMemo<LoadState<ReturnType<typeof buildRosterGroups>>>(
    () =>
      roster.state.status === 'ready'
        ? { status: 'ready', data: buildRosterGroups(roster.state.data.shifts) }
        : roster.state,
    [roster.state],
  );

  if (!membership) return null;

  const role = membership.role === 'MANAGER' ? 'manager' : 'crew';
  // 근무 상세 경로는 다른 작업에서 추가되므로 타입 경로 대신 문자열로 넘긴다.
  const openShift = (shiftId: number) => router.push(`/shift/${shiftId}` as Href);

  const selectMineDay = (day: number) => {
    setMineDay(day);
    // 그날 내 근무가 하나뿐이면 바로 상세로 간다. 달 목록은 날짜 선택으로 좁히지 않는다.
    if (mineState.status !== 'ready') return;
    const shifts = mineState.data.filter((row) => row.day === day);
    if (shifts.length === 1) openShift(shifts[0].shiftId);
  };

  return (
    <ScheduleFrame storeName={membership.store_name} tab={tab} onTabChange={setTab}>
      {tab === 'mine' ? (
        <MyShiftsView
          role={role}
          year={year}
          month={month}
          today={today}
          state={mineState}
          showAll={showAll}
          onToggleShowAll={() => setShowAll((value) => !value)}
          selectedDay={mineDay}
          onSelectDay={selectMineDay}
          onTodayPress={() => setMineDay(undefined)}
          onShiftPress={openShift}
          onRetry={mine.retry}
        />
      ) : (
        <AllShiftsView
          role={role}
          year={year}
          month={month}
          today={today}
          selectedDay={selectedAllDay}
          selectedDateLabel={formatDateLabel(year, month, selectedAllDay)}
          headcounts={headcounts}
          roster={rosterState}
          onSelectDay={setAllDay}
          onTodayPress={() => setAllDay(undefined)}
          onShiftPress={openShift}
          onRetry={() => {
            summary.retry();
            roster.retry();
          }}
        />
      )}
    </ScheduleFrame>
  );
}
