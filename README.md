# Punto Park U 🅿️

![Punto Park U Logo](/public/images/Logo.png)

🚀 **Aplicación en vivo:** [https://punto-park-u.vercel.app](https://punto-park-u.vercel.app)

🔗 **API Backend:** [https://punto-park-u.onrender.com](https://punto-park-u.onrender.com)

📦 **Stack de Deploy:**
- **Frontend:** [Vercel](https://vercel.com) (React + Vite)
- **Backend:** [Render](https://render.com) (Node.js + Express)
- **Base de datos:** [MongoDB Atlas](https://www.mongodb.com/atlas) (Cloud MongoDB)

Aplicativo Web para la gestión de parqueadero. Creado para la visualización de información de los usuarios de "Punto Park U".

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS | Node.js + Express + MongoDB

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Variables de Entorno](#-variables-de-entorno)
- [Autenticación](#-autenticación)
  - [Registro e Inicio de Sesión](#registro-e-inicio-de-sesión)
  - [Autenticación con Google (OAuth 2.0)](#autenticación-con-google-oauth-20)
  - [Recuperación de Contraseña](#recuperación-de-contraseña)
  - [Verificación de Email](#verificación-de-email)
  - [Autenticación de Dos Factores (2FA)](#autenticación-de-dos-factores-2fa)
  - [Gestión de Sesiones](#gestión-de-sesiones)
  - [Control de Acceso por Roles (RBAC)](#control-de-acceso-por-roles-rbac)
- [API REST](#-api-rest)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Despliegue](#-despliegue)

---

## 🚀 Características

### Frontend
- Landing page con diseño glassmorphism/neumorphism + disponibilidad en tiempo real
- Panel de usuario: dashboard, vehículos, reservas, pagos, perfil, historial
- Panel de administración: mapa del parqueadero, reportes, tarifas, usuarios, Prophet AI
- Reservas con selección visual de espacio (SpotSelector) y código QR
- Diseño responsive (mobile-first) + PWA para modo offline
- Tooltip en mapa admin con info del vehículo (placa, marca, modelo, color)
- Notificaciones push web

### Backend
- API REST con Express.js + paginación
- Autenticación JWT (access + refresh tokens)
- **Google OAuth 2.0** — Inicio de sesión con Google
- **Recuperación de contraseña** — Tokens con expiración de 1 hora
- **Verificación de email** — Configurable (estricta o permisiva)
- **2FA TOTP** — Autenticación de dos factores con códigos de respaldo
- **Gestión de sesiones** — Listar, revocar, heartbeat de actividad
- **RBAC** — Roles: admin, operator, user, guest con jerarquía
- **WebSocket** — Actualizaciones en tiempo real de espacios y actividad
- **Prophet AI** — Análisis predictivo de ocupación (7 días)
- **Demo overlay** — Mapa siempre creíble con ocupación simulada
- **Auto-cleanup** — Usuarios inactivos 6+ meses eliminados automáticamente
- **Auto-cancel** — Reservas pending canceladas 15min después de la hora programada (si el usuario no llega, se libera el espacio)
- **Sin límite de reservas** — Un usuario puede crear múltiples reservas simultáneas
- Rate limiting en endpoints sensibles
- MongoDB con Mongoose

### Parking & Reservas
- 55 espacios: Zona A (20 carros), B (20 motos), C (10 bicis), D (5 camionetas)
- Tarifas por tipo de vehículo: Hora, Día, Mes
- Métodos de pago: Efectivo, Datáfono (POS), PSE (ePayco), Transferencia
- Placas según norma Colombia: Carros ABC123, Motos ABC12D, Bicis sin placa (serial 7 dígitos)
- Reportes exportables a Excel (5 hojas) y PDF

### Flux AI — Inteligencia Artificial
- **Visión Computacional** — Reconocimiento de placas colombianas, detección de marca/modelo/color
- **Asignación Inteligente** — Optimización de espacios según ocupación, tamaño del vehículo y duración
- **Analítica Predictiva** — Predicción de ocupación, detección de anomalías, anticipación de horas pico
- Latencia: < 1 segundo por captura

### Hardware (Plan Premium — Fase 7)
- Cámaras inteligentes con IA para verificación automática de placas (Python FastAPI + OpenCV + EasyOCR + YOLOv8)
- Pantallas LED 46" para mostrar disponibilidad en tiempo real
- Terminal de pago inteligente (datáfono, QR Nequi/Daviplata, efectivo)
- Sistema de audio IA para reconocimiento de voz
- Sensores de ocupación MQTT
- Barreras automáticas con control remoto

---

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| React | ^18.3 | UI Framework |
| TypeScript | ^5.6 | Tipado estático |
| Vite | ^5.4 | Build tool / Dev server |
| Tailwind CSS | ^3.4 | Estilos utilitarios |
| Zustand | ^4.5 | Estado global |
| React Router | ^6.28 | Enrutamiento |
| Axios | ^1.7 | HTTP client |
| Sonner | ^1.7 | Toast notifications |

### Backend
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | ^18+ | Runtime |
| Express | ^4.21 | Framework HTTP |
| MongoDB / Mongoose | ^8.9 | Base de datos / ODM |
| JSON Web Token | ^9.0 | Autenticación |
| bcryptjs | ^2.4 | Hashing de contraseñas |
| express-rate-limit | ^7.5 | Rate limiting |
| express-validator | ^7.2 | Validación de entrada |
| google-auth-library | ^10.7 | Google OAuth 2.0 |
| speakeasy | ^2.0 | TOTP (2FA) |
| qrcode | ^1.5 | Generación de QR |

---

## 🏗️ Arquitectura

```
punto-park-u/
├── src/                    # Frontend React
│   ├── components/         # Componentes reutilizables
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Páginas (rutas)
│   ├── routes/             # Configuración de rutas
│   ├── sections/           # Secciones de landing page
│   ├── services/           # API service layer
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript types
│   └── utils/              # Utilidades
├── backend/                # Backend Express
│   └── src/
│       ├── config/         # Configuración (env vars)
│       ├── controllers/    # Route handlers
│       ├── jobs/           # Tareas programadas (session cleanup)
│       ├── middleware/      # Middleware (auth, roles, rate limit)
│       ├── models/         # Mongoose models
│       ├── routes/         # Express routes
│       ├── utils/          # Utilidades (seeder)
│       └── scripts/        # Scripts de verificación
└── openspec/               # SDD artifacts
```

---

## 📋 Requisitos Previos

- **Node.js** >= 18.x
- **MongoDB** >= 6.x (local o Atlas)
- **NPM** >= 9.x

Para desarrollo local:

```bash
node --version   # v18+
npm --version    # v9+
```

---

## 🔧 Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd punto-park-u

# 2. Instalar dependencias del frontend
npm install

# 3. Instalar dependencias del backend
cd backend
npm install
cd ..

# 4. Configurar variables de entorno (ver sección siguiente)
# 5. Iniciar en desarrollo
npm run dev:all
```

El frontend se ejecuta en `http://localhost:5173` y el backend en `http://localhost:3000`.

---

## 🔐 Variables de Entorno

### Backend (`backend/.env`)

```env
# ── Servidor ──
PORT=3000
NODE_ENV=development

# ── MongoDB ──
MONGODB_URI=mongodb://127.0.0.1:27017/punto-park-u

# ── JWT ──
JWT_SECRET=your-jwt-secret-here
JWT_REFRESH_SECRET=your-jwt-refresh-secret-here

# ── CORS ──
CORS_ORIGIN=http://localhost:5173

# ── Google OAuth 2.0 (opcional) ──
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/oauth/google/callback

# ── Frontend URL ──
FRONTEND_URL=http://localhost:5173

# ── Verificación de Email ──
# true  → bloquea login hasta verificar email
# false → permite login sin verificar (default)
STRICT_EMAIL_VERIFICATION=false

# ── Gestión de Sesiones ──
SESSION_TIMEOUT=30           # minutos de inactividad antes de cerrar sesión
ACTIVITY_HEARTBEAT_INTERVAL=5 # minutos entre heartbeats
SESSION_CLEANUP_INTERVAL=60  # minutos entre limpiezas de sesiones expiradas
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Punto Park U
VITE_SESSION_TIMEOUT=30
VITE_ACTIVITY_HEARTBEAT_INTERVAL=5
```

---

## 🔑 Autenticación

El sistema de autenticación consta de 6 módulos integrados:

### Registro e Inicio de Sesión

- Registro con nombre, cédula, email, username y contraseña
- Login por username o email
- JWT con access token (15 min) y refresh token (7 días)
- Tokens almacenados en localStorage
- Refresh automático mediante interceptor de Axios

### Autenticación con Google (OAuth 2.0)

**Configuración:**

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto y habilita la API de Google OAuth 2.0
3. Configura la pantalla de consentimiento (tipo externo)
4. Crea credenciales OAuth 2.0 (tipo: aplicación web)
5. Añade `http://localhost:3000/api/oauth/google/callback` como URI de redirección
6. Copia Client ID y Client Secret a `backend/.env`

**Flujo:**
1. Usuario hace clic en "Iniciar sesión con Google"
2. Redirige a Google Consent Screen
3. Google redirige a `/api/oauth/google/callback`
4. Backend intercambia código por tokens de Google
5. Crea o vincula cuenta (por email coincidente)
6. Redirige al frontend con JWT

### Recuperación de Contraseña

**Flujo:**
1. Usuario solicita recuperación en `/forgot-password`
2. Backend genera token (32 bytes hex, 1 hora de expiración)
3. En desarrollo: token se muestra en consola del servidor (email simulado)
4. Usuario hace clic en el enlace `/reset-password?token=...`
5. Ingresa nueva contraseña (mín. 8 caracteres)
6. Token se invalida después de usar

**Seguridad:**
- Respuesta idéntica para emails existentes e inexistentes (anti-enumeración)
- Rate limit: 3 intentos por 15 minutos por IP
- Token hasheado con bcrypt en base de datos

### Verificación de Email

Configurable mediante `STRICT_EMAIL_VERIFICATION`:
- **false** (default): El usuario recibe tokens inmediatamente al registrarse
- **true**: El usuario debe verificar su email antes de poder iniciar sesión

**Flujo:**
1. Al registrarse, se genera token de verificación (32 bytes hex, 24h)
2. Token se muestra en consola del servidor (email simulado en desarrollo)
3. Usuario visita `/verify-email?token=...`
4. Endpoint: `GET /api/auth/verify/:token`

**Resend:** `POST /api/auth/verify/resend` — rate limit: 2 por hora

### Autenticación de Dos Factores (2FA)

Basado en TOTP (RFC 6238) con la librería `speakeasy`.

**Configuración desde el perfil de usuario:**

1. `POST /api/auth/2fa/setup` — genera secreto temporal y QR
2. Usuario escanea QR con Google Authenticator, Microsoft Authenticator, Authy, etc.
3. `POST /api/auth/2fa/verify-setup` — verifica código TOTP y activa 2FA
4. Se generan 8 códigos de respaldo (mostrados una sola vez)

**Inicio de sesión con 2FA:**
1. Login normal → detecta 2FA activo → devuelve `requires2FA: true` + `tempToken`
2. Usuario ingresa código TOTP de su app de autenticación
3. `POST /api/auth/2fa/verify` — verifica y devuelve JWT completo
4. Alternativa: usar código de respaldo via `/api/auth/2fa/verify-backup`

**Administración:**
- `DELETE /api/auth/2fa/disable` — deshabilitar (requiere contraseña)
- `POST /api/auth/2fa/backup-codes` — regenerar códigos de respaldo
- `GET /api/auth/2fa/status` — estado actual

### Gestión de Sesiones

Cada inicio de sesión crea un registro de sesión en MongoDB.

**Características:**
- Cada sesión almacena: IP, user agent, tipo de dispositivo, última actividad
- Heartbeat de actividad: se actualiza `lastActiveAt` en cada request autenticado
- Timeout de inactividad configurable (default: 30 min)
- Expiración absoluta: 7 días

**Endpoints:**
- `GET /api/sessions` — listar sesiones activas
- `DELETE /api/sessions/:id` — revocar sesión específica
- `DELETE /api/sessions` — revocar todas las demás sesiones
- `POST /api/sessions/activity` — heartbeat de actividad
- `GET /api/sessions/stats` — estadísticas (admin)

**Limpieza:** Job automático cada 60 minutos que elimina sesiones expiradas.

### Control de Acceso por Roles (RBAC)

**Jerarquía de roles:**

| Rol | Permisos | Herencia |
|-----|----------|----------|
| `admin` | Acceso total: usuarios, tarifas, reportes, todo CRUD | Hereda operator + user |
| `operator` | Operaciones de parqueadero: spots, entradas/salidas, reservas | Hereda user |
| `user` | Autoservicio: perfil, vehículos, reservas, historial | — |
| `guest` | Solo lectura: landing page, disponibilidad | — |

**Middleware disponible:**
- `requireAuth` — verifica JWT + sesión activa
- `requireRole('admin')` — mínimo admin
- `requireRoles(['admin', 'operator'])` — lista de roles aceptados
- `requireAdmin` — legacy, equivalente a `requireRole('admin')`

**Endpoints de administración de usuarios:**
- `GET /api/users` — listar (admin/operator)
- `GET /api/users/:id` — ver detalle (admin/operator/self)
- `PUT /api/users/:id/role` — cambiar rol (admin, no self-demotion)
- `PUT /api/users/:id` — actualizar perfil (admin/self)
- `DELETE /api/users/:id` — eliminar usuario (admin)
- `GET /api/users/stats` — estadísticas por rol (admin)

---

## 📡 API REST

### Auth (`/api/auth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/register` | No | Registrar nuevo usuario |
| POST | `/login` | No | Iniciar sesión |
| GET | `/me` | Sí | Perfil del usuario actual |
| POST | `/refresh` | No | Refrescar access token |
| POST | `/logout` | Sí | Cerrar sesión |
| POST | `/forgot-password` | No | Solicitar recuperación |
| POST | `/reset-password` | No | Restablecer contraseña |
| POST | `/verify/send` | No | Enviar verificación de email |
| GET | `/verify/:token` | No | Verificar email |
| POST | `/verify/resend` | No | Reenviar verificación |

### OAuth (`/api/oauth`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/google` | No | Iniciar OAuth con Google |
| GET | `/google/callback` | No | Callback de Google |

### 2FA (`/api/auth/2fa`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/status` | Sí | Estado de 2FA |
| POST | `/setup` | Sí | Iniciar configuración de 2FA |
| POST | `/verify-setup` | Sí | Verificar código y activar |
| POST | `/disable` | Sí | Deshabilitar 2FA |
| POST | `/backup-codes` | Sí | Regenerar códigos de respaldo |
| POST | `/verify` | TempToken | Verificar 2FA durante login |
| POST | `/verify-backup` | TempToken | Verificar código de respaldo |

### Sesiones (`/api/sessions`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Sí | Listar sesiones activas |
| POST | `/activity` | Sí | Heartbeat de actividad |
| DELETE | `/` | Sí | Revocar todas las demás sesiones |
| DELETE | `/:id` | Sí | Revocar sesión específica |
| GET | `/stats` | Admin | Estadísticas de sesiones |

### Usuarios (`/api/users`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/` | Admin/Op | Listar usuarios |
| GET | `/stats` | Admin | Estadísticas por rol |
| GET | `/:id` | Admin/Op/Self | Ver usuario |
| PUT | `/:id` | Admin/Self | Actualizar usuario |
| PUT | `/:id/role` | Admin | Cambiar rol |
| DELETE | `/:id` | Admin | Eliminar usuario |

### Health (`/api/health`)

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/health` | No | Health check del servidor |

---

## 📁 Estructura del Proyecto

### Frontend (`src/`)

```
src/
├── App.tsx                         # Componente raíz
├── main.tsx                        # Punto de entrada
├── index.css                       # Estilos globales Tailwind
├── components/
│   ├── layout/                     # Layout, Header, Footer, MobileNav
│   ├── ui/                         # UI primitives (Button, Input, Card, Badge, Modal)
│   ├── ProtectedRoute.tsx          # Route guard con roles
│   ├── ErrorBoundary.tsx           # Error boundary global
│   └── LoadingSpinner.tsx          # Spinner de carga
├── hooks/
│   ├── useAuth.ts                  # Hook de autenticación
│   └── useSessionActivity.ts       # Heartbeat de sesión
├── pages/                          # Páginas por ruta
├── routes/
│   └── AppRoutes.tsx               # Configuración de rutas
├── services/                       # API services (auth, admin, parking)
├── stores/                         # Zustand stores (auth, admin, app)
├── types/                          # Tipos TypeScript
└── utils/                          # Constantes, errorHandler, formatters
```

### Backend (`backend/src/`)

```
backend/src/
├── server.js                       # Punto de entrada
├── app.js                          # Configuración Express
├── config/
│   ├── index.js                    # Variables de entorno
│   └── database.js                 # Conexión MongoDB
├── controllers/
│   ├── authController.js           # Auth principal (register, login, etc.)
│   ├── oauthController.js          # Google OAuth
│   ├── twoFactorController.js      # 2FA TOTP
│   ├── sessionController.js        # Gestión de sesiones
│   ├── userController.js           # CRUD de usuarios (admin)
│   └── publicController.js         # Endpoints públicos
├── middleware/
│   ├── requireAuth.js              # Verificación JWT + sesión
│   ├── requireRole.js              # RBAC middleware
│   ├── requireAdmin.js             # Legacy admin middleware
│   └── errorHandler.js             # Error handler global
├── models/
│   ├── User.js                     # Usuario con todos los campos de auth
│   └── Session.js                  # Sesión con actividad y expiración
├── routes/
│   ├── index.js                    # Health check + rutas públicas
│   ├── auth.js                     # Rutas de auth
│   ├── oauth.js                    # Rutas OAuth
│   ├── twoFactor.js                # Rutas 2FA
│   ├── sessions.js                 # Rutas de sesiones
│   ├── users.js                    # Rutas de usuarios
│   └── public.js                   # Rutas públicas
├── jobs/
│   └── sessionCleanup.js           # Limpieza periódica de sesiones
└── scripts/
    └── verify-auth.bash            # Script de verificación de auth
```

---

## 🧪 Verificación

### Script de Verificación de Auth

```bash
# Asegúrate de que el backend esté corriendo
npm run dev:backend

# En otra terminal, ejecuta el script de verificación
bash backend/scripts/verify-auth.bash
```

Esto ejecuta tests automatizados para:
1. Health check
2. Registro de usuario
3. Verificación de email
4. Login
5. Recuperación de contraseña
6. Perfil de usuario
7. Refresh de token
8. 2FA (setup, disable)
9. Códigos de respaldo
10. Gestión de sesiones
11. RBAC (jerarquía de roles)
12. Gestión de usuarios
13. Logout

### Comandos de Desarrollo

```bash
# Iniciar frontend + backend simultáneamente
npm run dev:all

# Solo frontend
npm run dev:frontend

# Solo backend
npm run dev:backend

# TypeScript type check
npm run typecheck

# Build de producción
npm run build
```

---

## 🚢 Despliegue

**Prerrequisitos:**
- MongoDB Atlas (o cualquier instancia MongoDB)
- Variables de entorno configuradas para producción
- (Opcional) Google OAuth Client ID/Secret configurado

**Pasos:**

```bash
# 1. Build frontend
npm run build

# 2. Iniciar backend en producción
cd backend
NODE_ENV=production npm start
```

Para despliegue en Vercel + Railway / Render, consultar la documentación específica de cada plataforma.

---

## 🎭 Datos de Demo

El mapa del parqueadero administra dos capas de datos:

1. **Reservas reales** — usuarios que reservaron espacio para una fecha/hora específica
2. **Demo overlay** — espacios simulados como ocupados/reservados para que el mapa siempre se vea activo

El overlay se aplica **solo** en el mapa de admin y la landing page. Al seleccionar un espacio para reservar, solo se muestran reservas reales.

| Zona | Tipo | Total | Libre | Ocupado | Reservado |
|------|------|-------|-------|---------|-----------|
| A | Carros | 20 | 7 | 9 | 4 |
| B | Motos | 20 | 9 | 7 | 4 |
| C | Bicicletas | 10 | 3 | 5 | 2 |
| D | Camionetas | 5 | 3 | 1 | 1 |

---

## 🔐 Nota sobre Google OAuth

Al usar Google OAuth en modo **Testing** (entorno de prueba), Google muestra el dominio real del backend (`onrender.com`) en la pantalla de consentimiento como medida anti-phishing. Esto es comportamiento esperado del protocolo OAuth 2.0 para aplicaciones no verificadas comercialmente. Para mostrar el nombre de la app ("Punto Park U") se requiere: dominio propio, verificación en Google Search Console y auditoría de Google.

---

## 📄 Licencia

MIT — Proyecto educativo SENA.

**Autores:** Alexander Medina & Miguel Palacio

---

## 📋 Propuesta Original — CCS S.A.S.

Basado en: Propuesta Técnica y Económica GA2-220501094-AA3-EV02  
**Empresa:** Soluciones de Software S.A.S. | **Ficha SENA:** 3118301  
**Inversión Plan Premium:** $77.390.000 COP iniciales + $16.444.000 COP anuales

### Estado de Implementación

| Módulo | Estado | Detalle |
|--------|--------|---------|
| Auth (JWT, OAuth, 2FA, RBAC) | ✅ Completo | 6 módulos integrados |
| Panel Admin (dashboard, reportes, tarifas) | ✅ Completo | Excel + PDF export |
| Panel Usuario (reservas, vehículos, pagos) | ✅ Completo | QR, selección visual de espacio |
| WebSocket tiempo real | ✅ Completo | Spots, actividad, alertas |
| Demo overlay (mapa siempre activo) | ✅ Completo | Determinístico por zona |
| PWA + Responsive | ✅ Completo | Offline fallback, mobile-first |
| Flux AI — Analítica Predictiva | 🔲 Pendiente | Reemplazar mocks con datos reales |
| Flux AI — Detección de Anomalías | 🔲 Pendiente | Z-score, alertas automáticas |
| Flux AI — Asignación Inteligente | 🔲 Pendiente | Pricing dinámico, sugerencia de espacio |
| OCR de placas (Python + OpenCV) | 🔲 Pendiente | Fase 7 — hardware requiere cámaras físicas |
| SMS/Twilio | 🔲 Pendiente | Notificaciones de ingreso, pago, proximidad |
| Pago multi-modal (Nequi, Daviplata) | 🔲 Pendiente | QR + datáfono + efectivo |
| Hardware físico (cámaras, LED, barreras) | 🔲 Pendiente | Fase 7 — $25M COP estimados |
