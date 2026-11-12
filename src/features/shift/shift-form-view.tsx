import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FieldGroup, OnboardingScreen } from '@/components/onboarding-screen';
import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { SelectionField } from '@/components/ui/selection-field';
import { TextField } from '@/components/ui/text-field';
import { DayToggle } from '@/components/ui/week-selector';
import { ErrorState, LoadingState } from '@/features/requests/screen-state';
import type { LoadState } from '@/features/schedule/schedule-model';
import { Colors } from '@/constants/theme';

import { formatTimeInput } from './shift-model';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;
/** 근무자 칸에 이름으로 보여 주는 최대 인원. 나머지는 "외 N명" */
const MAX_NAMES = 3;

/* -------------------------------------------------------------------------- */
/* 근무 등록 폼                                                                */
/* -------------------------------------------------------------------------- */

export type ShiftFormViewProps = {
  /** 선택된 근무자 이름 (선택 순서) */
  selectedNames: string[];
  start: string;
  end: string;
  /** 0 = 일요일 … 6 = 토요일 */
  weekdays: number[];
  onChangeStart: (value: string) => void;
  onChangeEnd: (value: string) => void;
  onBlurStart?: () => void;
  onBlurEnd?: () => void;
  onChangeWeekdays: (value: number[]) => void;
  onOpenMembers: () => void;
  onSubmit: () => void;
  onBack?: () => void;
  canSubmit: boolean;
  submitting?: boolean;
  assigneeError?: string;
  startError?: string;
  endError?: string;
  repeatError?: string;
  /** 특정 칸에 붙일 수 없는 실패 안내 */
  formError?: string;
};

export function ShiftFormView({
  selectedNames,
  start,
  end,
  weekdays,
  onChangeStart,
  onChangeEnd,
  onBlurStart,
  onBlurEnd,
  onChangeWeekdays,
  onOpenMembers,
  onSubmit,
  onBack,
  canSubmit,
  submitting = false,
  assigneeError,
  startError,
  endError,
  repeatError,
  formError,
}: ShiftFormViewProps) {
  const toggleDay = (index: number) => {
    const next = weekdays.includes(index)
      ? weekdays.filter((day) => day !== index)
      : [...weekdays, index];
    onChangeWeekdays(next.sort((a, b) => a - b));
  };

  return (
    <OnboardingScreen
      appBarTitle="근무 등록"
      title="크루원의 근무를 등록해주세요"
      onBack={onBack}
      cta={{
        label: submitting ? '등록 중…' : '등록하기',
        onPress: onSubmit,
        disabled: !canSubmit || submitting,
      }}>
      <View style={styles.sections}>
        <FieldGroup label="근무자">
          <SelectionField
            placeholder="근무자를 선택해주세요"
            values={selectedNames.slice(0, MAX_NAMES)}
            moreCount={Math.max(0, selectedNames.length - MAX_NAMES)}
            disabled={submitting}
            onPress={onOpenMembers}
          />
          {!!assigneeError && <FieldError message={assigneeError} />}
        </FieldGroup>

        <View style={styles.times}>
          <View style={styles.timeRow}>
            <View style={styles.timeColumn}>
              <FieldGroup label="시작 시간">
                <TextField
                  size="M"
                  style={styles.timeField}
                  accessibilityLabel="시작 시간"
                  placeholder="00:00"
                  keyboardType="number-pad"
                  maxLength={5}
                  editable={!submitting}
                  value={start}
                  errorMessage={startError}
                  onChangeText={(text) => onChangeStart(formatTimeInput(text))}
                  onBlur={onBlurStart}
                />
              </FieldGroup>
            </View>
            <View style={styles.timeColumn}>
              <FieldGroup label="종료 시간">
                <TextField
                  size="M"
                  style={styles.timeField}
                  accessibilityLabel="종료 시간"
                  placeholder="00:00"
                  keyboardType="number-pad"
                  maxLength={5}
                  editable={!submitting}
                  value={end}
                  errorMessage={endError}
                  onChangeText={(text) => onChangeEnd(formatTimeInput(text))}
                  onBlur={onBlurEnd}
                />
              </FieldGroup>
            </View>
          </View>
          {/* 시안: 에러 안내가 뜨면 입력 방식 안내는 빠진다 */}
          {!startError && !endError && (
            <AppText variant="body3M" color="gray700">
              24시 방식으로 입력해주세요
            </AppText>
          )}
        </View>

        <FieldGroup label="요일 반복" helper="선택한 모든 근무자에게 같은 요일과 시간이 적용돼요">
          {/* WeekSelector 는 354pt 고정 폭이라, 좁은 화면에서도 줄어들도록 DayToggle 을 직접 늘어놓는다 */}
          <View style={styles.week}>
            {WEEKDAY_LABELS.map((label, index) => (
              <DayToggle
                key={label}
                label={label}
                accessibilityLabel={`${label}요일`}
                selected={weekdays.includes(index)}
                onPress={submitting ? undefined : () => toggleDay(index)}
                style={styles.day}
              />
            ))}
          </View>
          {!!repeatError && <FieldError message={repeatError} />}
        </FieldGroup>

        {!!formError && (
          <View accessibilityLiveRegion="polite">
            <FieldError message={formError} />
          </View>
        )}
      </View>
    </OnboardingScreen>
  );
}

