import * as Crypto from 'expo-crypto';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { roleLabel } from '@/features/profile/display';
import { ErrorState } from '@/features/requests/screen-state';
import type { LoadState } from '@/features/schedule/schedule-model';
import {
  ShiftBatchField,
  shiftBatchApi,
  type ShiftBatchCreateBody,
} from '@/features/shift/api';
import {
  MemberSelectSheet,
  ShiftFormView,
  type MemberOption,
} from '@/features/shift/shift-form-view';
import {
  buildBatchInput,
  isFormComplete,
  isValidTime,
  isWrongTime,
  resolveBaseDate,
} from '@/features/shift/shift-model';
import { Colors } from '@/constants/theme';
import { ApiError, storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

const TIME_REQUIRED = '시간을 입력해주세요';

type ServerErrors = {
  assignee?: string;
  start?: string;
  end?: string;
  repeat?: string;
  form?: string;
};

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/schedule');
}

function toServerErrors(error: unknown): ServerErrors {
  if (!(error instanceof ApiError)) return { form: '근무를 등록하지 못했어요. 다시 시도해 주세요.' };
  // 화면에 미리보기 단계가 없으므로 서버 문구("미리보기를 다시 확인") 대신 다시 누르도록 안내한다.
  if (error.code === 'PREVIEW_STALE') {
    return { form: '그사이 근무표가 바뀌었어요. 등록하기를 다시 눌러 주세요.' };
  }
  if (error.fieldErrors.length === 0) return { form: error.message };

  const errors: ServerErrors = {};
  const rest: string[] = [];
  for (const { field, reason } of error.fieldErrors) {
    if (field === ShiftBatchField.assignees) errors.assignee ??= reason;
    else if (field === ShiftBatchField.startsAt) errors.start ??= reason;
    else if (field === ShiftBatchField.endsAt) errors.end ??= reason;
    else if (field.startsWith('repeat.')) errors.repeat ??= reason;
    else rest.push(reason);
  }
  if (rest.length > 0) errors.form = rest.join('\n');
  return errors;
}

/**
 * 근무 등록 (매니저).
 * 시안에는 날짜 입력이 없어 기준일은 ?date=yyyy-MM-dd, 없으면 오늘(Asia/Seoul)이다.
 */
