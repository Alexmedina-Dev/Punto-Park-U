// ╔══════════════════════════════════════════════════════════════════════╗
// ║  Auth Constants — colors, validation, and config for auth screens    ║
// ╚══════════════════════════════════════════════════════════════════════╝

// ── Color Palette (matches tailwind.config.js dark theme) ─────────────

export const COLORS = {
  bg: '#10131a',
  surface: '#10131a',
  surfaceLow: '#191b23',
  surfaceContainer: '#1d1f27',
  surfaceHigh: '#272a32',
  surfaceHighest: '#32353d',
  surfaceVariant: '#32353d',

  primary: '#a7c8ff',
  primaryFixed: '#d5e3ff',
  primaryFixedDim: '#a7c8ff',
  primaryContainer: '#0074d9',
  onPrimary: '#003060',
  onPrimaryContainer: '#fdfbff',

  secondary: '#afc8f0',
  secondaryContainer: '#2f486a',

  onBg: '#e1e2ec',
  onSurface: '#e1e2ec',
  onSurfaceVar: '#c1c6d5',

  outline: '#8b919e',
  outlineVar: '#414753',

  error: '#ef4444',
  errorContainer: '#7f1d1d',
  onError: '#ffffff',

  success: '#22c55e',

  googleBg: '#ffffff',
  googleText: '#1f1f1f',
} as const;

// ── Spacing ────────────────────────────────────────────────────────────

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ── Border Radius ──────────────────────────────────────────────────────

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 24,
  full: 9999,
} as const;

// ── Typography ─────────────────────────────────────────────────────────

export const FONT = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 28,
    xxl: 36,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },
} as const;

// ── Validation Patterns ────────────────────────────────────────────────

export const VALIDATION = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Cedula: 6–10 digits (Venezuelan cédula format)
  cedula: /^\d{6,10}$/,
  // Username: 3–30 alphanumeric + underscore, no spaces
  username: /^[a-zA-Z0-9_]{3,30}$/,
  // Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 number
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  // Basic 6-digit TOTP code
  totp: /^\d{6}$/,
} as const;

// ── Validation Error Messages ──────────────────────────────────────────

export const ERROR_MESSAGES = {
  required: (field: string) => `${field} es requerido`,
  email: 'Correo electrónico inválido',
  cedula: 'Cédula inválida (6-10 dígitos)',
  username: 'Usuario debe tener 3-30 caracteres alfanuméricos',
  password:
    'Mínimo 8 caracteres, 1 mayúscula, 1 minúscula y 1 número',
  passwordMatch: 'Las contraseñas no coinciden',
  terms: 'Debes aceptar los términos y condiciones',
  totp: 'Código inválido - debe tener 6 dígitos',
} as const;

// ── OAuth Configuration ────────────────────────────────────────────────

export const OAUTH = {
  google: {
    // This URL should point to the backend's Google OAuth endpoint
    // The backend will redirect to Google and then back to the app via deep link
    authUrl: '/auth/google',
    icon: 'google' as const,
  },
} as const;

// ─── Auth Screen Labels ────────────────────────────────────────────────

export const LABELS = {
  login: {
    title: 'Punto Park U',
    subtitle: 'Iniciar Sesión',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'correo@ejemplo.com',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Ingresa tu contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    loginButton: 'Iniciar Sesión',
    oauthButton: 'Continuar con Google',
    noAccount: '¿No tienes cuenta?',
    registerLink: 'Crear cuenta',
  },
  register: {
    title: 'Crear Cuenta',
    subtitle: 'Regístrate en Punto Park U',
    nombresLabel: 'Nombres',
    nombresPlaceholder: 'Tus nombres',
    apellidosLabel: 'Apellidos',
    apellidosPlaceholder: 'Tus apellidos',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'correo@ejemplo.com',
    cedulaLabel: 'Cédula',
    cedulaPlaceholder: '12345678',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'usuario123',
    passwordLabel: 'Contraseña',
    passwordPlaceholder: 'Crea una contraseña segura',
    confirmPasswordLabel: 'Confirmar contraseña',
    confirmPasswordPlaceholder: 'Repite la contraseña',
    termsText: 'Acepto los términos y condiciones',
    registerButton: 'Registrarse',
    hasAccount: '¿Ya tienes cuenta?',
    loginLink: 'Iniciar sesión',
  },
  twoFactor: {
    title: 'Verificación en dos pasos',
    subtitle: 'Ingresa el código de verificación',
    codeLabel: 'Código de verificación',
    codePlaceholder: '000000',
    verifyButton: 'Verificar',
    backupCodeLink: 'Usar código de respaldo',
  },
  oauthCallback: {
    title: 'Completando inicio de sesión...',
    loadingText: 'Procesando autenticación...',
    errorText: 'Error al iniciar sesión con Google',
    retryButton: 'Intentar de nuevo',
  },
  forgotPassword: {
    title: 'Recuperar Contraseña',
    subtitle: 'Te enviaremos un enlace para restablecer tu contraseña',
    emailLabel: 'Correo electrónico',
    emailPlaceholder: 'correo@ejemplo.com',
    sendButton: 'Enviar enlace',
    successMessage: 'Si existe una cuenta con ese correo, recibirás un enlace de recuperación.',
    backToLogin: 'Volver a inicio de sesión',
  },
} as const;
