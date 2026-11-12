import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { ShiftListItem } from '@/components/ui/list';
import { ProfileAvatar, type ProfileAvatarColor } from '@/components/ui/profile-avatar';
import { Colors } from '@/constants/theme';

import { avatarLabel } from './display';

export type ProfileViewProps = {
  name: string;
  storeName: string;
  /** 매니저 / 크루원 */
  role: string;
  avatarColor: ProfileAvatarColor;
  /** 매장 구성원 수. 아직 못 받았거나 실패했으면 null 이고 매장 이름만 보인다 */
  memberCount: number | null;
  onPressStore: () => void;
  onPressAccount: () => void;
};

/** 프로필 탭 */
export function ProfileView({
  name,
  storeName,
  role,
  avatarColor,
  memberCount,
  onPressStore,
  onPressAccount,
}: ProfileViewProps) {
  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <AppBar title="프로필" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* 공용 List/profile 은 88pt·18pt 이름이라, 이 화면의 100pt·20pt 카드는 따로 그린다 */}
        <View style={styles.card}>
          <ProfileAvatar label={avatarLabel(name)} color={avatarColor} />
          <View style={styles.cardText}>
            <AppText variant="code20B" numberOfLines={1}>
              {name}
            </AppText>
            <AppText variant="body3M" color="gray700" numberOfLines={1}>
              {storeName} · {role}
            </AppText>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.menu}>
          <ShiftListItem
            title="매장 정보"
            description={
              memberCount === null ? storeName : `${storeName} · 구성원 ${memberCount}명`
            }
            onPress={onPressStore}
          />
          <ShiftListItem title="계정 설정" description="내 정보" onPress={onPressAccount} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  content: {
    gap: 24,
    paddingVertical: 20,
  },
  card: {
    height: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  divider: {
    height: 4,
    backgroundColor: Colors.gray300,
  },
  menu: {
    gap: 8,
    paddingHorizontal: 24,
  },
});
