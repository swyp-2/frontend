import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { Button, TextButton } from '@/components/ui/button';
import { Colors } from '@/constants/theme';
import type { ConsentDocument } from '@/lib/api';

type Section = { heading?: string; body: string };

type Content =
  | { status: 'loading' }
  | { status: 'loaded'; sections: Section[] }
  | { status: 'failed' };

const HEADING = /^(#{1,6}\s+|제\s*\d+\s*조|\d+\.\s)/;

/**
 * 약관 본문(일반 텍스트)을 빈 줄 기준으로 나누고, 문단 첫 줄이 "1. 제목" / "# 제목" / "제1조" 꼴이면 소제목으로 본다.
 */
function parseSections(text: string): Section[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const [first, ...rest] = block.split('\n');
      if (HEADING.test(first)) {
        return { heading: first.replace(/^#{1,6}\s+/, ''), body: rest.join('\n').trim() };
      }
      return { body: block };
    });
}

async function loadSections(reference: string): Promise<Section[]> {
  if (!/^https?:\/\//.test(reference)) throw new Error('not a url');
  const response = await fetch(reference);
  if (!response.ok) throw new Error(String(response.status));
  const text = await response.text();
  // HTML 문서는 앱 안에서 그릴 수 없어 브라우저로 넘긴다.
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error('html');
  const sections = parseSections(text);
  if (sections.length === 0) throw new Error('empty');
  return sections;
}

export type ConsentSheetProps = {
  /** null 이면 닫힌 상태 */
  document: ConsentDocument | null;
  onClose: () => void;
  /** "동의하기" 를 눌렀을 때. 닫기(X)는 동의로 치지 않는다 */
  onAgree: (document: ConsentDocument) => void;
};

/** CO-03 약관 보기 바텀시트 */
export function ConsentSheet({ document, onClose, onAgree }: ConsentSheetProps) {
  const insets = useSafeAreaInsets();
  // 어느 문서의 결과인지 함께 들고 있다가, 다른 문서가 열리면 다시 불러오는 동안 loading 으로 본다.
  const [loaded, setLoaded] = useState<{ reference: string; content: Content } | null>(null);

  const reference = document?.body_reference;
  useEffect(() => {
    if (!reference) return;
    let cancelled = false;
    loadSections(reference)
      .then((sections): Content => ({ status: 'loaded', sections }))
      .catch((): Content => ({ status: 'failed' }))
      .then((result) => {
        if (!cancelled) setLoaded({ reference, content: result });
      });
    return () => {
      cancelled = true;
    };
  }, [reference]);

  const content: Content =
    loaded && loaded.reference === reference ? loaded.content : { status: 'loading' };

  return (
    <Modal
      visible={!!document}
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} accessibilityLabel="닫기" onPress={onClose} />
        {!!document && (
          // 874 프레임에서 시트 높이가 805 → 상태바(53) 아래 16 부터 시작한다.
          <View style={[styles.sheet, { marginTop: insets.top + 16 }]}>
            <AppBar
              variant="sheet"
              title={`[${document.required ? '필수' : '선택'}] ${document.title}`}
              onClose={onClose}
            />
            {content.status === 'loaded' ? (
              <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
                {content.sections.map((section, index) => (
                  <View key={index} style={styles.section}>
                    {!!section.heading && <AppText variant="body3SB">{section.heading}</AppText>}
                    {!!section.body && (
                      <AppText variant="body3M" color="gray700">
                        {section.body}
                      </AppText>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.placeholder}>
                {content.status === 'loading' ? (
                  <ActivityIndicator color={Colors.gray900} />
                ) : (
                  <>
                    <AppText variant="body3M" color="gray700" style={styles.placeholderText}>
                      약관 내용을 여기에서 불러오지 못했어요.
                    </AppText>
                    <TextButton
                      label="브라우저에서 보기"
                      onPress={() => WebBrowser.openBrowserAsync(document.body_reference)}
                    />
                  </>
                )}
              </View>
            )}
            <View style={[styles.footer, { paddingBottom: 24 + insets.bottom }]}>
              <Button label="동의하기" onPress={() => onAgree(document)} />
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.gray900,
    opacity: 0.4,
  },
  sheet: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: Colors.white,
  },
  content: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 24,
  },
  section: {
    gap: 8,
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 24,
  },
  placeholderText: {
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 24,
  },
});
