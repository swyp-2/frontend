import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';
import type { RequestAction, SubstituteRequestDetail } from '@/features/request-detail/api';
import { toDetailModel, type PersonalColors } from '@/features/request-detail/model';
import {
  RequestComposeView,
  type CandidateListState,
} from '@/features/request-detail/request-compose-view';
import {
  ActionConfirmSheet,
  RequestDetailPlaceholder,
  RequestDetailView,
  type ConfirmableAction,
} from '@/features/request-detail/request-detail-view';
import { formatShiftDate, formatShiftTime } from '@/features/requests/format';
import type { RecipientResponse, SubstituteStatus } from '@/features/requests/api';

/** 대타 요청 작성·요청 상세 화면 확인용 개발 화면 (/dev/request-detail). 서버 없이 가짜 응답으로 그린다 */

const noop = () => undefined;

const member = (membership_id: number, display_name: string) => ({ membership_id, display_name });

const doyun = member(1, '이도윤');
const eunseo = member(2, '이은서');
const haeun = member(3, '정하은');
const subin = member(4, '최수빈');
const soyul = member(5, '박소율');

const colors: PersonalColors = { 1: '#8E4EC6', 2: '#0090FF', 3: '#E5484D', 4: '#46A758' };

// 11월 9일 (월) 14:00-18:00, 11월 6일 (금) 10:00-14:00 (KST)
const nov9 = { shift_id: 9, starts_at: '2026-11-09T05:00:00Z', ends_at: '2026-11-09T09:00:00Z', deleted: false };
const nov6 = { shift_id: 6, starts_at: '2026-11-06T01:00:00Z', ends_at: '2026-11-06T05:00:00Z', deleted: false };

const recipient = (m: typeof doyun, response: RecipientResponse = 'PENDING') => ({ ...m, response });

function detail(
  status: SubstituteStatus,
  overrides: Partial<SubstituteRequestDetail>,
  allowed_actions: RequestAction[] = [],
): SubstituteRequestDetail {
  return {
    id: 1,
    status,
    terminal_reason: null,
    version: 1,
    created_at: '2026-11-01T00:00:00Z',
    closed_at: null,
    shift: nov9,
    requester: doyun,
    candidate: null,
    my_relation: 'REQUESTER',
    recipients: [],
    allowed_actions,
    events: [],
    ...overrides,
  };
}

const sentRecipients = [recipient(eunseo), recipient(doyun), recipient(haeun), recipient(subin)];

const sent = {
  waiting: detail('WAITING', { recipients: sentRecipients }, ['cancel']),
  pending: detail('PENDING_MANAGER', { candidate: eunseo, recipients: sentRecipients }, ['cancel']),
  approved: detail('APPROVED', { candidate: eunseo, recipients: sentRecipients }),
  rejected: detail('REJECTED', { candidate: eunseo, recipients: sentRecipients }),
  allDeclined: detail('ALL_DECLINED', { recipients: sentRecipients }),
};

const mine = [recipient(eunseo)];
const received = {
  waiting: detail('WAITING', { my_relation: 'TARGET', recipients: mine }, ['accept', 'reject']),
  declined: detail(
    'WAITING',
    { my_relation: 'TARGET', recipients: [recipient(eunseo, 'DECLINED')] },
    ['accept'],
  ),
  pendingDesign: detail('PENDING_MANAGER', { my_relation: 'CANDIDATE', candidate: eunseo, recipients: mine }),
  pendingServer: detail(
    'PENDING_MANAGER',
    { my_relation: 'CANDIDATE', candidate: eunseo, recipients: mine },
    ['withdraw'],
  ),
  approved: detail('APPROVED', { my_relation: 'CANDIDATE', candidate: eunseo, recipients: mine }),
  takenByOther: detail('PENDING_MANAGER', { my_relation: 'TARGET', candidate: subin, recipients: mine }),
};

