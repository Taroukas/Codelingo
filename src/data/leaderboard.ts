import { Colors } from '@/theme';

export interface RivalCoder {
  id: string;
  name: string;
  initials: string;
  xp: number;
  avatarBg: string;
  avatarLip: string;
  langBadge: string;
  isUser?: boolean;
}

/** 11 rival coders + the current user = 12 coders in the Amethyst League. */
export const RIVAL_CODERS: RivalCoder[] = [
  {
    id: 'r1',
    name: 'Elena Rostova',
    initials: 'ER',
    xp: 1240,
    avatarBg: Colors.violet,
    avatarLip: Colors.violetLip,
    langBadge: 'C++',
  },
  {
    id: 'r2',
    name: 'Marcus Chen',
    initials: 'MC',
    xp: 1120,
    avatarBg: Colors.sky,
    avatarLip: Colors.skyLip,
    langBadge: 'PY',
  },
  {
    id: 'r3',
    name: 'Sora Takahashi',
    initials: 'ST',
    xp: 1015,
    avatarBg: Colors.emerald,
    avatarLip: Colors.emeraldLip,
    langBadge: 'GO',
  },
  {
    id: 'r4',
    name: 'Liam O’Connor',
    initials: 'LO',
    xp: 940,
    avatarBg: Colors.flame,
    avatarLip: Colors.flameLip,
    langBadge: 'JS',
  },
  {
    id: 'r5',
    name: 'Priya Patel',
    initials: 'PP',
    xp: 890,
    avatarBg: Colors.violet,
    avatarLip: Colors.violetLip,
    langBadge: 'PY',
  },
  {
    id: 'r6',
    name: 'Noah Lindqvist',
    initials: 'NL',
    xp: 820,
    avatarBg: Colors.sky,
    avatarLip: Colors.skyLip,
    langBadge: 'GO',
  },
  {
    id: 'r7',
    name: 'Amara Okafor',
    initials: 'AO',
    xp: 760,
    avatarBg: Colors.emerald,
    avatarLip: Colors.emeraldLip,
    langBadge: 'JS',
  },
  {
    id: 'r8',
    name: 'Lucas Silva',
    initials: 'LS',
    xp: 695,
    avatarBg: Colors.flame,
    avatarLip: Colors.flameLip,
    langBadge: 'C++',
  },
  {
    id: 'r9',
    name: 'Hannah Kim',
    initials: 'HK',
    xp: 630,
    avatarBg: Colors.violet,
    avatarLip: Colors.violetLip,
    langBadge: 'PY',
  },
  {
    id: 'r10',
    name: 'Mateo Morales',
    initials: 'MM',
    xp: 540,
    avatarBg: Colors.sky,
    avatarLip: Colors.skyLip,
    langBadge: 'JS',
  },
  {
    id: 'r11',
    name: 'Chloe Dubois',
    initials: 'CD',
    xp: 485,
    avatarBg: Colors.emerald,
    avatarLip: Colors.emeraldLip,
    langBadge: 'GO',
  },
];
