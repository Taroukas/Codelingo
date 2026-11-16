import { Platform } from 'react-native';

/**
 * Linear / Vercel / GitHub Pro dark developer palette.
 *
 * Rules encoded here:
 * - Depth is a 1px hairline border + surface elevation, never a 3D lip.
 * - Accent is reserved for primary actions and active selections.
 * - Success / danger are semantic only (correct / wrong answers).
 */
export const Colors = {
  /* ---- Core surfaces -------------------------------------------------- */
  canvas: '#0A0A0C',
  surface: '#0E0E12',
  surfaceRaised: '#121216',
  control: '#18181B',
  controlActive: '#27272A',
  terminal: '#08080A',

  /* ---- Structure ------------------------------------------------------ */
  hairline: 'rgba(255, 255, 255, 0.08)',
  hairlineStrong: 'rgba(255, 255, 255, 0.14)',
  hairlineSoft: 'rgba(255, 255, 255, 0.06)',

  /* ---- Semantics ------------------------------------------------------ */
  accent: '#6E56CF',
  accentHover: '#7C6AE0',
  success: '#3FB950',
  danger: '#F85149',

  /* ---- Typography ----------------------------------------------------- */
  textPrimary: '#FAFAFA',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',

  /* ---- Legacy aliases (re-pointed, kept so older screens inherit) ------ */
  bg: '#0A0A0C',
  card: '#0E0E12',
  cardLip: '#0A0A0C',
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(255, 255, 255, 0.14)',
  ideBg: '#08080A',

  violet: '#6E56CF',
  violetLip: '#4B3AA0',
  violetBorder: 'rgba(255, 255, 255, 0.14)',
  violetTint: 'rgba(110, 86, 207, 0.16)',

  completedFace: '#1C1C21',
  completedLip: '#111114',
  completedBorder: 'rgba(255, 255, 255, 0.10)',
  completedIcon: '#A1A1AA',

  milestoneFace: '#232329',
  milestoneLip: '#141417',
  milestoneBorder: 'rgba(255, 255, 255, 0.14)',
  milestoneIcon: '#FAFAFA',

  lockedFace: '#18181B',
  lockedLip: '#0E0E12',
  lockedBorder: 'rgba(255, 255, 255, 0.06)',
  lockedIcon: '#52525B',

  bannerBg: '#0E0E12',
  bannerBorder: 'rgba(255, 255, 255, 0.08)',
  bannerLip: '#0A0A0C',
  bannerDivider: 'rgba(255, 255, 255, 0.08)',
  bannerTag: '#71717A',

  lavenderLight: '#FAFAFA',
  lavender: '#E4E4E7',
  lavenderSoft: '#D4D4D8',
  violetLight: '#C4B5FD',
  violetMid: '#A78BFA',
  violetDark: '#2E1065',
  violetDeep: '#1E0942',

  green: '#3FB950',
  greenLip: '#238636',
  greenBannerBg: 'rgba(63, 185, 80, 0.10)',
  greenBannerBorder: 'rgba(63, 185, 80, 0.35)',

  red: '#F85149',
  redLip: '#B62324',
  redBannerBg: 'rgba(248, 81, 73, 0.10)',
  redBannerBorder: 'rgba(248, 81, 73, 0.35)',

  flame: '#A1A1AA',
  flameLip: '#71717A',
  gems: '#A1A1AA',
  hearts: '#A1A1AA',

  gold: '#E3B341',
  goldLip: '#9E6A03',
  sky: '#6E56CF',
  skyLip: '#4B3AA0',
  skyTint: 'rgba(110, 86, 207, 0.14)',
  emerald: '#3FB950',
  emeraldLip: '#238636',
  emeraldTint: 'rgba(63, 185, 80, 0.14)',
  silver: '#71717A',
  silverLip: '#3F3F46',
  bronze: '#A16207',
  bronzeLip: '#713F12',
  purpleTab: '#6E56CF',

  white: '#FAFAFA',
  whiteLip: '#A1A1AA',

  text: '#FAFAFA',
  textDisabled: '#71717A',
} as const;

/**
 * Bricolage Grotesque — the app-wide UI typeface.
 * Registered once in `src/app/_layout.tsx` with weights 400 / 500 / 600 / 700 / 800,
 * so `fontWeight` resolves to the real cut on iOS, Android and web.
 */
export const UI_FONT = 'BricolageGrotesque';

/** Monospace font strictly for code, terminals, stats and badges. */
export const MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';
