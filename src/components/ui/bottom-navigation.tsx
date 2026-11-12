import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CalendarIcon, Icon } from '@/components/ui/icon';
import { Colors } from '@/constants/theme';

export type NavigationTab = 'schedule' | 'requests' | 'profile';

const tabs: { key: NavigationTab; label: string; width: number }[] = [
  { key: 'schedule', label: '근무표', width: 87 },
  { key: 'requests', label: '요청', width: 86 },
  { key: 'profile', label: '프로필', width: 87 },
];

function TabIcon({ tab, active }: { tab: NavigationTab; active: boolean }) {
  if (tab === 'schedule') return <CalendarIcon active={active} />;
  if (tab === 'requests') return <Icon name={active ? 'rotate-on' : 'rotate-off'} />;
  return <Icon name={active ? 'profile-on' : 'profile-off'} />;
}

export type BottomNavigationProps = {
  active: NavigationTab;
  onChange?: (tab: NavigationTab) => void;
  /** manager 는 오른쪽에 근무 등록(+) 버튼이 붙는다 */
  role?: 'crew' | 'manager';
  onAdd?: () => void;
  /** 빨간 new 점을 붙일 탭 */
  dots?: Partial<Record<NavigationTab, boolean>>;
  style?: StyleProp<ViewStyle>;
};

export function BottomNavigation({
  active,
  onChange,
  role = 'crew',
  onAdd,
  dots,
  style,
}: BottomNavigationProps) {
  return (
    <View style={[styles.container, role === 'manager' ? styles.manager : styles.crew, style]}>
      <View style={styles.pill} accessibilityRole="tablist">
        {tabs.map(({ key, label, width }) => {
          const isActive = key === active;
          return (
            <Pressable
              key={key}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={dots?.[key] ? `${label}, 새 알림 있음` : label}
              onPress={() => onChange?.(key)}
              style={[styles.tab, { width }, isActive && styles.tabActive]}>
              <View>
                <TabIcon tab={key} active={isActive} />
                {dots?.[key] && <Icon name="new" style={styles.dot} />}
              </View>
              <AppText variant="caption1SB" style={styles.tabLabel}>
                {label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
      {role === 'manager' && (
        <Pressable accessibilityRole="button" accessibilityLabel="근무 등록" onPress={onAdd}>
          <Icon name="plus-fab" size={52} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    height: 92,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
  },
  crew: {
    justifyContent: 'center',
  },
  manager: {
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  pill: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.white,
    borderRadius: 59,
    backgroundColor: Colors.gray100,
  },
  tab: {
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 33,
  },
  tabActive: {
    backgroundColor: Colors.gray300,
  },
  dot: {
    position: 'absolute',
    top: -2,
    right: -6,
  },
  tabLabel: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
});
