import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppBar } from '@/components/ui/app-bar';
import { AppText } from '@/components/ui/app-text';
import { BottomNavigation, type NavigationTab } from '@/components/ui/bottom-navigation';
import {
  Button,
  CopyButton,
  SocialLoginButton,
  TextButton,
  TodayButton,
} from '@/components/ui/button';
import { CodeCard } from '@/components/ui/code-card';
import { SectionHeader } from '@/components/ui/section-header';
import { TextField } from '@/components/ui/text-field';
import {
  Colors,
  Typography,
  type ColorToken,
  type TypographyToken,
} from '@/constants/theme';

/**
 * 디자인 시스템 확인용 임시 화면.
 * 실제 화면(로그인 등)을 붙이기 시작하면 이 파일을 교체한다.
 */

const swatches: ColorToken[] = [
  'gray900', 'gray800', 'gray700', 'gray400', 'gray300', 'gray200', 'gray100', 'white',
  'green200', 'green100', 'blue200', 'blue100', 'purple200', 'purple100',
  'red200', 'red100', 'red900',
];

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

export default function DesignSystemScreen() {
  const [tab, setTab] = useState<NavigationTab>('schedule');
  const [name, setName] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText variant="head24SB">BATON Design System</AppText>

        <Section title="Typography">
          {(Object.keys(Typography) as TypographyToken[]).map((token) => (
            <AppText key={token} variant={token}>
              {token}
            </AppText>
          ))}
        </Section>

        <Section title="Color">
          <View style={styles.swatches}>
            {swatches.map((token) => (
              <View key={token} style={styles.swatch}>
                <View style={[styles.swatchChip, { backgroundColor: Colors[token] }]} />
                <AppText variant="caption1M" color="gray800">
                  {token}
                </AppText>
              </View>
            ))}
          </View>
        </Section>

        <Section title="Btn_L/login">
          <SocialLoginButton provider="google" />
          <SocialLoginButton provider="kakao" />
          <SocialLoginButton provider="apple" />
        </Section>

        <Section title="Btn_L/cta">
          <Button label="버튼" disabled />
          <Button label="버튼" />
          <Button label="버튼" count={0} />
          <Button label="버튼" variant="secondary" />
        </Section>

        <Section title="Btn_M/cta">
          <View style={styles.row}>
            <Button size="M" label="버튼" disabled style={styles.flex} />
            <Button size="M" label="버튼" style={styles.flex} />
          </View>
          <View style={styles.row}>
            <Button size="M" label="버튼" variant="secondary" style={styles.flex} />
            <Button size="M" label="버튼" variant="reject" style={styles.flex} />
          </View>
        </Section>

        <Section title="Btn_S/cta · Btn_M/Copy · Btn_S/text · Btn_S/today">
          <View style={styles.row}>
            <Button size="S" label="승인하기" />
            <Button size="S" label="돌아가기" variant="secondary" />
          </View>
          <View style={styles.row}>
            <CopyButton />
            <TextButton label="전체근무" />
            <TodayButton />
          </View>
        </Section>

        <Section title="Text Field_L">
          <TextField placeholder="텍스트 입력" value={name} onChangeText={setName} />
          <TextField placeholder="텍스트 입력" value="텍스트 입력" editable={false} />
          <TextField placeholder="텍스트 입력" errorMessage="안내 문구" />
        </Section>

        <Section title="Text Field_M">
          <View style={styles.row}>
            <TextField size="M" placeholder="텍스트 입력" />
            <TextField size="M" placeholder="텍스트 입력" errorMessage="안내 문구" />
          </View>
        </Section>

        <Section title="Code Card">
          <CodeCard code="CODE1234" storeName="매장 이름" managerName="담당자" />
        </Section>
      </ScrollView>

      {/* 화면 폭을 그대로 쓰는 컴포넌트는 여백 없이 따로 둔다 */}
      <View style={styles.fullWidth}>
        <AppBar title="페이지" onBack={() => {}} />
        <AppBar title="매장 이름" variant="store" style={styles.storeBar} />
        <AppBar title="바텀시트" variant="sheet" onClose={() => {}} />
        <SectionHeader title="00월 근무" actionLabel="전체근무" />
        <BottomNavigation active={tab} onChange={setTab} role="manager" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.gray100,
  },
  content: {
    padding: 24,
    gap: 32,
  },
  section: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flex: {
    flex: 1,
    width: undefined,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  swatch: {
    alignItems: 'center',
    gap: 4,
  },
  swatchChip: {
    width: 56,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.gray300,
  },
  fullWidth: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray300,
  },
  storeBar: {
    height: 58,
  },
});
