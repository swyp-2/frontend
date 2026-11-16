/**
 * 전체 기능 시나리오. 로컬 백엔드(local 프로필)에 프론트 API 모듈(src/lib/api.ts, src/features/*\/api.ts)을 그대로 호출한다.
 * 매니저 M, 크루원 A·B(대타), 크루원 C(나가기·탈퇴) 4명이 가입부터 탈퇴까지 진행한다.
 *
 * 운영 서버에서는 돌리지 말 것: 사용자를 DB에 직접 넣고 X-Test-User-Id(local 전용)로 인증한다.
 *
 * 실행 예:
 *   docker run -d --name baton-e2e-pg -e POSTGRES_DB=baton -e POSTGRES_USER=baton -e POSTGRES_PASSWORD=baton -p 15432:5432 postgres:16
 *   (백엔드) BATON_DB_PORT=15432 ./gradlew bootRun --args='--spring.profiles.active=local --server.port=18080'
 *   EXPO_PUBLIC_API_URL=http://localhost:18080 E2E_PG_CONTAINER=baton-e2e-pg npx tsx scripts/e2e/scenario.ts
 */
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? '';
const PG_CONTAINER = process.env.E2E_PG_CONTAINER ?? 'baton-e2e-pg';

if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(API_URL)) {
  console.error(`EXPO_PUBLIC_API_URL 이 로컬 주소가 아니에요(${API_URL || '없음'}). 운영 서버에는 돌리지 않습니다.`);
  process.exit(2);
}

// api.ts 가 읽는 RN 전역. 개발용 TEST_USER_ID 를 쓰지 않고 아래 fetch 래퍼로 사용자를 바꾼다.
(globalThis as { __DEV__?: boolean }).__DEV__ = false;

let currentUser: number | null = null;
const realFetch = globalThis.fetch;
globalThis.fetch = (input, init = {}) => {
  const headers = new Headers(init.headers);
  if (currentUser !== null) headers.set('X-Test-User-Id', String(currentUser));
  return realFetch(input, { ...init, headers });
};

/* ------------------------------- 도우미 ------------------------------- */

let passed = 0;

