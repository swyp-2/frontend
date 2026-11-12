import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Checkbox } from '@/components/ui/checkbox';
import { ErrorState, LoadingState } from '@/features/requests/screen-state';

import { Heading, ScreenFrame, Section, ShiftCard } from './parts';

export type ComposeCandidate = { id: number; name: string; role: string };

export type CandidateListState =
  | { status: 'loading' }
  | { status: 'error'; message: string; onRetry?: () => void }
  | { status: 'loaded'; candidates: ComposeCandidate[] };

export type RequestComposeViewProps = {
  shiftDate: string;
  shiftTime: string;
  candidates: CandidateListState;
  selectedIds: readonly number[];
  onToggle: (id: number) => void;
  onSubmit: () => void;
  onBack?: () => void;
  /** 전송 중이면 버튼과 선택을 막는다 */
  submitting?: boolean;
  /** 전송 실패 안내. 선택값은 그대로 둔다 */
  errorMessage?: string | null;
};

/** RQ-01 대타 요청 작성: 원본 근무(읽기 전용) + 요청할 크루원 선택 */
export function RequestComposeView({
  shiftDate,
  shiftTime,
  candidates,
  selectedIds,
  onToggle,
  onSubmit,
  onBack,
  submitting = false,
  errorMessage,
}: RequestComposeViewProps) {
  const count = selectedIds.length;
  return (
    <ScreenFrame
      appBarTitle="대타 요청"
      onBack={onBack}
      busy={submitting}
      errorMessage={errorMessage}
      buttons={[
        {
          key: 'submit',
          label: '요청하기',
          count: count > 0 ? count : undefined,
          disabled: count === 0,
          onPress: onSubmit,
        },
      ]}>
      <Heading title={'대타를 요청할\n크루원을 선택해주세요'} />
      <Section label="대타 근무 일정" helper="날짜와 시간은 변경할 수 없어요">
        <ShiftCard date={shiftDate} time={shiftTime} />
      </Section>
      <Section label="크루원 선택">
        {candidates.status === 'loading' && <LoadingState style={styles.state} />}
        {candidates.status === 'error' && (
          <ErrorState
            style={styles.state}
            message={candidates.message}
            onRetry={candidates.onRetry}
          />
        )}
        {candidates.status === 'loaded' &&
          (candidates.candidates.length === 0 ? (
            <AppText variant="body2M" color="gray700" style={styles.empty}>
              요청할 수 있는 크루원이 없어요
            </AppText>
          ) : (
            <View style={styles.list}>
              {candidates.candidates.map((candidate) => (
                <Checkbox
                  key={candidate.id}
                  title={candidate.name}
                  description={candidate.role}
                  checked={selectedIds.includes(candidate.id)}
                  disabled={submitting}
                  onPress={() => onToggle(candidate.id)}
                />
              ))}
            </View>
          ))}
      </Section>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 5,
  },
  state: {
    flex: 0,
    minHeight: 160,
  },
  empty: {
    paddingVertical: 40,
    textAlign: 'center',
  },
});
