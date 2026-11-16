import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/lib/api';

import type { ListState } from './requests-view';

export type RequestPage<C> = { cards: C[]; nextCursor: string | null; hasMore: boolean };

const LOADING = { status: 'loading' } as const;

const errorMessage = (error: unknown) =>
  error instanceof ApiError ? error.message : '요청 목록을 불러오지 못했어요.';

/**
 * 탭이 있는 요청 목록의 상태. 반환값은 요청 목록 화면(ManagerRequestsView·CrewRequestsView) props 그대로다.
 * 화면으로 돌아오거나 탭을 바꿀 때마다 첫 페이지부터 다시 받고, 당겨서 새로고침·다음 페이지·다시 시도를 처리한다.
 * loadPage 참조가 바뀌면 현재 탭을 다시 받으므로 호출하는 쪽에서 고정해 둔다.
 */
export function useRequestPages<T extends string, C extends { id: number }>(
  initialTab: T,
  loadPage: (tab: T, cursor: string | null) => Promise<RequestPage<C>>,
) {
  const [tab, setTab] = useState(initialTab);
  // 아직 한 번도 받지 않은 탭은 loading 으로 본다.
  const [lists, setLists] = useState<Partial<Record<T, ListState<C>>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const cursors = useRef<Partial<Record<T, string | null>>>({});
  // 탭마다 가장 최근 첫 페이지 요청 번호. 늦게 도착한 이전 응답을 버리는 데 쓴다.
  const tickets = useRef<Partial<Record<T, number>>>({});

  const setList = useCallback(
    (key: T, next: ListState<C> | ((current: ListState<C>) => ListState<C>)) =>
      setLists((prev) => ({
        ...prev,
        [key]: typeof next === 'function' ? next(prev[key] ?? LOADING) : next,
      })),
    [],
  );

  const reload = useCallback(
    async (key: T) => {
      const ticket = (tickets.current[key] ?? 0) + 1;
      tickets.current[key] = ticket;
      try {
        const page = await loadPage(key, null);
        if (ticket !== tickets.current[key]) return;
        cursors.current[key] = page.nextCursor;
        setList(key, { status: 'ready', items: page.cards, hasMore: page.hasMore });
      } catch (error) {
        if (ticket !== tickets.current[key]) return;
        setList(key, { status: 'error', message: errorMessage(error) });
      }
    },
    [loadPage, setList],
  );

  useFocusEffect(
    useCallback(() => {
      void reload(tab);
    }, [reload, tab]),
  );

  const loadMore = async () => {
    const key = tab;
    const current = lists[key] ?? LOADING;
    if (current.status !== 'ready' || !current.hasMore || current.loadingMore) return;
    const ticket = tickets.current[key];
    setList(key, { ...current, loadingMore: true, loadMoreFailed: false });
    try {
      const page = await loadPage(key, cursors.current[key] ?? null);
      // 그 사이 첫 페이지를 다시 받았으면 이 응답은 버린다.
      if (ticket !== tickets.current[key]) return;
      cursors.current[key] = page.nextCursor;
      setList(key, (latest) => {
        if (latest.status !== 'ready') return latest;
        const known = new Set(latest.items.map((item) => item.id));
        return {
          status: 'ready',
          items: [...latest.items, ...page.cards.filter((card) => !known.has(card.id))],
          hasMore: page.hasMore,
        };
      });
    } catch {
      if (ticket !== tickets.current[key]) return;
      setList(key, (latest) =>
        latest.status === 'ready'
          ? { ...latest, loadingMore: false, loadMoreFailed: true }
          : latest,
      );
    }
  };

  const retry = () => {
    setList(tab, LOADING);
    void reload(tab);
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload(tab);
    setRefreshing(false);
  };

  return {
    tab,
    onTabChange: setTab,
    state: lists[tab] ?? LOADING,
    onRetry: retry,
    onLoadMore: loadMore,
    onRefresh: refresh,
    refreshing,
  };
}
