import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConsentSheet } from '@/components/consent-sheet';
import { goBack, OnboardingScreen } from '@/components/onboarding-screen';
import { AppText } from '@/components/ui/app-text';
import { CheckIcon } from '@/components/ui/checkbox';
import { Colors } from '@/constants/theme';
import { ApiError, meApi, type ConsentDocument } from '@/lib/api';
import { screenPath, useSession } from '@/lib/session';

/** CO-02 약관 동의 (+ CO-03 약관 보기 시트) */
export default function ConsentScreen() {
  const { setMe } = useSession();
  const [documents, setDocuments] = useState<ConsentDocument[]>([]);
  const [agreed, setAgreed] = useState<Record<number, boolean>>({});
  const [viewing, setViewing] = useState<ConsentDocument | null>(null);
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    meApi
      .consentDocuments()
      .then(setDocuments)
      .catch(() => setMessage('약관을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'));
  }, []);

  const allAgreed = documents.length > 0 && documents.every((d) => agreed[d.document_id]);
  const requiredAgreed =
    documents.length > 0 && documents.filter((d) => d.required).every((d) => agreed[d.document_id]);

  const toggleAll = () =>
    setAgreed(Object.fromEntries(documents.map((d) => [d.document_id, !allAgreed])));

  const submit = async () => {
    if (saving || !requiredAgreed) return;
    setSaving(true);
    setMessage(undefined);
    try {
      const me = await meApi.agree(
        documents.map((d) => ({ document_id: d.document_id, agreed: !!agreed[d.document_id] })),
      );
      setMe(me);
      router.replace(screenPath[me.next_screen]);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : '저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <OnboardingScreen
        appBarTitle="약관 동의"
        onBack={goBack}
        title="약관을 확인해주세요"
        cta={{ label: '다음으로', onPress: submit, disabled: !requiredAgreed || saving }}>
        <View style={styles.card}>
          <CheckRow label="전체 동의" all checked={allAgreed} onPress={toggleAll} />
          <View style={styles.divider} />
          <View style={styles.list}>
            {documents.map((d) => (
              <View key={d.document_id} style={styles.item}>
                <CheckRow
                  label={`[${d.required ? '필수' : '선택'}] ${d.title}`}
                  checked={!!agreed[d.document_id]}
                  onPress={() =>
                    setAgreed((prev) => ({ ...prev, [d.document_id]: !prev[d.document_id] }))
                  }
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${d.title} 보기`}
                  hitSlop={12}
                  onPress={() => setViewing(d)}>
                  <AppText variant="body3M" color="gray700">
                    보기
                  </AppText>
                </Pressable>
              </View>
            ))}
          </View>
        </View>
        {!!message && (
          <AppText variant="body3M" color="red900" style={styles.message}>
            {message}
          </AppText>
        )}
      </OnboardingScreen>
      <ConsentSheet
        document={viewing}
        onClose={() => setViewing(null)}
        onAgree={(d) => {
          setAgreed((prev) => ({ ...prev, [d.document_id]: true }));
          setViewing(null);
        }}
      />
    </>
  );
}

function CheckRow({
  label,
  all = false,
  checked,
  onPress,
}: {
  label: string;
  /** 전체 동의 줄은 글자가 더 크고 진하다 */
  all?: boolean;
  checked: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      hitSlop={8}
      onPress={onPress}
      style={styles.checkRow}>
      <CheckIcon checked={checked} />
      <AppText
        variant={all ? 'body2SB' : 'body3M'}
        color={all ? 'gray900' : 'gray800'}
        numberOfLines={1}
        style={styles.checkLabel}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    gap: 20,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  divider: {
    height: 1,
    borderRadius: 1,
    backgroundColor: Colors.gray400,
  },
  list: {
    gap: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  checkLabel: {
    flexShrink: 1,
  },
  message: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
});
