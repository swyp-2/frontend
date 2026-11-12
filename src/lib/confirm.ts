import { Alert, Platform } from 'react-native';

type ConfirmOptions = {
  title: string;
  message: string;
  /** 되돌릴 수 없는 행동의 버튼 문구 */
  confirmLabel: string;
};

/**
 * 되돌릴 수 없는 행동 앞의 확인창. 시안에 확인 화면이 없는 곳에서 OS 기본 확인창을 쓴다.
 * (웹은 Alert 버튼을 지원하지 않아 confirm)
 */
export function confirmDestructive({ title, message, confirmLabel }: ConfirmOptions) {
  if (Platform.OS === 'web') {
    return Promise.resolve(globalThis.confirm?.(`${title}\n${message}`) ?? false);
  }
  return new Promise<boolean>((resolve) => {
    Alert.alert(
      title,
      message,
      [
        { text: '돌아가기', style: 'cancel', onPress: () => resolve(false) },
        { text: confirmLabel, style: 'destructive', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

/** 확인 버튼 하나짜리 안내창 */
export function notify(title: string, message: string) {
  if (Platform.OS === 'web') globalThis.alert?.(`${title}\n${message}`);
  else Alert.alert(title, message);
}
