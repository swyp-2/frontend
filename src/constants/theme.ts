/**
 * BATON 디자인 토큰.
 * 값은 Figma 변수(Design System 섹션)를 그대로 옮긴 것이다.
 */

import type { TextStyle } from 'react-native';

export const Colors = {
  gray900: '#1F2125',
  gray800: '#61646C',
  gray700: '#9FA1A6',
  gray400: '#D7D9DC',
  gray300: '#E6E7EC',
  gray200: '#EFF0F4',
  gray100: '#F5F6F8',
  white: '#FFFFFF',

  green900: '#27A461',
  green200: '#CAEAD9',
  green100: '#E6F9F0',
  blue200: '#D2E9FF',
  blue100: '#E5F3FF',
  purple200: '#DAD9F2',
  purple100: '#EEEEFA',
  red200: '#FFDBE4',
  red100: '#FEEDF7',
  red900: '#FF5252',

  /** 변수로 등록되지 않고 컴포넌트에 직접 쓰인 색 */
  errorBackground: '#FFF7F7',
  errorBorder: '#FF9896',
  kakao: '#FEE500',
} as const;

export type ColorToken = keyof typeof Colors;

export const FontFamily = {
  medium: 'Pretendard-Medium',
  semiBold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
} as const;

/** 모든 텍스트 스타일의 행간은 1.4 배다. */
const type = (fontFamily: string, fontSize: number, letterSpacing = 0): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight: Math.round(fontSize * 1.4 * 10) / 10,
  letterSpacing,
});

export const Typography = {
  // Head 24 SB 만 자간 -2% 다.
  head24SB: type(FontFamily.semiBold, 24, -0.48),
  code20B: type(FontFamily.bold, 20),
  body1B: type(FontFamily.bold, 18),
  body1SB: type(FontFamily.semiBold, 18),
  body2SB: type(FontFamily.semiBold, 16),
  body2M: type(FontFamily.medium, 16),
  body3SB: type(FontFamily.semiBold, 14),
  body3M: type(FontFamily.medium, 14),
  body4SB: type(FontFamily.semiBold, 12),
  body4M: type(FontFamily.medium, 12),
  caption1SB: type(FontFamily.semiBold, 10),
  caption1M: type(FontFamily.medium, 10),
} as const;

export type TypographyToken = keyof typeof Typography;

/** 화면 좌우 기본 여백 (402pt 프레임 기준 24pt) */
export const ScreenPadding = 24;