const managerBase = { my_relation: 'MANAGER' as const, shift: nov6, requester: haeun, candidate: soyul };
const manager = {
  pending: detail('PENDING_MANAGER', managerBase, ['approve', 'final_reject']),
  approved: detail('APPROVED', managerBase),
  rejected: detail('REJECTED', managerBase),
  waiting: detail('WAITING', { ...managerBase, candidate: null }),
};

const candidates: CandidateListState = {
  status: 'loaded',
  candidates: ['홍길동', '이은서', '정하은', '김서연', '최수빈', '이도윤', '박정연'].map((name, i) => ({
    id: i + 1,
    name,
    role: '크루원',
  })),
};

function Frame({ title, height = 874, children }: { title: string; height?: number; children: ReactNode }) {
  return (
    <View style={styles.cell}>
      <AppText variant="body4SB" color="gray800">
        {title}
      </AppText>
      <View style={[styles.frame, { height }]}>{children}</View>
    </View>
  );
}

type DetailFrameProps = {
  title: string;
  detail: SubstituteRequestDetail;
  /** 열어 둘 확인 시트 */
  sheet?: ConfirmableAction;
  reason?: string;
  /** 서버에 없는 값이라 가짜 응답으로는 만들 수 없어 모델에 직접 넣는다 */
  rejectReason?: string;
  busy?: boolean;
  errorMessage?: string;
  sheetError?: string;
};

function DetailFrame({
  title,
  detail: data,
  sheet,
  reason: initialReason = '',
  rejectReason,
  busy,
  errorMessage,
  sheetError,
}: DetailFrameProps) {
  const [reason, setReason] = useState(initialReason);
  const model = toDetailModel(data, colors);
  return (
    <Frame title={title}>
      <RequestDetailView
        model={model.kind === 'crew' && rejectReason ? { ...model, rejectReason } : model}
        onAction={noop}
        onBack={noop}
        busy={busy}
        errorMessage={errorMessage}
      />
      {!!sheet && (
        <>
          <View style={styles.backdrop} />
          <View style={styles.sheet}>
            <ActionConfirmSheet
              inline
              action={sheet}
              info={{
                shiftDate: formatShiftDate(data.shift.starts_at),
                shiftTime: formatShiftTime(data.shift.starts_at, data.shift.ends_at),
                requesterName: data.requester.display_name,
                candidateName: data.candidate?.display_name ?? null,
              }}
              reason={reason}
              onChangeReason={setReason}
              busy={busy}
              errorMessage={sheetError}
              onConfirm={noop}
              onClose={noop}
            />
          </View>
        </>
      )}
    </Frame>
  );
}

function ComposeFrame({
  title,
  initial = [],
  list = candidates,
  submitting,
  errorMessage,
}: {
  title: string;
  initial?: number[];
  list?: CandidateListState;
  submitting?: boolean;
  errorMessage?: string;
}) {
  const [selected, setSelected] = useState<number[]>(initial);
  return (
    <Frame title={title} height={1099}>
      <RequestComposeView
        shiftDate={formatShiftDate(nov9.starts_at)}
        shiftTime={formatShiftTime(nov9.starts_at, nov9.ends_at)}
        candidates={list}
        selectedIds={selected}
        onToggle={(id) =>
          setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
        }
        onSubmit={noop}
        onBack={noop}
        submitting={submitting}
        errorMessage={errorMessage}
      />
    </Frame>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      <AppText variant="body1B">{title}</AppText>
      <View style={styles.row}>{children}</View>
    </View>
  );
}

