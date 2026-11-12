import * as Crypto from 'expo-crypto';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { goBack } from '@/components/onboarding-screen';
import {
  requestDetailApi,
  type RequestAction,
  type SubstituteRequestDetail,
} from '@/features/request-detail/api';
import {
  toDetailModel,
  type DetailActionKey,
  type PersonalColors,
} from '@/features/request-detail/model';
import {
  ActionConfirmSheet,
  RequestDetailPlaceholder,
  RequestDetailView,
  type ConfirmableAction,
} from '@/features/request-detail/request-detail-view';
import { formatShiftDate, formatShiftTime } from '@/features/requests/format';
import { ApiError, notificationApi, storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string; retryable: boolean }
  | { status: 'loaded'; detail: SubstituteRequestDetail };

const CONFIRMABLE: readonly DetailActionKey[] = ['cancel', 'withdraw', 'approve', 'final_reject'];
/** 그 사이 요청·근무 상태가 바뀐 경우. 최신 상태를 다시 불러와 보여 준다 */
const STALE_CODES = ['REQUEST_STATE_CONFLICT', 'REQUEST_EXPIRED', 'SHIFT_STATE_CONFLICT'];

const messageOf = (error: unknown, fallback: string) =>
  error instanceof ApiError ? error.message : fallback;

/** RQ-03 / AP-02 요청 상세. 서버가 준 관계·상태·allowed_actions 대로 그린다 */
export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const requestId = Number(id);
  const { me } = useSession();
  const storeId = me?.membership?.store_id;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [colors, setColors] = useState<PersonalColors>({});
  const [sheet, setSheet] = useState<ConfirmableAction | null>(null);
  // TODO: 최종 거절 API 는 사유를 받지 않는다. 시안대로 입력은 받지만 서버로 보내지 않는다.
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);

  const ticket = useRef(0);
  const running = useRef(false);
  // 네트워크 실패 뒤 같은 행동을 다시 누르면 같은 키를 보내 중복 처리를 막는다.
  const idempotency = useRef<{ action: RequestAction; key: string } | null>(null);

  const load = useCallback(async () => {
    const current = ++ticket.current;
    if (!Number.isInteger(requestId) || requestId <= 0) {
      setState({ status: 'error', message: '요청을 찾을 수 없어요.', retryable: false });
      return;
    }
    try {
      const detail = await requestDetailApi.get(requestId);
      if (current !== ticket.current) return;
      setState({ status: 'loaded', detail });
    } catch (error) {
      if (current !== ticket.current) return;
      setState({
        status: 'error',
        message: messageOf(error, '요청을 불러오지 못했어요.'),
        // 권한 없음·없는 요청은 다시 시도해도 같다.
        retryable: !(error instanceof ApiError && (error.status === 403 || error.status === 404)),
      });
    }
  }, [requestId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  // 상세를 열면 이 요청의 카드 점을 지운다. 점은 부가 정보라 실패해도 알리지 않는다.
  useEffect(() => {
    if (!Number.isInteger(requestId) || requestId <= 0) return;
    notificationApi.check(requestId).catch(() => undefined);
  }, [requestId]);

  // 아바타 색은 상세 응답에 없어 구성원 목록에서 가져온다. 실패해도 기본색으로 보여 주면 된다.
  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    storeApi
      .members(storeId)
      .then((members) => {
        if (cancelled) return;
        setColors(Object.fromEntries(members.map((m) => [m.membership_id, m.personal_color])));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [storeId]);

  if (state.status !== 'loaded') {
    return (
      <RequestDetailPlaceholder
        onBack={goBack}
        state={
          state.status === 'loading'
            ? state
            : {
                status: 'error',
                message: state.message,
                onRetry: state.retryable
                  ? () => {
                      setState({ status: 'loading' });
                      void load();
                    }
                  : undefined,
              }
        }
      />
    );
  }

  const { detail } = state;

  const run = async (action: RequestAction) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setNotice(null);
    setSheetError(null);
    if (idempotency.current?.action !== action) {
      idempotency.current = { action, key: Crypto.randomUUID() };
    }
    try {
      const next = await requestDetailApi.transition(detail.id, action, idempotency.current.key);
      idempotency.current = null;
      ticket.current++; // 진행 중이던 조회 결과가 이 응답을 덮지 않게 한다
      setState({ status: 'loaded', detail: next });
      setSheet(null);
      setReason('');
    } catch (error) {
      // 서버가 답을 준 실패는 같은 키로 다시 보내도 결과가 같으므로 키를 버린다.
      if (!(error instanceof ApiError) || error.status !== 0) idempotency.current = null;
      if (error instanceof ApiError && STALE_CODES.includes(error.code)) {
        setSheet(null);
        setNotice(error.message);
        await load();
      } else {
        const message = messageOf(error, '처리하지 못했어요. 다시 시도해 주세요.');
        // 확인 시트에서 실패하면 시트와 입력값을 그대로 두고 그 안에서 알린다.
        if (CONFIRMABLE.includes(action)) setSheetError(message);
        else setNotice(message);
      }
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  const onAction = (key: DetailActionKey) => {
    if (key === 'view_schedule') {
      router.navigate('/schedule');
    } else if (CONFIRMABLE.includes(key)) {
      setSheetError(null);
      setSheet(key as ConfirmableAction);
    } else {
      void run(key);
    }
  };

  return (
    <>
      <RequestDetailView
        model={toDetailModel(detail, colors)}
        onAction={onAction}
        onBack={goBack}
        busy={busy}
        errorMessage={notice}
      />
      <ActionConfirmSheet
        action={sheet}
        info={{
          shiftDate: formatShiftDate(detail.shift.starts_at),
          shiftTime: formatShiftTime(detail.shift.starts_at, detail.shift.ends_at),
          requesterName: detail.requester.display_name,
          candidateName: detail.candidate?.display_name ?? null,
        }}
        reason={reason}
        onChangeReason={setReason}
        busy={busy}
        errorMessage={sheetError}
        onConfirm={() => sheet && void run(sheet)}
        onClose={() => {
          if (!busy) setSheet(null);
        }}
      />
    </>
  );
}
