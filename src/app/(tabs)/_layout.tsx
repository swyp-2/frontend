import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { AppState } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';

import { BottomNavigation, type NavigationTab } from '@/components/ui/bottom-navigation';
import { Colors } from '@/constants/theme';
import {
  refreshRequestIndicator,
  resetRequestIndicator,
  useHasUnreadRequests,
} from '@/features/requests/notification-indicator';
import { useSession } from '@/lib/session';

/**
 * 근무표 / 요청 / 프로필 탭. 탭 바는 시안의 하단 내비게이션을 그대로 쓴다.
 * 매니저는 내비게이션 오른쪽 + 버튼으로 근무 등록에 들어간다.
 */
export default function TabsLayout() {
  const { me } = useSession();
  const membershipId = me?.membership?.membership_id;
  const hasUnread = useHasUnreadRequests();

  // 요청 탭 점: 탭 화면으로 돌아올 때(상세에서 복귀 포함)와 앱이 다시 앞으로 올 때 새로 받는다.
  useFocusEffect(
    useCallback(() => {
      if (membershipId !== undefined) void refreshRequestIndicator();
    }, [membershipId]),
  );
  useEffect(() => {
    if (membershipId === undefined) return;
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') void refreshRequestIndicator();
    });
    return () => {
      subscription.remove();
      // 소속이 바뀌거나 사라지면 이전 계정의 점을 남기지 않는다.
      resetRequestIndicator();
    };
  }, [membershipId]);

  // 소속 매장이 없으면 탭 화면을 볼 수 없다. 진입점이 가입 단계로 다시 보낸다.
  if (!me?.membership) return <Redirect href="/" />;

  const role = me.membership.role === 'MANAGER' ? 'manager' : 'crew';

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: Colors.gray100 } }}
      tabBar={({ state, navigateToTab }) => (
        <BottomNavigation
          active={state.routes[state.index].name as NavigationTab}
          onChange={(tab) => {
            const route = state.routes.find((r) => r.name === tab);
            if (route) navigateToTab(route.key);
            // 요청 탭은 들어가면서 읽음 처리하므로 다른 탭으로 갈 때만 다시 받는다.
            if (tab !== 'requests') void refreshRequestIndicator();
          }}
          dots={{ requests: hasUnread }}
          role={role}
          onAdd={() => router.push('/shift/new')}
        />
      )}>
      <Tabs.Screen name="schedule" />
      <Tabs.Screen name="requests" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
