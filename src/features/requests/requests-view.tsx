import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { TextButton } from '@/components/ui/button';
import { CrewRequestListItem, ManagerRequestListItem } from '@/components/ui/list';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { Colors } from '@/constants/theme';

import type { CrewRequestCard, ManagerRequestCard } from './cards';
import { EmptyState, ErrorState, LoadingState } from './screen-state';

export type ListState<T> =
  | { status: 'loading' }
  /** retryable 이 false 면 다시 시도 버튼을 숨긴다 */
  | { status: 'error'; message: string; retryable?: boolean }
  | {
      status: 'ready';
      items: T[];
      hasMore?: boolean;
      loadingMore?: boolean;
      /** 다음 페이지를 못 받아왔을 때. 이미 받은 목록은 그대로 둔다 */
      loadMoreFailed?: boolean;
    };

export type ManagerTab = 'requested' | 'approved' | 'rejected';
export type CrewTab = 'sent' | 'received';

const managerTabs: readonly TabItem<ManagerTab>[] = [
  { key: 'requested', label: '요청' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
];

const crewTabs: readonly TabItem<CrewTab>[] = [
  { key: 'sent', label: '보낸 요청' },
  { key: 'received', label: '받은 요청' },
];

const managerEmpty: Record<ManagerTab, string> = {
  requested: '들어온 요청이 없어요',
  approved: '승인된 요청이 없어요',
  rejected: '거절된 요청이 없어요',
};

// 크루 빈 화면은 시안이 없어 매니저 문구 형식을 따랐다.
const crewEmpty: Record<CrewTab, string> = {
  sent: '보낸 요청이 없어요',
  received: '받은 요청이 없어요',
};

type CommonProps<T extends string, C> = {
  tab: T;
  onTabChange: (tab: T) => void;
  state: ListState<C>;
  onPressItem: (id: number) => void;
  onRetry?: () => void;
  /** 목록 끝에 가까워지면 호출된다 */
  onLoadMore?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
};

export type ManagerRequestsViewProps = CommonProps<ManagerTab, ManagerRequestCard>;
export type CrewRequestsViewProps = CommonProps<CrewTab, CrewRequestCard>;

/** 매니저: 대타 승인 요청 (요청 / 승인 / 거절) */
export function ManagerRequestsView(props: ManagerRequestsViewProps) {
  return (
    <RequestsLayout
      {...props}
      title="대타 승인 요청"
      tabs={managerTabs}
      emptyMessage={managerEmpty[props.tab]}
      renderCard={(card) => (
        <ManagerRequestListItem
          key={card.id}
          name={card.name}
          date={card.date}
          time={card.time}
          requester={card.requester}
          substitute={card.substitute}
          status={card.status}
          onPress={() => props.onPressItem(card.id)}
        />
      )}
    />
  );
}

/** 크루: 대타 요청 (보낸 요청 / 받은 요청) */
export function CrewRequestsView(props: CrewRequestsViewProps) {
  return (
    <RequestsLayout
      {...props}
      title="대타 요청"
      tabs={crewTabs}
      emptyMessage={crewEmpty[props.tab]}
      renderCard={(card) => (
        <CrewRequestListItem
          key={card.id}
          date={card.date}
          time={card.time}
          names={card.names}
          status={card.status}
          statusLabel={card.statusLabel}
          unread={card.unread}
          onPress={() => props.onPressItem(card.id)}
        />
      )}
    />
  );
}

type LayoutProps<T extends string, C> = CommonProps<T, C> & {
  title: string;
  tabs: readonly TabItem<T>[];
  emptyMessage: string;
  renderCard: (card: C) => ReactNode;
};

const LOAD_MORE_THRESHOLD = 240;

function RequestsLayout<T extends string, C>({
  title,
  tabs,
  tab,
  onTabChange,
  state,
  emptyMessage,
  renderCard,
  onRetry,
  onLoadMore,
  onRefresh,
  refreshing = false,
}: LayoutProps<T, C>) {
  const canLoadMore =
    state.status === 'ready' && !!state.hasMore && !state.loadingMore && !state.loadMoreFailed;

  const onScroll = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!canLoadMore) return;
    const { contentOffset, layoutMeasurement, contentSize } = nativeEvent;
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - LOAD_MORE_THRESHOLD) {
      onLoadMore?.();
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title={title} />
      {/* 탭 바는 프레임 402 중 376 (좌우 13) */}
      <Tabs items={tabs} value={tab} onChange={onTabChange} style={styles.tabs} />
      {state.status === 'loading' && <LoadingState style={styles.centered} />}
      {state.status === 'error' && (
        <ErrorState
          message={state.message}
          onRetry={state.retryable === false ? undefined : onRetry}
          style={styles.centered}
        />
      )}
      {state.status === 'ready' && state.items.length === 0 && (
        <EmptyState message={emptyMessage} style={styles.centered} />
      )}
      {state.status === 'ready' && state.items.length > 0 && (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.list}
          onScroll={onScroll}
          scrollEventThrottle={64}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.gray900}
              />
            ) : undefined
          }>
          {state.items.map(renderCard)}
          {state.loadingMore && (
            <ActivityIndicator color={Colors.gray900} style={styles.footer} />
          )}
          {state.loadMoreFailed && (
            <View style={styles.footer}>
              <AppText variant="body3M" color="gray800">
                요청을 더 불러오지 못했어요.
              </AppText>
              <TextButton label="다시 시도" onPress={onLoadMore} />
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  tabs: {
    alignSelf: 'auto',
    marginHorizontal: 13,
  },
  list: {
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  // 시안의 빈 화면 문구는 하단 내비게이션(92)을 포함한 프레임 전체의 세로 가운데에 있다.
  // 이 영역은 위로 151, 아래로 92 가 빠져 있으므로 그 차이만큼 아래를 띄운다.
  centered: {
    paddingBottom: 20 + 59,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
});
