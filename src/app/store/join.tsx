import { router } from 'expo-router';
import { useState } from 'react';

import { FieldGroup, goBack, OnboardingScreen } from '@/components/onboarding-screen';
import { TextField } from '@/components/ui/text-field';
import { ApiError, storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

const CODE_PATTERN = /^[A-Z0-9]{8}$/;

/** ST-03 매장 참여 */
export default function StoreJoinScreen() {
  const { refresh } = useSession();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (saving) return;
    if (!CODE_PATTERN.test(code)) {
      setError('올바르지 않은 코드 형식이에요');
      return;
    }
    setSaving(true);
    try {
      await storeApi.join(code);
      await refresh();
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.messageFor('code') : '참여하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      appBarTitle="매장 참여"
      onBack={goBack}
      title="매장 코드를 입력해주세요"
      cta={{ label: '참여하기', onPress: submit, disabled: !code || saving }}>
      <FieldGroup label="매장 코드">
        <TextField
          value={code}
          onChangeText={(text) => {
            setCode(text.toUpperCase().replace(/[^A-Z0-9]/g, ''));
            setError(undefined);
          }}
          errorMessage={error}
          placeholder="매장 코드를 입력해주세요"
          maxLength={8}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </FieldGroup>
    </OnboardingScreen>
  );
}
