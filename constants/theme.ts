/** BoiMix brand colors (mirrors Tailwind config) */
export const Colors = {
  primary: "#E84C1E",
  primaryLight: "#F77A5C",
  primaryDark: "#C43A13",

  secondary: "#1A1A2E",
  secondaryLight: "#16213E",

  surface: "#FFFFFF",
  surfaceDark: "#F5F5F5",
  surfaceCard: "#FAFAFA",

  textPrimary: "#1A1A2E",
  textSecondary: "#6B7280",
  textMuted: "#9CA3AF",
  textInverse: "#FFFFFF",

  border: "#E5E7EB",
  borderLight: "#F3F4F6",

  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",

  // Availability mode colors
  sell: "#10B981",
  exchange: "#3B82F6",
  borrow: "#8B5CF6",
  library: "#F59E0B",
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
