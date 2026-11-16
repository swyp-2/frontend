# TestFlight 출시 1회 설정

코드는 준비돼 있고, 아래는 계정·서버 권한이 있는 사람만 할 수 있는 단계다. 순서대로 하면 된다.
계획·결정 기록: [plans/2026-11-16-testflight-launch.md](plans/2026-11-16-testflight-launch.md)

| 값 | |
|---|---|
| iOS 번들 ID | `com.swyp.baton` |
| 앱 이름 | BATON |
| 이용약관 | https://swyp-2.github.io/frontend/terms/v1/ |
| 개인정보 처리방침 | https://swyp-2.github.io/frontend/privacy/v1/ |
| 지원 페이지 | https://swyp-2.github.io/frontend/support/ |
| 문의 이메일 | kimdonghwan913@gmail.com |

## 1. 약관 페이지 공개 (GitHub Pages)

frontend 저장소 Settings → Pages → Source를 **GitHub Actions**로 둔다. `main`에 `site/`가 머지되면 `Pages` 워크플로가 배포한다.
확인: 위 세 URL이 200으로 열린다. (Google 동의 화면·App Store Connect에 이 URL을 넣으므로 가장 먼저)

## 2. Google OAuth 클라이언트 만들기

1. https://console.cloud.google.com → 새 프로젝트 `BATON`
2. **Google 인증 플랫폼 → 브랜딩**: 앱 이름 BATON, 사용자 지원 이메일, 홈페이지·개인정보 처리방침·서비스 약관 URL(위 표)
3. **대상**: 외부(External). 범위는 기본값(openid·email·profile)만 — 민감 범위가 없어 검수가 필요 없다.
   테스트 단계에서는 "테스트 사용자"에 테스터 Google 계정을 넣거나, 바로 "앱 게시"로 프로덕션 전환
4. **클라이언트 → 클라이언트 만들기**
   - 유형 **iOS**, 번들 ID `com.swyp.baton` → **iOS 클라이언트 ID** (`…apps.googleusercontent.com`)
   - 유형 **웹 애플리케이션**, 리디렉션 URI 비움 → **웹 클라이언트 ID**
5. 두 값을 아래 3·4단계에 쓴다(공개 식별자라 커밋해도 된다. 클라이언트 보안 비밀번호는 쓰지 않는다)

## 3. 백엔드 배포 설정 (EC2, 한 번)

backend 저장소 PR #25(매니저 목록 API·운영 약관·CI/CD)가 머지되면 `Deploy` 워크플로가 EC2에 배포한다. 그 전에:

```bash
# EC2에서: 레포 클론 경로와 실행 중인 컨테이너 확인
docker ps --format '{{.Names}}\t{{.Image}}'      # baton-api 가 보여야 함
cd <클론 경로> && git remote -v && git branch      # develop 기준인지

# .env 에 소셜 로그인 aud 허용값 추가 (기존 값은 그대로 두고 두 줄만)
BATON_GOOGLE_CLIENT_IDS=<iOS 클라이언트 ID>,<웹 클라이언트 ID>
BATON_APPLE_CLIENT_IDS=com.swyp.baton
```

```bash
# 로컬에서: 배포 워크플로가 쓸 시크릿 (값은 직접 입력)
gh secret set EC2_HOST    -R swyp-2/backend   # 예: 3.36.158.96
gh secret set EC2_USER    -R swyp-2/backend   # 예: ubuntu
gh secret set EC2_APP_DIR -R swyp-2/backend   # 위에서 확인한 클론 경로
gh secret set EC2_SSH_KEY -R swyp-2/backend < ~/.ssh/<EC2 키>.pem
```

머지 후 확인:

```bash
curl -s http://3.36.158.96/health
curl -s http://3.36.158.96/v3/api-docs | grep -c '/stores/{storeId}/substitute-requests'   # 1
```

## 4. 앱 빌드·TestFlight (EAS)

```bash
nvm use 22
npx eas-cli@latest login                 # Expo 계정
npx eas-cli@latest init                  # EAS 프로젝트 생성. app.config.ts에 projectId를 넣으라고 안내하면 그대로 추가
```

`eas.json`의 `build.production.env`에 Google 값을 넣는다:

```json
"EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID": "<iOS 클라이언트 ID>",
"EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID": "<웹 클라이언트 ID>"
```

첫 빌드는 Apple 로그인 프롬프트가 있어 **직접 터미널에서**:

```bash
npx eas-cli@latest build --platform ios --profile production --auto-submit
```

- Apple ID 로그인 → 팀 선택 → 번들 ID 등록·인증서·프로비저닝 생성은 모두 "Yes"
- App Store Connect 앱이 없으면 자동 생성. 이름 "BATON"이 이미 쓰이고 있으면 `BATON - 대타 근무표`처럼 바꾼다(홈 화면 이름은 BATON 유지)
- 제출 단계에서 App Store Connect API 키를 만들지 물으면 "Yes"(이후 CI 자동 제출에 쓰인다)

빌드가 처리되면 App Store Connect → TestFlight → 내부 테스트 그룹에 테스터(팀 구성원)를 추가한다.

## 5. main 머지 = TestFlight 자동 빌드 켜기

1. https://expo.dev → Account settings → Access tokens → 토큰 생성 → `gh secret set EXPO_TOKEN -R swyp-2/frontend`
2. frontend 저장소 Settings → Secrets and variables → Actions → Variables → `TESTFLIGHT_ENABLED` = `true`

이후 `main`에 앱 코드가 머지될 때마다 빌드 번호가 자동으로 올라간 새 빌드가 TestFlight에 올라간다.

## 6. 기기에서 확인할 것

- [ ] Google 로그인 → 약관 화면에 "서비스 이용약관"·"개인정보 처리방침" 2건 → 가입 완료
- [ ] Apple 로그인(다른 계정) → 가입 완료
- [ ] 매니저: 매장 만들기 → 초대 코드 → 근무 등록 / 크루원: 코드 참여 → 대타 요청 → 매니저 요청 탭에서 승인
- [ ] 계정 설정의 이용약관·개인정보 처리방침·문의하기가 열린다

## 나중에 (App Store 정식 심사 전)

- 백엔드 HTTPS 도메인 → `app.config.ts`의 `NSAllowsArbitraryLoads` 제거, `EXPO_PUBLIC_API_URL`을 https로
- 탈퇴 시 Sign in with Apple 토큰 철회(심사 지침 5.1.1(v))
- App Store Connect 앱 개인정보 라벨, 스크린샷, 지원 URL(위 지원 페이지)
- 처리방침의 "접속 기록 최대 3개월 보관"이 EC2 로그 순환 설정과 맞는지 확인
