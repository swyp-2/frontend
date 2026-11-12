import type { ButtonVariant } from '@/components/ui/button';
import type { ProfileAvatarColor } from '@/components/ui/profile-avatar';
import { avatarColor, avatarLabel, roleLabel } from '@/features/profile/display';
import { formatShiftDate, formatShiftTime } from '@/features/requests/format';
import type { SubstituteMember } from '@/features/requests/api';

import type { RequestAction, SubstituteRequestDetail } from './api';

/** 서버 행동 + 화면 이동만 하는 "근무 일정 보기" */
export type DetailActionKey = RequestAction | 'view_schedule';

export type DetailAction = { key: DetailActionKey; label: string; variant: ButtonVariant };

export type DetailPerson = {
  id: number;
  name: string;
  role: string;
  avatarLabel: string;
  avatarColor: ProfileAvatarColor;
};

export type CrewDetailModel = {
  kind: 'crew';
  title: string;
  shiftDate: string;
  shiftTime: string;
  /** 근무 카드 아래 안내 */
  shiftHelper?: string;
  people?: { label: string; items: DetailPerson[] };
  /** 서버에 필드가 없어 지금은 항상 비어 있다 (시안: 거절 사유) */
  rejectReason?: string;
  actions: DetailAction[];
};

export type ManagerDetailModel = {
  kind: 'manager';
  title: string;
  subtitle: string;
  shiftDate: string;
  shiftTime: string;
  requesterName: string;
  /** 수락 후보가 없으면 null */
  candidateName: string | null;
  actions: DetailAction[];
};

export type DetailModel = CrewDetailModel | ManagerDetailModel;

/** membership_id → 서버 개인 색상(hex). 상세 응답에는 색이 없어 구성원 목록에서 가져온다 */
export type PersonalColors = Record<number, string | undefined>;

const DELETED_SHIFT_HELPER = '삭제된 근무예요. 삭제 전 정보를 보여드려요';

// 화면에 나오는 순서(왼쪽 → 오른쪽)와 라벨. 서버가 허용한 행동만 버튼으로 만든다.
const actionButtons: { key: RequestAction; label: string; variant: ButtonVariant }[] = [
  { key: 'reject', label: '거절하기', variant: 'reject' },
  { key: 'final_reject', label: '거절하기', variant: 'reject' },
  { key: 'accept', label: '수락하기', variant: 'primary' },
  { key: 'approve', label: '승인하기', variant: 'primary' },
  { key: 'cancel', label: '요청 취소하기', variant: 'secondary' },
  { key: 'withdraw', label: '수락 철회하기', variant: 'secondary' },
];

function toActions(detail: SubstituteRequestDetail): DetailAction[] {
  return actionButtons.filter((button) => detail.allowed_actions.includes(button.key));
}

function toPerson(member: SubstituteMember, colors: PersonalColors): DetailPerson {
  return {
    id: member.membership_id,
    name: member.display_name,
    role: roleLabel.CREW,
    avatarLabel: avatarLabel(member.display_name),
    avatarColor: avatarColor(colors[member.membership_id]),
  };
}

/* 시안에 없는 종료 상태 문구는 임시로 정한 것이다 (TODO: 디자인 확정 필요) */
function closedTitle(detail: SubstituteRequestDetail) {
  switch (detail.status) {
    case 'ALL_DECLINED':
      return '모든 크루원이 거절했어요';
    case 'CANCELLED':
      return '요청이 취소됐어요';
    case 'WITHDRAWN':
      return '수락이 철회됐어요';
    case 'EXPIRED':
      return '요청이 만료됐어요';
    case 'CANCELLED_SOURCE_CHANGED':
      return '근무가 삭제되어 요청이 종료됐어요';
    case 'REJECTED':
      return '대타가 거절됐어요';
    case 'APPROVED':
      return '대타가 확정됐어요';
    default:
      return '요청 상세';
  }
}

