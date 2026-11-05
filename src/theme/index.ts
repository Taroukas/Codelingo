import { Platform } from 'react-native';

/**
 * Duolingo Dark Mode color palette with Electric Violet (#8B5CF6) brand primary.
 * Exact 3D base shadow colors for isometric pucks, banners, chests, and tactile buttons.
 */
export const Colors = {
  // Core surfaces
  bg: '#131F24',
  card: '#202F36',
  ideBg: '#0D1518',
  border: '#37464F',
  cardLip: '#141F23',

  // Unit 1: Primary Brand (Electric Violet)
  violet: '#8B5CF6',
  violetLip: '#5B21B6',
  violetBannerLip: '#6D28D9',
  violetTint: 'rgba(139, 92, 246, 0.16)',

  // Unit 2: Sky Blue
  sky: '#1CB0F6',
  skyLip: '#1899D6',
  skyTint: 'rgba(28, 176, 246, 0.15)',

  // Unit 3: Duolingo Emerald Green
  emerald: '#58CC02',
  emeraldLip: '#46A302',
  emeraldTint: 'rgba(88, 204, 2, 0.16)',

  // Validation / Correct
  green: '#58CC02',
  greenLip: '#46A302',
  greenBannerBg: '#14281D',
  greenBannerBorder: '#285238',

  // Error / Wrong
  red: '#FF4B4B',
  redLip: '#C81E1E',
  redBannerBg: '#2D161B',
  redBannerBorder: '#5C2831',

  // Gamification accents
  flame: '#FF9600',
  flameLip: '#C26D00',
  gems: '#1CB0F6',
  hearts: '#FF4B4B',
  gold: '#FFC800',
  goldLip: '#CE9E00',
  silver: '#E5E7EB',
  silverLip: '#9CA3AF',
  bronze: '#D97706',
  bronzeLip: '#92400E',
  purpleTab: '#CE82FF',

  // Neutral white button / tooltip
  white: '#FFFFFF',
  whiteLip: '#D4D4D8',

  // Typography colors
  text: '#FFFFFF',
  textSecondary: '#AFAFAF',
  textDisabled: '#52656D',
} as const;

/** System font for UI headings, buttons, banners, and labels. */
export const UI_FONT = Platform.select({
  ios: 'System',
  default: 'sans-serif',
});

/** Monospace font strictly for code snippet boxes and syntax tokens. */
export const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
