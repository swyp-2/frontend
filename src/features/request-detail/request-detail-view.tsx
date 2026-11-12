import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { ProfileListItem } from '@/components/ui/list';
import { TextArea } from '@/components/ui/text-area';
import { Colors } from '@/constants/theme';
import { ErrorState, LoadingState } from '@/features/requests/screen-state';

import { ConfirmSheet, ConfirmSheetContent } from './confirm-sheet';
import type {
  CrewDetailModel,
  DetailActionKey,
  DetailModel,
  ManagerDetailModel,
} from './model';
import { Heading, ScreenFrame, Section, ShiftCard, type FooterButton } from './parts';

const APP_BAR_TITLE = '요청 상세';

export type RequestDetailViewProps = {
  model: DetailModel;
  onAction: (key: DetailActionKey) => void;
  onBack?: () => void;
  /** 처리 중이면 버튼을 막는다 */
  busy?: boolean;
  /** 버튼 위 안내 (실패, 또는 409 뒤 최신 상태로 바뀌었다는 안내) */
  errorMessage?: string | null;
};

/** 요청 상세. 크루원(보낸·받은 요청)과 매니저 화면을 model.kind 로 나눈다 */
export function RequestDetailView({
  model,
  onAction,
  onBack,
  busy,
  errorMessage,
}: RequestDetailViewProps) {
  const buttons: FooterButton[] = model.actions.map((action) => ({
    ...action,
    onPress: () => onAction(action.key),
  }));
  return (
    <ScreenFrame
      appBarTitle={APP_BAR_TITLE}
      onBack={onBack}
      buttons={buttons}
      busy={busy}
      errorMessage={errorMessage}>
      {model.kind === 'manager' ? <ManagerBody model={model} /> : <CrewBody model={model} />}
    </ScreenFrame>
  );
}

function CrewBody({ model }: { model: CrewDetailModel }) {
  return (
    <>
      <Heading title={model.title} />
      <Section label="대타 근무 일정" helper={model.shiftHelper}>
        <ShiftCard date={model.shiftDate} time={model.shiftTime} />
      </Section>
      {!!model.people && (
        <Section label={model.people.label}>
          <View style={styles.people}>
            {model.people.items.map((person) => (
              <ProfileListItem
                key={person.id}
                name={person.name}
                role={person.role}
                avatarLabel={person.avatarLabel}
                avatarColor={person.avatarColor}
              />
            ))}
          </View>
        </Section>
      )}
      {!!model.rejectReason && (
        <Section label="거절 사유">
          <TextArea value={model.rejectReason} editable={false} />
        </Section>
      )}
    </>
  );
}

function ManagerBody({ model }: { model: ManagerDetailModel }) {
  return (
    <View style={styles.manager}>
      <View style={styles.managerHeading}>
        <AppText variant="head24SB" accessibilityRole="header" style={styles.center}>
          {model.title}
        </AppText>
        <AppText variant="body2M" color="gray700" style={styles.center}>
          {model.subtitle}
        </AppText>
      </View>
      <View style={styles.swap}>
        <SwapCard date={model.shiftDate} time={model.shiftTime} name={model.requesterName} />
        <SwapCard
          date={model.shiftDate}
          time={model.shiftTime}
          // 수락 후보가 아직 없을 때의 표시는 시안에 없다.
          name={model.candidateName ?? '미정'}
        />
        <View style={styles.arrow}>
          <Icon name="arrow-01" />
        </View>
      </View>
    </View>
  );
}

