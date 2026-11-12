import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const KEY = 'baton.access_token';

/**
 * access_token 보관소. 모바일은 Keychain / Keystore 에 저장한다.
 * 웹은 localStorage 를 피하라는 연동 가이드에 따라 메모리에만 둔다 (새로고침하면 다시 로그인).
 */
let memoryToken: string | null = null;

export const tokenStorage = {
  async get() {
    if (Platform.OS === 'web') return memoryToken;
    return SecureStore.getItemAsync(KEY);
  },
  async set(token: string) {
    if (Platform.OS === 'web') {
      memoryToken = token;
      return;
    }
    await SecureStore.setItemAsync(KEY, token);
  },
  async clear() {
    if (Platform.OS === 'web') {
      memoryToken = null;
      return;
    }
    await SecureStore.deleteItemAsync(KEY);
  },
};
