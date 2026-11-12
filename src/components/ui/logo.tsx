import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

const sources = {
  dark: require('@/assets/images/logo.svg'),
  white: require('@/assets/images/logo-white.svg'),
} as const;

// Figma 원본 크기
const WIDTH = 147.987;
const HEIGHT = 56.778;

export type LogoProps = {
  /** dark: 밝은 배경용(gray900), white: 로그인 화면처럼 어두운 배경용 */
  color?: keyof typeof sources;
  /** 가로 크기. 세로는 원본 비율을 따른다 */
  width?: number;
  style?: StyleProp<ImageStyle>;
};

export function Logo({ color = 'dark', width = WIDTH, style }: LogoProps) {
  return (
    <Image
      source={sources[color]}
      style={[{ width, height: (width * HEIGHT) / WIDTH }, style]}
      contentFit="contain"
      accessibilityRole="image"
      accessibilityLabel="BATON"
    />
  );
}
