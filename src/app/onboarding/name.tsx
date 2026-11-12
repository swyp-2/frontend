import { router } from 'expo-router';
import { useState } from 'react';

import { FieldGroup, goBack, OnboardingScreen } from '@/components/onboarding-screen';
import { TextField } from '@/components/ui/text-field';
import { ApiError, meApi } from '@/lib/api';
import { screenPath, useSession } from '@/lib/session';

/** CO-04 이름 입력 */
export default function NameScreen() {
  const { setMe } = useSession();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const trimmed = name.trim();

  const submit = async () => {
    if (saving) return;
    if (trimmed.length < 2 || trimmed.length > 15) {
      setError('공백을 제외한 2~15자의 이름을 입력해 주세요');
      return;
    }
    setSaving(true);
    try {
      const me = await meApi.setName(trimmed);
      setMe(me);
      router.replace(screenPath[me.next_screen]);
    } catch (e) {
      setError(e instanceof ApiError ? e.messageFor('display_name') : '저장하지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      appBarTitle="이름 입력"
      onBack={goBack}
      title={'함께 일할 때 사용하는\n이름을 입력해주세요'}
      cta={{ label: '다음으로', onPress: submit, disabled: !trimmed || saving }}>
      <FieldGroup label="이름" helper={error ? undefined : '시간표와 프로필에 동일하게 표시돼요'}>
        <TextField
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(undefined);
          }}
          errorMessage={error}
          placeholder="이름을 입력해 주세요"
          maxLength={15}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </FieldGroup>
    </OnboardingScreen>
  );
}