async function step(name: string, run: () => Promise<void>) {
  try {
    await run();
    passed += 1;
    console.log(`PASS  ${name}`);
  } catch (error) {
    console.log(`FAIL  ${name}`);
    console.error(error);
    console.log(`\n${passed} passed, 1 failed (이후 단계는 앞 단계 결과에 의존해 중단)`);
    process.exit(1);
  }
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal<T>(actual: T, expected: T, label: string) {
  check(actual === expected, `${label}: 기대 ${String(expected)}, 실제 ${String(actual)}`);
}

async function as<T>(userId: number, run: () => Promise<T>): Promise<T> {
  currentUser = userId;
  return run();
}

/** psql 로 가입 직후 상태의 사용자를 만든다(소셜 로그인 대신) */
function createUser(): number {
  const sql =
    "INSERT INTO users (id, display_name, onboarding_stage, selected_role, account_state, created_at, updated_at, version) " +
    "VALUES ((SELECT COALESCE(MAX(id), 900000) + 1 FROM users WHERE id > 900000), NULL, 'CONSENT_REQUIRED', NULL, 'ACTIVE', now(), now(), 0) " +
    'RETURNING id';
  const out = execFileSync('docker', ['exec', PG_CONTAINER, 'psql', '-U', 'baton', '-d', 'baton', '-tAc', sql], {
    encoding: 'utf8',
  });
  const id = Number(out.trim().split('\n')[0]);
  check(Number.isInteger(id) && id > 900000, `사용자 생성 실패: ${out}`);
  return id;
}

/** Asia/Seoul 기준 오늘부터 days 일 뒤 날짜(yyyy-MM-dd) */
function seoulDate(days: number) {
  const now = new Date(Date.now() + 9 * 3600_000 + days * 86400_000);
  return now.toISOString().slice(0, 10);
}

/* -------------------------------- 시나리오 -------------------------------- */

async function main() {
  const { ApiError, meApi, storeApi, shiftApi, notificationApi } = await import('../../src/lib/api');
  const { shiftBatchApi } = await import('../../src/features/shift/api');
  const { substituteRequestApi } = await import('../../src/features/requests/api');
  const { requestDetailApi } = await import('../../src/features/request-detail/api');

  type ApiErrorType = InstanceType<typeof ApiError>;
  async function expectError(promise: Promise<unknown>, status: number, code?: string): Promise<ApiErrorType> {
    try {
      await promise;
    } catch (error) {
      check(error instanceof ApiError, `ApiError 가 아님: ${String(error)}`);
      equal(error.status, status, `HTTP 상태(${error.code})`);
      if (code) equal(error.code, code, '오류 코드');
      return error;
    }
    throw new Error(`${status} 오류를 기대했지만 성공했어요`);
  }

  const M = createUser();
  const A = createUser();
  const B = createUser();
  const C = createUser();
  console.log(`users M=${M} A=${A} B=${B} C=${C}  api=${API_URL}\n`);

  // 1. 온보딩 ----------------------------------------------------------------
  async function onboard(userId: number, name: string, role: 'MANAGER' | 'CREW') {
    return as(userId, async () => {
      let me = await meApi.get();
      equal(me.next_screen, 'CO-02', `${name} 첫 화면`);
      const docs = await meApi.consentDocuments();
      const required = docs.filter((d) => d.required);
      check(required.length >= 2, `필수 약관 2건 이상이어야 함(${required.length})`);
      for (const doc of required) {
        check(doc.body_reference.startsWith('https://swyp-2.github.io/frontend/'), `약관 URL: ${doc.body_reference}`);
      }
      me = await meApi.agree(docs.map((d) => ({ document_id: d.document_id, agreed: d.required })));
      equal(me.next_screen, 'CO-04', `${name} 동의 후`);
      me = await meApi.setName(name);
      equal(me.next_screen, 'CO-05', `${name} 이름 후`);
      me = await meApi.setRole(role);
      equal(me.next_screen, role === 'MANAGER' ? 'ST-01' : 'ST-03', `${name} 역할 후`);
    });
  }

  await step('필수 약관이 운영 URL로 내려온다 · 필수 약관을 빼면 422', async () => {
    await as(M, async () => {
      const docs = await meApi.consentDocuments();
      await expectError(meApi.agree(docs.filter((d) => !d.required).map((d) => ({ document_id: d.document_id, agreed: true }))), 422);
    });
  });
  await step('온보딩: 약관 → 이름 → 역할 (M 매니저, A·B·C 크루원)', async () => {
    await onboard(M, '매니저엠', 'MANAGER');
    await onboard(A, '크루에이', 'CREW');
    await onboard(B, '크루비', 'CREW');
    await onboard(C, '크루씨', 'CREW');
  });

  // 2. 매장 -------------------------------------------------------------------
  let storeId = 0;
  let inviteCode = '';
  await step('매장 만들기(멱등 키 재전송은 같은 매장) · 초대 코드 조회', async () => {
    await as(M, async () => {
      const key = randomUUID();
      const created = await storeApi.create('이투이매장', key);
      const again = await storeApi.create('이투이매장', key);
      equal(again.store_id, created.store_id, '멱등 재전송 store_id');
      storeId = created.store_id;
      inviteCode = (await storeApi.inviteCode(storeId)).code;
      equal(inviteCode, created.invite_code, '초대 코드');
      equal((await meApi.get()).next_screen, 'CA-01', 'M 매장 생성 후');
    });
  });
  await step('초대 코드로 참여(A·B·C) · 잘못된 코드는 실패', async () => {
    for (const user of [A, B, C]) {
      await as(user, async () => {
        const joined = await storeApi.join(inviteCode);
        equal(joined.store_id, storeId, '참여 매장');
        equal((await meApi.get()).next_screen, 'CA-01', '참여 후 화면');
      });
    }
    const D = createUser();
    await onboard(D, '크루디', 'CREW');
    const failed = await as(D, () => expectErrorAny(storeApi.join('ZZZZZZZZ')));
    check(failed >= 400 && failed < 500, `잘못된 코드는 4xx(실제 ${failed})`);
  });
  async function expectErrorAny(promise: Promise<unknown>) {
    try {
      await promise;
    } catch (error) {
      check(error instanceof ApiError, 'ApiError 가 아님');
      return error.status;
    }
    throw new Error('실패를 기대했지만 성공했어요');
  }
  await step('매장 정보·구성원(전체, 대타 후보)', async () => {
    const store = await as(M, () => storeApi.get(storeId));
    equal(store.member_count, 4, '구성원 수');
    equal(store.my_role, 'MANAGER', 'M 역할');
    const all = await as(A, () => storeApi.members(storeId, 'all'));
    equal(all.length, 4, '전체 구성원');
    equal(all[0].role, 'MANAGER', '매니저가 먼저');
    const candidates = await as(A, () => storeApi.members(storeId, 'substitute_candidates'));
    check(candidates.every((m) => m.role === 'CREW' && !m.is_me), '대타 후보는 본인 제외 크루원');
    check(candidates.some((m) => m.display_name === '크루비'), '후보에 B 포함');
  });

  const membership = async (userId: number) => (await as(userId, () => meApi.get())).membership!.membership_id;
  const mA = await membership(A);
  const mB = await membership(B);

  // 3. 근무 일괄 등록 ----------------------------------------------------------------
  const startDate = seoulDate(1);
  const endDate = seoulDate(14);
  const repeat = { enabled: true, start_date: startDate, end_date: endDate, weekdays: [1, 2, 3, 4, 5, 6, 7] };
  // A는 오전(09:00~13:00 KST), B는 오후(14:00~18:00 KST). 같은 시간이면 승인 시 B에게 완전히 같은 근무가 생겨 서버가 막는다.
  const morningA = {
    store_id: storeId,
    assignee_membership_ids: [mA],
    starts_at: `${startDate}T00:00:00Z`,
    ends_at: `${startDate}T04:00:00Z`,
    repeat,
  };
  const afternoonB = {
    ...morningA,
    assignee_membership_ids: [mB],
    starts_at: `${startDate}T05:00:00Z`,
    ends_at: `${startDate}T09:00:00Z`,
  };
  await step('크루원은 근무를 등록할 수 없다(403)', async () => {
    await as(A, () => expectError(shiftBatchApi.preview(morningA), 403));
  });
  await step('근무 일괄 등록: 미리보기 → 최종 등록(멱등) → 같은 입력 재미리보기는 전부 중복', async () => {
    await as(M, async () => {
      const preview = await shiftBatchApi.preview(morningA);
      equal(preview.create_count, 14, '미리보기 생성 수(14일)');
      const key = randomUUID();
      const created = await shiftBatchApi.create({ ...morningA, preview_token: preview.preview_token }, key);
      equal(created.created_count, 14, '등록 수');
      const again = await shiftBatchApi.create({ ...morningA, preview_token: preview.preview_token }, key);
      equal(again.shift_ids.join(), created.shift_ids.join(), '멱등 재전송 결과');
      const second = await shiftBatchApi.preview(morningA);
      equal(second.duplicate_count, 14, '재미리보기 중복 수');
      const previewB = await shiftBatchApi.preview(afternoonB);
      const createdB = await shiftBatchApi.create({ ...afternoonB, preview_token: previewB.preview_token }, randomUUID());
      equal(createdB.created_count, 14, 'B 오후 등록 수');
    });
  });

  const month = startDate.slice(0, 7);
  let aShifts: number[] = [];
  await step('근무표: 내 근무 월 목록 · 전체 월 요약 · 날짜 명단 · 근무 상세', async () => {
    const months = [...new Set([startDate.slice(0, 7), endDate.slice(0, 7)])];
    const mine = (await Promise.all(months.map((m) => as(A, () => shiftApi.month(storeId, m, 'mine'))))).flatMap((r) => r.shifts);
    equal(mine.length, 14, 'A 내 근무 수');
    check(mine.every((s) => s.assignee.is_me), '내 근무는 전부 본인');
    aShifts = mine.map((s) => s.shift_id);
    const all = await as(M, () => shiftApi.month(storeId, month, 'all'));
    check(all.shifts.length === 0 && all.days.some((d) => d.headcount === 2), '전체 요약은 날짜별 인원만');
    const day = await as(B, () => shiftApi.day(storeId, startDate));
    equal(day.shift_count, 2, '그날 근무 건수');
    const detail = await as(A, () => shiftApi.detail(aShifts[0]));
    check(detail.is_mine && detail.allowed_actions.includes('request_substitute'), '본인 근무는 대타 요청 가능');
    const managerView = await as(M, () => shiftApi.detail(aShifts[0]));
    check(managerView.allowed_actions.includes('delete'), '매니저는 삭제 가능');
  });

  // 4. 대타 요청 ---------------------------------------------------------------
  const createRequest = (shiftId: number) =>
    as(A, () => requestDetailApi.create(shiftId, [mB], randomUUID()));
  const act = (userId: number, requestId: number, action: Parameters<typeof requestDetailApi.transition>[1]) =>
    as(userId, () => requestDetailApi.transition(requestId, action, randomUUID()));

  let rejectedId = 0;
  await step('요청 → 지정 대상 B 탭 점·카드 점 → 탭 진입·상세 진입으로 지움 → B 거절 = ALL_DECLINED', async () => {
    const request = await createRequest(aShifts[0]);
    rejectedId = request.id;
    equal(request.status, 'WAITING', '생성 직후');
    equal(request.my_relation, 'REQUESTER', 'A 관계');
    check((await as(B, () => notificationApi.indicator())).has_unread, 'B 탭 점 켜짐');
    const received = await as(B, () => substituteRequestApi.list('received'));
    const card = received.items.find((i) => i.id === request.id);
    check(card?.unchecked && card.my_response === 'PENDING', 'B 받은 요청 카드 점');
    await as(B, () => notificationApi.open());
    check(!(await as(B, () => notificationApi.indicator())).has_unread, 'B 탭 점 꺼짐');
    await as(B, () => notificationApi.check(request.id));
    const after = await as(B, () => substituteRequestApi.list('received'));
    check(!after.items.find((i) => i.id === request.id)?.unchecked, 'B 카드 점 꺼짐');
    const detail = await as(B, () => requestDetailApi.get(request.id));
    check(detail.allowed_actions.includes('accept') && detail.allowed_actions.includes('reject'), 'B 수락·거절 가능');
    const rejected = await act(B, request.id, 'reject');
    equal(rejected.status, 'ALL_DECLINED', 'B 거절 후');
  });

  await step('같은 근무에 진행 중 요청이 있으면 409 ACTIVE_REQUEST_EXISTS + existing_request_id', async () => {
    const first = await createRequest(aShifts[1]);
    const error = await expectError(createRequest(aShifts[1]), 409, 'ACTIVE_REQUEST_EXISTS');
    equal(error.existingRequestId, first.id, 'existing_request_id');
    equal((await act(A, first.id, 'cancel')).status, 'CANCELLED', '요청자 취소');
  });

  let approvedId = 0;
  await step('B 수락 → 매니저 탭 점·요청 탭 목록 → 승인 = APPROVED, 근무 담당자 B로 변경', async () => {
    const request = await createRequest(aShifts[2]);
    approvedId = request.id;
    const accepted = await act(B, request.id, 'accept');
    equal(accepted.status, 'PENDING_MANAGER', '수락 후');
    check((await as(M, () => notificationApi.indicator())).has_unread, 'M 탭 점 켜짐');
    const pending = await as(M, () => substituteRequestApi.managerList(storeId, 'PENDING_MANAGER'));
    const card = pending.items.find((i) => i.id === request.id);
    check(card?.unchecked && card.candidate?.membership_id === mB, 'M 요청 탭 카드(점·후보)');
    const sent = await as(A, () => substituteRequestApi.list('sent'));
    check(sent.items.find((i) => i.id === request.id)?.unchecked, 'A 보낸 요청 카드 점(수락 알림)');
    const approved = await act(M, request.id, 'approve');
    equal(approved.status, 'APPROVED', '승인 후');
    const shift = await as(B, () => shiftApi.detail(aShifts[2]));
    equal(shift.assignee.membership_id, mB, '근무 담당자');
    const approvedTab = await as(M, () => substituteRequestApi.managerList(storeId, 'APPROVED'));
    check(approvedTab.items.some((i) => i.id === request.id), 'M 승인 탭에 표시');
  });

  await step('B 수락 후 철회 = WITHDRAWN', async () => {
    const request = await createRequest(aShifts[3]);
    await act(B, request.id, 'accept');
    equal((await act(B, request.id, 'withdraw')).status, 'WITHDRAWN', '철회 후');
  });

  await step('B 수락 → 매니저 최종 거절 = REJECTED, 거절 탭에 표시', async () => {
    const request = await createRequest(aShifts[4]);
    await act(B, request.id, 'accept');
    equal((await act(M, request.id, 'final_reject')).status, 'REJECTED', '최종 거절 후');
    const rejectedTab = await as(M, () => substituteRequestApi.managerList(storeId, 'REJECTED'));
    check(rejectedTab.items.some((i) => i.id === request.id), 'M 거절 탭에 표시');
    const pendingTab = await as(M, () => substituteRequestApi.managerList(storeId, 'PENDING_MANAGER'));
    check(!pendingTab.items.some((i) => i.id === request.id), '요청 탭에서는 빠짐');
  });

  await step('이미 끝난 요청에 다시 행동하면 409', async () => {
    const error = await as(B, () => expectErrorAny(requestDetailApi.transition(rejectedId, 'accept', randomUUID())));
    equal(error, 409, '종료 요청 수락');
    await as(M, () => expectError(requestDetailApi.transition(approvedId, 'approve', randomUUID()), 409));
  });

  await step('매니저 요청 탭 권한·입력 검사: 크루원 403, 잘못된 cursor 422', async () => {
    await as(A, () => expectError(substituteRequestApi.managerList(storeId, 'PENDING_MANAGER'), 403));
    await as(M, () => expectError(substituteRequestApi.managerList(storeId, 'APPROVED', 'not-a-cursor!'), 422));
  });

  await step('크루원 보낸·받은 목록: 최신순, 매니저는 403', async () => {
    const sent = await as(A, () => substituteRequestApi.list('sent'));
    equal(sent.items.length, 5, 'A 보낸 요청 수');
    const times = sent.items.map((i) => i.created_at);
    check(times.every((t, i) => i === 0 || times[i - 1] >= t), '최신순');
    const received = await as(B, () => substituteRequestApi.list('received'));
    equal(received.items.length, 5, 'B 받은 요청 수');
    await as(M, () => expectError(substituteRequestApi.list('sent'), 403));
  });

  // 5. 근무 삭제 ---------------------------------------------------------------
  await step('진행 중 요청이 있는 근무 삭제 → 요청 종료(CANCELLED_SOURCE_CHANGED) · 같은 버전으로 다시 삭제하면 409', async () => {
    const request = await createRequest(aShifts[5]);
    const detail = await as(M, () => shiftApi.detail(aShifts[5]));
    const deleted = await as(M, () => shiftApi.remove(aShifts[5], detail.version));
    check(deleted.deleted, '삭제됨');
    equal(deleted.closed_request_id, request.id, '함께 종료한 요청');
    const closed = await as(A, () => requestDetailApi.get(request.id));
    equal(closed.status, 'CANCELLED_SOURCE_CHANGED', '요청 상태');
    await as(M, () => expectError(shiftApi.remove(aShifts[5], detail.version), 409, 'SHIFT_STATE_CONFLICT'));
    await as(A, () => expectError(shiftApi.remove(aShifts[6], 0), 403));
  });

  // 6. 나가기·탈퇴 -------------------------------------------------------------
  await step('남은 근무가 있으면 나가기·탈퇴 409 FUTURE_SHIFT_REMAINS', async () => {
    await as(A, () => expectError(storeApi.leave(storeId), 409, 'FUTURE_SHIFT_REMAINS'));
    await as(A, () => expectError(meApi.withdraw(), 409, 'FUTURE_SHIFT_REMAINS'));
  });
  await step('근무 없는 C: 매장 나가기 → 코드 참여 화면(ST-03) → 다시 참여 → 탈퇴 → 이후 401', async () => {
    await as(C, async () => {
      await storeApi.leave(storeId);
      const me = await meApi.get();
      equal(me.next_screen, 'ST-03', '나간 뒤 화면');
      equal(me.membership, null, '소속 없음');
      await expectError(storeApi.get(storeId), 403);
      await storeApi.join(inviteCode);
      equal((await meApi.get()).next_screen, 'CA-01', '재참여 후');
      await meApi.withdraw();
      await expectError(meApi.get(), 401, 'UNAUTHENTICATED');
    });
    const members = await as(M, () => storeApi.members(storeId, 'all'));
    check(!members.some((m) => m.display_name === '크루씨'), '탈퇴한 C는 구성원에서 빠짐');
  });

  console.log(`\n${passed} passed, 0 failed\nALL PASS`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
