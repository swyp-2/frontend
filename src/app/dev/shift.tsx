import { useLocalSearchParams } from 'expo-router';
import { Children, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import type { LoadState } from '@/features/schedule/schedule-model';
import {
  ShiftDetailView,
  type ShiftDetailContent,
} from '@/features/shift/shift-detail-view';
import {
  MemberSelectPanel,
  sheetBackdropStyle,
  ShiftFormView,
  type MemberOption,
  type ShiftFormViewProps,
} from '@/features/shift/shift-form-view';
import { planShiftActions } from '@/features/shift/shift-model';
import { Colors } from '@/constants/theme';

/* 시안 프레임(402×874)에서 상태바(53)를 뺀 크기 */
const FRAME_WIDTH = 402;
const FRAME_HEIGHT = 821;

const MEMBERS: MemberOption[] = [
  { id: 1, name: '홍길동', role: '매니저' },
  { id: 2, name: '이은서', role: '크루원' },
  { id: 3, name: '정하은', role: '크루원' },
  { id: 4, name: '김서연', role: '크루원' },
  { id: 5, name: '최수빈', role: '크루원' },
  { id: 6, name: '박소율', role: '크루원' },
  { id: 7, name: '박정연', role: '크루원' },
];
const READY_MEMBERS: LoadState<MemberOption[]> = { status: 'ready', data: MEMBERS };

const noop = () => {};

const emptyForm: ShiftFormViewProps = {
  selectedNames: [],
  start: '',
  end: '',
  weekdays: [],
  onChangeStart: noop,
  onChangeEnd: noop,
  onChangeWeekdays: noop,
  onOpenMembers: noop,
  onSubmit: noop,
  onBack: noop,
  canSubmit: false,
};

const filledForm: ShiftFormViewProps = {
  ...emptyForm,
  selectedNames: ['이은서', '정하은', '최수빈', '김서연', '박소율'],
  start: '16:00',
  end: '22:00',
  weekdays: [1, 3, 5],
  canSubmit: true,
};

const baseDetail = {
  dateLabel: '11월 5일 (목)',
  timeLabel: '16:00-22:00',
  name: '정하은',
  role: '크루원',
  avatarLabel: '하은',
  avatarColor: 'purple',
} as const;

const request = {
  request_id: 1,
  status: 'PENDING',
  viewer_is_requester: true,
  pending_manager_approval: true,
};

function detail(
  allowed_actions: string[],
  extra: { is_started?: boolean; is_mine?: boolean; hasRequest?: boolean } = {},
): LoadState<ShiftDetailContent> {
  const plan = planShiftActions({
    allowed_actions,
    is_started: extra.is_started ?? false,
    is_mine: extra.is_mine ?? false,
    active_request: extra.hasRequest ? request : null,
  });
  return { status: 'ready', data: { ...baseDetail, ...plan } };
}

function Frame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.block}>
      <AppText variant="body3SB" color="gray800">
        {title}
      </AppText>
      <View style={styles.frame}>{children}</View>
    </View>
  );
}

function Sheet({ members, selected }: { members: LoadState<MemberOption[]>; selected: number[] }) {
  return (
    <>
      <ShiftFormView {...emptyForm} />
      <View style={sheetBackdropStyle} />
      <View style={styles.sheet}>
        <MemberSelectPanel
          members={members}
          initialSelectedIds={selected}
          onConfirm={noop}
          onClose={noop}
          onRetry={noop}
        />
      </View>
    </>
  );
}

/** 직접 입력해 볼 수 있는 폼 (API 호출 없음) */
function InteractiveForm() {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  return (
    <ShiftFormView
      {...emptyForm}
      start={start}
      end={end}
      weekdays={weekdays}
      onChangeStart={setStart}
      onChangeEnd={setEnd}
      onChangeWeekdays={setWeekdays}
    />
  );
}

/** ?only=N 이면 N번째(0부터) 프레임만 그린다 (스크린샷 비교용) */
function Gallery({ children }: { children: ReactNode }) {
  const { only } = useLocalSearchParams<{ only?: string }>();
  const frames = Children.toArray(children);
  const picked = only === undefined ? frames : frames.slice(Number(only), Number(only) + 1);
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      {picked}
    </ScrollView>
  );
}

