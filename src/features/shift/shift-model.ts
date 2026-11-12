import { dateKey, seoulParts } from '@/features/schedule/schedule-model';
import type { ShiftDetail } from '@/lib/api';

import type { ShiftBatchInput } from './api';

/* ------------------------------- 근무 등록 ------------------------------- */

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const KST_OFFSET_HOURS = 9;

/** 숫자만 남겨 "HH:mm" 꼴로 만든다 ("1600" → "16:00") */
export function formatTimeInput(text: string) {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export const isValidTime = (value: string) => TIME.test(value);

/** 네 자리를 다 쳤는데 24시 방식 시각이 아닌 경우 */
export const isWrongTime = (value: string) => value.length === 5 && !isValidTime(value);

/** 오늘의 Asia/Seoul 날짜 (yyyy-MM-dd) */
export function todayInSeoul(now: number | Date = Date.now()) {
  const { year, month, day } = seoulParts(now);
  return dateKey(year, month, day);
}

/** 경로 파라미터로 받은 날짜가 올바르면 그대로, 아니면 오늘 */
export function resolveBaseDate(param: string | undefined, now: number | Date = Date.now()) {
  if (param && DATE.test(param) && !Number.isNaN(Date.parse(`${param}T00:00:00Z`))) return param;
  return todayInSeoul(now);
}

/** 한 달 뒤 날짜. 다음 달에 같은 일자가 없으면 말일로 맞춘다 (서버의 plusMonths 와 같은 규칙) */
export function plusOneMonth(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const target = new Date(Date.UTC(year, month, Math.min(day, lastDay)));
  return dateKey(target.getUTCFullYear(), target.getUTCMonth() + 1, target.getUTCDate());
}

/** Asia/Seoul 날짜·시각 → UTC ISO */
function seoulToUtcIso(date: string, time: string, addDays = 0) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  return new Date(
    Date.UTC(year, month - 1, day + addDays, hour - KST_OFFSET_HOURS, minute),
  ).toISOString();
}

export type ShiftFormValues = {
  memberIds: number[];
  /** "HH:mm" (Asia/Seoul) */
  start: string;
  end: string;
  /** 0 = 일요일 … 6 = 토요일 */
  weekdays: number[];
};

export function isFormComplete({ memberIds, start, end }: ShiftFormValues) {
  return memberIds.length > 0 && isValidTime(start) && isValidTime(end) && start !== end;
}

/**
 * 화면 입력 → 일괄 등록 요청.
 * - 종료가 시작보다 이르면 다음 날 끝나는 근무로 본다.
 * - 요일을 고르지 않으면 baseDate 하루치, 고르면 baseDate 부터 1개월(서버 최대 범위) 동안 그 요일에 반복한다.
 */
export function buildBatchInput(
  storeId: number,
  values: ShiftFormValues,
  baseDate: string,
): ShiftBatchInput {
  const overnight = values.end <= values.start;
  return {
    store_id: storeId,
    assignee_membership_ids: values.memberIds,
    starts_at: seoulToUtcIso(baseDate, values.start),
    ends_at: seoulToUtcIso(baseDate, values.end, overnight ? 1 : 0),
    repeat:
      values.weekdays.length > 0
        ? {
            enabled: true,
            start_date: baseDate,
            end_date: plusOneMonth(baseDate),
            weekdays: values.weekdays.map((day) => (day === 0 ? 7 : day)).sort((a, b) => a - b),
          }
        : null,
  };
}

/* ------------------------------- 근무 상세 ------------------------------- */

/** 서버 ShiftActions 의 allowed_actions 값 */
export type ShiftActionKind =
  | 'request_substitute'
  | 'view_request'
  | 'delete'
  | 'view_approval_request';

export type ShiftActionButton = {
  kind: ShiftActionKind;
  label: string;
  variant: 'primary' | 'secondary';
};

export type ShiftActionPlan = {
  /** 카드 아래 안내 문구 */
  helper?: string;
  /** 위에서 아래 순서 */
  buttons: ShiftActionButton[];
};

/** 서버가 허용한 행동만 버튼으로 만든다. 모르는 값은 무시한다 */
export function planShiftActions(
  detail: Pick<ShiftDetail, 'allowed_actions' | 'is_started' | 'is_mine' | 'active_request'>,
): ShiftActionPlan {
  const allowed = new Set(detail.allowed_actions);
  const buttons: ShiftActionButton[] = [];
  const hasRequest = !!detail.active_request;

  if (allowed.has('delete')) {
    if (allowed.has('view_approval_request') && hasRequest) {
      buttons.push({ kind: 'view_approval_request', label: '대타 승인 요청 보기', variant: 'secondary' });
    }
    buttons.push({ kind: 'delete', label: '삭제하기', variant: 'primary' });
    return { helper: '해당 근무를 삭제할 수 있어요', buttons };
  }
  if (allowed.has('view_request') && hasRequest) {
    return {
      helper: '진행 중인 대타 요청이 있어요',
      buttons: [{ kind: 'view_request', label: '대타 요청 보기', variant: 'primary' }],
    };
  }
  if (allowed.has('request_substitute')) {
    return {
      helper: '해당 근무의 대타를 요청할 수 있어요',
      buttons: [{ kind: 'request_substitute', label: '대타 요청하기', variant: 'primary' }],
    };
  }
  return {
    helper: detail.is_mine && detail.is_started ? '이미 시작된 근무는 대타를 요청할 수 없어요' : undefined,
    buttons: [],
  };
}
