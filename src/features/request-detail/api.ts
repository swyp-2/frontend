/**
 * 대타 요청 생성·상세·상태 전이 API.
 * 계약: 백엔드 develop 의 SubstituteRequestController / SubstituteRequestViews.Detail.
 */

import { api } from '@/lib/api';
import type {
  RecipientResponse,
  SubstituteMember,
  SubstituteShift,
  SubstituteStatus,
} from '@/features/requests/api';

export type RequestRelation = 'REQUESTER' | 'CANDIDATE' | 'TARGET' | 'MANAGER';

/** allowed_actions 값. 전이 API 경로의 마지막 부분과 같다 (final_reject 만 경로가 final-reject) */
export type RequestAction = 'cancel' | 'accept' | 'reject' | 'withdraw' | 'approve' | 'final_reject';

/** 사용자 행동이 아닌 종료의 사유 */
export type TerminalReason = 'REQUESTER_LEFT' | 'CANDIDATE_LEFT' | 'NO_ACTIVE_TARGET' | 'SHIFT_DELETED';

export type RequestRecipient = SubstituteMember & { response: RecipientResponse };

export type RequestEvent = {
  kind: string;
  /** 만료 등 시스템 처리면 null */
  actor: SubstituteMember | null;
  occurred_at: string;
};

/** RQ-03 / AP-02 요청 상세. 거절 사유 필드는 서버에 없다 */
export type SubstituteRequestDetail = {
  id: number;
  status: SubstituteStatus;
  terminal_reason: TerminalReason | null;
  version: number;
  created_at: string;
  closed_at: string | null;
  shift: SubstituteShift;
  requester: SubstituteMember;
  /** 첫 수락 후보. 수락 전이면 null */
  candidate: SubstituteMember | null;
  my_relation: RequestRelation;
  /** 요청자·매니저에게는 전체, 지정 대상·후보에게는 본인 것만 */
  recipients: RequestRecipient[];
  /** 표시용. 종료됐거나 근무 시작 시각이 지나면 빈 배열 */
  allowed_actions: RequestAction[];
  events: RequestEvent[];
};

const actionPath: Record<RequestAction, string> = {
  cancel: 'cancel',
  accept: 'accept',
  reject: 'reject',
  withdraw: 'withdraw',
  approve: 'approve',
  final_reject: 'final-reject',
};

export const requestDetailApi = {
  /** 409 ACTIVE_REQUEST_EXISTS 면 같은 근무에 진행 중 요청이 이미 있다 (ApiError.existingRequestId) */
  create: (shiftId: number, targetMembershipIds: number[], idempotencyKey: string) =>
    api<SubstituteRequestDetail>('/substitute-requests', {
      method: 'POST',
      body: { shift_id: shiftId, target_membership_ids: targetMembershipIds },
      idempotencyKey,
    }),
  get: (requestId: number) => api<SubstituteRequestDetail>(`/substitute-requests/${requestId}`),
  /**
   * 상태 전이 6종. 본문이 없고(최종 거절도 사유를 받지 않는다) 처리 후 최신 상세를 돌려준다.
   * 409 REQUEST_STATE_CONFLICT / REQUEST_EXPIRED / SHIFT_STATE_CONFLICT 면 다시 조회해야 한다.
   */
  transition: (requestId: number, action: RequestAction, idempotencyKey: string) =>
    api<SubstituteRequestDetail>(`/substitute-requests/${requestId}/${actionPath[action]}`, {
      method: 'POST',
      idempotencyKey,
    }),
};
