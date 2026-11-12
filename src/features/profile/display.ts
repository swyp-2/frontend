import type { ProfileAvatarColor } from '@/components/ui/profile-avatar';
import type { Role } from '@/lib/api';

export const roleLabel: Record<Role, string> = {
  MANAGER: '매니저',
  CREW: '크루원',
};

/** 아바타 안 글자: 이름 뒤 두 글자 (김도연 → 도연) */
export function avatarLabel(name: string) {
  const chars = Array.from(name.trim());
  return chars.slice(-2).join('');
}

/**
 * 서버 개인 색상(12색 hex) → 아바타 4색.
 * TODO: 시안에는 아바타 색이 4가지뿐이고 12색과의 대응은 정해진 바가 없어 색 계열로 묶었다.
 */
const avatarColors: Record<string, ProfileAvatarColor> = {
  '#E5484D': 'red',
  '#F76B15': 'red',
  '#FFB224': 'red',
  '#D6409F': 'red',
  '#46A758': 'green',
  '#12A594': 'green',
  '#05A2C2': 'blue',
  '#0090FF': 'blue',
  '#3E63DD': 'blue',
  '#8E4EC6': 'purple',
  '#A18072': 'purple',
  '#687076': 'purple',
};

export function avatarColor(personalColor: string | null | undefined): ProfileAvatarColor {
  return avatarColors[personalColor?.toUpperCase() ?? ''] ?? 'blue';
}
