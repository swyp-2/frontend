import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Icon } from '@/components/ui/icon';
import {
  ProfileAvatar,
  type ProfileAvatarColor,
} from '@/components/ui/profile-avatar';
import { Colors } from '@/constants/theme';

type RowProps = {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

function Row({ onPress, style, children }: RowProps & { children: ReactNode }) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [style, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

/* -------------------------------------------------------------------------- */
/* 근무 카드: List/empty, List/filled                                          */
/* -------------------------------------------------------------------------- */

export type ShiftListItemVariant = 'on' | 'off' | 'empty';

export type ShiftListItemProps = RowProps & {
  /** filled: 날짜, empty: 안내 제목 */
  title: string;
  /** filled: 근무 시간, empty: 안내 문구 */
  description?: string;
  /** on/off 는 List/filled 의 두 상태, empty 는 List/empty */
  variant?: ShiftListItemVariant;
};

export function ShiftListItem({
  title,
  description,
  variant = 'on',
  onPress,
  style,
}: ShiftListItemProps) {
  return (
    <Row onPress={onPress} style={[styles.shift, shiftStyles[variant], style]}>
      <AppText variant="body2SB" numberOfLines={1} style={styles.stretch}>
        {title}
      </AppText>
      {!!description && (
        <AppText variant="body4M" color="gray800" numberOfLines={1}>
          {description}
        </AppText>
      )}
    </Row>
  );
}

/* -------------------------------------------------------------------------- */
/* 프로필 카드: List/profile                                                   */
/* -------------------------------------------------------------------------- */

export type ProfileListItemProps = RowProps & {
  name: string;
  role?: string;
  /** 아바타 안 글자. 기본값은 name */
  avatarLabel?: string;
  avatarColor?: ProfileAvatarColor;
};

export function ProfileListItem({
  name,
  role,
  avatarLabel = name,
  avatarColor = 'blue',
  onPress,
  style,
}: ProfileListItemProps) {
  return (
    <Row onPress={onPress} style={[styles.profile, style]}>
      <ProfileAvatar label={avatarLabel} color={avatarColor} />
      <View style={styles.profileText}>
        <AppText variant="body1SB" numberOfLines={1}>
          {name}
        </AppText>
        {!!role && (
          <AppText variant="body3M" color="gray700" numberOfLines={1}>
            {role}
          </AppText>
        )}
      </View>
    </Row>
  );
}

/* -------------------------------------------------------------------------- */
/* 매니저용 대타 승인 요청 카드: List/manager                                  */
/* -------------------------------------------------------------------------- */

export type ManagerRequestStatus = 'unread' | 'read' | 'resolved';

export type ManagerRequestListItemProps = RowProps & {
  /** 제목 앞 이름 */
  name: string;
  /** 이름 뒤에 붙는 문구 */
  message?: string;
  date: string;
  time: string;
  /** 요청자 → 교체자 */
  requester: string;
  substitute: string;
  /** unread 는 빨간 new 점, resolved 는 회색 배경 */
  status?: ManagerRequestStatus;
};

export function ManagerRequestListItem({
  name,
  message = '님의 대타 승인 요청',
  date,
  time,
  requester,
  substitute,
  status = 'read',
  onPress,
  style,
}: ManagerRequestListItemProps) {
  return (
    <Row
      onPress={onPress}
      style={[styles.request, styles.manager, status === 'resolved' && styles.requestDone, style]}>
      <View style={styles.titleRow}>
        <AppText variant="body2SB" numberOfLines={1} style={styles.shrink}>
          {name}
          {message}
        </AppText>
        {status === 'unread' && <Icon name="new" />}
      </View>
      <View style={styles.managerBody}>
        <View style={styles.managerWhen}>
          <AppText variant="body3SB" color="gray800" numberOfLines={1}>
            {date}
          </AppText>
          <AppText variant="body3SB" color="gray800" numberOfLines={1}>
            {time}
          </AppText>
        </View>
        <View style={styles.inlineRow}>
          <AppText variant="body3M" color="gray700" numberOfLines={1}>
            {requester}
          </AppText>
          <Icon name="arrow-02" />
          <AppText variant="body3M" color="gray700" numberOfLines={1}>
            {substitute}
          </AppText>
        </View>
      </View>
    </Row>
  );
}

/* -------------------------------------------------------------------------- */
/* 크루용 대타 요청 카드: List/crew                                            */
/* -------------------------------------------------------------------------- */

export type CrewRequestStatus = 'wait' | 'pending' | 'approved' | 'rejected';

const crewStatusLabel: Record<CrewRequestStatus, string> = {
  wait: '응답 대기',
  pending: '승인 대기',
  approved: '승인',
  rejected: '거절',
};

export type StatusBadgeProps = {
  status: CrewRequestStatus;
  /** 기본 문구 대신 쓸 라벨 */
  label?: string;
  style?: StyleProp<ViewStyle>;
};

/** List/crew 오른쪽 상태 배지 */
export function StatusBadge({ status, label = crewStatusLabel[status], style }: StatusBadgeProps) {
  const done = status === 'approved' || status === 'rejected';
  return (
    <View style={[styles.badge, done && styles.badgeDone, style]}>
      <AppText
        variant="body4SB"
        color={done ? 'gray800' : 'gray700'}
        style={styles.badgeLabel}
        numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

export type CrewRequestListItemProps = RowProps & {
  date: string;
  time: string;
  /** 요청 대상 이름들. maxNames 를 넘는 인원은 "외 N명" 으로 줄인다 */
  names: readonly string[];
  maxNames?: number;
  status?: CrewRequestStatus;
  statusLabel?: string;
  /** 빨간 new 점 (Figma 의 unread) */
  unread?: boolean;
};

export function CrewRequestListItem({
  date,
  time,
  names,
  maxNames = 3,
  status = 'wait',
  statusLabel,
  unread = false,
  onPress,
  style,
}: CrewRequestListItemProps) {
  const shown = names.slice(0, maxNames);
  const rest = names.length - shown.length;
  const done = status === 'approved' || status === 'rejected';
  return (
    <Row onPress={onPress} style={[styles.request, styles.crew, done && styles.requestDone, style]}>
      <View style={styles.crewHeader}>
        <View style={[styles.inlineRow, styles.shrink]}>
          <AppText variant="body2SB" numberOfLines={1}>
            {date}
          </AppText>
          <AppText variant="body2SB">·</AppText>
          <View style={[styles.titleRow, styles.shrink]}>
            <AppText variant="body2SB" numberOfLines={1} style={styles.shrink}>
              {time}
            </AppText>
            {unread && <Icon name="new" />}
          </View>
        </View>
        <StatusBadge status={status} label={statusLabel} />
      </View>
      <View style={styles.inlineRow}>
        {shown.map((name, index) => (
          <View key={index} style={styles.inlineRow}>
            {index > 0 && (
              <AppText variant="body3M" color="gray700">
                ·
              </AppText>
            )}
            <AppText variant="body3M" color="gray700" numberOfLines={1}>
              {name}
            </AppText>
          </View>
        ))}
        {rest > 0 && (
          <AppText variant="body3M" color="gray700" numberOfLines={1}>
            외 {rest}명
          </AppText>
        )}
      </View>
    </Row>
  );
}

const shiftStyles = StyleSheet.create({
  on: { backgroundColor: Colors.gray200 },
  off: { backgroundColor: Colors.gray400 },
  empty: { backgroundColor: Colors.gray300 },
});

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.8,
  },
  stretch: {
    alignSelf: 'stretch',
  },
  shrink: {
    flexShrink: 1,
  },
  shift: {
    alignSelf: 'stretch',
    height: 74,
    alignItems: 'flex-start',
    gap: 2,
    padding: 16,
    borderRadius: 20,
  },
  profile: {
    alignSelf: 'stretch',
    height: 88,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: Colors.white,
  },
  profileText: {
    flex: 1,
    gap: 2,
  },
  request: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.white,
  },
  requestDone: {
    backgroundColor: Colors.gray200,
  },
  manager: {
    gap: 16,
  },
  crew: {
    gap: 8,
  },
  // new 점은 제목 오른쪽 위에 붙는다.
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  managerBody: {
    alignSelf: 'stretch',
    alignItems: 'flex-start',
    gap: 6,
  },
  managerWhen: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  crewHeader: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badge: {
    width: 56,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: Colors.gray200,
  },
  badgeDone: {
    width: 36,
    backgroundColor: Colors.gray400,
  },
  // 배지 텍스트만 행간이 1.5 배다.
  badgeLabel: {
    lineHeight: 18,
  },
});
