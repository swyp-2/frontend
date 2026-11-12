import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';

import { AccountView } from '@/features/profile/account-view';
import { roleLabel } from '@/features/profile/display';
import { ApiError } from '@/lib/api';
import { confirmDestructive, notify } from '@/lib/confirm';
import { useSession } from '@/lib/session';

/** 프로필 - 계정 설정: 내 정보, 매장 나가기, 로그아웃, 탈퇴 */
export default function AccountScreen() {
  const { me, signOut, leaveStore, withdraw } = useSession();
  const [busy, setBusy] = useState(false);
  const running = useRef(false);

  if (!me?.membership) return <Redirect href="/" />;
  const { membership } = me;

  /** 한 번에 하나만 처리한다. 성공하면 진입점이 로그인 또는 매장 연결 단계로 보낸다 */
  const run = async (title: string, task: () => Promise<void>) => {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    try {
      await task();
      router.replace('/');
    } catch (error) {
      // 남은 근무가 있으면 409 FUTURE_SHIFT_REMAINS 이고 서버 문구를 그대로 보여 준다.
      notify(
        title,
        error instanceof ApiError ? error.message : '처리하지 못했어요. 다시 시도해 주세요.',
      );
    } finally {
      running.current = false;
      setBusy(false);
    }
  };

  // signOut 은 서버 호출이 실패해도 기기에서는 로그아웃한다.
  const logout = () => run('로그아웃', signOut);

  // 확인 팝업 시안이 없어 OS 기본 확인창을 쓴다.
  const onLeaveStore = async () => {
    const confirmed = await confirmDestructive({
      title: '매장에서 나갈까요?',
      message: `${membership.store_name}의 근무표와 요청을 더 볼 수 없어요. 진행 중인 대타 요청은 함께 정리돼요.`,
      confirmLabel: '나가기',
    });
    if (confirmed) await run('매장 나가기', () => leaveStore(membership.store_id));
  };

  const onWithdraw = async () => {
    const confirmed = await confirmDestructive({
      title: '정말 탈퇴할까요?',
      message: '계정과 매장 소속이 삭제되고 되돌릴 수 없어요.',
      confirmLabel: '탈퇴',
    });
    if (confirmed) await run('탈퇴하기', withdraw);
  };

  return (
    <AccountView
      name={me.display_name ?? ''}
      role={roleLabel[membership.role]}
      storeName={membership.store_name}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      onLeaveStore={onLeaveStore}
      onLogout={logout}
      onWithdraw={onWithdraw}
      busy={busy}
    />
  );
}
