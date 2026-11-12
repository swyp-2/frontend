import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { avatarColor, roleLabel } from '@/features/profile/display';
import { ProfileView } from '@/features/profile/profile-view';
import { storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

/** 프로필 탭. 이름·역할·매장은 세션의 /me, 구성원 수만 매장 정보에서 받는다 */
export default function ProfileScreen() {
  const { me } = useSession();
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const storeId = me?.membership?.store_id;

  useFocusEffect(
    useCallback(() => {
      if (!storeId) return;
      let active = true;
      storeApi
        .get(storeId)
        .then((store) => {
          if (active) setMemberCount(store.member_count);
        })
        // 실패하면 인원 수 없이 매장 이름만 보여 준다. 매장 정보 화면에서 다시 시도할 수 있다.
        .catch(() => {
          if (active) setMemberCount(null);
        });
      return () => {
        active = false;
      };
    }, [storeId]),
  );

  if (!me?.membership) return null;
  const { membership } = me;

  return (
    <ProfileView
      name={me.display_name ?? ''}
      storeName={membership.store_name}
      role={roleLabel[membership.role]}
      avatarColor={avatarColor(membership.personal_color)}
      memberCount={memberCount}
      onPressStore={() => router.push('/profile/store')}
      onPressAccount={() => router.push('/profile/account')}
    />
  );
}
