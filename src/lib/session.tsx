import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ApiError,
  authApi,
  meApi,
  storeApi,
  setAccessToken,
  setUnauthenticatedHandler,
  TEST_USER_ID,
  type Me,
  type NextScreen,
  type SocialProvider,
} from '@/lib/api';
import { tokenStorage } from '@/lib/token-storage';

type SessionState =
  | { status: 'loading'; me: null }
  | { status: 'signedOut'; me: null }
  | { status: 'signedIn'; me: Me }
  /** 토큰은 있는데 /me 를 못 받아온 상태 (네트워크·서버 오류). 로그아웃시키지 않고 재시도하게 한다 */
  | { status: 'error'; me: null };

type SessionValue = SessionState & {
  /** 소셜 SDK 가 준 id_token 으로 로그인을 완료한다 */
  signIn: (provider: SocialProvider, idToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 매장 나가기. 로그인은 유지되고 최신 /me 로 바뀐다. 실패하면 ApiError 를 던지고 아무것도 바뀌지 않는다 */
  leaveStore: (storeId: number) => Promise<void>;
  /** 계정 탈퇴. 성공하면 기기에서도 로그아웃한다. 실패하면 ApiError 를 던지고 아무것도 바뀌지 않는다 */
  withdraw: () => Promise<void>;
  /** 온보딩 저장 API 가 돌려준 최신 /me 를 반영한다 */
  setMe: (me: Me) => void;
  refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function useSession() {
  const value = use(SessionContext);
  if (!value) throw new Error('useSession 은 SessionProvider 안에서만 쓸 수 있어요.');
  return value;
}

/** 서버가 정해준 다음 화면(next_screen)을 앱 경로로 바꾼다 */
export const screenPath = {
  'CO-02': '/onboarding/consent',
  'CO-04': '/onboarding/name',
  'CO-05': '/onboarding/role',
  'ST-01': '/store/create',
  'ST-03': '/store/join',
  'CA-01': '/schedule',
} as const satisfies Record<NextScreen, string>;

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading', me: null });

  const clear = useCallback(async () => {
    setAccessToken(null);
    await tokenStorage.clear();
    setState({ status: 'signedOut', me: null });
  }, []);

  const refresh = useCallback(async () => {
    try {
      const me = await meApi.get();
      setState({ status: 'signedIn', me });
    } catch (error) {
      // 401 은 아래 핸들러가 이미 로그아웃 처리했다.
      if (error instanceof ApiError && error.status === 401) return;
      setState({ status: 'error', me: null });
    }
  }, []);

  useEffect(() => {
    setUnauthenticatedHandler(() => {
      void clear();
    });

    (async () => {
      const token = await tokenStorage.get().catch(() => null);
      if (!token && !TEST_USER_ID) {
        setState({ status: 'signedOut', me: null });
        return;
      }
      setAccessToken(token);
      await refresh();
    })();

    return () => setUnauthenticatedHandler(null);
  }, [clear, refresh]);

  const signIn = useCallback(
    async (provider: SocialProvider, idToken: string) => {
      const { access_token } = await authApi.complete(provider, idToken);
      setAccessToken(access_token);
      await tokenStorage.set(access_token);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(async () => {
    // 서버 세션 종료가 실패해도 기기에서는 로그아웃한다.
    await authApi.logout().catch(() => undefined);
    await clear();
  }, [clear]);

  const leaveStore = useCallback(
    async (storeId: number) => {
      await storeApi.leave(storeId);
      await refresh();
    },
    [refresh],
  );

  const withdraw = useCallback(async () => {
    // 서버가 모든 세션을 끝냈으므로 로그아웃 호출 없이 기기 토큰만 지운다.
    await meApi.withdraw();
    await clear();
  }, [clear]);

  const setMe = useCallback((me: Me) => setState({ status: 'signedIn', me }), []);

  const value = useMemo(
    () => ({ ...state, signIn, signOut, leaveStore, withdraw, setMe, refresh }),
    [state, signIn, signOut, leaveStore, withdraw, setMe, refresh],
  );

  return <SessionContext value={value}>{children}</SessionContext>;
}
