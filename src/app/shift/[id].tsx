import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { avatarColor, avatarLabel, roleLabel } from '@/features/profile/display';
import {
  formatLocalDate,
  formatTimeRange,
  type LoadState,
} from '@/features/schedule/schedule-model';
import { ShiftDetailView, type ShiftDetailContent } from '@/features/shift/shift-detail-view';
import { planShiftActions, type ShiftActionKind } from '@/features/shift/shift-model';
import { ApiError, shiftApi, storeApi, type Role, type ShiftDetail } from '@/lib/api';
import { confirmDestructive } from '@/lib/confirm';
import { useSession } from '@/lib/session';

type Loaded = { detail: ShiftDetail; role: Role | null };

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/schedule');
}

/** 시안에 삭제 확인 화면이 없어 OS 기본 확인창을 쓴다 */
const confirmDelete = () =>
  confirmDestructive({
    title: '근무를 삭제할까요?',
    message: '진행 중인 대타 요청이 있으면 함께 종료돼요.',
    confirmLabel: '삭제',
  });

/** 근무 상세. 보이는 버튼은 서버가 준 allowed_actions 를 그대로 따른다 */
export default function ShiftDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const shiftId = Number(id);
  const validId = Number.isInteger(shiftId) && shiftId > 0;
  const { me } = useSession();
  const storeId = me?.membership?.store_id;

  const [state, setState] = useState<LoadState<Loaded>>({ status: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);
  const [busyAction, setBusyAction] = useState<ShiftActionKind | null>(null);
  const busyRef = useRef(false);
  const [actionError, setActionError] = useState<string>();

  useEffect(() => {
    if (!validId) return;
    let cancelled = false;
    Promise.all([
      shiftApi.detail(shiftId),
      // 상세 응답에는 담당자의 역할이 없어 구성원 목록에서 찾는다. 못 불러와도 상세는 보여 준다.
      storeId === undefined ? null : storeApi.members(storeId).catch(() => null),
    ])
      .then(([detail, members]): LoadState<Loaded> => {
        const member = members?.find((m) => m.membership_id === detail.assignee.membership_id);
        return { status: 'ready', data: { detail, role: member?.role ?? null } };
      })
      .catch((error): LoadState<Loaded> => ({
        status: 'error',
        message:
          error instanceof ApiError && error.status === 404
            ? '삭제되었거나 볼 수 없는 근무예요.'
            : error instanceof ApiError
              ? error.message
              : '근무 정보를 불러오지 못했어요.',
      }))
      .then((next) => {
        if (!cancelled) setState(next);
      });
    return () => {
      cancelled = true;
    };
  }, [shiftId, validId, storeId, reloadKey]);

  // 대타 요청 화면 등에서 돌아오면 가능한 행동이 달라졌을 수 있어 조용히 다시 불러온다.
  const focusedOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focusedOnce.current) setReloadKey((key) => key + 1);
      focusedOnce.current = true;
    }, []),
  );

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setActionError(undefined);
    setReloadKey((key) => key + 1);
  }, []);

  const viewState = useMemo<LoadState<ShiftDetailContent>>(() => {
    if (!validId) return { status: 'error', message: '근무를 찾을 수 없어요.' };
    if (state.status !== 'ready') return state;
    const { detail, role } = state.data;
    const plan = planShiftActions(detail);
    return {
      status: 'ready',
      data: {
        dateLabel: formatLocalDate(detail.local_date),
        timeLabel: formatTimeRange(detail.starts_at, detail.ends_at),
        name: detail.assignee.display_name,
        role: role ? roleLabel[role] : undefined,
        avatarLabel: avatarLabel(detail.assignee.display_name),
        avatarColor: avatarColor(detail.assignee.personal_color),
        helper: plan.helper,
        buttons: plan.buttons,
      },
    };
  }, [state, validId]);

  const removeShift = async (detail: ShiftDetail) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusyAction('delete');
    setActionError(undefined);
    try {
      if (!(await confirmDelete())) return;
      await shiftApi.remove(detail.shift_id, detail.version);
      goBack();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setActionError('근무를 삭제하지 못했어요. 다시 시도해 주세요.');
      } else if (error.status === 404 || error.currentState === 'DELETED') {
        // 그 사이 다른 매니저가 삭제했다. 상세는 더 볼 수 없으니 근무표로 돌아간다.
        goBack();
      } else {
        setActionError(error.message);
        // 버전·담당자가 바뀐 경우(CHANGED). 최신 근무를 받아 와 다시 누를 수 있게 한다.
        if (error.code === 'SHIFT_STATE_CONFLICT') setReloadKey((key) => key + 1);
      }
    } finally {
      busyRef.current = false;
      setBusyAction(null);
    }
  };

  const onAction = (kind: ShiftActionKind) => {
    if (state.status !== 'ready' || busyRef.current) return;
    const { detail } = state.data;
    if (kind === 'delete') void removeShift(detail);
    else if (kind === 'request_substitute') {
      router.push({ pathname: '/requests/new', params: { shiftId: String(detail.shift_id) } });
    } else if (detail.active_request) {
      router.push({
        pathname: '/requests/[id]',
        params: { id: String(detail.active_request.request_id) },
      });
    }
  };

  return (
    <ShiftDetailView
      state={viewState}
      onBack={goBack}
      onRetry={validId ? retry : undefined}
      onAction={onAction}
      busyAction={busyAction}
      actionError={actionError}
    />
  );
}
