/**
 * 대타 요청 목록 API.
 * 계약: 백엔드 develop 의 SubstituteRequestController / SubstituteRequestViews.
 */

import { api } from '@/lib/api';

export type SubstituteStatus =
  | 'WAITING'
  | 'PENDING_MANAGER'
  | 'APPROVED'
  | 'REJECTED'
  | 'ALL_DECLINED'
  | 'CANCELLED'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'CANCELLED_SOURCE_CHANGED';

export type RecipientResponse = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'UNAVAILABLE';

/** 탈퇴·연결 해제된 사람은 display_name 이 "탈퇴한 구성원" 으로 온다 */
export type SubstituteMember = { membership_id: number; display_name: string };

/** starts_at / ends_at 은 UTC ISO 8601. deleted 는 상세에서만 채워진다 */
export type SubstituteShift = {
  shift_id: number;
  starts_at: string;
  ends_at: string;
  deleted: boolean | null;
};

/** RQ-02 목록 카드 한 건 */
export type SubstituteRequestSummary = {
  id: number;
  status: SubstituteStatus;
  terminal_reason: string | null;
  shift: SubstituteShift;
  requester: SubstituteMember;
  /** 첫 수락 후보. 수락 전이면 null */
  candidate: SubstituteMember | null;
  /** 받은 요청 목록에서만 본인 응답 */
  my_response: RecipientResponse | null;
  /** 카드 점. 이 요청에 대해 아직 확인하지 않은 본인 알림(최근 7일)이 있으면 true */
  unchecked: boolean;
  created_at: string;
};

export type SubstituteRequestPage = {
  items: SubstituteRequestSummary[];
  next_cursor: string | null;
  has_more: boolean;
};

export type RequestBox = 'sent' | 'received';

/** 상세 응답 중 목록 카드에 필요한 부분만. 전체 타입은 상세 화면 쪽에서 정의한다 */
export type SubstituteRequestRecipients = {
  id: number;
  recipients: { membership_id: number; display_name: string; response: RecipientResponse }[];
};

export const substituteRequestApi = {
  /** 크루원 전용. 생성 시각 내림차순 20개씩, 다음 페이지는 next_cursor 를 cursor 로 보낸다 */
  list: (box: RequestBox, cursor?: string | null) =>
    api<SubstituteRequestPage>(
      `/me/substitute-requests?box=${box}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    ),
  /** 요청자에게는 지정 대상 전체가 recipients 로 온다 */
  recipients: (requestId: number) =>
    api<SubstituteRequestRecipients>(`/substitute-requests/${requestId}`),
};
