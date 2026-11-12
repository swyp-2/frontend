import { Image } from 'expo-image';
import {
  Pressable,
  StyleSheet,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import { Colors, type ColorToken } from '@/constants/theme';

type BaseProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
};

const pressed = ({ pressed }: { pressed: boolean }) => (pressed ? styles.pressed : null);

/* -------------------------------------------------------------------------- */
/* CTA 버튼: Btn_L/cta, Btn_M/cta, Btn_S/cta                                   */
/* -------------------------------------------------------------------------- */

export type ButtonSize = 'L' | 'M' | 'S';
export type ButtonVariant = 'primary' | 'secondary' | 'reject';

export type ButtonProps = BaseProps & {
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  /** L 사이즈 primary 버튼 라벨 옆에 붙는 숫자 배지 */
  count?: number;
};

const labelColor: Record<ButtonVariant, ColorToken> = {
  primary: 'white',
  secondary: 'gray900',
  reject: 'red900',
};

export function Button({
  label,
  size = 'L',
  variant = 'primary',
  count,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary' && !disabled;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.cta,
        sizeStyles[size],
        isPrimary && styles.ctaPrimary,
        pressed(state),
        style,
      ]}
      {...rest}>
      <AppText
        variant={size === 'S' ? 'body3SB' : 'body2SB'}
        color={disabled ? 'gray700' : labelColor[variant]}
        numberOfLines={1}>
        {label}
      </AppText>
      {count !== undefined && (
        <View style={styles.count}>
          <AppText variant="body4SB" style={styles.countLabel}>
            {count}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 소셜 로그인 버튼: Btn_L/login                                               */
/* -------------------------------------------------------------------------- */

export type SocialProvider = 'google' | 'kakao' | 'apple';

const socialLabel: Record<SocialProvider, string> = {
  google: 'Google로 계속하기',
  kakao: '카카오로 계속하기',
  apple: 'Apple로 계속하기',
};

function SocialLogo({ provider }: { provider: SocialProvider }) {
  return (
    <View style={styles.socialLogo}>
      {provider === 'google' && (
        <Image
          source={require('@/assets/images/social/google-logo.svg')}
          style={styles.googleLogo}
        />
      )}
      {provider === 'kakao' && (
        <Image
          source={require('@/assets/images/social/kakao-mask.png')}
          tintColor={Colors.gray900}
          style={styles.kakaoLogo}
        />
      )}
      {provider === 'apple' && (
        <Image source={require('@/assets/images/social/apple.png')} style={styles.appleLogo} />
      )}
    </View>
  );
}

export type SocialLoginButtonProps = BaseProps & { provider: SocialProvider };

export function SocialLoginButton({ provider, style, ...rest }: SocialLoginButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.social,
        provider === 'kakao' && styles.socialKakao,
        pressed(state),
        style,
      ]}
      {...rest}>
      <SocialLogo provider={provider} />
      <AppText variant="body3SB" style={styles.socialLabel} numberOfLines={1}>
        {socialLabel[provider]}
      </AppText>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 복사 버튼: Btn_M/Copy                                                       */
/* -------------------------------------------------------------------------- */

export function CopyButton({
  label = '복사하기',
  style,
  ...rest
}: BaseProps & { label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [styles.copy, pressed(state), style]}
      {...rest}>
      <Icon name="copy" style={styles.copyIcon} />
      <AppText variant="body2SB">{label}</AppText>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 텍스트 버튼: Btn_S/text                                                     */
/* -------------------------------------------------------------------------- */

export function TextButton({ label, style, ...rest }: BaseProps & { label: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [styles.text, pressed(state), style]}
      {...rest}>
      <AppText variant="body4M" color="gray800">
        {label}
      </AppText>
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 오늘 버튼: Btn_S/today                                                      */
/* -------------------------------------------------------------------------- */

export function TodayButton({ label = '오늘', style, ...rest }: BaseProps & { label?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={10}
      style={(state) => [styles.today, pressed(state), style]}
      {...rest}>
      <AppText variant="caption1SB" color="gray800">
        {label}
      </AppText>
    </Pressable>
  );
}

const sizeStyles = StyleSheet.create({
  L: { height: 60, borderRadius: 12, alignSelf: 'stretch' },
  M: { height: 60, borderRadius: 12, width: 175 },
  S: { height: 45, borderRadius: 10, width: 136 },
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    overflow: 'hidden',
    backgroundColor: Colors.gray300,
  },
  ctaPrimary: {
    backgroundColor: Colors.gray900,
  },
  count: {
    width: 22,
    height: 22,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
  countLabel: {
    width: 20,
    textAlign: 'center',
  },
  social: {
    height: 54,
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.white,
  },
  socialKakao: {
    backgroundColor: Colors.kakao,
  },
  socialLabel: {
    width: 120,
    textAlign: 'center',
  },
  socialLogo: {
    width: 24,
    height: 24,
    overflow: 'hidden',
  },
  googleLogo: {
    position: 'absolute',
    left: 1,
    top: 1,
    width: 22,
    height: 22,
  },
  kakaoLogo: {
    position: 'absolute',
    left: 0.995,
    top: 1.998,
    width: 22,
    height: 20.293,
  },
  appleLogo: {
    position: 'absolute',
    left: 1.977,
    top: 0.178,
    width: 19.245,
    height: 23.642,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingLeft: 16,
    paddingRight: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: Colors.gray300,
  },
  copyIcon: {
    transform: [{ rotate: '180deg' }],
  },
  text: {
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  today: {
    width: 38,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 35,
    backgroundColor: Colors.gray200,
  },
});