function sentModel(detail: SubstituteRequestDetail, colors: PersonalColors): CrewDetailModel {
  const candidate = detail.candidate
    ? { label: '대타 크루원', items: [toPerson(detail.candidate, colors)] }
    : undefined;
  const recipients = detail.recipients.length
    ? { label: '크루원 선택', items: detail.recipients.map((r) => toPerson(r, colors)) }
    : undefined;

  let title: string;
  if (detail.status === 'WAITING') title = '크루원의 응답을 기다리고 있어요';
  else if (detail.status === 'PENDING_MANAGER') title = '매니저의 승인을 기다리고 있어요';
  else title = closedTitle(detail);

  return {
    kind: 'crew',
    title,
    shiftDate: formatShiftDate(detail.shift.starts_at),
    shiftTime: formatShiftTime(detail.shift.starts_at, detail.shift.ends_at),
    shiftHelper: detail.shift.deleted ? DELETED_SHIFT_HELPER : undefined,
    people: candidate ?? recipients,
    actions: toActions(detail),
  };
}

function receivedModel(detail: SubstituteRequestDetail): CrewDetailModel {
  const isCandidate = detail.my_relation === 'CANDIDATE';
  const myResponse = detail.recipients[0]?.response;
  const actions = toActions(detail);

  let title: string;
  let helper: string | undefined;
  if (detail.status === 'WAITING') {
    // 시안은 미응답 상태만 있다. 거절 후 재수락·응답 불가 문구는 임시다.
    if (myResponse === 'DECLINED') title = '대타 요청을 거절했어요';
    else title = `${detail.requester.display_name}님이 대타를 요청했어요`;
    helper = '매니저 승인 후 확정돼요';
  } else if (detail.status === 'PENDING_MANAGER') {
    title = isCandidate ? '매니저의 승인을 기다리고 있어요' : '다른 크루원이 먼저 수락했어요';
    helper = isCandidate ? '매니저 승인 후 확정돼요' : undefined;
  } else if (detail.status === 'APPROVED') {
    title = isCandidate ? '대타가 확정됐어요' : '다른 크루원으로 대타가 확정됐어요';
    // 확정된 근무는 내 근무표에서 확인한다 (서버 행동이 아니라 화면 이동)
    if (isCandidate) actions.push({ key: 'view_schedule', label: '근무 일정 보기', variant: 'secondary' });
  } else {
    title = closedTitle(detail);
  }

  return {
    kind: 'crew',
    title,
    shiftDate: formatShiftDate(detail.shift.starts_at),
    shiftTime: formatShiftTime(detail.shift.starts_at, detail.shift.ends_at),
    shiftHelper: detail.shift.deleted ? DELETED_SHIFT_HELPER : helper,
    actions,
  };
}

function managerModel(detail: SubstituteRequestDetail): ManagerDetailModel {
  const requester = detail.requester.display_name;
  // 시안은 승인 대기(PENDING_MANAGER)만 있다. 나머지 문구는 임시다.
  let title = `${requester}님이 요청했어요`;
  let subtitle = '변경되는 근무 일정을 확인해주세요';
  if (detail.status === 'WAITING') {
    subtitle = '크루원의 응답을 기다리고 있어요';
  } else if (detail.status === 'APPROVED') {
    title = '대타를 승인했어요';
    subtitle = '근무 담당자가 변경됐어요';
  } else if (detail.status === 'REJECTED') {
    title = '대타를 거절했어요';
    subtitle = `${requester}님의 근무가 유지돼요`;
  } else if (detail.status !== 'PENDING_MANAGER') {
    title = closedTitle(detail);
    subtitle = `${requester}님의 근무가 유지돼요`;
  }

  return {
    kind: 'manager',
    title,
    subtitle,
    shiftDate: formatShiftDate(detail.shift.starts_at),
    shiftTime: formatShiftTime(detail.shift.starts_at, detail.shift.ends_at),
    requesterName: requester,
    candidateName: detail.candidate?.display_name ?? null,
    actions: toActions(detail),
  };
}

/** 서버 상세 → 화면 모델. 어떤 화면을 그릴지는 서버가 준 my_relation 으로 정한다 */
export function toDetailModel(
  detail: SubstituteRequestDetail,
  colors: PersonalColors = {},
): DetailModel {
  if (detail.my_relation === 'MANAGER') return managerModel(detail);
  if (detail.my_relation === 'REQUESTER') return sentModel(detail, colors);
  return receivedModel(detail);
}
