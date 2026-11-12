/**
 * BATON 백엔드 호출 공통부.
 * 성공: {"data": ..., "meta": {"server_time": ...}}, 실패: {"error": {...}}, 본문 없는 성공은 204.
 * JSON 필드는 서버 계약 그대로 snake_case 로 둔다.
 */

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');

/** local 프로필 서버 전용 인증 우회. 운영 서버에는 없는 기능이라 개발 빌드에서만 쓴다. */
export const TEST_USER_ID = __DEV__ ? process.env.EXPO_PUBLIC_TEST_USER_ID || undefined : undefined;

export type FieldError = { field: string; reason: string };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: FieldError[] = [],
    readonly retryable = false,
    readonly currentState?: string,
    /** 409 ACTIVE_REQUEST_EXISTS 일 때만: 같은 근무에 이미 진행 중인 요청 */
    readonly existingRequestId?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** 해당 필드의 오류 안내. 없으면 서버가 준 전체 메시지 */
  messageFor(field: string) {
    return this.fieldErrors.find((e) => e.field === field)?.reason ?? this.message;
  }
}

let accessToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

/** 401 을 받았을 때 한 번 호출된다 (토큰 삭제 후 로그인 화면으로 보내는 용도) */
export function setUnauthenticatedHandler(handler: (() => void) | null) {
  onUnauthenticated = handler;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  idempotencyKey?: string;
  /** false 면 Authorization 헤더를 붙이지 않는다 (로그인 완료 호출) */
  auth?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, idempotencyKey, auth = true } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
  if (auth) {
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    else if (TEST_USER_ID) headers['X-Test-User-Id'] = TEST_USER_ID;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', '네트워크 연결을 확인한 뒤 다시 시도해 주세요.', [], true);
  }

  if (response.status === 204) return undefined as T;

  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const error = json?.error;
    if (response.status === 401 && auth) onUnauthenticated?.();
    throw new ApiError(
      response.status,
      error?.code ?? 'INTERNAL_ERROR',
      error?.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
      error?.field_errors ?? [],
      error?.retryable ?? false,
      json?.current_state,
      json?.existing_request_id,
    );
  }

  return json?.data as T;
}

/* ------------------------------- 응답 타입 ------------------------------- */

export type Role = 'MANAGER' | 'CREW';

export type OnboardingStage =
  | 'CONSENT_REQUIRED'
  | 'NAME_REQUIRED'
  | 'ROLE_REQUIRED'
  | 'STORE_REQUIRED'
  | 'COMPLETED';

export type NextScreen = 'CO-02' | 'CO-04' | 'CO-05' | 'ST-01' | 'ST-03' | 'CA-01';

export type Me = {
  user_id: number;
  display_name: string | null;
  onboarding_stage: OnboardingStage;
  selected_role: Role | null;
  membership: {
    membership_id: number;
    store_id: number;
    store_name: string;
    role: Role;
    personal_color: string;
  } | null;
  next_screen: NextScreen;
};

export type TokenResponse = {
  access_token: string;
  expires_in: number;
  onboarding_stage: OnboardingStage;
};

export type ConsentDocument = {
  document_id: number;
  kind: string;
  version: number;
  title: string;
  required: boolean;
  body_reference: string;
};

export type CreatedStore = {
  store_id: number;
  name: string;
  membership_id: number;
  invite_code: string;
};

export type JoinedStore = {
  store_id: number;
  store_name: string;
  membership_id: number;
  role: Role;
};

export type Store = {
  store_id: number;
  name: string;
  member_count: number;
  my_role: Role;
};

export type Member = {
  membership_id: number;
  display_name: string;
  role: Role;
  personal_color: string;
  is_me: boolean;
};

export type ShiftAssignee = {
  membership_id: number;
  display_name: string;
  personal_color: string;
  is_me: boolean;
};

/** starts_at / ends_at 은 UTC ISO 8601, local_date 는 시작 시각의 Asia/Seoul 날짜(yyyy-MM-dd) */
export type ShiftItem = {
  shift_id: number;
  starts_at: string;
  ends_at: string;
  local_date: string;
  assignee: ShiftAssignee;
};

/** days 는 근무가 있는 날만 온다. scope=all 이면 shifts 는 빈 배열이다 */
export type ShiftMonth = {
  month: string;
  days: { date: string; headcount: number }[];
  shifts: ShiftItem[];
};

/** headcount 는 중복을 뺀 인원, shift_count 는 근무 건수 */
export type ShiftDay = {
  date: string;
  headcount: number;
  shift_count: number;
  shifts: ShiftItem[];
};

