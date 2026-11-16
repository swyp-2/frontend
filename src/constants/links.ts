/**
 * 앱 밖으로 여는 공개 링크.
 * 약관 URL 은 서버의 동의 문서(body_reference)와 같은 주소라 바꾸지 않는다.
 */
export const Links = {
  /** 서비스 이용약관 */
  terms: 'https://swyp-2.github.io/frontend/terms/v1/',
  /** 개인정보 처리방침 */
  privacy: 'https://swyp-2.github.io/frontend/privacy/v1/',
  /** 고객 지원 페이지. 메일 앱을 열 수 없을 때 대신 연다 */
  support: 'https://swyp-2.github.io/frontend/support/',
  /** 문의 이메일 */
  contactEmail: 'kimdonghwan913@gmail.com',
} as const;
