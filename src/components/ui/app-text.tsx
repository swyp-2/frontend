import { Text, type TextProps } from 'react-native';

import { Colors, Typography, type ColorToken, type TypographyToken } from '@/constants/theme';

export type AppTextProps = TextProps & {
  variant?: TypographyToken;
  color?: ColorToken;
};

export function AppText({ variant = 'body2M', color = 'gray900', style, ...rest }: AppTextProps) {
  return <Text style={[Typography[variant], { color: Colors[color] }, style]} {...rest} />;
}