export default function RequestDetailGalleryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Group title="A. 대타 요청 작성 (크루원)">
        <ComposeFrame title="764:5074 C 대타 요청" />
        <ComposeFrame title="764:5104 크루원 선택" initial={[2, 3, 5, 6]} />
        <ComposeFrame
          title="(시안 없음) 전송 실패: 선택 유지"
          initial={[2, 3]}
          errorMessage="요청을 보내지 못했어요. 다시 시도해 주세요."
        />
        <ComposeFrame title="(시안 없음) 전송 중" initial={[2, 3]} submitting />
        <ComposeFrame title="(시안 없음) 크루원 목록 로딩" list={{ status: 'loading' }} />
        <ComposeFrame
          title="(시안 없음) 크루원 목록 실패"
          list={{ status: 'error', message: '크루원 목록을 불러오지 못했어요.', onRetry: noop }}
        />
        <ComposeFrame title="(시안 없음) 후보 0명" list={{ status: 'loaded', candidates: [] }} />
      </Group>

      <Group title="B-1. 크루원: 보낸 요청">
        <DetailFrame title="764:5134 응답 대기" detail={sent.waiting} />
        <DetailFrame title="764:5212 승인 대기" detail={sent.pending} />
        <DetailFrame title="764:5235 승인" detail={sent.approved} />
        <DetailFrame title="764:5256 거절" detail={sent.rejected} />
        <DetailFrame
          title="764:5277 거절 사유 (서버 필드 없음)"
          detail={sent.rejected}
          rejectReason="잦은 대타 요청"
        />
        <DetailFrame title="(시안 없음) 요청 취소 확인" detail={sent.waiting} sheet="cancel" />
        <DetailFrame title="(시안 없음) 모두 거절" detail={sent.allDeclined} />
      </Group>

      <Group title="B-2. 크루원: 받은 요청">
        <DetailFrame title="764:5160 응답 대기" detail={received.waiting} />
        <DetailFrame title="764:5179 승인 대기 (시안: 버튼 없음)" detail={received.pendingDesign} />
        <DetailFrame title="764:5195 확정" detail={received.approved} />
        <DetailFrame
          title="(시안 없음) 승인 대기 + 서버가 withdraw 허용"
          detail={received.pendingServer}
        />
        <DetailFrame
          title="(시안 없음) 수락 철회 확인"
          detail={received.pendingServer}
          sheet="withdraw"
        />
        <DetailFrame title="(시안 없음) 거절 후 재수락 가능" detail={received.declined} />
        <DetailFrame title="(시안 없음) 다른 크루원이 수락" detail={received.takenByOther} />
        <DetailFrame
          title="(시안 없음) 처리 실패 안내"
          detail={received.waiting}
          errorMessage="요청 상태가 바뀌었어요. 최신 요청을 확인해 주세요."
        />
      </Group>

      <Group title="B-3. 매니저">
        <DetailFrame title="764:5903 M 요청 상세" detail={manager.pending} />
        <DetailFrame title="764:5929 최종 승인 확인" detail={manager.pending} sheet="approve" />
        <DetailFrame title="764:5967 최종 거절 확인" detail={manager.pending} sheet="final_reject" />
        <DetailFrame
          title="764:6004 최종 거절 확인 사유"
          detail={manager.pending}
          sheet="final_reject"
          reason="잦은 대타 요청"
        />
        <DetailFrame
          title="(시안 없음) 최종 승인 실패: 시트 유지"
          detail={manager.pending}
          sheet="approve"
          sheetError="네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        />
        <DetailFrame title="(시안 없음) 승인 완료" detail={manager.approved} />
        <DetailFrame title="(시안 없음) 거절 완료" detail={manager.rejected} />
        <DetailFrame title="(시안 없음) 응답 대기" detail={manager.waiting} />
      </Group>

      <Group title="로딩 · 조회 실패">
        <Frame title="로딩">
          <RequestDetailPlaceholder state={{ status: 'loading' }} onBack={noop} />
        </Frame>
        <Frame title="조회 실패 (다시 시도)">
          <RequestDetailPlaceholder
            state={{ status: 'error', message: '요청을 불러오지 못했어요.', onRetry: noop }}
            onBack={noop}
          />
        </Frame>
        <Frame title="권한 없음 · 없는 요청 (다시 시도 없음)">
          <RequestDetailPlaceholder
            state={{ status: 'error', message: '요청을 찾을 수 없어요.' }}
            onBack={noop}
          />
        </Frame>
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
    padding: 24,
    backgroundColor: Colors.gray400,
  },
  group: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  cell: {
    gap: 6,
  },
  frame: {
    width: 402,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.gray900,
    opacity: 0.4,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
