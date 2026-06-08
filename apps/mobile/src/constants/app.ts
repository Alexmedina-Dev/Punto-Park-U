// ╔══════════════════════════════════════════════════════════════════════╗
// ║  App Constants — app-wide config, colors, spacing, payment config   ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── Color Palette ─────────────────────────────────────────────────────

export const COLORS = {
  // Brand
  primary: '#1a73e8',
  primaryLight: '#4a9af5',
  primaryDark: '#1557b0',

  // Status
  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fce4ec',
  info: '#3b82f6',
  infoLight: '#dbeafe',

  // Background
  bg: '#f0f2f5',
  surface: '#ffffff',
  surfaceElevated: 'rgba(255, 255, 255, 0.95)',
  modalOverlay: 'rgba(0, 0, 0, 0.5)',

  // Text
  text: '#1a1a2e',
  textSecondary: '#666666',
  textTertiary: '#999999',
  textInverse: '#ffffff',

  // Borders
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.04)',

  // Skeleton
  skeleton: '#e0e0e0',

  // Shadow
  shadow: '#000000',
} as const;

// ── Spacing ───────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ── Border Radius ─────────────────────────────────────────────────────

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
} as const;

// ── Typography ────────────────────────────────────────────────────────

export const FONT = {
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    xxxl: 36,
  },
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
} as const;

// ── ePayco Configuration ──────────────────────────────────────────────

export const EPAYCO = {
  // Callback URL scheme used by ePayco to return to the app
  callbackScheme: 'puntoparku',
  callbackHost: 'epayco',
  callbackPath: '/callback',

  // Timeout for WebView checkout (minutes)
  checkoutTimeoutMinutes: 15,

  // Supported payment methods displayed in checkout
  methods: [
    { id: 'credit_card', label: 'Tarjeta de crédito', icon: '💳' },
    { id: 'debit_card', label: 'Tarjeta débito', icon: '💳' },
    { id: 'pse', label: 'PSE', icon: '🏦' },
    { id: 'cash', label: 'Efectivo (Corresponsal)', icon: '🏪' },
  ] as const,

  // Status polling interval (ms)
  pollingInterval: 3000,

  // Max polling attempts before timeout
  maxPollingAttempts: 60,
} as const;

// ── Payment Status Display ────────────────────────────────────────────

export const PAYMENT_STATUS = {
  pending: { label: 'Pendiente', color: COLORS.warning, bg: COLORS.warningLight, icon: '⏳' },
  pending_epayco: { label: 'En proceso', color: COLORS.warning, bg: COLORS.warningLight, icon: '🔄' },
  completed: { label: 'Pagado', color: COLORS.success, bg: COLORS.successLight, icon: '✅' },
  failed: { label: 'Fallido', color: COLORS.error, bg: COLORS.errorLight, icon: '❌' },
  refunded: { label: 'Reembolsado', color: COLORS.info, bg: COLORS.infoLight, icon: '↩️' },
} as const;

export const PAYMENT_METHODS = {
  cash: { label: 'Efectivo', icon: '💵' },
  pos: { label: 'POS', icon: '💳' },
  epayco: { label: 'ePayco', icon: '🔄' },
} as const;

// ── API ───────────────────────────────────────────────────────────────

export const API = {
  timeout: 15000,
  retryMax: 3,
  retryBaseDelay: 1000,
} as const;

// ── Store Metadata ────────────────────────────────────────────────────

export const APP_METADATA = {
  name: 'Punto Park U',
  slogan: 'Estaciona sin preocupaciones',
  description:
    'Encuentra, reserva y paga tu estacionamiento de forma rápida y segura. ' +
    'Punto Park U te permite gestionar tus vehículos, realizar reservas en ' +
    'los principales estacionamientos y pagar fácilmente a través de ePayco.',
  keywords: [
    'estacionamiento',
    'parking',
    'parqueadero',
    'reservas',
    'vehículos',
    'ePayco',
    'pagos',
    'Punto Park U',
  ],
  supportEmail: 'soporte@puntoparku.com',
  supportPhone: '+573001234567',
  website: 'https://puntoparku.com',
  privacyPolicyUrl: 'https://puntoparku.com/privacidad',
  termsUrl: 'https://puntoparku.com/terminos',
} as const;

// ── Animation ─────────────────────────────────────────────────────────

export const ANIMATION = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  stagger: {
    fast: 50,
    normal: 80,
    slow: 120,
  },
} as const;

// ── Storage Keys ──────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  token: 'token',
  refreshToken: 'refreshToken',
  user: 'user',
  onboardingComplete: 'onboarding_complete',
  theme: 'theme',
} as const;
