// Obsidian Sovereign design tokens — hex values for React Native / NativeWind
export const theme = {
  bg: '#080808',
  surface: '#111111',
  elevated: '#1A1A1A',
  surfaceGlass: 'rgba(10,10,10,0.85)',

  // Brand palette
  midasGold: '#D4AF37',
  savageGold: '#C9A227',
  neonGreen: '#39FF14',
  emerald: '#0B6B4F',
  emeraldLight: '#0F8C68',
  accentPurple: '#9D4EDD',
  highlightRed: '#E63946',
  sapphire: '#0A4D7A',
  royalPurple: '#7851A9',
  peridot: '#B4C424',

  // Text
  textPrimary: '#ECEDEE',
  textSecondary: '#9BA1A6',
  textMuted: '#687076',

  // Borders
  border: '#1E2022',
  borderSubtle: '#1F1F1F',
  borderGold: 'rgba(212,175,55,0.2)',

  // DeeplyUs mode
  deeplyBg: '#3A2028',
  deeplySurface: '#2A2038',
  deeplyAccent: '#8B0000',
  deeplyText: '#F7D6D9',
  deeplyBorder: '#5C3040',

  // Rank tier colors
  rankSpark: '#D4AF37',
  rankFlame: '#FF6B00',
  rankCalibrator: '#0B6B4F',
  rankInferno: '#E63946',
  rankSovereign: '#9D4EDD',

  // XP neon
  xpNeon: '#39FF14',
} as const;

export type ThemeKey = keyof typeof theme;