export default function ShiftNewScreen() {
  const { me } = useSession();
  const membership = me?.membership ?? null;
  const storeId = membership?.store_id;
  const isManager = membership?.role === 'MANAGER';
  const params = useLocalSearchParams<{ date?: string }>();
  const [baseDate] = useState(() => resolveBaseDate(params.date));

  const [members, setMembers] = useState<LoadState<MemberOption[]>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    if (storeId === undefined || !isManager) return;
    let cancelled = false;
    storeApi
      .members(storeId)
      .then(
        (list): LoadState<MemberOption[]> => ({
          status: 'ready',
          data: list.map((member) => ({
            id: member.membership_id,
            name: member.display_name,
            role: roleLabel[member.role],
          })),
        }),
        (error): LoadState<MemberOption[]> => ({
          status: 'error',
          message: error instanceof ApiError ? error.message : '근무자 목록을 불러오지 못했어요.',
        }),
      )
      .then((next) => {
        if (!cancelled) setMembers(next);
      });
    return () => {
      cancelled = true;
    };
  }, [storeId, isManager, reloadKey]);
  const reloadMembers = useCallback(() => {
    setMembers({ status: 'loading' });
    setReloadKey((key) => key + 1);
  }, []);

  const [memberIds, setMemberIds] = useState<number[]>([]);
  // 고른 뒤 목록을 다시 불러오지 못해도 이름을 보여 주려고 따로 들고 있는다.
  const [memberNames, setMemberNames] = useState<Record<number, string>>({});
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [touched, setTouched] = useState({ start: false, end: false });
  const [sheetOpen, setSheetOpen] = useState(false);
  const [serverErrors, setServerErrors] = useState<ServerErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  /**
   * 결과를 모르는 채 끊긴 최종 요청. 입력이 그대로면 같은 본문·같은 멱등 키로 다시 보내
   * 처음 요청이 이미 저장됐더라도 두 번 만들어지지 않게 한다.
   */
  const pending = useRef<{ inputKey: string; body: ShiftBatchCreateBody; key: string } | null>(
    null,
  );

  const values = useMemo(
    () => ({ memberIds, start, end, weekdays }),
    [memberIds, start, end, weekdays],
  );

  const clearError = (...fields: (keyof ServerErrors)[]) =>
    setServerErrors((prev) => {
      const next = { ...prev, form: undefined };
      for (const field of fields) next[field] = undefined;
      return next;
    });

  const localTimeError = (value: string, wasTouched: boolean) =>
    isWrongTime(value) || (wasTouched && !isValidTime(value)) ? TIME_REQUIRED : undefined;
  const startError = serverErrors.start ?? localTimeError(start, touched.start);
  const endError =
    serverErrors.end ??
    localTimeError(end, touched.end) ??
    (isValidTime(start) && start === end ? '시작 시간과 다르게 입력해주세요' : undefined);

  const submit = async () => {
    if (submittingRef.current || storeId === undefined || !isFormComplete(values)) return;
    submittingRef.current = true;
    setSubmitting(true);
    setServerErrors({});
    try {
      const input = buildBatchInput(storeId, values, baseDate);
      const inputKey = JSON.stringify(input);
      let attempt = pending.current?.inputKey === inputKey ? pending.current : null;
      if (!attempt) {
        pending.current = null;
        const preview = await shiftBatchApi.preview(input);
        if (preview.create_count === 0) {
          setServerErrors({ form: '모두 이미 등록된 근무예요.' });
          return;
        }
        attempt = {
          inputKey,
          body: { ...input, preview_token: preview.preview_token },
          key: Crypto.randomUUID(),
        };
        pending.current = attempt;
      }
      try {
        await shiftBatchApi.create(attempt.body, attempt.key);
      } catch (error) {
        // 서버가 분명히 거절한 요청은 다시 보내도 같은 결과라 버리고, 다음엔 미리보기부터 새로 한다.
        const unknownOutcome =
          error instanceof ApiError && (error.status === 0 || error.status >= 500);
        if (!unknownOutcome) pending.current = null;
        throw error;
      }
      pending.current = null;
      goBack();
    } catch (error) {
      setServerErrors(toServerErrors(error));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!membership || !isManager) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppBar title="근무 등록" onBack={goBack} />
        <ErrorState
          message={
            membership ? '매니저만 근무를 등록할 수 있어요.' : '매장에 소속된 뒤에 이용할 수 있어요.'
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.flex}>
      <ShiftFormView
        selectedNames={memberIds.map((id) => memberNames[id] ?? '')}
        start={start}
        end={end}
        weekdays={weekdays}
        onChangeStart={(value) => {
          setStart(value);
          clearError('start');
        }}
        onChangeEnd={(value) => {
          setEnd(value);
          clearError('end');
        }}
        onBlurStart={() => setTouched((prev) => ({ ...prev, start: true }))}
        onBlurEnd={() => setTouched((prev) => ({ ...prev, end: true }))}
        onChangeWeekdays={(value) => {
          setWeekdays(value);
          clearError('repeat');
        }}
        onOpenMembers={() => setSheetOpen(true)}
        onSubmit={submit}
        onBack={goBack}
        canSubmit={isFormComplete(values)}
        submitting={submitting}
        assigneeError={serverErrors.assignee}
        startError={startError}
        endError={endError}
        repeatError={serverErrors.repeat}
        formError={serverErrors.form}
      />
      <MemberSelectSheet
        visible={sheetOpen}
        members={members}
        initialSelectedIds={memberIds}
        onRetry={reloadMembers}
        onClose={() => setSheetOpen(false)}
        onConfirm={(ids) => {
          if (members.status === 'ready') {
            setMemberNames(Object.fromEntries(members.data.map((m) => [m.id, m.name])));
          }
          setMemberIds(ids);
          clearError('assignee');
          setSheetOpen(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
});
