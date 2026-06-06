# Domain: Auth (Authentication)

## Source
- Login: `C:\Projects\Punto-Park-U-Web\Login\`
- Registration: `C:\Projects\Punto-Park-U-Web\Registro\`

## Features
1. **User Registration** — Name, ID (cédula), credentials, vehicle info
   - Registration form with validation
   - Success screen (`Registro-exitoso/`)
   - Error screen (`Pantalla-error/`)
2. **User Login** — Credential validation
   - Login form with remember-me
   - Redirect to user panel on success
3. **Admin Login** — Separate admin access (hardcoded in vanilla)
4. **Session Management** — localStorage in vanilla → JWT in migration
5. **User Panel** — Dashboard with vehicles, reservations, profile
   - `C:\Projects\Punto-Park-U-Web\Login\Pantalla Usuario\`

## Migration Notes
- Replace localStorage auth with JWT (access + refresh tokens)
- Implement bcryptjs for password hashing
- Create protected routes with React Router
- Build login/register as React components with form validation
- Add TypeScript interfaces for User, AuthState, LoginCredentials
