import {
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors, Typography } from '@/constants/theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  /** L: 화면 폭을 채움, M: 172pt 고정 (두 칸 배치용) */
  size?: 'L' | 'M';
  /** 값이 있으면 에러 상태로 그리고 필드 아래에 안내 문구를 띄운다 */
  errorMessage?: string;
  style?: StyleProp<ViewStyle>;
};

export function TextField({ size = 'L', errorMessage, value, style, ...rest }: TextFieldProps) {
  const hasError = !!errorMessage;
  const isFilled = !!value;
  return (
    <View style={[styles.container, size === 'M' ? styles.sizeM : styles.sizeL, style]}>
      <TextInput
        value={value}
        placeholderTextColor={hasError ? Colors.red900 : Colors.gray700}
        style={[
          styles.input,
          isFilled ? styles.inputFilled : styles.inputEmpty,
          hasError && styles.inputError,
        ]}
        {...rest}
      />
      {hasError && (
        <View style={styles.helper}>
          <AppText variant="body3M" color="red900">
            {errorMessage}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sizeL: {
    alignSelf: 'stretch',
  },
  sizeM: {
    width: 172,
  },
  input: {
    height: 55,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    // TextInput 은 lineHeight 를 주면 플랫폼마다 세로 정렬이 어긋나므로 폰트만 가져온다.
    fontSize: Typography.body2M.fontSize,
  },
  inputEmpty: {
    fontFamily: Typography.body2M.fontFamily,
    color: Colors.gray900,
  },
  inputFilled: {
    fontFamily: Typography.body2SB.fontFamily,
    color: Colors.gray900,
  },
  inputError: {
    fontFamily: Typography.body2M.fontFamily,
    color: Colors.red900,
    borderColor: Colors.errorBorder,
    backgroundColor: Colors.errorBackground,
  },
  helper: {
    paddingHorizontal: 4,
  },
});
