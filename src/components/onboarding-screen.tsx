import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';

/**
 * 앱 바 뒤로가기. 온보딩은 서버가 정한 다음 화면으로 replace 이동하므로 보통은 돌아갈 화면이 없고,
 * 그때는 아무 일도 하지 않는다 (이전 단계로 되돌리는 흐름은 아직 정해지지 않았다).
 */
export function goBack() {
  if (router.canGoBack()) router.back();
}

type Cta = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

type OnboardingScreenProps = {
  title: string;
  subtitle?: string;
  /** 앱 바 가운데에 들어가는 화면 이름 */
  appBarTitle?: string;
  /** 넘기면 앱 바에 뒤로가기가 생긴다 */
  onBack?: () => void;
  /** false 면 앱 바 없이 제목이 화면 중간쯤에서 시작한다 (매장 코드 화면) */
  appBar?: boolean;
  /** center 는 제목·부제를 가운데 정렬한다 (매장 코드 화면) */
  align?: 'left' | 'center';
  cta: Cta;
  children: ReactNode;
};

/**
 * 온보딩·매장 연결 화면 공통 틀: 앱 바 → 제목 → 내용 → 하단 고정 CTA.
 * 간격은 Figma 402×874 프레임의 레이어 좌표를 그대로 옮겼다.
 */
export function OnboardingScreen({
  title,
  subtitle,
  appBarTitle,
  onBack,
  appBar = true,
  align = 'left',
  cta,
  children,
}: OnboardingScreenProps) {
  const centered = align === 'center';
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}>
          {appBar ? (
            <AppBar title={appBarTitle} onBack={onBack} />
          ) : (
            <View style={styles.noAppBarSpacer} />
          )}
          <View style={[styles.heading, centered && styles.headingCentered]}>
            <AppText
              variant="head24SB"
              accessibilityRole="header"
              style={[styles.title, centered && styles.textCentered]}>
              {title}
            </AppText>
            {!!subtitle && (
              <AppText variant="body2M" color="gray700" style={centered && styles.textCentered}>
                {subtitle}
              </AppText>
            )}
          </View>
          <View style={styles.body}>{children}</View>
        </ScrollView>
        <View style={styles.footer}>
          <Button label={cta.label} onPress={cta.onPress} disabled={cta.disabled} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type FieldGroupProps = {
  label: string;
  /** 필드 아래 보조 설명. 에러 안내는 TextField 의 errorMessage 로 넘긴다 */
  helper?: string;
  children: ReactNode;
};

/** 라벨 + 입력 필드 + 보조 설명 묶음 */
export function FieldGroup({ label, helper, children }: FieldGroupProps) {
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="body2SB" style={styles.fieldText}>
        {label}
      </AppText>
      {children}
      {!!helper && (
        <AppText variant="body3M" color="gray700" style={styles.fieldText}>
          {helper}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scroll: {
    flexGrow: 1,
  },
  noAppBarSpacer: {
    height: 153,
  },
  heading: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
  },
  headingCentered: {
    alignItems: 'center',
  },
  // Figma 의 Head 24 SB 는 자간 -2%(-0.48)인데 theme 토큰에는 0 으로 들어 있어 여기서 맞춘다.
  title: {
    letterSpacing: -0.48,
  },
  textCentered: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  fieldGroup: {
    gap: 14,
  },
  fieldText: {
    paddingHorizontal: 4,
  },
});
