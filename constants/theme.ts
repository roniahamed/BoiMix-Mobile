/**
 * BoiMix Brand Colors & Design System
 * Synchronized with BoiMix Web Frontend & Brand Guidelines
 */
export const Colors = {
  // Brand Primary: BoiMix Blue
  primary: "#006B32",
  primaryLight: "#46A66A",
  primaryDark: "#005126",
  primarySoft: "#E1F1DF",

  // Brand Secondary: BoiMix Navy
  secondary: "#103B24",
  secondaryLight: "#27573A",
  secondaryDark: "#092A18",

  // Brand Accent: BoiMix Orange
  accent: "#FF9900",
  accentLight: "#FFB84D",
  accentDark: "#D98200",
  accentSoft: "#FFF4E0",

  // Brand Pink & Green
  brandPink: "#E91E63",
  brandGreen: "#33C24D",

  // Surfaces & Backgrounds
  surface: "#FFFFFF",
  surfaceDark: "#F8F6F0",
  surfaceCard: "#FFFFFF",
  background: "#F8F6F0",

  // Text Hierarchy
  textPrimary: "#17271D",
  textSecondary: "#59645C",
  textMuted: "#89928B",
  textInverse: "#FFFFFF",

  // Borders
  border: "#DEDCD3",
  borderLight: "#EAE8E0",

  // Status Colors
  success: "#33C24D",
  successSoft: "#EAF9ED",
  warning: "#FF9900",
  warningSoft: "#FFF4E0",
  error: "#DC2626",
  errorSoft: "#FEF2F2",
  info: "#006B32",
  infoSoft: "#E1F1DF",

  // Book Availability Modes
  sell: "#33C24D",
  exchange: "#006B32",
  borrow: "#8B5CF6",
  library: "#FF9900",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
} as const;
