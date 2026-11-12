import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button, type ButtonVariant } from '@/components/ui/button';
import { Colors } from '@/constants/theme';

export type FooterButton = {
  key: string;
  label: string;
  variant?: ButtonVariant;
  /** L 사이즈 primary 버튼의 숫자 배지 */
  count?: number;
  disabled?: boolean;
  onPress: () => void;
};

type ScreenFrameProps = {
  appBarTitle: string;
  onBack?: () => void;
  /** 하단 고정 버튼. 1개면 Btn_L, 2개면 Btn_M 두 개를 나란히 둔다 */
  buttons?: FooterButton[];
  /** 버튼 위에 보이는 실패 안내 */
  errorMessage?: string | null;
  /** 처리 중이면 버튼을 모두 막는다 (중복 제출 방지) */
  busy?: boolean;
  /** false 면 내용을 스크롤 없이 그대로 채운다 (로딩·오류 안내) */
  scroll?: boolean;
  children: ReactNode;
};

/** 앱 바 → 내용 → 하단 고정 버튼 틀 (402×874 프레임 기준) */
export function ScreenFrame({
  appBarTitle,
  onBack,
  buttons = [],
  errorMessage,
  busy = false,
  scroll = true,
  children,
}: ScreenFrameProps) {
  const insets = useSafeAreaInsets();
  const single = buttons.length === 1;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <AppBar title={appBarTitle} onBack={onBack} />
        {scroll ? (
          <ScrollView
            style={styles.flex}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>
            {children}
          </ScrollView>
        ) : (
          <View style={styles.flex}>{children}</View>
        )}
        {(buttons.length > 0 || !!errorMessage) && (
          <View style={[styles.footer, { paddingBottom: Math.max(24, insets.bottom) }]}>
            {!!errorMessage && (
              <AppText
                variant="body3M"
                color="red900"
                style={styles.error}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite">
                {errorMessage}
              </AppText>
            )}
            <View style={styles.buttons}>
              {buttons.map((button) => (
                <Button
                  key={button.key}
                  size={single ? 'L' : 'M'}
                  label={button.label}
                  variant={button.variant}
                  count={button.count}
                  disabled={busy || button.disabled}
                  onPress={button.onPress}
                  style={single ? styles.full : styles.half}
                />
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** 화면 제목 (Head 24 SB) */
export function Heading({ title }: { title: string }) {
  return (
    <View style={styles.heading}>
      <AppText variant="head24SB" accessibilityRole="header">
        {title}
      </AppText>
    </View>
  );
}

type SectionProps = {
  label: string;
  /** 내용 아래 보조 설명 */
  helper?: string;
  children: ReactNode;
};

/** 라벨 + 내용 + 보조 설명 묶음 */
export function Section({ label, helper, children }: SectionProps) {
  return (
    <View style={styles.section}>
      <AppText variant="body2SB" style={styles.sectionLabel}>
        {label}
      </AppText>
      {children}
      {!!helper && (
        <AppText variant="body3M" color="gray700">
          {helper}
        </AppText>
      )}
    </View>
  );
}

/** 원본 근무 카드: "11월 9일 (월) · 14:00-18:00" */
export function ShiftCard({ date, time }: { date: string; time: string }) {
  return (
    <View style={styles.shift} accessible accessibilityLabel={`${date} ${time}`}>
      <AppText variant="body1SB" numberOfLines={1}>
        {date}
      </AppText>
      <AppText variant="body1SB">·</AppText>
      <AppText variant="body1SB" numberOfLines={1} style={styles.shrink}>
        {time}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  shrink: {
    flexShrink: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  scroll: {
    flexGrow: 1,
  },
  heading: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  section: {
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  sectionLabel: {
    paddingHorizontal: 4,
  },
  shift: {
    alignSelf: 'stretch',
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: Colors.gray300,
  },
  footer: {
    gap: 12,
    paddingHorizontal: 24,
    backgroundColor: Colors.gray100,
  },
  error: {
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 4,
  },
  full: {
    flex: 1,
  },
  // Btn_M 은 폭이 175 로 고정이라, 화면 폭에 맞춰 반씩 나눠 갖게 한다.
  half: {
    flex: 1,
    width: 'auto',
  },
});
