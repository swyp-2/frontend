import { Redirect } from 'expo-router';

/** 가입 흐름이 끝나는 지점. 근무표 탭으로 보낸다 */
export default function Home() {
  return <Redirect href="/schedule" />;
}
