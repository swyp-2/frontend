import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';
import { AccountView } from '@/features/profile/account-view';
import { ProfileView } from '@/features/profile/profile-view';
import { StoreInfoView, type StoreMemberCard } from '@/features/profile/store-info-view';
import type { CrewRequestCard, ManagerRequestCard } from '@/features/requests/cards';
import {
  CrewRequestsView,
  ManagerRequestsView,
  type CrewTab,
  type ListState,
  type ManagerTab,
} from '@/features/requests/requests-view';

const managerCards: Record<ManagerTab, ManagerRequestCard[]> = {
  requested: [
    {
      id: 1,
      name: '정하은',
      date: '11월 6일 (금)',
      time: '10:00-14:00',
      requester: '정하은',
      substitute: '박소율',
      status: 'unread',
    },
    {
      id: 2,
      name: '이도윤',
      date: '12월 25일 (금)',
      time: '16:00-22:00',
      requester: '이도윤',
      substitute: '정하은',
      status: 'read',
    },
  ],
  approved: [
    {
      id: 3,
      name: '박현우',
      date: '12월 25일 (금)',
      time: '9:00-13:00',
      requester: '박현우',
      substitute: '정하은',
      status: 'resolved',
    },
  ],
  rejected: [
    {
      id: 4,
      name: '박현우',
      date: '12월 25일 (금)',
      time: '9:00-13:00',
      requester: '박현우',
      substitute: '정하은',
      status: 'resolved',
    },
  ],
};

const crewCards: Record<CrewTab, CrewRequestCard[]> = {
  sent: [
    {
      id: 1,
      date: '11월 9일 (월)',
      time: '14:00-18:00',
      names: ['이은서', '정하은', '이도윤', '박소율'],
      status: 'wait',
    },
    { id: 2, date: '11월 9일 (월)', time: '14:00-18:00', names: ['이은서'], status: 'pending' },
    { id: 3, date: '11월 9일 (월)', time: '14:00-18:00', names: ['이은서'], status: 'approved' },
    { id: 4, date: '11월 9일 (월)', time: '14:00-18:00', names: ['이은서'], status: 'rejected' },
  ],
  received: [
    {
      id: 5,
      date: '11월 9일 (월)',
      time: '14:00-18:00',
      names: ['이도윤'],
      status: 'wait',
      unread: true,
    },
    { id: 6, date: '11월 16일 (월)', time: '14:00-18:00', names: ['이도윤'], status: 'pending' },
    { id: 7, date: '10월 9일 (월)', time: '14:00-18:00', names: ['이은서'], status: 'approved' },
  ],
};

const members: StoreMemberCard[] = [
  { id: 1, name: '배성현', role: '매니저', avatarLabel: '성현', avatarColor: 'blue' },
  { id: 2, name: '김도연', role: '크루원', avatarLabel: '도연', avatarColor: 'purple' },
  { id: 3, name: '정하은', role: '크루원', avatarLabel: '하은', avatarColor: 'red' },
  { id: 4, name: '이도윤', role: '크루원', avatarLabel: '도윤', avatarColor: 'green' },
  { id: 5, name: '박소율', role: '크루원', avatarLabel: '소율', avatarColor: 'blue' },
  { id: 6, name: '이은서', role: '크루원', avatarLabel: '은서', avatarColor: 'red' },
  { id: 7, name: '박현우', role: '크루원', avatarLabel: '현우', avatarColor: 'purple' },
  { id: 8, name: '최지우', role: '크루원', avatarLabel: '지우', avatarColor: 'green' },
];

const noop = () => {};

/** 탭 화면은 하단 내비게이션(92)을 뺀 높이, 나머지는 프레임 전체 높이 */
function Frame({ title, tab = false, children }: { title: string; tab?: boolean; children: ReactNode }) {
  return (
    <View style={styles.cell}>
      <AppText variant="body4SB" color="gray800">
        {title}
      </AppText>
      <View style={[styles.frame, tab && styles.tabFrame]}>{children}</View>
    </View>
  );
}

function ManagerDemo({ state }: { state?: ListState<ManagerRequestCard> }) {
  const [tab, setTab] = useState<ManagerTab>('requested');
  return (
    <ManagerRequestsView
      tab={tab}
      onTabChange={setTab}
      state={state ?? { status: 'ready', items: managerCards[tab] }}
      onPressItem={noop}
      onRetry={noop}
    />
  );
}

function CrewDemo({
  initialTab = 'sent',
  state,
}: {
  initialTab?: CrewTab;
  state?: ListState<CrewRequestCard>;
}) {
  const [tab, setTab] = useState<CrewTab>(initialTab);
  return (
    <CrewRequestsView
      tab={tab}
      onTabChange={setTab}
      state={state ?? { status: 'ready', items: crewCards[tab] }}
      onPressItem={noop}
      onRetry={noop}
    />
  );
}

