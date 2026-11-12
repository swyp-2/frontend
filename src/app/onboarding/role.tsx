import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { goBack, OnboardingScreen } from '@/components/onboarding-screen';
import { AppText } from '@/components/ui/app-text';
import { RadioCard } from '@/components/ui/radio-card';
import { ApiError, meApi, type Role } from '@/lib/api';
import { screenPath, useSession } from '@/lib/session';

const roles: { role: Role; title: string; description: string }[] = [
  { role: 'MANAGER', title: '매니저', description: '매장 근무표를 편성하고\n대타 요청을 최종 승인해요' },
  { role: 'CREW', title: '크루원', description: '함께 일하는 시간표를 확인하고\n내 근무의 대타를 부탁해요' },
];

/** CO-05 역할 선택 */
export default function RoleScreen() {
  const { setMe } = useSession();
  const [selected, setSelected] = useState<Role | null>(null);
  const [message, setMessage] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving || !selected) return;
    setSaving(true);
    setMessage(undefined);
    try {
      const me = await meApi.setRole(selected);
      setMe(me);
      router.replace(screenPath[me.next_screen]);
    } catch (e) {
      setMessage(e instanceof ApiError ? e.message : '저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      appBarTitle="역할 선택"
      onBack={goBack}
      title="어떤 역할로 시작할까요?"
      subtitle="역할에 맞는 화면으로 시작해요"
      cta={{ label: '다음으로', onPress: submit, disabled: !selected || saving }}>
      <View style={styles.cards} accessibilityRole="radiogroup">
        {roles.map(({ role, title, description }) => (
          <RadioCard
            key={role}
            title={title}
            description={description}
            selected={role === selected}
            onPress={() => setSelected(role)}
          />
        ))}
      </View>
      {!!message && (
        <AppText variant="body3M" color="red900" style={styles.message}>
          {message}
        </AppText>
      )}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  cards: {
    gap: 8,
  },
  message: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
});
