import type { CrewRequestStatus, ManagerRequestStatus } from '@/components/ui/list';

import type { RequestBox, SubstituteRequestSummary } from './api';
import { formatShiftDate, formatShiftTime } from './format';

/** List/crew 카드에 그대로 넘기는 값 */
export type CrewRequestCard = {
  id: number;
  date: string;
  time: string;
  names: string[];
  status: CrewRequestStatus;
  /** 시안에 없는 종료 상태(취소·만료 등)의 배지 문구 */
  statusLabel?: string;
  unread?: boolean;
};

/** List/manager 카드에 그대로 넘기는 값 */
export type ManagerRequestCard = {
  id: number;
  name: string;
  date: string;
  time: string;
  requester: string;
  substitute: string;
  status: ManagerRequestStatus;
};

/**
 * 서버 상태 → 배지. 시안에는 응답 대기·승인 대기·승인·거절 네 가지만 있어
 * 나머지 종료 상태는 종료 카드 모양에 두 글자 문구를 붙인다.
 */
function badge(
  item: SubstituteRequestSummary,
  box: RequestBox,
): Pick<CrewRequestCard, 'status' | 'statusLabel'> {
  switch (item.status) {
    case 'WAITING':
      // 내가 거절했어도 다른 대상이 남아 있으면 요청은 WAITING 이다.
      return box === 'received' && item.my_response === 'DECLINED'
        ? { status: 'rejected' }
        : { status: 'wait' };
    case 'PENDING_MANAGER':
      return { status: 'pending' };
    case 'APPROVED':
      return { status: 'approved' };
    case 'REJECTED':
    case 'ALL_DECLINED':
      return { status: 'rejected' };
    case 'CANCELLED':
    case 'CANCELLED_SOURCE_CHANGED':
      return { status: 'rejected', statusLabel: '취소' };
    case 'WITHDRAWN':
      return { status: 'rejected', statusLabel: '철회' };
    case 'EXPIRED':
      return { status: 'rejected', statusLabel: '만료' };
    default:
      return { status: 'rejected', statusLabel: '종료' };
  }
}

/**
 * 보낸 요청: 수락한 사람이 있으면 그 사람, 없으면 요청한 대상 전체(카드가 3명까지 보여 주고 "외 n명").
 * 받은 요청: 요청한 사람.
 * recipientNames 는 목록 응답에 없어 상세에서 따로 받아 온 값이다.
 */
export function toCrewCard(
  item: SubstituteRequestSummary,
  box: RequestBox,
  recipientNames: string[] = [],
): CrewRequestCard {
  const names =
    box === 'received'
      ? [item.requester.display_name]
      : item.candidate
        ? [item.candidate.display_name]
        : recipientNames;
  return {
    id: item.id,
    date: formatShiftDate(item.shift.starts_at),
    time: formatShiftTime(item.shift.starts_at, item.shift.ends_at),
    names,
    unread: item.unchecked,
    ...badge(item, box),
  };
}
