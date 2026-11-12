import { useSyncExternalStore } from 'react';

import { notificationApi } from '@/lib/api';

/**
 * 하단 바 "요청" 탭의 빨간 점. 탭 바와 요청 화면이 같이 쓰는 값이라 컴포넌트 밖에 둔다.
 * 점은 부가 정보라 조회·읽음 처리가 실패해도 화면에 알리지 않고 이전 값을 유지한다.
 */
let hasUnread = false;
// 늦게 도착한 조회 응답이 그 뒤의 읽음 처리 결과를 덮지 않게 한다.
let sequence = 0;
let opening: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: boolean) {
  if (hasUnread === next) return;
  hasUnread = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHasUnreadRequests() {
  return useSyncExternalStore(
    subscribe,
    () => hasUnread,
    () => false,
  );
}

/** 서버에서 점 여부를 다시 받는다 */
export async function refreshRequestIndicator() {
  // 읽음 처리가 진행 중이면 끝난 뒤의 값을 받는다 (요청 탭에서 점이 잠깐 다시 켜지는 것을 막는다).
  await opening;
  const current = ++sequence;
  try {
    const { has_unread } = await notificationApi.indicator();
    if (current === sequence) set(has_unread);
  } catch {
    // 이전 값을 유지한다.
  }
}

/** 요청 탭에 들어왔을 때: 지금까지 온 알림을 읽음 처리하고 점을 지운다 */
export function openRequestTab() {
  const current = ++sequence;
  const task = notificationApi
    .open()
    .then(() => {
      if (current === sequence) set(false);
    })
    // 읽음 처리가 안 됐으면 점을 지우지 않는다.
    .catch(() => undefined)
    .finally(() => {
      if (opening === task) opening = null;
    });
  opening = task;
  return task;
}

/** 로그아웃·매장 나가기 등으로 이전 계정의 점이 남지 않게 한다 */
export function resetRequestIndicator() {
  sequence++;
  set(false);
}