export default function ShiftDevScreen() {
  return (
    <Gallery>
      <Frame title="근무 등록 · 기본">
        <ShiftFormView {...emptyForm} />
      </Frame>
      <Frame title="근무 등록 · 에러">
        <ShiftFormView
          {...emptyForm}
          startError="시간을 입력해주세요"
          endError="시간을 입력해주세요"
        />
      </Frame>
      <Frame title="근무 등록 · 선택 완료">
        <ShiftFormView {...filledForm} />
      </Frame>
      <Frame title="근무 등록 · 등록 중">
        <ShiftFormView {...filledForm} submitting />
      </Frame>
      <Frame title="근무 등록 · 서버 실패 (입력 유지)">
        <ShiftFormView
          {...filledForm}
          assigneeError="이 매장의 현재 구성원만 근무자로 선택할 수 있어요."
          repeatError="기간 안에 선택한 요일이 없어요."
          formError="네트워크 연결을 확인한 뒤 다시 시도해 주세요."
        />
      </Frame>
      <Frame title="근무 등록 · 직접 입력">
        <InteractiveForm />
      </Frame>
      <Frame title="근무자 선택 · 기본">
        <Sheet members={READY_MEMBERS} selected={[]} />
      </Frame>
      <Frame title="근무자 선택 · 선택 완료">
        <Sheet members={READY_MEMBERS} selected={[2, 3, 5]} />
      </Frame>
      <Frame title="근무자 선택 · 불러오는 중">
        <Sheet members={{ status: 'loading' }} selected={[]} />
      </Frame>
      <Frame title="근무자 선택 · 불러오기 실패">
        <Sheet
          members={{ status: 'error', message: '근무자 목록을 불러오지 못했어요.' }}
          selected={[]}
        />
      </Frame>
      <Frame title="근무 상세 · 매니저 (삭제)">
        <ShiftDetailView state={detail(['delete'])} onBack={noop} onAction={noop} />
      </Frame>
      <Frame title="근무 상세 · 매니저 (삭제 + 승인 요청 보기)">
        <ShiftDetailView
          state={detail(['delete', 'view_approval_request'], { hasRequest: true })}
          onBack={noop}
          onAction={noop}
        />
      </Frame>
      <Frame title="근무 상세 · 매니저 (삭제 실패)">
        <ShiftDetailView
          state={detail(['delete'])}
          onBack={noop}
          onAction={noop}
          actionError="근무 삭제는 아직 준비 중이에요."
        />
      </Frame>
      <Frame title="근무 상세 · 크루원 (대타 요청 가능)">
        <ShiftDetailView
          state={detail(['request_substitute'], { is_mine: true })}
          onBack={noop}
          onAction={noop}
        />
      </Frame>
      <Frame title="근무 상세 · 크루원 (진행 중 요청)">
        <ShiftDetailView
          state={detail(['view_request'], { is_mine: true, hasRequest: true })}
          onBack={noop}
          onAction={noop}
        />
      </Frame>
      <Frame title="근무 상세 · 크루원 (시작된 내 근무)">
        <ShiftDetailView
          state={detail([], { is_mine: true, is_started: true })}
          onBack={noop}
          onAction={noop}
        />
      </Frame>
      <Frame title="근무 상세 · 크루원 (다른 사람 근무)">
        <ShiftDetailView state={detail([])} onBack={noop} onAction={noop} />
      </Frame>
      <Frame title="근무 상세 · 불러오는 중">
        <ShiftDetailView state={{ status: 'loading' }} onBack={noop} onAction={noop} />
      </Frame>
      <Frame title="근무 상세 · 불러오기 실패">
        <ShiftDetailView
          state={{ status: 'error', message: '근무 정보를 불러오지 못했어요.' }}
          onBack={noop}
          onRetry={noop}
          onAction={noop}
        />
      </Frame>
    </Gallery>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.gray400,
  },
  content: {
    alignItems: 'center',
    gap: 24,
    paddingVertical: 24,
  },
  block: {
    gap: 8,
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  // 시안: 상태바 아래 16pt 부터 시트가 시작한다.
  sheet: {
    ...StyleSheet.absoluteFill,
    top: 16,
  },
});
