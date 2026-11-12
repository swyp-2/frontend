/** 근무 시각은 항상 Asia/Seoul(UTC+9, 서머타임 없음) 기준으로 보여 준다. */
const KST_OFFSET = 9 * 60 * 60 * 1000;
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** UTC 메서드로 읽으면 서울 시각이 나오는 Date. 형식이 잘못됐으면 null */
function toSeoul(iso: string) {
  const time = new Date(iso).getTime();
  return Number.isNaN(time) ? null : new Date(time + KST_OFFSET);
}

const pad = (value: number) => String(value).padStart(2, '0');

/** "11월 9일 (월)" */
export function formatShiftDate(startsAt: string) {
  const date = toSeoul(startsAt);
  if (!date) return '-';
  return `${date.getUTCMonth() + 1}월 ${date.getUTCDate()}일 (${WEEKDAYS[date.getUTCDay()]})`;
}

/** "14:00-18:00" */
export function formatShiftTime(startsAt: string, endsAt: string) {
  const start = toSeoul(startsAt);
  const end = toSeoul(endsAt);
  if (!start || !end) return '-';
  const clock = (date: Date) => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
  return `${clock(start)}-${clock(end)}`;
}
