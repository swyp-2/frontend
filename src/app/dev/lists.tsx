import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Calendar, CalendarDay } from '@/components/ui/calendar';
import { Chip } from '@/components/ui/chip';
import { Icon, NumBadge, type IconName } from '@/components/ui/icon';
import {
  CrewRequestListItem,
  ManagerRequestListItem,
  ProfileListItem,
  ShiftListItem,
  StatusBadge,
} from '@/components/ui/list';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { Tab, Tabs } from '@/components/ui/tabs';
import { DayToggle, WeekSelector } from '@/components/ui/week-selector';
import { Colors } from '@/constants/theme';

const twoTabs = [
  { key: 'mine', label: '내 근무' },
  { key: 'all', label: '전체 근무' },
] as const;

const threeTabs = [
  { key: 'request', label: '요청' },
  { key: 'approved', label: '승인' },
  { key: 'rejected', label: '거절' },
] as const;

const icons: IconName[] = [
  'bell',
  'link',
  'plus',
  'right-01',
  'right-02',
  'arrow-01',
  'arrow-02',
  'complete-green',
  'complete-red',
  'new',
  'alert',
  'rotate-off',
  'rotate-off-alm',
  'rotate-on',
  'rotate-on-alm',
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="body4SB" color="gray800">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/** 개발용 갤러리: Tab, Chip, List, Calendar, Week Toggle, Icon */
export default function ListsGallery() {
  const [two, setTwo] = useState<(typeof twoTabs)[number]['key']>('mine');
  const [three, setThree] = useState<(typeof threeTabs)[number]['key']>('request');
  const [single, setSingle] = useState(true);
  const [toggle, setToggle] = useState(false);
  const [weekdays, setWeekdays] = useState<number[]>([1, 3]);
  const [selectedDay, setSelectedDay] = useState<number | undefined>(12);
  const [pressed, setPressed] = useState('없음');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Section title="Tab">
        <View style={styles.row}>
          <Tab label="내 근무" active={single} onPress={() => setSingle(true)} style={styles.half} />
          <Tab label="전체 근무" active={!single} onPress={() => setSingle(false)} style={styles.half} />
        </View>
      </Section>
      <Section title="Taps/2">
        <Tabs items={twoTabs} value={two} onChange={setTwo} />
      </Section>
      <Section title="Taps/3">
        <Tabs items={threeTabs} value={three} onChange={setThree} />
      </Section>

      <Section title="Chip">
        <View style={styles.wrap}>
          <Chip label="이름" color="blue" />
          <Chip label="이름" color="orange" />
          <Chip label="이름" color="purple" />
          <Chip label="이름" color="green" onPress={() => setPressed('Chip')} />
        </View>
      </Section>

      <Section title={`List (마지막으로 누른 항목: ${pressed})`}>
        <ShiftListItem variant="empty" title="등록된 근무가 없어요" description="근무 일정을 추가해주세요" />
        <ShiftListItem
          variant="on"
          title="00월 00일 (월)"
          description="00:00-00:00"
          onPress={() => setPressed('List/filled on')}
        />
        <ShiftListItem variant="off" title="00월 00일 (월)" description="00:00-00:00" />
        <ProfileListItem name="이름" role="역할" onPress={() => setPressed('List/profile')} />
      </Section>

      <Section title="List/manager">
        {(['unread', 'read', 'resolved'] as const).map((status) => (
          <ManagerRequestListItem
            key={status}
            status={status}
            name="이름"
            date="00월 00일 (월)"
            time="00:00-00:00"
            requester="요청자"
            substitute="교체자"
            onPress={() => setPressed(`List/manager ${status}`)}
          />
        ))}
      </Section>

      <Section title="List/crew">
        <CrewRequestListItem
          status="wait"
          date="00월 00일 (월)"
          time="00:00-00:00"
          names={['이름', '이름', '이름', '이름']}
          onPress={() => setPressed('List/crew wait')}
        />
        <CrewRequestListItem status="pending" date="00월 00일 (월)" time="00:00-00:00" names={['이름']} />
        <CrewRequestListItem status="approved" date="00월 00일 (월)" time="00:00-00:00" names={['이름']} />
        <CrewRequestListItem status="rejected" date="00월 00일 (월)" time="00:00-00:00" names={['이름']} />
        <CrewRequestListItem unread status="wait" date="00월 00일 (월)" time="00:00-00:00" names={['이름']} />
        <View style={styles.wrap}>
          <StatusBadge status="wait" />
          <StatusBadge status="pending" />
          <StatusBadge status="approved" />
          <StatusBadge status="rejected" />
        </View>
      </Section>

      <Section title="Day">
        <View style={styles.wrap}>
          <CalendarDay day={0} />
          <CalendarDay day={0} state="selected" />
          <CalendarDay day={0} state="today" />
        </View>
        <View style={styles.wrap}>
          <CalendarDay day={0} label="0명" />
          <CalendarDay day={0} label="0명" state="selected" />
          <CalendarDay day={0} label="0명" state="today" />
        </View>
      </Section>

      <Section title="Calendar">
        <Calendar
          year={2026}
          month={11}
          today={new Date(2026, 10, 4)}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          onTodayPress={() => setSelectedDay(undefined)}
          dayLabels={{ 4: '2명', 12: '3명', 20: '1명' }}
        />
      </Section>

      <Section title="Toggle / Week Selector">
        <View style={styles.wrap}>
          <DayToggle label="월" />
          <DayToggle label="월" selected />
          <DayToggle label="월" selected={toggle} onPress={() => setToggle((v) => !v)} />
        </View>
        <WeekSelector value={weekdays} onChange={setWeekdays} />
        <WeekSelector value={[]} />
      </Section>

      <Section title="Icon">
        <View style={styles.wrap}>
          {icons.map((name) => (
            <View key={name} style={styles.icon}>
              <Icon name={name} />
              <AppText variant="caption1M" color="gray800">
                {name}
              </AppText>
            </View>
          ))}
          <View style={styles.icon}>
            <NumBadge count={0} />
            <AppText variant="caption1M" color="gray800">
              num
            </AppText>
          </View>
        </View>
        <View style={styles.wrap}>
          <ProfileAvatar label="이름" color="blue" />
          <ProfileAvatar label="이름" color="red" />
          <ProfileAvatar label="이름" color="purple" />
          <ProfileAvatar label="이름" color="green" />
        </View>
      </Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  // Figma 컴포넌트 기준 폭(354pt)으로 고정해 비교하기 쉽게 한다.
  content: {
    width: 402,
    alignSelf: 'center',
    gap: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
  },
  half: {
    width: 'auto',
    flex: 1,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
  },
  icon: {
    minWidth: 56,
    alignItems: 'center',
    gap: 4,
  },
});
