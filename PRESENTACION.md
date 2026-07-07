# Guía de Presentación — Punto Park U

## 1. Qué es (30 segundos)
**Punto Park U** es un sistema web completo de gestión de parqueadero que conecta usuarios y administradores en tiempo real. Permite reservar espacios, gestionar vehículos, pagos, reportes y controlar la ocupación del parqueadero desde cualquier dispositivo.

**URL en vivo:** https://punto-park-u.vercel.app

---

## 2. Stack Tecnológico (30 segundos)

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS |
| **Backend** | Node.js + Express + MongoDB Atlas |
| **Deploy** | Vercel (frontend) + Render (backend) |
| **Comunicación** | WebSockets para actualizaciones en tiempo real |

---

## 3. Funcionalidades Clave (2 minutos)

### Para el Usuario
- Registro con validación de edad (18-85 años)
- Gestión de múltiples vehículos (carros, motos, bicicletas, camionetas)
- Reservas con 1 día de anticipación — selección visual de espacio
- Código QR para entrada/salida del parqueadero
- Pagos en efectivo, datáfono o PSE (ePayco)
- Historial de reservas y pagos

### Para el Administrador
- Mapa del parqueadero en tiempo real con ocupación visual
- Reportes dinámicos con exportación a Excel y PDF
- Gestión de tarifas por tipo de vehículo y tiempo (hora, día, mes)
- Panel de Prophet AI — análisis predictivo de ocupación
- Notificaciones push y SMS (Twilio)
- Gestión de usuarios y operadores

### Seguridad
- JWT con access + refresh tokens
- Google OAuth 2.0
- 2FA (autenticación de dos factores)
- RBAC — roles: admin, operator, user, guest
- Rate limiting en endpoints sensibles

---

## 4. Arquitectura (1 minuto)

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Vercel    │──────▶│   Render    │──────▶│MongoDB Atlas│
│  (React)    │  HTTP │  (Express)  │  TCP  │   (NoSQL)   │
└─────────────┘      └─────────────┘      └─────────────┘
      │                     │
      └──── WebSocket ◄─────┘
```

**Patrones:**
- API REST con paginación
- WebSocket para actualizaciones en vivo (espacios ocupados, actividad)
- Monorepo con packages compartidos (types, API client, stores)
- Demo overlay en mapa — muestra ocupación realista sin depender de datos reales

---

## 5. Datos de Demo (si preguntan)

> "El mapa muestra ocupación realista para la presentación. Los espacios ocupados/reservados son simulados basados en el código del spot (determinístico). Las reservas reales del sistema funcionan normalmente encima de esto."

| Zona | Tipo | Total | Libre |
|------|------|-------|-------|
| A | Carros | 20 | 7 |
| B | Motos | 20 | 9 |
| C | Bicicletas | 10 | 3 |
| D | Camionetas | 5 | 3 |

---

## 6. Escudo Técnico — OAuth (si preguntan por el dominio)

> "Esa es una característica de seguridad de OAuth 2.0 de Google. Actualmente nuestra aplicación está en el entorno de 'Prueba' (Testing) en Google Cloud. Como medida anti-phishing, Google exige que las aplicaciones no verificadas comercialmente muestren el dominio real del backend (onrender.com) para que el usuario sepa exactamente a dónde van sus datos. Para pasar a Producción, el protocolo exige adquirir un dominio propio, verificarlo mediante Google Search Console y someter la app a la auditoría de Google."

---

## 7. Placas de Vehículos Colombia (si preguntan)

| Tipo | Formato real | Ejemplo |
|------|-------------|---------|
| Carros | 3 letras + 3 números | ABC123 |
| Motos | 3 letras + 2 números + 1 letra | ABC12D |
| Camionetas | 3 letras + 3 números | ABC123 |
| Bicicletas | Serial del marco (7-10 dígitos, sin placa) | — |

---

## 8. Números para la presentación

- **55 espacios** en total (A:20, B:20, C:10, D:5)
- **3 tipos de tarifa**: por hora, por día, por mes
- **4 métodos de pago**: Efectivo, Datáfono, PSE, Transferencia
- **3 roles de usuario**: Admin, Operador, Cliente
- **Tiempo de gracia**: 15 minutos después de la hora de reserva

---

## 9. URLs Importantes

- **App:** https://punto-park-u.vercel.app
- **API:** https://punto-park-u.onrender.com
- **Admin:** admin / admin1234
- **Repo:** https://github.com/Alexmedina-Dev/Punto-Park-U

---

## 10. Lo que falta (roadmap realista)

- Dominio propio para quitar `.onrender.com` de OAuth
- Notificaciones SMS reales (requiere Twilio pago)
- App móvil nativa (PWA ya funciona)
- Integración con cámaras de seguridad
- Sistema de fidelización/puntos

---

*Documento generado para presentación SENA — Punto Park U*
