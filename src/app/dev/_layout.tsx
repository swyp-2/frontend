import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';

/** 시안 확인용 개발 화면 묶음. 루트 레이아웃이 개발 빌드(__DEV__)에서만 열어 준다 */
export default function DevLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.gray100 },
      }}
    />
  );
}
