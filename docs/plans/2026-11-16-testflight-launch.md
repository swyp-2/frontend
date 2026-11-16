---
type: plan
status: approved
tags: [testflight, social-login, manager-requests, legal]
last_reviewed: 2026-11-16
---
# BATON 첫 TestFlight 출시 — 매니저 목록 API · 소셜 로그인 · 약관 · 배포

> 상태: 승인 · 기준 2026-11-16

## 목표
- 무엇을: 남은 화면-API 연결(매니저 요청 목록), Google·Apple 로그인, 운영 약관, iOS 앱 설정을 끝내고 TestFlight 내부 테스트에 올린다.
- 누구를 위해: 팀·내부 테스터(App Store Connect 팀 구성원).
- 끝나면: 테스터가 TestFlight 앱으로 Google/Apple 로그인 → 약관 동의 → 가입 → 근무표 → 대타 요청 → 매니저 승인까지 운영 서버(http://3.36.158.96)에서 끝까지 쓸 수 있다.

## 결정된 전제
- 프론트 규칙: `AGENTS.md` (Expo SDK 58, `npx expo install`, lint·typecheck 필수, `src/app` = 라우트)
- 백엔드 규칙: `swyp-2-backend/CLAUDE.md` (코딩 규칙·테스트 방식·Flyway 이름 규칙), 분담 `docs/backend-split.md`
- 로그인 계약: `swyp-2-backend/docs/frontend-auth.md` (id_token → `POST /auth/{provider}/complete`, aud 검증)
- 알림 목록(NT-01)·`GET /me/notifications`는 만들지 않는다 (backend-split.md "B API: 빨간 점", 2026-11-11 팀 결정)

## 현황 (2026-11-16 조사)
- 배포 서버 OpenAPI 33개 엔드포인트 전부 프론트에 호출부가 있고 필드가 일치한다.
- 빈칸: ① 매니저 요청 탭(요청/승인/거절 탭 시안 있음)용 API 없음 → "준비 중" 표시 ② `src/lib/social-auth.ts` 스텁
  ③ 운영 DB 약관: 시드는 `db/seed/local` 전용 → 운영엔 약관이 없을 가능성이 높고, 없으면 CO-02에서 "동의" 버튼이 영원히 비활성(`consent.tsx`의 `documents.length > 0` 조건)
  ④ app.json 템플릿 값(이름·번들 ID·아이콘) ⑤ `/dev/*`·`/design-system`이 운영 빌드에 노출 ⑥ 서버 http(IP) → iOS ATS 차단
- 로컬 백엔드 체크아웃은 origin/develop보다 25커밋 뒤(배포 서버는 최신 develop 기준).
- EAS 로그인 안 됨. Docker 28·Java 21·Xcode·iPhone 16 시뮬레이터 있음. gh 로그인(swyp-2 org, 두 레포 ADMIN).

## 인터뷰 결과
| 질문 | 답 | 영향 |
|---|---|---|
| Apple Developer 계정 | 있음, Admin 이상 | EAS가 인증서·프로비저닝·ASC 앱 등록 자동 처리 |
| 번들 ID / 이름 | `com.swyp.baton` / `BATON` | app.config·백엔드 `BATON_APPLE_CLIENT_IDS` |
| Google OAuth 클라이언트 | 사용자가 만듦, 절차 안내 | 태스크 U1. 코드는 환경변수로 받고 값만 나중에 꽂음 |
| 매니저 목록 | 지금대로 올리지 말고 → (추가 지시) 백엔드도 직접 구현 | 태스크 B2·F4 |
| 백엔드 반영 | 기능 브랜치 → develop PR | B4. 머지는 팀 규칙대로 |
| EC2 배포 | 사용자가 SSH 가능 | B5는 사용자가 실행, 명령은 계획에 |
| 약관 호스팅 | GitHub Pages (swyp-2/frontend, 공개) | F1 |
| 운영자 명의 | BATON 팀, 문의 kimdonghwan913@gmail.com | F1 본문 |
| 범위 | "전체 기능 확인, 약관 없으면 만들어서" | F6·F7 검증, F1 약관 작성 |

### 내 결정 (묻지 않고 고른 기본값)
- 매니저 목록 API 모양: `GET /stores/{storeId}/substitute-requests?status=PENDING_MANAGER|APPROVED|REJECTED&cursor=` — 근무 조회(`/stores/{id}/shifts`)와 같은 매장 범위 패턴, 응답은 기존 `GET /me/substitute-requests`의 `Page`와 같은 모양(재사용). 탭 매핑: 요청=PENDING_MANAGER, 승인=APPROVED, 거절=REJECTED.
- ATS: `NSAllowsArbitraryLoads=true` 임시 허용. ATS 예외 도메인은 IP 주소를 지원하지 않아서다. HTTPS 도메인이 생기면 제거.
- Google 라이브러리: `@react-native-google-signin/google-signin` 무료 Original API (Expo 가이드가 안내하는 라이브러리). `webClientId`를 설정해 id_token aud = Web 클라이언트 ID.
- Apple 버튼은 기존 커스텀 `SocialLoginButton` 유지, iOS에서만 표시, `isAvailableAsync()` false면 숨김.
- 운영 약관은 필수 2종(이용약관·개인정보 처리방침)만. 마케팅 기능이 없어 마케팅 동의는 운영에 두지 않는다.
- 약관 URL(버전 고정): `https://swyp-2.github.io/frontend/terms/v1/`, `.../privacy/v1/`, 지원 페이지 `.../support/`
- 계정 설정에 이용약관·개인정보 처리방침·문의하기 행 추가 (App Store 지침 5.1.1(i): 앱 안에서 처리방침 접근).
- 개발용 라우트는 `__DEV__`가 아니면 접근 불가.
- 아이콘: 디자인 확정 전까지 `assets/images/logo.svg`(흰색)를 gray900 배경 1024px에 얹어 생성. 스플래시도 같은 배경.
- slug·scheme: `baton`. 버전 1.0.0, 빌드 번호는 EAS remote 자동 증가.
- 첫 EAS 빌드·제출은 Apple 로그인이 대화형이라 사용자가 터미널에서 실행. 이후 빌드는 같은 명령.
- 전체 기능 확인 = (a) 백엔드 `./gradlew test` (b) 로컬 백엔드에 대해 프론트 API 모듈로 3인(매니저·크루 2) 시나리오 스크립트 (c) 시뮬레이터 개발 빌드에서 딥링크로 화면별 스크린샷. Maestro 등 새 도구는 설치하지 않는다.

## 범위 밖
- Android 출시·Android Google 클라이언트, 웹
- 백엔드 HTTPS 도메인 (ATS 임시 허용으로 우회)
- App Store 정식 심사 제출 — 그 전에 필요한 것: Sign in with Apple 탈퇴 시 토큰 철회(지침 5.1.1(v)), App 개인정보 라벨, ATS 예외 제거
- 푸시 알림, 알림 목록(NT-01), 근무 수정

## 전역 제약
- expo `~58.0.x`, RN 0.88, 패키지 추가는 `npx expo install` (bun.lock 없음 → npx)
- iOS 번들 ID `com.swyp.baton`, 표시 이름 `BATON`, slug/scheme `baton`
- 약관 URL 위 3개 고정, 운영자 "BATON 팀", 문의 `kimdonghwan913@gmail.com`
- 백엔드: Java 21, Spring Boot 4, snake_case JSON, `{"data","meta"}` 응답, 기존 마이그레이션 수정 금지, 새 파일 `V{yyyyMMddHHmm}__a_설명.sql`
- 백엔드 작업 브랜치 `feat/manager-requests-consents` (최신 origin/develop에서), 프론트 작업 브랜치 `feat/testflight-launch`
- 토큰·클라이언트 시크릿을 커밋하지 않는다 (Google 클라이언트 ID는 공개 식별자라 커밋 가능)
- 완료 선언 전 프론트 `npx expo lint && npx tsc --noEmit`, 백엔드 `./gradlew test`

## 태스크

### B1. backend-sync-baseline · 상태: 대기
- 읽을 것: `swyp-2-backend/CLAUDE.md`, `docs/backend-split.md`
- 할 것: `swyp-2-backend`에서 `git pull --ff-only`(develop) → 브랜치 `feat/manager-requests-consents` 생성 → 기준선 테스트
- 주는 것: 깨끗한 기준선(실패 테스트 수 0 확인)
- 하지 말 것: 기준선이 빨간데 진행. 이유: 내 변경 탓인지 구분 불가
- 검증: `./gradlew test` → BUILD SUCCESSFUL
- 실행 패턴: 혼자
- 결과 요약:

### B2. manager-request-list-api · 상태: 대기
- 읽을 것: `substitute/api/SubstituteRequestController.java`(`list`), `application/SubstituteRequestQueryService.java`, `RequestCursor.java`, `SubstituteRequestViews.java`(`Page`·`Summary`), `domain/SubstituteRequestRepository.java`, 기존 목록 API 테스트
- 할 것: `GET /stores/{storeId}/substitute-requests?status=&cursor=` 추가
  - 권한: 인증 사용자의 **그 매장 활성 소속이 MANAGER**일 때만. 아니면(크루·다른 매장·소속 없음) 403 FORBIDDEN
  - `status` 필수, `PENDING_MANAGER|APPROVED|REJECTED` 외 값·누락·잘못된 cursor → 422 VALIDATION_FAILED
  - 정렬·페이지: 생성 시각 DESC, id DESC, 20개, 기존 `RequestCursor` 재사용
  - 응답: 기존 `Page`(items·next_cursor·has_more). `my_response`는 null, `unchecked`는 요청자 소속이 아니라 **조회한 매니저 소속**의 미확인 알림 기준
  - Swagger 설명·에러 목록을 기존 list와 같은 형식으로
- 주는 것: 프론트 F4가 쓸 계약 — 경로·쿼리 위 그대로, 항목 = `SubstituteRequestSummary`(프론트 `src/features/requests/api.ts`)와 동일 필드
- 하지 말 것: 크루용 `/me/substitute-requests` 동작 변경. 이유: 배포된 프론트가 쓰는 중. 엔티티 직접 반환 금지(CLAUDE.md)
- 검증: 테스트부터 작성 후 실패 확인 → 구현. 케이스: 상태 필터 3종, 다른 매장 요청 미포함, 크루 403, 다른 매장 매니저 403, 잘못된 status/cursor 422, 21건 페이지 넘김, unchecked가 매니저 기준. `./gradlew test` → BUILD SUCCESSFUL
- 실행 패턴: 혼자
- 결과 요약:

### B3. prod-consent-documents · 상태: 대기
- 읽을 것: `db/migration/V1__a_core_schema.sql`(consent_documents), `db/seed/local/R__seed_consent_documents.sql`, `application*.yml`의 flyway locations, 약관 관련 테스트(`ConsentDocumentRepositoryTest`, 온보딩 테스트)
- 할 것: 새 마이그레이션 `V202611161200__a_consent_documents_v1.sql` — TERMS_OF_SERVICE v1(필수, "서비스 이용약관"), PRIVACY_POLICY v1(필수, "개인정보 처리방침"), body_reference = 전역 제약의 URL, effective_at = 2026-11-16 00:00 KST. `ON CONFLICT (kind, version) DO UPDATE`(운영에 손으로 넣은 행이 있어도 실패하지 않게). local 시드가 이 두 행을 example.com으로 덮어쓰지 않도록 조정(마케팅 선택 약관은 local 전용으로 남겨도 됨)
- 주는 것: 운영 `GET /consent-documents`가 필수 2건 반환
- 하지 말 것: 기존 마이그레이션 수정. 이유: Flyway 체크섬 실패로 운영 기동 불가
- 검증: `./gradlew test` → BUILD SUCCESSFUL, 로컬 기동 후 `GET /consent-documents`(X-Test-User-Id) 응답에 두 URL
- 실행 패턴: 혼자
- 결과 요약:

### B4. backend-pr · 상태: 대기
- 읽을 것: B2·B3 결과, `docs/frontend-auth.md`
- 할 것: `docs/backend-split.md`·`docs/frontend-auth.md`에 매니저 목록 API·운영 약관 반영 → push → develop 대상 PR(본문: 만든 API, 테스트 수, 임의로 정한 것, B 담당 패키지 수정 사실 명시해 B 리뷰 요청)
- 주는 것: PR URL
- 하지 말 것: 직접 머지. 이유: 팀 리뷰 규칙
- 검증: `gh pr view --json url,state` → OPEN
- 실행 패턴: 혼자
- 결과 요약:

### B5. backend-cd · 상태: 대기
- 읽을 것: `docker-compose.prod.yml`, `Dockerfile`, EC2의 실제 배포 위치·방식(사용자에게 SSH로 `docker ps`·클론 경로 확인 요청)
- 할 것: `.github/workflows/ci.yml`(PR·push 시 `./gradlew test`) + `.github/workflows/deploy.yml`(develop push 시 SSH로 EC2 접속 → 클론 경로에서 `git pull --ff-only` → `docker compose -f docker-compose.prod.yml up -d --build` → `/health` UP 확인, 실패 시 job 실패). 시크릿 이름: `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_APP_DIR`. B4 PR에 함께 넣는다
- 주는 것: "PR 머지 = 배포"
- 하지 말 것: `.env`·비밀 값을 워크플로·레포에 넣기. 이유: 공개 레포. `.env`는 EC2에만
- 검증: PR에서 ci.yml 초록, 머지 후 deploy.yml 초록 + 아래 B6 검증
- 실행 패턴: 혼자
- 결과 요약:

### B6. backend-first-deploy (사용자 1회 설정) · 상태: 대기
- 할 것(사용자): ① `gh secret set`으로 B5 시크릿 4개 등록(SSH 키는 사용자가 직접 입력) ② EC2 `.env`에 `BATON_GOOGLE_CLIENT_IDS=<iOS ID>,<Web ID>`, `BATON_APPLE_CLIENT_IDS=com.swyp.baton` 추가 ③ B4 PR 머지 → deploy.yml이 배포
- 하지 말 것: 머지 전 브랜치 배포(사용자가 따로 결정하지 않는 한)
- 검증: `curl -s http://3.36.158.96/v3/api-docs | grep -c '/stores/{storeId}/substitute-requests'` → 1, `/health` → UP
- 실행 패턴: 사용자 (나는 명령만 준비)
- 결과 요약:

### U1. google-oauth-clients (사용자 실행, 다른 태스크와 병렬) · 상태: 대기
- 할 것: console.cloud.google.com → 프로젝트 "BATON" → Google 인증 플랫폼: 앱 이름 BATON, 지원 이메일, 대상 외부, 개인정보 처리방침·서비스 약관 URL(전역 제약) → 범위 기본(openid·email·profile)만 → 클라이언트 만들기 ① iOS(번들 ID `com.swyp.baton`) ② 웹 애플리케이션(리디렉션 URI 없음) → 게시 상태 "프로덕션"(기본 범위만이라 검수 없음; 아니면 테스트 사용자 등록)
- 주는 것: iOS 클라이언트 ID, Web 클라이언트 ID (둘 다 `….apps.googleusercontent.com`)
- 검증: 두 값을 나에게 전달
- 결과 요약:

### F1. legal-site · 상태: 대기
- 읽을 것: 백엔드 데이터 모델(`V1__a_core_schema.sql`·backend-split.md의 저장 항목·탈퇴 파기 규칙), `frontend-auth.md`("이메일 저장 안 함")
- 할 것: `site/` 정적 HTML 3쪽(`terms/v1/index.html`, `privacy/v1/index.html`, `support/index.html`, 루트 index는 링크만) + `.github/workflows/pages.yml`(main push 시 `site/` 배포) + `gh api`로 Pages 활성화(build_type=workflow)
  - 처리방침에 실제와 맞게: 수집 항목(소셜 계정 고유 식별자, 이름, 매장·소속·역할, 근무·대타 요청·알림 기록, 약관 동의 기록, 로그인 세션), 이메일 미저장, 목적, 보관·파기(탈퇴 시 파기·익명화), 처리위탁(AWS 호스팅, Google·Apple 로그인), 국외 이전 여부, 14세 미만 가입 불가, 이용자 권리, 보호책임자 = BATON 팀 / 문의 이메일, 시행일 2026-11-16
  - 이용약관: 서비스 내용(근무표·대타 요청·승인), 계정·탈퇴, 이용자 의무, 책임 제한, 변경 고지, 문의
- 주는 것: 전역 제약의 URL 3개 (B3의 body_reference, ASC 메타데이터)
- 하지 말 것: 백엔드에서 확인 안 되는 수집 항목·외부 도구 기재. 이유: 처리방침은 사실과 달라선 안 된다
- 검증: 로컬 `npx serve site` 후 3쪽 200, main 머지 후 `curl -s -o /dev/null -w '%{http_code}' <URL>` → 200 ×3
- 실행 패턴: 혼자
- 결과 요약:

### F2. app-identity-config · 상태: 대기
- 읽을 것: `app.json`, Expo v58 app config 문서(`https://docs.expo.dev/versions/v58.0.0/config/app/`), `src/app/_layout.tsx`
- 할 것: `app.json` → `app.config.ts`(환경변수 사용 위해). name `BATON`, slug/scheme `baton`, `ios.bundleIdentifier`, `ios.config.usesNonExemptEncryption: false`, `ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads: true`(주석: 임시), 아이콘·스플래시 교체, `eas.json`(`cli.appVersionSource: remote`, `build.production.ios.autoIncrement: true`, `env.EXPO_PUBLIC_API_URL`), 개발용 라우트(`dev/*`, `design-system`)를 `__DEV__`에서만 접근
- 주는 것: `app.config.ts`(F3가 플러그인·Google 스킴 추가), `eas.json`(F8)
- 하지 말 것: `ios/`·`android/` 생성·수정. 이유: CNG(AGENTS.md)
- 검증: `npx expo config --type public | grep -E 'bundleIdentifier|NSAllowsArbitraryLoads'` → 값 보임, `npx expo-doctor`, lint·tsc 통과
- 실행 패턴: 혼자
- 결과 요약:

### F3. social-login-sdk · 상태: 대기
- 읽을 것: `src/lib/social-auth.ts`, `src/app/login.tsx`, Expo v58 apple-authentication 문서, `https://react-native-google-signin.github.io/docs/setting-up/expo`와 Original API 문서(설치 시점에 확인, 기억으로 쓰지 않는다)
- 할 것: `npx expo install expo-apple-authentication @react-native-google-signin/google-signin`, `app.config.ts`에 `ios.usesAppleSignIn: true`·두 플러그인(Google `iosUrlScheme`은 `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`에서 계산), `requestIdToken(provider): Promise<string>` 구현 — Apple `identityToken`, Google `idToken`; 사용자 취소(Apple `ERR_REQUEST_CANCELED`, Google 취소 응답)는 `SocialAuthCancelled`; 토큰 null·클라이언트 ID 미설정은 `SocialAuthNotConfigured`. 로그인 화면: Apple 버튼은 iOS이고 사용 가능할 때만
- 주는 것: 변경 없는 `requestIdToken` 시그니처(로그인 화면 그대로 동작)
- 하지 말 것: access token을 서버에 보내기. 이유: 서버는 ID 토큰만 검증
- 검증: lint·tsc, `npx expo run:ios`(시뮬레이터) 빌드 성공, Apple 버튼 탭 → 네이티브 시트 표시·취소 시 메시지 없음, Google 버튼 탭 → (ID 없으면) 미설정 안내
- 실행 패턴: 혼자
- 결과 요약:

### F4. manager-requests-wiring · 상태: 대기
- 읽을 것: B2의 계약, `src/app/(tabs)/requests.tsx`(`ManagerRequests`, `CrewRequests` 페이지 처리), `src/features/requests/{api,cards,requests-view}.ts(x)`, `src/components/ui/list.tsx`(`ManagerRequestListItem` props)
- 할 것: `substituteRequestApi.managerList(storeId, status, cursor)`, `toManagerCard(item)`, `ManagerRequests`를 크루 목록과 같은 로딩·새로고침·더보기·늦은 응답 버리기 방식으로 연결. 탭 → status 매핑은 "내 결정" 그대로. 카드 점 = `unchecked`
- 하지 말 것: 크루 목록 동작 변경
- 검증: lint·tsc, F6 시나리오의 매니저 목록 단계 통과, F7 스크린샷에 카드 표시
- 실행 패턴: 혼자
- 결과 요약:

### F5. legal-links-in-app · 상태: 대기
- 읽을 것: `src/features/profile/account-view.tsx`, `src/app/profile/account.tsx`
- 할 것: 계정 설정에 "이용약관"·"개인정보 처리방침"(`WebBrowser.openBrowserAsync`) ·"문의하기"(`mailto:`) 행. URL·이메일은 `src/constants/links.ts` 한 곳에
- 검증: lint·tsc, F7 스크린샷
- 실행 패턴: 혼자
- 결과 요약:

### F6. e2e-api-scenario · 상태: 대기
- 읽을 것: `src/lib/api.ts`, `src/features/*/api.ts`, 백엔드 `docker-compose.yml`·local 프로필(`X-Test-User-Id`), 백엔드 `EndToEndScenarioTest`
- 할 것: 로컬 백엔드(B 브랜치, local 프로필) 기동 → `scripts/e2e/scenario.ts`(npx tsx 실행, 프론트 API 모듈을 그대로 import) — 3인: 약관·이름·역할 → 매장 생성·초대 코드·참여 → 근무 미리보기·등록·월/일 조회·상세 → 대타 요청 → 거절·수락·철회·취소·승인·최종 거절 각 경로 → 탭 점/카드 점 → 매니저 목록 3탭 → 근무 삭제 → 나가기·탈퇴(409 포함) → 로그아웃
- 하지 말 것: 운영 서버에 실행. 이유: 운영 데이터 오염, 운영엔 X-Test-User-Id 없음
- 검증: `npx tsx scripts/e2e/scenario.ts` → 단계별 PASS, 마지막 줄 `ALL PASS`
- 실행 패턴: 혼자
- 결과 요약:

### F7. ui-smoke-simulator · 상태: 대기
- 읽을 것: F6 결과(데이터가 들어간 로컬 서버), 라우트 목록 `src/app/**`
- 할 것: 개발 빌드(`EXPO_PUBLIC_API_URL=http://localhost:8080`, `EXPO_PUBLIC_TEST_USER_ID`=매니저/크루) → `xcrun simctl openurl booted baton://<경로>`로 각 화면 이동 → `xcrun simctl io booted screenshot` → 스크래치패드에 저장 후 직접 보고 깨진 화면 확인
- 검증: 화면별 스크린샷(근무표·근무 상세·근무 등록·요청 탭 크루/매니저·요청 상세·프로필·매장 정보·계정 설정·로그인·온보딩)에서 오류 상태·빈 렌더 없음
- 실행 패턴: 혼자
- 결과 요약:

### F8. eas-testflight (사용자 대화형 단계 포함) · 상태: 대기
- 읽을 것: `eas.json`, `https://docs.expo.dev/submit/ios.md`
- 할 것: (사용자) `npx eas-cli@latest login` → (나) `npx eas-cli init` → U1 값을 `eas.json` production env에 → (사용자) `npx eas-cli@latest build --platform ios --profile production --auto-submit` (Apple 로그인·번들 ID 등록·ASC 앱 생성 프롬프트) → ASC TestFlight 내부 테스트 그룹에 테스터 추가 → (사용자) 기기에서 Google·Apple 로그인~승인 흐름 확인
- 하지 말 것: B5(서버에 클라이언트 ID 반영) 전에 로그인 확인. 이유: aud 검증 401
- 검증: `npx eas-cli build:list --platform ios --limit 1` → FINISHED, ASC에 빌드 "테스트 가능", 기기 로그인 성공
- 실행 패턴: 사용자 + 나
- 결과 요약:

### F9. app-cd · 상태: 대기
- 읽을 것: F8 결과(EAS에 인증서·ASC API 키 저장됨), `eas.json`
- 할 것: `.github/workflows/ci.yml`(PR 시 `npx expo lint`·`npx tsc --noEmit`) + `.github/workflows/testflight.yml`(main push 시 `expo/expo-github-action`으로 `eas build --platform ios --profile production --auto-submit --non-interactive --no-wait`). 시크릿 `EXPO_TOKEN`(사용자가 expo.dev에서 발급해 `gh secret set`)
- 주는 것: "main 머지 = TestFlight 새 빌드"
- 하지 말 것: 첫 빌드 전에 이 워크플로 활성화. 이유: 비대화형 빌드는 EAS에 저장된 인증서가 있어야 한다
- 검증: PR에서 ci.yml 초록, 머지 후 `npx eas-cli build:list --platform ios --limit 1`에 새 빌드
- 실행 패턴: 혼자
- 결과 요약:

## 순서
B1 → B2 → B3 → B5 → B4(PR) · (병렬) F1 → F2 → F3 → F5 → F4(B2 후) → F6(B3 후) → F7 · U1 병렬 → B6(머지·배포) → F8 → F9

## 검증 (전체 완료 판정)
- 백엔드: `./gradlew test` BUILD SUCCESSFUL, PR의 ci.yml 초록 → 머지 시 deploy.yml 초록 → api-docs에 새 경로
- 앱: main 머지 시 testflight.yml이 새 빌드를 TestFlight에 올림
- 프론트: `npx expo lint && npx tsc --noEmit` 오류 0, `npx tsx scripts/e2e/scenario.ts` ALL PASS, F7 스크린샷 이상 없음
- 약관 URL 3개 200
- TestFlight 빌드 테스트 가능 + 기기에서 Google·Apple 로그인 성공

## 리뷰 초점 (어떤 태스크의 기본 검증도 안 치는 조건)
1. 두 매장의 매니저를 겸하지 않는 매니저가 다른 매장 storeId로 목록 조회 → 403이고 요청 정보 노출 없음 (B2 테스트에 추가)
2. 매장을 나간 직후의 전 매니저 토큰으로 목록 조회 → 403 (B2)
3. 크루 목록에서 받은 cursor를 매니저 목록에 재사용 / 변조 cursor → 422 또는 같은 정렬 기준에서 안전하게 동작 (B2)
4. 운영 DB에 같은 kind·version 약관이 이미 손으로 들어가 있을 때 마이그레이션이 실패하지 않음 (B3: 미리 행을 넣고 마이그레이션 실행하는 테스트)
5. Google 로그인에서 `webClientId` 미설정·idToken null → 서버 호출 없이 미설정 안내, 취소 → 메시지 없음 (F3: 수동 확인 + 분기 단위 확인)

## 자동 반복
- 태스크별 검증 미달 시 원인 수정 후 재실행, 상한 3회. 사람 없이 끝까지 돌리지 않는다(B5·U1·F8에 사용자 단계가 있음).

## 위험 · 되돌리기
- 번들 ID는 ASC 등록 후 변경 불가 → F8 전까지 최종 확인.
- ASC 앱 이름 "BATON"이 이미 쓰이고 있으면 등록 거부 → "BATON - 대타 근무표" 등으로 ASC 이름만 바꾼다(홈 화면 이름은 BATON 유지).
- `NSAllowsArbitraryLoads`는 외부 테스트 심사·App Store 심사에서 사유를 물을 수 있음 → 내부 테스트만. HTTPS 후 제거.
- 백엔드 배포 실패 → 이전 이미지로 `docker compose up -d` 재기동. 약관 마이그레이션은 추가(insert/upsert)뿐이라 기존 데이터 영향 없음, 단 Flyway는 앞으로만 간다.
- GitHub Pages에 문의 이메일이 공개된다(사용자 지정).
- B 담당 패키지 수정 → PR에 명시해 B 리뷰.

## 실행 기록
