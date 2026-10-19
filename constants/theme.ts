/**
 * Colour tokens. Screens never hard-code colours: they read the active palette from
 * ThemeContext (useTheme / useThemedStyles), so light and dark modes stay in sync.
 * Waselni palette: navy blue (#1e3a5f) and orange (#f97316), as on the website.
 */
export const LIGHT_COLORS = {
  primary: '#1E3A5F',
  primaryDark: '#152B47',
  primaryContainer: '#D6E4F5',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#0D2340',

  /** Brand navy for filled surfaces with white text (same hue in both modes). */
  brand: '#1E3A5F',
  accent: '#F97316',
  accentContainer: '#FFE3CC',
  onAccent: '#FFFFFF',
  onAccentContainer: '#5A2400',

  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF1F7',
  chip: '#E4EAF2',

  text: '#141B24',
  textSecondary: '#536072',
  textLight: '#FFFFFF',

  success: '#15803D',
  successContainer: '#D7F5DF',
  onSuccessContainer: '#0B3D1D',
  warning: '#B45309',
  warningContainer: '#FEF0C7',
  onWarningContainer: '#4A2500',
  error: '#B3261E',
  errorContainer: '#F9DEDC',
  onErrorContainer: '#410E0B',

  star: '#F5A524',
  bubbleMine: '#1E3A5F',
  onBubbleMine: '#FFFFFF',
  bubbleOther: '#FFFFFF',

  border: '#DDE3EC',
  divider: '#C7D0DC',
};

export type Palette = typeof LIGHT_COLORS;

export const DARK_COLORS: Palette = {
  primary: '#9CC3F0',
  primaryDark: '#7EAEE6',
  primaryContainer: '#1F3A5E',
  onPrimary: '#0A2442',
  onPrimaryContainer: '#D6E4F5',

  brand: '#2D5A8C',
  accent: '#FF9A52',
  accentContainer: '#6B3108',
  onAccent: '#2E1300',
  onAccentContainer: '#FFE3CC',

  background: '#0F141B',
  surface: '#171E27',
  surfaceAlt: '#212A35',
  chip: '#27313D',

  text: '#E5EAF1',
  textSecondary: '#A7B3C2',
  textLight: '#FFFFFF',

  success: '#6FD08C',
  successContainer: '#123D22',
  onSuccessContainer: '#D7F5DF',
  warning: '#F7B955',
  warningContainer: '#4A3108',
  onWarningContainer: '#FEF0C7',
  error: '#F2B8B5',
  errorContainer: '#601410',
  onErrorContainer: '#F9DEDC',

  star: '#F5B941',
  bubbleMine: '#2D5A8C',
  onBubbleMine: '#FFFFFF',
  bubbleOther: '#212A35',

  border: '#26303C',
  divider: '#36424F',
};

export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const BORDER_RADIUS = { sm: 6, md: 10, lg: 16, xl: 22, round: 999 };
export const FONT = { xs: 11, sm: 13, md: 15, lg: 17, xl: 20, xxl: 24 };
