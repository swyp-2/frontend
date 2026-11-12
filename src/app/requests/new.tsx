import * as Crypto from 'expo-crypto';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { goBack } from '@/components/onboarding-screen';
import { roleLabel } from '@/features/profile/display';
import { requestDetailApi } from '@/features/request-detail/api';
import {
  RequestComposeView,
  type CandidateListState,
} from '@/features/request-detail/request-compose-view';
import { RequestDetailPlaceholder } from '@/features/request-detail/request-detail-view';
import { formatShiftDate, formatShiftTime } from '@/features/requests/format';
import { ApiError, shiftApi, storeApi, type ShiftDetail } from '@/lib/api';
import { useSession } from '@/lib/session';

type ShiftState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retryable: boolean }
  | { status: 'loaded'; shift: ShiftDetail };

const APP_BAR_TITLE = '대타 요청';

const messageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

const openDetail = (requestId: number) =>
  router.replace({ pathname: '/requests/[id]', params: { id: String(requestId) } });

/** RQ-01 대타 요청 작성 (/requests/new?shiftId=) */
export default function RequestComposeScreen() {
  const params = useLocalSearchParams<{ shiftId: string }>();
  const shiftId = Number(params.shiftId);
  const { me } = useSession();
  const storeId = me?.membership?.store_id;
  const validShiftId = Number.isInteger(shiftId) && shiftId > 0;

  const [shiftState, setShiftState] = useState<ShiftState>({ status: 'loading' });
  const [candidates, setCandidates] = useState<CandidateListState>({ status: 'loading' });
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const running = useRef(false);
  // 같은 선택으로 다시 보내면 같은 키를 써서 중복 생성을 막는다 (선택이 바뀌면 새 키).
  const idempotency = useRef<{ signature: string; key: string } | null>(null);

  const loadShift = useCallback(async () => {
    if (!validShiftId) return;
    try {
      const shift = await shiftApi.detail(shiftId);
      // 이미 진행 중인 요청이 있으면 새로 만들지 않고 그 상세로 보낸다.
      if (shift.active_request) {
        openDetail(shift.active_request.request_id);
        return;
      }
      setShiftState({ status: 'loaded', shift });
    } catch (e) {
      setShiftState({
        status: 'error',
        message: messageOf(e, '근무 정보를 불러오지 못했어요.'),
        retryable: !(e instanceof ApiError && (e.status === 403 || e.status === 404)),
      });
    }
  }, [shiftId, validShiftId]);

  const loadCandidates = useCallback(async () => {
    if (!storeId) return;
    try {
      const members = await storeApi.members(storeId, 'substitute_candidates');
      setCandidates({
        status: 'loaded',
        candidates: members
          // 서버가 이미 본인·매니저를 빼고 주지만 한 번 더 거른다.
          .filter((member) => !member.is_me && member.role === 'CREW')
          .map((member) => ({
            id: member.membership_id,
            name: member.display_name,
            role: roleLabel[member.role],
          })),
      });
    } catch (e) {
      setCandidates({
        status: 'error',
        message: messageOf(e, '크루원 목록을 불러오지 못했어요.'),
      });
    }
  }, [storeId]);

  useFocusEffect(
    useCallback(() => {
      void loadShift();
      void loadCandidates();
    }, [loadShift, loadCandidates]),
  );

  if (!validShiftId || !storeId) {
    return (
      <RequestDetailPlaceholder
        appBarTitle={APP_BAR_TITLE}
        onBack={goBack}
        state={{
          status: 'error',
          message: validShiftId ? '매장 정보를 확인할 수 없어요.' : '근무를 찾을 수 없어요.',
        }}
      />
    );
  }

  if (shiftState.status !== 'loaded') {
    return (
      <RequestDetailPlaceholder
        appBarTitle={APP_BAR_TITLE}
        onBack={goBack}
        state={
          shiftState.status === 'loading'
            ? shiftState
            : {
                status: 'error',
                message: shiftState.message,
                onRetry: shiftState.retryable
                  ? () => {
                      setShiftState({ status: 'loading' });
                      void loadShift();
                    }
                  : undefined,
              }
        }
      />
    );
  }

  const { shift } = shiftState;

  const toggle = (id: number) => {
    setError(null);
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (running.current || selectedIds.length === 0) return;
    running.current = true;
    setSubmitting(true);
    setError(null);
    const targets = [...selectedIds].sort((a, b) => a - b);
    const signature = targets.join(',');
    if (idempotency.current?.signature !== signature) {
      idempotency.current = { signature, key: Crypto.randomUUID() };
    }
    try {
      const created = await requestDetailApi.create(shift.shift_id, targets, idempotency.current.key);
      openDetail(created.id);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ACTIVE_REQUEST_EXISTS') {
        if (e.existingRequestId) {
          openDetail(e.existingRequestId);
          return;
        }
      }
      setError(
        e instanceof ApiError
          ? e.messageFor('target_membership_ids')
          : '요청을 보내지 못했어요. 다시 시도해 주세요.',
      );
    } finally {
      running.current = false;
      setSubmitting(false);
    }
  };

  return (
    <RequestComposeView
      shiftDate={formatShiftDate(shift.starts_at)}
      shiftTime={formatShiftTime(shift.starts_at, shift.ends_at)}
      candidates={
        candidates.status === 'error'
          ? {
              ...candidates,
              onRetry: () => {
                setCandidates({ status: 'loading' });
                void loadCandidates();
              },
            }
          : candidates
      }
      selectedIds={selectedIds}
      onToggle={toggle}
      onSubmit={submit}
      onBack={goBack}
      submitting={submitting}
      errorMessage={error}
    />
  );
}
