import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Colors } from '@/constants/theme';

export type CodeCardProps = {
  code: string;
  storeName: string;
  managerName: string;
  style?: StyleProp<ViewStyle>;
};

export function CodeCard({ code, storeName, managerName, style }: CodeCardProps) {
  return (
    <View style={[styles.card, style]}>
      <AppText variant="code20B" style={styles.code} selectable>
        {code}
      </AppText>
      <View style={styles.meta}>
        <AppText variant="body3SB" color="gray700" numberOfLines={1} style={styles.metaText}>
          {storeName}
        </AppText>
        <AppText variant="body3SB" color="gray700">
          ·
        </AppText>
        <AppText variant="body3SB" color="gray700" numberOfLines={1} style={styles.metaText}>
          {managerName}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 120,
    alignItems: 'center',
    gap: 16,
    padding: 28,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  code: {
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metaText: {
    flexShrink: 1,
  },
});