function FieldError({ message }: { message: string }) {
  return (
    <AppText variant="body3M" color="red900" style={styles.fieldError}>
      {message}
    </AppText>
  );
}

/* -------------------------------------------------------------------------- */
/* 근무자 선택 바텀시트                                                        */
/* -------------------------------------------------------------------------- */

export type MemberOption = {
  id: number;
  name: string;
  /** "매니저" / "크루원" */
  role: string;
};

export type MemberSelectPanelProps = {
  members: LoadState<MemberOption[]>;
  /** 시트를 열 때의 선택. 시트 안에서 바꾼 내용은 "추가하기" 를 눌러야 반영된다 */
  initialSelectedIds: readonly number[];
  onConfirm: (ids: number[]) => void;
  onClose: () => void;
  onRetry?: () => void;
  /** 하단 안전 영역 */
  bottomInset?: number;
};

/** 시트 본체. 화면 위에 띄우는 일은 MemberSelectSheet 가 한다 */
export function MemberSelectPanel({
  members,
  initialSelectedIds,
  onConfirm,
  onClose,
  onRetry,
  bottomInset = 0,
}: MemberSelectPanelProps) {
  const [selected, setSelected] = useState<number[]>(() => [...initialSelectedIds]);

  const toggle = (id: number) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  // 목록에 없는(그사이 매장을 떠난) 사람은 선택에서 뺀다.
  const confirmable =
    members.status === 'ready'
      ? selected.filter((id) => members.data.some((member) => member.id === id))
      : [];

  return (
    <View style={styles.sheet}>
      <AppBar variant="sheet" title="근무자 추가" onClose={onClose} />
      {members.status === 'loading' && <LoadingState />}
      {members.status === 'error' && <ErrorState message={members.message} onRetry={onRetry} />}
      {members.status === 'ready' &&
        (members.data.length === 0 ? (
          <ErrorState message="선택할 수 있는 근무자가 없어요" />
        ) : (
          <ScrollView style={styles.flex} contentContainerStyle={styles.list}>
            {members.data.map((member) => (
              <Checkbox
                key={member.id}
                variant="bottom"
                title={member.name}
                description={member.role}
                checked={selected.includes(member.id)}
                onPress={() => toggle(member.id)}
              />
            ))}
          </ScrollView>
        ))}
      <View style={[styles.sheetFooter, { paddingBottom: 24 + bottomInset }]}>
        <Button
          label="추가하기"
          count={confirmable.length > 0 ? confirmable.length : undefined}
          disabled={confirmable.length === 0}
          onPress={() => onConfirm(confirmable)}
        />
      </View>
    </View>
  );
}

export type MemberSelectSheetProps = Omit<MemberSelectPanelProps, 'bottomInset'> & {
  visible: boolean;
};

export function MemberSelectSheet({ visible, onClose, ...panel }: MemberSelectSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.flex}>
        <Pressable style={styles.backdrop} accessibilityLabel="닫기" onPress={onClose} />
        {visible && (
          // 874 프레임에서 시트 높이가 805 → 상태바(53) 아래 16 부터 시작한다.
          <View style={[styles.flex, { marginTop: insets.top + 16 }]}>
            <MemberSelectPanel {...panel} onClose={onClose} bottomInset={insets.bottom} />
          </View>
        )}
      </View>
    </Modal>
  );
}

export const sheetBackdropStyle = {
  ...StyleSheet.absoluteFill,
  backgroundColor: Colors.gray900,
  opacity: 0.4,
} as const;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  // 시안의 각 묶음은 위아래 16pt 여백을 갖는다 → 묶음 사이 32pt.
  sections: {
    gap: 32,
  },
  times: {
    gap: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  timeColumn: {
    flex: 1,
  },
  // Text Field_M 은 172pt 고정인데 402pt 보다 좁은 화면에서도 두 칸이 들어가도록 칸 폭을 따른다.
  timeField: {
    width: 'auto',
    alignSelf: 'stretch',
  },
  week: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  day: {
    flexShrink: 1,
  },
  fieldError: {
    paddingHorizontal: 4,
  },
  backdrop: sheetBackdropStyle,
  sheet: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: Colors.white,
  },
  list: {
    gap: 5,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  sheetFooter: {
    paddingHorizontal: 24,
  },
});
