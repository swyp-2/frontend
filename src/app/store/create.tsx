import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useRef, useState } from 'react';

import { FieldGroup, goBack, OnboardingScreen } from '@/components/onboarding-screen';
import { TextField } from '@/components/ui/text-field';
import { ApiError, storeApi } from '@/lib/api';
import { useSession } from '@/lib/session';

/** ST-01 매장 만들기 */
export default function StoreCreateScreen() {
  const { refresh } = useSession();
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  // 같은 매장명으로 다시 누르면 같은 키를 보내 중복 생성을 막는다.
  const idempotency = useRef<{ name: string; key: string } | null>(null);

  const trimmed = name.trim();

  const submit = async () => {
    if (saving) return;
    if (trimmed.length < 1 || trimmed.length > 15) {
      setError('공백을 제외한 1~15자의 이름을 입력해 주세요');
      return;
    }
    if (idempotency.current?.name !== trimmed) {
      idempotency.current = { name: trimmed, key: Crypto.randomUUID() };
    }
    setSaving(true);
    try {
      const store = await storeApi.create(trimmed, idempotency.current.key);
      await refresh();
      router.replace({
        pathname: '/store/invite',
        params: { code: store.invite_code, storeName: store.name },
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.messageFor('name') : '매장을 만들지 못했어요. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingScreen
      appBarTitle="매장 만들기"
      onBack={goBack}
      title="우리 매장의 이름을 입력해주세요"
      cta={{ label: '다음으로', onPress: submit, disabled: !trimmed || saving }}>
      <FieldGroup label="매장명">
        <TextField
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError(undefined);
          }}
          errorMessage={error}
          placeholder="매장 이름을 입력해주세요"
          maxLength={15}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      </FieldGroup>
    </OnboardingScreen>
  );
}
