import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import {
  substituteRequestApi,
  type RequestBox,
  type SubstituteRequestSummary,
} from '@/features/requests/api';
import { toCrewCard, type CrewRequestCard } from '@/features/requests/cards';
import { openRequestTab } from '@/features/requests/notification-indicator';
import {
  CrewRequestsView,
  ManagerRequestsView,
  type CrewTab,
  type ListState,
  type ManagerTab,
} from '@/features/requests/requests-view';
import { ApiError } from '@/lib/api';
import { useSession } from '@/lib/session';

/** 요청 탭: 매니저는 대타 승인 요청, 크루는 보낸·받은 대타 요청 */
export default function RequestsScreen() {
  const { me } = useSession();
  const hasMembership = !!me?.membership;

  // 요청 탭에 들어올 때마다 지금까지 온 알림을 읽음 처리해 탭 점을 지운다 (매니저·크루 공통).
  useFocusEffect(
    useCallback(() => {
      if (hasMembership) void openRequestTab();
    }, [hasMembership]),
  );

  if (!me?.membership) return null;
  return me.membership.role === 'MANAGER' ? <ManagerRequests /> : <CrewRequests />;
}

const openRequest = (id: number) =>
  router.push({ pathname: '/requests/[id]', params: { id: String(id) } });

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '요청 목록을 불러오지 못했어요.';

/**
 * TODO(api): 매니저용 목록 계약이 없다. GET /me/substitute-requests 는 크루원 전용(매니저 403)이고
 * 백엔드 범위에서도 AP-01(처리 대기 목록)이 빠져 있어, 계약이 생길 때까지 목록 대신 안내만 보여 준다.
 * 그동안 매니저는 근무 상세의 "대타 승인 요청 보기"로 승인 화면(AP-02)에 들어간다.
 */
function ManagerRequests() {
  const [tab, setTab] = useState<ManagerTab>('requested');
  return (
    <ManagerRequestsView
      tab={tab}
      onTabChange={setTab}
      state={{
        status: 'error',
        message: '승인 요청 목록은 아직 준비 중이에요.',
        retryable: false,
      }}
      onPressItem={openRequest}
    />
  );
}

type CrewList = ListState<CrewRequestCard>;

/**
 * 보낸 요청의 응답 대기 카드는 요청한 대상 이름을 보여 줘야 하는데 목록 응답에는 대상이 없다.
 * 그래서 아직 수락자가 없는 진행 중 요청만 상세를 받아 이름을 채운다. 실패한 건은 이름 없이 둔다.
 */
async function loadRecipientNames(box: RequestBox, items: SubstituteRequestSummary[]) {
  const names = new Map<number, string[]>();
  if (box !== 'sent') return names;
  const waiting = items.filter((item) => item.status === 'WAITING' && !item.candidate);
  const results = await Promise.allSettled(
    waiting.map((item) => substituteRequestApi.recipients(item.id)),
  );
  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') return;
    names.set(
      waiting[index].id,
      result.value.recipients.map((recipient) => recipient.display_name),
    );
  });
  return names;
}

async function loadPage(box: RequestBox, cursor: string | null) {
  const page = await substituteRequestApi.list(box, cursor);
  const names = await loadRecipientNames(box, page.items);
  return {
    cards: page.items.map((item) => toCrewCard(item, box, names.get(item.id))),
    nextCursor: page.next_cursor,
    hasMore: page.has_more,
  };
}

function CrewRequests() {
  const [tab, setTab] = useState<CrewTab>('sent');
  const [lists, setLists] = useState<Record<CrewTab, CrewList>>({
    sent: { status: 'loading' },
    received: { status: 'loading' },
  });
  const [refreshing, setRefreshing] = useState(false);
  const cursors = useRef<Record<CrewTab, string | null>>({ sent: null, received: null });
  // 탭마다 가장 최근 첫 페이지 요청 번호. 늦게 도착한 이전 응답을 버리는 데 쓴다.
  const tickets = useRef<Record<CrewTab, number>>({ sent: 0, received: 0 });

  const setList = (box: CrewTab, next: CrewList | ((current: CrewList) => CrewList)) =>
    setLists((prev) => ({
      ...prev,
      [box]: typeof next === 'function' ? next(prev[box]) : next,
    }));

  const reload = useCallback(async (box: CrewTab) => {
    const ticket = ++tickets.current[box];
    try {
      const page = await loadPage(box, null);
      if (ticket !== tickets.current[box]) return;
      cursors.current[box] = page.nextCursor;
      setList(box, { status: 'ready', items: page.cards, hasMore: page.hasMore });
    } catch (error) {
      if (ticket !== tickets.current[box]) return;
      setList(box, { status: 'error', message: errorMessage(error) });
    }
  }, []);

  // 탭으로 돌아오거나 보낸/받은 탭을 바꿀 때마다 첫 페이지부터 다시 받는다.
  useFocusEffect(
    useCallback(() => {
      void reload(tab);
    }, [reload, tab]),
  );

  const loadMore = async () => {
    const box = tab;
    const current = lists[box];
    if (current.status !== 'ready' || !current.hasMore || current.loadingMore) return;
    const ticket = tickets.current[box];
    setList(box, { ...current, loadingMore: true, loadMoreFailed: false });
    try {
      const page = await loadPage(box, cursors.current[box]);
      // 그 사이 첫 페이지를 다시 받았으면 이 응답은 버린다.
      if (ticket !== tickets.current[box]) return;
      cursors.current[box] = page.nextCursor;
      setList(box, (latest) => {
        if (latest.status !== 'ready') return latest;
        const known = new Set(latest.items.map((item) => item.id));
        return {
          status: 'ready',
          items: [...latest.items, ...page.cards.filter((card) => !known.has(card.id))],
          hasMore: page.hasMore,
        };
      });
    } catch {
      if (ticket !== tickets.current[box]) return;
      setList(box, (latest) =>
        latest.status === 'ready'
          ? { ...latest, loadingMore: false, loadMoreFailed: true }
          : latest,
      );
    }
  };

  const retry = () => {
    setList(tab, { status: 'loading' });
    void reload(tab);
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload(tab);
    setRefreshing(false);
  };

  return (
    <CrewRequestsView
      tab={tab}
      onTabChange={setTab}
      state={lists[tab]}
      onPressItem={openRequest}
      onRetry={retry}
      onLoadMore={loadMore}
      onRefresh={refresh}
      refreshing={refreshing}
    />
  );
}