export type ShiftDetail = ShiftItem & {
  version: number;
  is_mine: boolean;
  is_started: boolean;
  active_request: {
    request_id: number;
    status: string;
    viewer_is_requester: boolean;
    pending_manager_approval: boolean;
  } | null;
  allowed_actions: string[];
};

export type ShiftDeleted = {
  shift_id: number;
  deleted: boolean;
  /** 함께 종료한 진행 중 대타 요청. 없으면 null */
  closed_request_id: number | null;
};

export type SocialProvider = 'google' | 'apple';

/* --------------------------------- 호출 --------------------------------- */

export const authApi = {
  complete: (provider: SocialProvider, idToken: string) =>
    api<TokenResponse>(`/auth/${provider}/complete`, {
      method: 'POST',
      body: { id_token: idToken },
      auth: false,
    }),
  logout: () => api<void>('/auth/logout', { method: 'POST' }),
};

export const meApi = {
  get: () => api<Me>('/me'),
  consentDocuments: () => api<ConsentDocument[]>('/consent-documents'),
  agree: (agreements: { document_id: number; agreed: boolean }[]) =>
    api<Me>('/me/consents', { method: 'POST', body: { agreements } }),
  setName: (displayName: string) =>
    api<Me>('/me/onboarding/name', { method: 'PUT', body: { display_name: displayName } }),
  setRole: (role: Role) => api<Me>('/me/onboarding/role', { method: 'PUT', body: { role } }),
  /** 계정 탈퇴. 모든 기기의 세션이 끝난다. 끝나지 않은 본인 근무가 있으면 409 FUTURE_SHIFT_REMAINS */
  withdraw: () => api<void>('/me', { method: 'DELETE' }),
};

export const storeApi = {
  create: (name: string, idempotencyKey: string) =>
    api<CreatedStore>('/stores', { method: 'POST', body: { name }, idempotencyKey }),
  inviteCode: (storeId: number) => api<{ code: string }>(`/stores/${storeId}/invite-code`),
  join: (code: string) => api<JoinedStore>('/memberships/join', { method: 'POST', body: { code } }),
  get: (storeId: number) => api<Store>(`/stores/${storeId}`),
  members: (storeId: number, purpose: 'all' | 'substitute_candidates' = 'all') =>
    api<Member[]>(`/stores/${storeId}/members?purpose=${purpose}`),
  /** 매장 나가기. 토큰은 유지되고 가입 단계가 매장 연결로 돌아간다. 남은 근무가 있으면 409 FUTURE_SHIFT_REMAINS */
  leave: (storeId: number) => api<void>(`/stores/${storeId}/leave`, { method: 'POST' }),
};

export const shiftApi = {
  /** month 는 yyyy-MM. mine 은 내 근무 목록, all 은 날짜별 인원 요약만 */
  month: (storeId: number, month: string, scope: 'mine' | 'all') =>
    api<ShiftMonth>(`/stores/${storeId}/shifts?month=${month}&scope=${scope}`),
  /** date 는 yyyy-MM-dd. 그날 매장 전체 근무 명단 */
  day: (storeId: number, date: string) =>
    api<ShiftDay>(`/stores/${storeId}/shifts?date=${date}`),
  detail: (shiftId: number) => api<ShiftDetail>(`/shifts/${shiftId}`),
  /**
   * 매니저 전용 단건 삭제. expectedVersion 은 상세에서 받은 version.
   * 409 SHIFT_STATE_CONFLICT 의 current_state 는 DELETED(이미 삭제) 또는 CHANGED(버전·담당자 변경)
   */
  remove: (shiftId: number, expectedVersion: number) =>
    api<ShiftDeleted>(`/shifts/${shiftId}?expected_version=${expectedVersion}`, {
      method: 'DELETE',
    }),
};

/** 빨간 점. 알림 목록 화면은 없고 요청 탭 점·요청 카드 점 두 단계다 */
export const notificationApi = {
  /** 하단 바 요청 탭 점 여부 */
  indicator: () => api<{ has_unread: boolean }>('/me/notification-indicator'),
  /** 요청 탭 진입. 지금까지 온 알림을 읽음 처리해 탭 점을 지운다 (카드 점은 그대로) */
  open: () => api<void>('/me/notifications/open', { method: 'POST' }),
  /** 요청 상세 진입. 그 요청의 카드 점을 지운다. 관계없는 요청이면 아무 일도 없다 */
  check: (requestId: number) =>
    api<void>(`/me/substitute-requests/${requestId}/check`, { method: 'POST' }),
};
