/**
 * BoiMix Brand Colors & Design System
 * Synchronized with BoiMix Web Frontend & Brand Guidelines
 */
export const Colors = {
  // Brand Primary: BoiMix Blue
  primary: "#0397D3",
  primaryLight: "#38BDF8",
  primaryDark: "#027DB0",
  primarySoft: "#E8F7FD",

  // Brand Secondary: BoiMix Navy
  secondary: "#0B2A5B",
  secondaryLight: "#1E3A8A",
  secondaryDark: "#081B3A",

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
  surfaceDark: "#F1F2F4",
  surfaceCard: "#FFFFFF",
  background: "#F1F2F4",

  // Text Hierarchy
  textPrimary: "#1F2933",
  textSecondary: "#666666",
  textMuted: "#9C9C9C",
  textInverse: "#FFFFFF",

  // Borders
  border: "#CDCDCD",
  borderLight: "#E5E5E5",

  // Status Colors
  success: "#33C24D",
  successSoft: "#EAF9ED",
  warning: "#FF9900",
  warningSoft: "#FFF4E0",
  error: "#DC2626",
  errorSoft: "#FEF2F2",
  info: "#0397D3",
  infoSoft: "#E8F7FD",

  // Book Availability Modes
  sell: "#33C24D",
  exchange: "#0397D3",
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
