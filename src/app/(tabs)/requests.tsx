import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import {
  substituteRequestApi,
  type ManagerRequestFilter,
  type RequestBox,
  type SubstituteRequestSummary,
} from '@/features/requests/api';
import {
  toCrewCard,
  toManagerCard,
  type CrewRequestCard,
  type ManagerRequestCard,
} from '@/features/requests/cards';
import { openRequestTab } from '@/features/requests/notification-indicator';
import {
  CrewRequestsView,
  ManagerRequestsView,
  type CrewTab,
  type ManagerTab,
} from '@/features/requests/requests-view';
import { useRequestPages } from '@/features/requests/use-request-pages';
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
  const { role, store_id: storeId } = me.membership;
  // 매장이 바뀌면 이전 매장의 목록·커서를 버리고 처음부터 받는다.
  return role === 'MANAGER' ? (
    <ManagerRequests key={storeId} storeId={storeId} />
  ) : (
    <CrewRequests />
  );
}

const openRequest = (id: number) =>
  router.push({ pathname: '/requests/[id]', params: { id: String(id) } });

const managerFilter: Record<ManagerTab, ManagerRequestFilter> = {
  requested: 'PENDING_MANAGER',
  approved: 'APPROVED',
  rejected: 'REJECTED',
};

function ManagerRequests({ storeId }: { storeId: number }) {
  const loadPage = useCallback(
    async (tab: ManagerTab, cursor: string | null) => {
      const page = await substituteRequestApi.managerList(storeId, managerFilter[tab], cursor);
      return {
        cards: page.items.map(toManagerCard),
        nextCursor: page.next_cursor,
        hasMore: page.has_more,
      };
    },
    [storeId],
  );
  const list = useRequestPages<ManagerTab, ManagerRequestCard>('requested', loadPage);
  return <ManagerRequestsView {...list} onPressItem={openRequest} />;
}

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

async function loadCrewPage(box: RequestBox, cursor: string | null) {
  const page = await substituteRequestApi.list(box, cursor);
  const names = await loadRecipientNames(box, page.items);
  return {
    cards: page.items.map((item) => toCrewCard(item, box, names.get(item.id))),
    nextCursor: page.next_cursor,
    hasMore: page.has_more,
  };
}

function CrewRequests() {
  const list = useRequestPages<CrewTab, CrewRequestCard>('sent', loadCrewPage);
  return <CrewRequestsView {...list} onPressItem={openRequest} />;
}
