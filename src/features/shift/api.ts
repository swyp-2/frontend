/**
 * 근무 일괄 등록 API (백엔드 ShiftBatchController 기준).
 * 미리보기(저장 없음) → 최종 등록(멱등) 두 단계이고, 최종 요청은 미리보기와 같은 입력에 preview_token 을 더한 것이다.
 */

import { api } from '@/lib/api';

export type ShiftBatchRepeat = {
  enabled: boolean;
  /** yyyy-MM-dd. 첫 근무의 Asia/Seoul 날짜와 같아야 한다 */
  start_date: string;
  /** yyyy-MM-dd. start_date 부터 달력상 최대 1개월, 양 끝 포함 */
  end_date: string;
  /** ISO 요일 (1 = 월 … 7 = 일) */
  weekdays: number[];
};

export type ShiftBatchInput = {
  store_id: number;
  assignee_membership_ids: number[];
  /** 첫 근무 1건의 시작·종료 시각 (UTC ISO 8601, 분 단위) */
  starts_at: string;
  ends_at: string;
  /** null 이면 starts_at 날짜의 근무 1건만 만든다 */
  repeat: ShiftBatchRepeat | null;
};

export type ShiftBatchCreateBody = ShiftBatchInput & { preview_token: string };

/** duplicate=true 인 건은 최종 등록에서 만들지 않는다 */
export type ShiftBatchPreviewItem = {
  membership_id: number;
  display_name: string;
  local_date: string;
  starts_at: string;
  ends_at: string;
  duplicate: boolean;
};

export type ShiftBatchPreview = {
  /** 30분간 유효 */
  preview_token: string;
  create_count: number;
  duplicate_count: number;
  total_count: number;
  items: ShiftBatchPreviewItem[];
};

export type ShiftBatchCreated = {
  created_count: number;
  duplicate_count: number;
  shift_ids: number[];
};

/** 서버가 field_errors 에 쓰는 필드 이름 */
export const ShiftBatchField = {
  assignees: 'assignee_membership_ids',
  startsAt: 'starts_at',
  endsAt: 'ends_at',
  repeatStart: 'repeat.start_date',
  repeatEnd: 'repeat.end_date',
  repeatWeekdays: 'repeat.weekdays',
} as const;

export const shiftBatchApi = {
  preview: (input: ShiftBatchInput) =>
    api<ShiftBatchPreview>('/shift-batches/preview', { method: 'POST', body: input }),
  /** 같은 키·같은 본문으로 다시 보내면 처음 결과를 그대로 받는다. 근무표가 바뀌었으면 409 PREVIEW_STALE */
  create: (body: ShiftBatchCreateBody, idempotencyKey: string) =>
    api<ShiftBatchCreated>('/shift-batches', { method: 'POST', body, idempotencyKey }),
};