function SwapCard({ date, time, name }: { date: string; time: string; name: string }) {
  return (
    <View style={styles.swapCard}>
      <View style={styles.swapWhen}>
        <AppText variant="body2SB" numberOfLines={1}>
          {date}
        </AppText>
        <AppText variant="body1SB" numberOfLines={1}>
          {time}
        </AppText>
      </View>
      <AppText variant="body3M" color="gray800" numberOfLines={1}>
        {name}
      </AppText>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* 확인 바텀시트                                                               */
/* -------------------------------------------------------------------------- */

/** 확인이 필요한 행동. 크루원 거절(reject)과 수락(accept)은 확인 없이 바로 처리한다 */
export type ConfirmableAction = 'cancel' | 'withdraw' | 'approve' | 'final_reject';

export type ConfirmInfo = {
  shiftDate: string;
  shiftTime: string;
  requesterName: string;
  candidateName: string | null;
};

function confirmCopy(action: ConfirmableAction, info: ConfirmInfo) {
  switch (action) {
    case 'approve':
      return {
        title: '근무 대타를 승인할까요?',
        highlight: `${info.shiftDate} ${info.shiftTime}`,
        message: `해당 일자의 크루원이\n${info.requesterName}님에서 ${info.candidateName ?? '대타 크루원'}님으로 변경돼요`,
        confirmLabel: '최종 승인하기',
      };
    case 'final_reject':
      return {
        title: '근무 대타를 거절할까요?',
        message: `${info.requesterName}님의 근무가 유지돼요`,
        confirmLabel: '최종 거절하기',
      };
    // 요청 취소·수락 철회 확인은 시안이 없어 거절 확인과 같은 틀에 임시 문구를 넣었다.
    case 'cancel':
      return {
        title: '대타 요청을 취소할까요?',
        message: '요청이 종료되고 내 근무는 그대로 유지돼요',
        confirmLabel: '요청 취소하기',
      };
    case 'withdraw':
      return {
        title: '수락을 철회할까요?',
        message: `요청이 종료되고 ${info.requesterName}님의 근무가 유지돼요`,
        confirmLabel: '수락 철회하기',
      };
  }
}

export type ActionConfirmSheetProps = {
  /** null 이면 닫힌 상태 */
  action: ConfirmableAction | null;
  info: ConfirmInfo;
  /** 최종 거절 사유 입력값 */
  reason: string;
  onChangeReason: (reason: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  errorMessage?: string | null;
  /** true 면 Modal 없이 시트만 그린다 (개발용 화면) */
  inline?: boolean;
};

export function ActionConfirmSheet({
  action,
  info,
  reason,
  onChangeReason,
  inline = false,
  ...rest
}: ActionConfirmSheetProps) {
  // 닫히는 동안에도 Modal 이 내용을 요구하므로 기본 문구를 채워 둔다.
  const copy = confirmCopy(action ?? 'cancel', info);
  const children =
    action === 'final_reject' ? (
      <TextArea
        value={reason}
        onChangeText={onChangeReason}
        placeholder="거절 사유를 작성해주세요 (선택)"
        accessibilityLabel="거절 사유"
        editable={!rest.busy}
      />
    ) : null;

  if (inline) {
    if (!action) return null;
    return (
      <ConfirmSheetContent {...copy} {...rest}>
        {children}
      </ConfirmSheetContent>
    );
  }
  return (
    <ConfirmSheet visible={!!action} {...copy} {...rest}>
      {children}
    </ConfirmSheet>
  );
}

/* -------------------------------------------------------------------------- */
/* 로딩 · 오류                                                                 */
/* -------------------------------------------------------------------------- */

export type RequestDetailPlaceholderProps = {
  state: { status: 'loading' } | { status: 'error'; message: string; onRetry?: () => void };
  appBarTitle?: string;
  onBack?: () => void;
};

/** 상세·작성 화면의 로딩과 조회 실패 */
export function RequestDetailPlaceholder({
  state,
  appBarTitle = APP_BAR_TITLE,
  onBack,
}: RequestDetailPlaceholderProps) {
  return (
    <ScreenFrame appBarTitle={appBarTitle} onBack={onBack} scroll={false}>
      {state.status === 'loading' ? (
        <LoadingState />
      ) : (
        <ErrorState message={state.message} onRetry={state.onRetry} />
      )}
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  center: {
    textAlign: 'center',
  },
  people: {
    gap: 5,
  },
  // 874 프레임에서 앱 바(111) 아래 89 에서 제목이 시작하고, 제목 묶음 60 아래에 카드가 온다.
  manager: {
    paddingTop: 89,
  },
  managerHeading: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  swap: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 60,
    marginHorizontal: 24,
  },
  swapCard: {
    flex: 1,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.gray300,
  },
  swapWhen: {
    alignItems: 'center',
    gap: 4,
  },
  arrow: {
    position: 'absolute',
    top: 75,
    left: '50%',
    width: 30,
    height: 30,
    marginLeft: -15,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
});
