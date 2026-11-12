import * as Clipboard from 'expo-clipboard';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { avatarColor, avatarLabel, roleLabel } from '@/features/profile/display';
import { StoreInfoView, type StoreMembersState } from '@/features/profile/store-info-view';
import { ApiError, storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

const TOAST_DURATION = 2500;

/** 프로필 - 매장 정보: 구성원 목록, 매니저는 매장 코드 복사 */
export default function StoreInfoScreen() {
  const { me } = useSession();
  const [members, setMembers] = useState<StoreMembersState>({ status: 'loading' });
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  // 복사할 때마다 값이 바뀌어 토스트 타이머를 다시 건다. 0 이면 숨김.
  const [copiedAt, setCopiedAt] = useState(0);
  const ticket = useRef(0);

  const membership = me?.membership;
  const storeId = membership?.store_id;

  const load = useCallback(async () => {
    if (!storeId) return;
    const current = ++ticket.current;
    try {
      const result = await storeApi.members(storeId);
      if (current !== ticket.current) return;
      setMembers({
        status: 'ready',
        members: result.map((member) => ({
          id: member.membership_id,
          name: member.display_name,
          role: roleLabel[member.role],
          avatarLabel: avatarLabel(member.display_name),
          avatarColor: avatarColor(member.personal_color),
        })),
      });
    } catch (error) {
      if (current !== ticket.current) return;
      setMembers({
        status: 'error',
        message: error instanceof ApiError ? error.message : '구성원을 불러오지 못했어요.',
      });
    }
  }, [storeId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  useEffect(() => {
    if (!copiedAt) return;
    const timer = setTimeout(() => setCopiedAt(0), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [copiedAt]);

  if (!membership || !storeId) return <Redirect href="/" />;

  const copyCode = async () => {
    setCopying(true);
    setCopyError(null);
    try {
      const { code } = await storeApi.inviteCode(storeId);
      await Clipboard.setStringAsync(code);
      setCopiedAt(Date.now());
    } catch (error) {
      setCopiedAt(0);
      setCopyError(
        error instanceof ApiError
          ? error.message
          : '매장 코드를 복사하지 못했어요. 다시 시도해 주세요.',
      );
    } finally {
      setCopying(false);
    }
  };

  const retry = () => {
    setMembers({ status: 'loading' });
    void load();
  };

  return (
    <StoreInfoView
      storeName={membership.store_name}
      members={members}
      onCopyCode={membership.role === 'MANAGER' ? copyCode : undefined}
      copying={copying}
      copyError={copyError}
      copied={!!copiedAt}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      onRetry={retry}
    />
  );
}
