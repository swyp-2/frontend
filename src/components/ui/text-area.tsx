import { StyleSheet, TextInput, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { Colors, Typography } from '@/constants/theme';

export type TextAreaProps = Omit<TextInputProps, 'style' | 'multiline'> & {
  style?: StyleProp<ViewStyle>;
};

export function TextArea({ value, style, ...rest }: TextAreaProps) {
  return (
    <TextInput
      value={value}
      multiline
      textAlignVertical="top"
      placeholderTextColor={Colors.gray700}
      style={[styles.input, value ? styles.filled : styles.empty, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    alignSelf: 'stretch',
    height: 100,
    // Figma 여백(18/16)에서 테두리 1 을 뺀 값
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.gray200,
    backgroundColor: Colors.white,
    color: Colors.gray900,
    fontSize: Typography.body2M.fontSize,
    lineHeight: Typography.body2M.lineHeight,
  },
  empty: {
    fontFamily: Typography.body2M.fontFamily,
  },
  filled: {
    fontFamily: Typography.body2SB.fontFamily,
  },
});