/** 개발용: 요청 탭·프로필 화면을 목 데이터로 상태별로 늘어놓는다 */
export default function RequestsProfileGallery() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Frame tab title="요청 / 매니저 (탭을 눌러 요청·승인·거절 전환)">
        <ManagerDemo />
      </Frame>
      <Frame tab title="요청 / 매니저 / 승인 (종료 카드)">
        <ManagerRequestsView
          tab="approved"
          onTabChange={noop}
          state={{ status: 'ready', items: managerCards.approved }}
          onPressItem={noop}
        />
      </Frame>
      <Frame tab title="요청 / 매니저 / 빈 목록">
        <ManagerDemo state={{ status: 'ready', items: [] }} />
      </Frame>
      <Frame tab title="요청 / 매니저 / 불러오는 중">
        <ManagerDemo state={{ status: 'loading' }} />
      </Frame>
      <Frame tab title="요청 / 매니저 / 계약 없음 (현재 실제 화면)">
        <ManagerDemo
          state={{
            status: 'error',
            message: '승인 요청 목록은 아직 준비 중이에요.',
            retryable: false,
          }}
        />
      </Frame>
      <Frame tab title="요청 / 크루 / 보낸 요청">
        <CrewDemo />
      </Frame>
      <Frame tab title="요청 / 크루 / 받은 요청">
        <CrewDemo initialTab="received" />
      </Frame>
      <Frame tab title="요청 / 크루 / 빈 목록">
        <CrewDemo state={{ status: 'ready', items: [] }} />
      </Frame>
      <Frame tab title="요청 / 크루 / 오류">
        <CrewDemo state={{ status: 'error', message: '요청 목록을 불러오지 못했어요.' }} />
      </Frame>
      <Frame tab title="요청 / 크루 / 다음 페이지 실패 + 시안 밖 상태 배지">
        <CrewDemo
          state={{
            status: 'ready',
            hasMore: true,
            loadMoreFailed: true,
            items: [
              { id: 1, date: '11월 9일 (월)', time: '14:00-18:00', names: [], status: 'wait' },
              {
                id: 2,
                date: '11월 9일 (월)',
                time: '14:00-18:00',
                names: ['이은서'],
                status: 'rejected',
                statusLabel: '취소',
              },
              {
                id: 3,
                date: '11월 9일 (월)',
                time: '14:00-18:00',
                names: ['이은서'],
                status: 'rejected',
                statusLabel: '만료',
              },
            ],
          }}
        />
      </Frame>

      <Frame tab title="프로필 / 크루">
        <ProfileView
          name="김도연"
          storeName="모닝커피 성수점"
          role="크루원"
          avatarColor="purple"
          memberCount={15}
          onPressStore={noop}
          onPressAccount={noop}
        />
      </Frame>
      <Frame tab title="프로필 / 매니저 / 구성원 수 못 받음">
        <ProfileView
          name="배성현"
          storeName="모닝커피 성수점"
          role="매니저"
          avatarColor="blue"
          memberCount={null}
          onPressStore={noop}
          onPressAccount={noop}
        />
      </Frame>
      <Frame title="매장 정보 / 매니저">
        <StoreInfoView
          storeName="모닝커피 성수점"
          members={{ status: 'ready', members }}
          onCopyCode={noop}
          onBack={noop}
          onRetry={noop}
        />
      </Frame>
      <Frame title="매장 정보 / 매니저 / 복사 완료">
        <StoreInfoView
          storeName="모닝커피 성수점"
          members={{ status: 'ready', members: members.slice(0, 3) }}
          onCopyCode={noop}
          copied
          onBack={noop}
          onRetry={noop}
        />
      </Frame>
      <Frame title="매장 정보 / 크루 (코드 버튼 없음)">
        <StoreInfoView
          storeName="모닝커피 성수점"
          members={{ status: 'ready', members: members.slice(0, 3) }}
          onBack={noop}
          onRetry={noop}
        />
      </Frame>
      <Frame title="매장 정보 / 불러오는 중">
        <StoreInfoView
          storeName="모닝커피 성수점"
          members={{ status: 'loading' }}
          onCopyCode={noop}
          onBack={noop}
          onRetry={noop}
        />
      </Frame>
      <Frame title="매장 정보 / 오류 + 복사 실패">
        <StoreInfoView
          storeName="모닝커피 성수점"
          members={{ status: 'error', message: '구성원을 불러오지 못했어요.' }}
          onCopyCode={noop}
          copyError="매장 코드를 복사하지 못했어요. 다시 시도해 주세요."
          onBack={noop}
          onRetry={noop}
        />
      </Frame>
      <Frame title="계정 설정">
        <AccountView
          name="김도연"
          role="크루원"
          storeName="모닝커피 성수점"
          onBack={noop}
          onLeaveStore={noop}
          onLogout={noop}
          onWithdraw={noop}
        />
      </Frame>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray400,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    padding: 24,
  },
  cell: {
    gap: 8,
  },
  frame: {
    width: 402,
    height: 874,
    overflow: 'hidden',
    backgroundColor: Colors.gray100,
  },
  tabFrame: {
    height: 874 - 92,
  },
});
