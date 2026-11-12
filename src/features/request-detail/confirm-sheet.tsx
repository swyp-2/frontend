import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Colors } from '@/constants/theme';

export type ConfirmSheetContentProps = {
  title: string;
  message: string;
  /** 넘기면 제목과 안내 사이에 회색 칩으로 강조한다 (승인 확인의 근무 일시) */
  highlight?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
  /** 처리 중이면 확인 버튼을 막는다 */
  busy?: boolean;
  /** 실패 안내. 시트와 입력값은 그대로 둔다 */
  errorMessage?: string | null;
  /** 안내 아래 입력 영역 (거절 사유) */
  children?: ReactNode;
};

/** 확인 바텀시트의 시트 부분. 개발용 화면에서는 Modal 없이 이것만 그린다 */
export function ConfirmSheetContent({
  title,
  message,
  highlight,
  confirmLabel,
  onConfirm,
  onClose,
  busy = false,
  errorMessage,
  children,
}: ConfirmSheetContentProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.sheet}>
      <AppBar variant="sheet" onClose={onClose} />
      <View style={styles.body}>
        <View style={highlight ? styles.textsWithHighlight : styles.texts}>
          <AppText variant="code20B" accessibilityRole="header" style={styles.center}>
            {title}
          </AppText>
          {!!highlight && (
            <View style={styles.highlight}>
              <AppText variant="body2SB" color="gray800" numberOfLines={1}>
                {highlight}
              </AppText>
            </View>
          )}
          <AppText variant="body2M" color="gray800" style={styles.center}>
            {message}
          </AppText>
        </View>
        {children}
        {!!errorMessage && (
          <AppText
            variant="body3M"
            color="red900"
            style={styles.center}
            accessibilityRole="alert"
            accessibilityLiveRegion="polite">
            {errorMessage}
          </AppText>
        )}
      </View>
      <View style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>
        <Button label={confirmLabel} disabled={busy} onPress={onConfirm} />
      </View>
    </View>
  );
}

export type ConfirmSheetProps = ConfirmSheetContentProps & { visible: boolean };

/** 확인 바텀시트. 바깥을 누르거나 X 를 누르면 아무것도 바꾸지 않고 닫힌다 */
export function ConfirmSheet({ visible, ...content }: ConfirmSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={content.onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} accessibilityLabel="닫기" onPress={content.onClose} />
        {visible && <ConfirmSheetContent {...content} />}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.gray900,
    opacity: 0.4,
  },
  sheet: {
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: Colors.white,
  },
  body: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  texts: {
    alignItems: 'center',
    gap: 7,
  },
  textsWithHighlight: {
    alignItems: 'center',
    gap: 16,
  },
  center: {
    textAlign: 'center',
  },
  highlight: {
    width: 230,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: Colors.gray200,
  },
  footer: {
    paddingHorizontal: 24,
  },
});
