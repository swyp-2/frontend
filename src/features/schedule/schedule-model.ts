import type { ChipColor } from '@/components/ui/chip';
import type { ShiftItem } from '@/lib/api';

/**
 * 근무표 화면이 쓰는 날짜·시간 계산과 표시용 데이터 변환.
 * 서버 시각은 UTC ISO 문자열이고 화면은 항상 Asia/Seoul(UTC+9, 서머타임 없음) 기준이다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export type SeoulParts = {
  year: number;
  /** 1 ~ 12 */
  month: number;
  day: number;
  hour: number;
  minute: number;
};

/** 시각을 Asia/Seoul 달력 값으로 바꾼다. 기기 시간대와 무관하다 */
export function seoulParts(input: string | number | Date): SeoulParts {
  const shifted = new Date(new Date(input).getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  };
}

const pad = (value: number) => String(value).padStart(2, '0');

/** yyyy-MM */
export const monthKey = (year: number, month: number) => `${year}-${pad(month)}`;

/** yyyy-MM-dd */
export const dateKey = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;

/** "11월 4일 (수)" */
export function formatDateLabel(year: number, month: number, day: number) {
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

/** yyyy-MM-dd → "11월 4일 (수)" */
export function formatLocalDate(localDate: string) {
  const [year, month, day] = localDate.split('-').map(Number);
  return formatDateLabel(year, month, day);
}

const formatTime = ({ hour, minute }: SeoulParts) => `${hour}:${pad(minute)}`;

/** "9:00-13:00". 다음 날 끝나는 근무는 끝 시각 앞에 "다음날" 을 붙인다 */
export function formatTimeRange(startsAt: string, endsAt: string) {
  const start = seoulParts(startsAt);
  const end = seoulParts(endsAt);
  const overnight =
    dateKey(end.year, end.month, end.day) !== dateKey(start.year, start.month, start.day);
  return `${formatTime(start)}-${overnight ? '다음날 ' : ''}${formatTime(end)}`;
}

export type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: T };

/* ------------------------------- 내 근무 -------------------------------- */

export type MyShiftRow = {
  shiftId: number;
  /** 근무 시작일(Asia/Seoul)의 일 */
  day: number;
  /** "11월 4일 (수)" */
  title: string;
  /** "16:00-22:00" */
  time: string;
  /** 이미 끝난 근무 */
  ended: boolean;
};

export function buildMyShiftRows(shifts: readonly ShiftItem[], now: number): MyShiftRow[] {
  return [...shifts]
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.shift_id - b.shift_id)
    .map((shift) => ({
      shiftId: shift.shift_id,
      day: Number(shift.local_date.slice(8, 10)),
      title: formatLocalDate(shift.local_date),
      time: formatTimeRange(shift.starts_at, shift.ends_at),
      ended: new Date(shift.ends_at).getTime() <= now,
    }));
}

/* ------------------------------- 전체 근무 ------------------------------- */

export type RosterGroup = {
  key: string;
  /** "9:00-13:00" */
  time: string;
  color: ChipColor;
  members: { shiftId: number; name: string }[];
};

// 같은 시간대는 같은 색. 시간대 순서대로 돌아가며 칠한다.
const GROUP_COLORS: readonly ChipColor[] = ['blue', 'orange', 'purple', 'green'];

/** 그날 명단을 시간대별로 묶는다. 시작 시각 → 끝 시각 순, 묶음 안에서는 이름순 */
export function buildRosterGroups(shifts: readonly ShiftItem[]): RosterGroup[] {
  const sorted = [...shifts].sort(
    (a, b) =>
      a.starts_at.localeCompare(b.starts_at) ||
      a.ends_at.localeCompare(b.ends_at) ||
      a.assignee.display_name.localeCompare(b.assignee.display_name, 'ko') ||
      a.shift_id - b.shift_id,
  );

  const groups: RosterGroup[] = [];
  for (const shift of sorted) {
    const key = `${shift.starts_at}|${shift.ends_at}`;
    let group = groups.at(-1);
    if (group?.key !== key) {
      group = {
        key,
        time: formatTimeRange(shift.starts_at, shift.ends_at),
        color: GROUP_COLORS[groups.length % GROUP_COLORS.length],
        members: [],
      };
      groups.push(group);
    }
    group.members.push({ shiftId: shift.shift_id, name: shift.assignee.display_name });
  }
  return groups;
}

/** 달력 날짜 아래 인원 라벨: { 5: "5명" } */
export function buildHeadcountLabels(days: readonly { date: string; headcount: number }[]) {
  const labels: Record<number, string> = {};
  for (const { date, headcount } of days) {
    if (headcount > 0) labels[Number(date.slice(8, 10))] = `${headcount}명`;
  }
  return labels;
}
