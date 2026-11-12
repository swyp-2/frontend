import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { CheckIcon, Checkbox, SelectIcon } from '@/components/ui/checkbox';
import { Logo } from '@/components/ui/logo';
import { RadioCard } from '@/components/ui/radio-card';
import { SelectionField } from '@/components/ui/selection-field';
import { TextArea } from '@/components/ui/text-area';
import { Toast } from '@/components/ui/toast';
import { Colors } from '@/constants/theme';

/** 폼 계열 공용 컴포넌트 확인용 개발 화면 (/dev/forms) */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="body4SB" color="gray800">
        {title}
      </AppText>
      {children}
    </View>
  );
}

export default function FormsGalleryScreen() {
  const [role, setRole] = useState<'a' | 'b'>('b');
  const [checked, setChecked] = useState<Record<string, boolean>>({ d2: true, b2: true });
  const [memo, setMemo] = useState('');
  const [workers, setWorkers] = useState<string[]>([]);

  const toggle = (key: string) => setChecked((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Section title="Logo">
          <Logo />
          <View style={styles.dark}>
            <Logo color="white" />
          </View>
        </Section>

        <Section title="Toast/Success">
          <Toast message="매장 코드를 복사했어요!" />
        </Section>

        <Section title="Radio Card">
          <RadioCard
            title="역할"
            description={'매장 근무표를 편성하고\n대타 요청을 최종 승인해요.'}
            selected={role === 'a'}
            onPress={() => setRole('a')}
          />
          <RadioCard
            title="역할"
            description={'매장 근무표를 편성하고\n대타 요청을 최종 승인해요.'}
            selected={role === 'b'}
            onPress={() => setRole('b')}
          />
        </Section>

        <Section title="Checkbox/default">
          <Checkbox title="이름" description="역할" checked={!!checked.d1} onPress={() => toggle('d1')} />
          <Checkbox title="이름" description="역할" checked={!!checked.d2} onPress={() => toggle('d2')} />
        </Section>

        <Section title="Checkbox/bottom">
          <View style={styles.sheet}>
            <Checkbox
              variant="bottom"
              title="이름"
              description="역할"
              checked={!!checked.b1}
              onPress={() => toggle('b1')}
            />
            <Checkbox
              variant="bottom"
              title="이름"
              description="역할"
              checked={!!checked.b2}
              onPress={() => toggle('b2')}
            />
          </View>
        </Section>

        <Section title="Icon/check · Icon/Select">
          <View style={styles.row}>
            <CheckIcon />
            <CheckIcon checked />
            <SelectIcon />
            <SelectIcon selected />
          </View>
        </Section>

        <Section title="Text Area">
          <TextArea value={memo} onChangeText={setMemo} placeholder="텍스트 입력" />
          <TextArea value="텍스트 입력" editable={false} />
        </Section>

        <Section title="Selection Field">
          <SelectionField
            placeholder="근무자를 선택해주세요"
            values={workers}
            onPress={() => setWorkers((prev) => (prev.length ? [] : ['홍길동']))}
          />
          <SelectionField
            placeholder="근무자를 선택해주세요"
            values={['홍길동', '홍길동', '홍길동']}
            moreCount={2}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  content: {
    gap: 28,
    padding: 24,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dark: {
    alignSelf: 'flex-start',
    padding: 16,
    borderRadius: 16,
    backgroundColor: Colors.gray900,
  },
  sheet: {
    gap: 12,
    padding: 20,
    marginHorizontal: -20,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
});
