const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat,
  HeadingLevel, BorderStyle, WidthType, ShadingType,
  PageNumber, PageBreak, TableOfContents
} = require('docx');

// ── Colores ──
const PRIMARY = '1B5E7B';
const LIGHT_BG = 'E8F4F8';
const WHITE = 'FFFFFF';
const BLACK = '000000';
const GRAY = '666666';
const BORDER_COLOR = 'CCCCCC';

// ── Helpers ──
const border = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

function headerCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: PRIMARY, type: ShadingType.CLEAR },
    margins: cellMargins,
    verticalAlign: 'center',
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, color: WHITE, font: 'Arial', size: 20 })] })],
  });
}

function dataCell(text, width) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    margins: cellMargins,
    children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20 })] })],
  });
}

function altRow(idx) {
  return { fill: idx % 2 === 0 ? WHITE : LIGHT_BG, type: ShadingType.CLEAR };
}

// ── Build ──
const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 22 } } },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: PRIMARY },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: '333333' },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 },
      },
    ],
  },
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets2',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets3',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets4',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'bullets5',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers1',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.', alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  sections: [
    // ── COVER PAGE ──
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 4000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'PUNTO PARK U', font: 'Arial', size: 56, bold: true, color: PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
          children: [new TextRun({ text: 'Aplicativo Web para Gestión de Parqueadero', font: 'Arial', size: 28, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: 'Documentación Técnica', font: 'Arial', size: 24, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY, space: 1 } },
          children: [],
        }),
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Autores:', font: 'Arial', size: 22, bold: true, color: PRIMARY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Alexander Medina & Miguel Palacio', font: 'Arial', size: 22 })],
        }),
        new Paragraph({ spacing: { before: 400 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Stack: React 18 + TypeScript + Vite + Tailwind CSS | Node.js + Express + MongoDB', font: 'Arial', size: 20, color: GRAY })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Proyecto Educativo SENA', font: 'Arial', size: 20, color: GRAY })],
        }),
      ],
    },

    // ── MAIN CONTENT ──
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'Punto Park U - Documentación Técnica', font: 'Arial', size: 16, color: GRAY, italics: true })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'Pagina ', font: 'Arial', size: 16, color: GRAY }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 16, color: GRAY }),
            ],
          })],
        }),
      },
      children: [
        // ── TOC ──
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun('Tabla de Contenidos')],
        }),
        new TableOfContents('Tabla de Contenidos', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),

        // ══════════════════════════════════════════════════════════════
        // 1. CARACTERISTICAS
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('1. Caracteristicas')] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Frontend')] }),
        ...[
          'Landing page con diseno glassmorphism/neumorphism',
          'Panel de usuario con dashboard, vehiculos, reservas, perfil',
          'Panel de administracion con reportes, tarifas, usuarios',
          'Diseno responsive (mobile-first)',
          'Modo oscuro',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Backend')] }),
        ...[
          'API REST con Express.js',
          'Autenticacion JWT (access + refresh tokens)',
          'Google OAuth 2.0 - Inicio de sesion con Google',
          'Recuperacion de contrasena - Tokens con expiracion de 1 hora',
          'Verificacion de email - Configurable (estricta o permisiva)',
          '2FA TOTP - Autenticacion de dos factores con codigos de respaldo',
          'Gestion de sesiones - Listar, revocar, heartbeat de actividad',
          'RBAC - Roles: admin, operator, user, guest con jerarquia',
          'Rate limiting en endpoints sensibles',
          'MongoDB con Mongoose',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets2', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        // ══════════════════════════════════════════════════════════════
        // 2. STACK TECNOLOGICO
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('2. Stack Tecnologico')] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Frontend')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 1560, 4680],
          rows: [
            new TableRow({ children: [headerCell('Tecnologia', 3120), headerCell('Version', 1560), headerCell('Proposito', 4680)] }),
            ...([
              ['React', '^18.3', 'UI Framework'],
              ['TypeScript', '^5.6', 'Tipado estatico'],
              ['Vite', '^5.4', 'Build tool / Dev server'],
              ['Tailwind CSS', '^3.4', 'Estilos utilitarios'],
              ['Zustand', '^4.5', 'Estado global'],
              ['React Router', '^6.28', 'Enrutamiento'],
              ['Axios', '^1.7', 'HTTP client'],
              ['Sonner', '^1.7', 'Toast notifications'],
            ].map(([tech, ver, purpose], i) =>
              new TableRow({
                children: [dataCell(tech, 3120), dataCell(ver, 1560), dataCell(purpose, 4680)],
                tableHeader: false,
              })
            )),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun('Backend')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3120, 1560, 4680],
          rows: [
            new TableRow({ children: [headerCell('Tecnologia', 3120), headerCell('Version', 1560), headerCell('Proposito', 4680)] }),
            ...([
              ['Node.js', '^18+', 'Runtime'],
              ['Express', '^4.21', 'Framework HTTP'],
              ['MongoDB / Mongoose', '^8.9', 'Base de datos / ODM'],
              ['JSON Web Token', '^9.0', 'Autenticacion'],
              ['bcryptjs', '^2.4', 'Hashing de contrasenas'],
              ['express-rate-limit', '^7.5', 'Rate limiting'],
              ['express-validator', '^7.2', 'Validacion de entrada'],
              ['google-auth-library', '^10.7', 'Google OAuth 2.0'],
              ['speakeasy', '^2.0', 'TOTP (2FA)'],
              ['qrcode', '^1.5', 'Generacion de QR'],
            ].map(([tech, ver, purpose], i) =>
              new TableRow({
                children: [dataCell(tech, 3120), dataCell(ver, 1560), dataCell(purpose, 4680)],
                tableHeader: false,
              })
            )),
          ],
        }),

        // ══════════════════════════════════════════════════════════════
        // 3. ARQUITECTURA
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('3. Arquitectura')] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'El proyecto sigue una arquitectura de monorepo con dos paquetes principales:', size: 22 })],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Frontend (src/)')] }),
        ...[
          'components/ - Componentes reutilizables (UI, layout)',
          'hooks/ - Custom hooks (useAuth, useSessionActivity)',
          'pages/ - Paginas por ruta',
          'routes/ - Configuracion de rutas (AppRoutes.tsx)',
          'sections/ - Secciones de landing page',
          'services/ - API service layer',
          'stores/ - Zustand stores (auth, vehicle, reservation)',
          'types/ - TypeScript types',
          'utils/ - Constantes, errorHandler, formatters',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets3', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Backend (backend/src/)')] }),
        ...[
          'config/ - Variables de entorno y conexion a BD',
          'controllers/ - Route handlers (auth, vehicle, reservation, admin)',
          'middleware/ - Middleware (requireAuth, requireRole, errorHandler)',
          'models/ - Mongoose models (User, Vehicle, Reservation, Session)',
          'routes/ - Express routes',
          'services/ - Services (socket, analytics, camera)',
          'jobs/ - Tareas programadas (session cleanup)',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets4', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        // ══════════════════════════════════════════════════════════════
        // 4. INSTALACION
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('4. Instalacion')] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Requisitos Previos')] }),
        ...[
          'Node.js >= 18.x',
          'MongoDB >= 6.x (local o Atlas)',
          'NPM >= 9.x',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets5', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Pasos de Instalacion')] }),
        ...[
          'Clonar el repositorio: git clone <repo-url>',
          'Instalar dependencias del frontend: npm install',
          'Instalar dependencias del backend: cd backend && npm install',
          'Configurar variables de entorno (ver seccion 5)',
          'Iniciar en desarrollo: npm run dev:all',
        ].map((t, i) => new Paragraph({ numbering: { reference: 'numbers1', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: 'El frontend se ejecuta en http://localhost:5173 y el backend en http://localhost:3000.', size: 22, italics: true })],
        }),

        // ══════════════════════════════════════════════════════════════
        // 5. VARIABLES DE ENTORNO
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('5. Variables de Entorno')] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Backend (backend/.env)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [headerCell('Variable', 3500), headerCell('Descripcion / Valor Default', 5860)] }),
            ...([
              ['PORT', '3000'],
              ['NODE_ENV', 'development'],
              ['MONGODB_URI', 'mongodb://127.0.0.1:27017/punto-park-u'],
              ['JWT_SECRET', 'your-jwt-secret-here'],
              ['JWT_REFRESH_SECRET', 'your-jwt-refresh-secret-here'],
              ['CORS_ORIGIN', 'http://localhost:5173'],
              ['GOOGLE_CLIENT_ID', 'your-client-id.apps.googleusercontent.com'],
              ['STRICT_EMAIL_VERIFICATION', 'false'],
              ['SESSION_TIMEOUT', '30 (minutos)'],
            ].map(([variable, desc]) =>
              new TableRow({ children: [dataCell(variable, 3500), dataCell(desc, 5860)] })
            )),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun('Frontend (.env)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [3500, 5860],
          rows: [
            new TableRow({ children: [headerCell('Variable', 3500), headerCell('Descripcion / Valor Default', 5860)] }),
            ...([
              ['VITE_API_URL', 'http://localhost:3000/api'],
              ['VITE_APP_NAME', 'Punto Park U'],
              ['VITE_SESSION_TIMEOUT', '30'],
              ['VITE_ACTIVITY_HEARTBEAT_INTERVAL', '5'],
            ].map(([variable, desc]) =>
              new TableRow({ children: [dataCell(variable, 3500), dataCell(desc, 5860)] })
            )),
          ],
        }),

        // ══════════════════════════════════════════════════════════════
        // 6. AUTENTICACION
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('6. Autenticacion')] }),
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: 'El sistema de autenticacion consta de 6 modulos integrados:', size: 22 })],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Registro e Inicio de Sesion')] }),
        ...[
          'Registro con nombre, cedula, email, username y contrasena',
          'Login por username o email',
          'JWT con access token (15 min) y refresh token (7 dias)',
          'Tokens almacenados en localStorage',
          'Refresh automatico mediante interceptor de Axios',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Autenticacion con Google (OAuth 2.0)')] }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Flujo:', size: 22, bold: true })],
        }),
        ...[
          'Usuario hace clic en "Iniciar sesion con Google"',
          'Redirige a Google Consent Screen',
          'Google redirige a /api/oauth/google/callback',
          'Backend intercambia codigo por tokens de Google',
          'Crea o vincula cuenta (por email coincidente)',
          'Redirige al frontend con JWT',
        ].map((t, i) => new Paragraph({ numbering: { reference: 'numbers1', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Recuperacion de Contrasena')] }),
        ...[
          'Usuario solicita recuperacion en /forgot-password',
          'Backend genera token (32 bytes hex, 1 hora de expiracion)',
          'En desarrollo: token se muestra en consola del servidor',
          'Usuario hace clic en el enlace /reset-password?token=...',
          'Ingresa nueva contrasena (min. 8 caracteres)',
          'Token se invalida despues de usar',
        ].map((t, i) => new Paragraph({ numbering: { reference: 'numbers1', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Autenticacion de Dos Factores (2FA)')] }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Basado en TOTP (RFC 6238) con la libreria speakeasy.', size: 22 })],
        }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Configuracion desde el perfil de usuario:', size: 22, bold: true })],
        }),
        ...[
          'POST /api/auth/2fa/setup - genera secreto temporal y QR',
          'Usuario escanea QR con Google Authenticator o similar',
          'POST /api/auth/2fa/verify-setup - verifica codigo TOTP y activa 2FA',
          'Se generan 8 codigos de respaldo (mostrados una sola vez)',
        ].map((t, i) => new Paragraph({ numbering: { reference: 'numbers1', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Gestion de Sesiones')] }),
        ...[
          'Cada sesion almacena: IP, user agent, tipo de dispositivo, ultima actividad',
          'Heartbeat de actividad: se actualiza lastActiveAt en cada request autenticado',
          'Timeout de inactividad configurable (default: 30 min)',
          'Expiracion absoluta: 7 dias',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Control de Acceso por Roles (RBAC)')] }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Jerarquia de roles:', size: 22, bold: true })],
        }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1800, 4560, 3000],
          rows: [
            new TableRow({ children: [headerCell('Rol', 1800), headerCell('Permisos', 4560), headerCell('Herencia', 3000)] }),
            ...([
              ['admin', 'Acceso total: usuarios, tarifas, reportes, todo CRUD', 'Hereda operator + user'],
              ['operator', 'Operaciones de parqueadero: spots, entradas/salidas', 'Hereda user'],
              ['user', 'Autoservicio: perfil, vehiculos, reservas, historial', '-'],
              ['guest', 'Solo lectura: landing page, disponibilidad', '-'],
            ].map(([role, perms, inherit]) =>
              new TableRow({ children: [dataCell(role, 1800), dataCell(perms, 4560), dataCell(inherit, 3000)] })
            )),
          ],
        }),

        // ══════════════════════════════════════════════════════════════
        // 7. API REST
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('7. API REST')] }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun('Auth (/api/auth)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1200, 2800, 900, 4460],
          rows: [
            new TableRow({ children: [headerCell('Metodo', 1200), headerCell('Ruta', 2800), headerCell('Auth', 900), headerCell('Descripcion', 4460)] }),
            ...([
              ['POST', '/register', 'No', 'Registrar nuevo usuario'],
              ['POST', '/login', 'No', 'Iniciar sesion'],
              ['GET', '/me', 'Si', 'Perfil del usuario actual'],
              ['POST', '/refresh', 'No', 'Refrescar access token'],
              ['POST', '/logout', 'Si', 'Cerrar sesion'],
              ['POST', '/forgot-password', 'No', 'Solicitar recuperacion'],
              ['POST', '/reset-password', 'No', 'Restablecer contrasena'],
              ['GET', '/verify/:token', 'No', 'Verificar email'],
            ].map(([method, route, auth, desc]) =>
              new TableRow({ children: [dataCell(method, 1200), dataCell(route, 2800), dataCell(auth, 900), dataCell(desc, 4460)] })
            )),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun('Vehiculos (/api/vehicles)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1200, 2800, 900, 4460],
          rows: [
            new TableRow({ children: [headerCell('Metodo', 1200), headerCell('Ruta', 2800), headerCell('Auth', 900), headerCell('Descripcion', 4460)] }),
            ...([
              ['GET', '/', 'Si', 'Listar vehiculos del usuario'],
              ['POST', '/', 'Si', 'Registrar nuevo vehiculo'],
              ['GET', '/:id', 'Si', 'Ver detalle de vehiculo'],
              ['PUT', '/:id', 'Si', 'Actualizar vehiculo'],
              ['DELETE', '/:id', 'Si', 'Eliminar vehiculo (soft delete)'],
            ].map(([method, route, auth, desc]) =>
              new TableRow({ children: [dataCell(method, 1200), dataCell(route, 2800), dataCell(auth, 900), dataCell(desc, 4460)] })
            )),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun('Reservas (/api/reservations)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1200, 2800, 900, 4460],
          rows: [
            new TableRow({ children: [headerCell('Metodo', 1200), headerCell('Ruta', 2800), headerCell('Auth', 900), headerCell('Descripcion', 4460)] }),
            ...([
              ['GET', '/', 'Si', 'Listar reservas del usuario'],
              ['POST', '/', 'Si', 'Crear nueva reserva'],
              ['PUT', '/:id/cancel', 'Si', 'Cancelar reserva'],
              ['GET', '/stats', 'Si', 'Estadisticas de reservas'],
            ].map(([method, route, auth, desc]) =>
              new TableRow({ children: [dataCell(method, 1200), dataCell(route, 2800), dataCell(auth, 900), dataCell(desc, 4460)] })
            )),
          ],
        }),

        new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300 }, children: [new TextRun('Usuarios (/api/users)')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [1200, 2800, 1800, 3560],
          rows: [
            new TableRow({ children: [headerCell('Metodo', 1200), headerCell('Ruta', 2800), headerCell('Auth', 1800), headerCell('Descripcion', 3560)] }),
            ...([
              ['GET', '/', 'Admin/Operator', 'Listar usuarios'],
              ['GET', '/stats', 'Admin', 'Estadisticas por rol'],
              ['GET', '/:id', 'Admin/Op/Self', 'Ver usuario'],
              ['PUT', '/:id', 'Admin/Self', 'Actualizar usuario'],
              ['PUT', '/:id/role', 'Admin', 'Cambiar rol'],
              ['DELETE', '/:id', 'Admin', 'Eliminar usuario'],
            ].map(([method, route, auth, desc]) =>
              new TableRow({ children: [dataCell(method, 1200), dataCell(route, 2800), dataCell(auth, 1800), dataCell(desc, 3560)] })
            )),
          ],
        }),

        // ══════════════════════════════════════════════════════════════
        // 8. COMANDOS DE DESARROLLO
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun('8. Comandos de Desarrollo')] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          columnWidths: [4680, 4680],
          rows: [
            new TableRow({ children: [headerCell('Comando', 4680), headerCell('Descripcion', 4680)] }),
            ...([
              ['npm run dev:all', 'Iniciar frontend + backend simultaneamente'],
              ['npm run dev:frontend', 'Solo frontend'],
              ['npm run dev:backend', 'Solo backend'],
              ['npm run typecheck', 'TypeScript type check'],
              ['npm run build', 'Build de produccion'],
            ].map(([cmd, desc]) =>
              new TableRow({ children: [dataCell(cmd, 4680), dataCell(desc, 4680)] })
            )),
          ],
        }),

        // ══════════════════════════════════════════════════════════════
        // 9. DESPLIEGUE
        // ══════════════════════════════════════════════════════════════
        new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400 }, children: [new TextRun('9. Despliegue')] }),
        new Paragraph({
          spacing: { after: 100 },
          children: [new TextRun({ text: 'Prerrequisitos:', size: 22, bold: true })],
        }),
        ...[
          'MongoDB Atlas (o cualquier instancia MongoDB)',
          'Variables de entorno configuradas para produccion',
          '(Opcional) Google OAuth Client ID/Secret configurado',
        ].map(t => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: 'Pasos:', size: 22, bold: true })],
        }),
        ...[
          'Build frontend: npm run build',
          'Iniciar backend en produccion: cd backend && NODE_ENV=production npm start',
        ].map((t, i) => new Paragraph({ numbering: { reference: 'numbers1', level: 0 }, children: [new TextRun({ text: t, size: 22 })] })),

        new Paragraph({
          spacing: { before: 300 },
          border: { top: { style: BorderStyle.SINGLE, size: 6, color: PRIMARY, space: 1 } },
          children: [],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          children: [new TextRun({ text: 'MIT - Proyecto Educativo SENA', size: 20, color: GRAY, italics: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Autores: Alexander Medina & Miguel Palacio', size: 20, color: GRAY, italics: true })],
        }),
      ],
    },
  ],
});

// ── Write ──
const OUTPUT = 'C:/Projects/Punto-Park-U/Punto_Park_U_Documentacion.docx';
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Document created: ${OUTPUT}`);
});
