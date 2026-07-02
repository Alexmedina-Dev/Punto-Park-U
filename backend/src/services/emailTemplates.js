const config = require('../config');

const BRAND = {
  color: '#10B981',
  colorDark: '#059669',
  name: 'Punto Park U',
  logoUrl: `${config.frontendUrl}/images/Logo.png`,
};

function wrap(body) {
  return `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:${BRAND.color};padding:24px 32px;text-align:center;">
            <img src="${BRAND.logoUrl}" alt="${BRAND.name}" height="40" style="display:inline-block;" />
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;text-align:center;font-size:12px;color:#9ca3af;">
            &copy; ${new Date().getFullYear()} ${BRAND.name}. Todos los derechos reservados.
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function verificationTemplate(user, verifyUrl) {
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;">Verificá tu email</h2>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
      Hola <strong>${user.name || user.email}</strong>, creaste una cuenta en ${BRAND.name}.
      Hacé click en el botón para verificar tu dirección de email.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${verifyUrl}" style="display:inline-block;background:${BRAND.color};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Verificar email
      </a>
    </p>
    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
      Este enlace expira en <strong>1 hora</strong>. Si no creaste esta cuenta, podés ignorar este mensaje.
    </p>`;
  return wrap(body);
}

function passwordResetTemplate(user, resetUrl) {
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;">Restablecé tu contraseña</h2>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
      Hola <strong>${user.name || user.email}</strong>, recibimos un pedido para restablecer tu contraseña en ${BRAND.name}.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      <a href="${resetUrl}" style="display:inline-block;background:${BRAND.color};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Restablecer contraseña
      </a>
    </p>
    <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">
      Este enlace expira en <strong>15 minutos</strong>. Si no pediste este cambio, podés ignorar este mensaje.
    </p>`;
  return wrap(body);
}

function welcomeTemplate(user) {
  const body = `
    <h2 style="margin:0 0 16px;color:#111827;">¡Bienvenido a ${BRAND.name}!</h2>
    <p style="margin:0 0 16px;color:#4b5563;line-height:1.6;">
      Hola <strong>${user.name || user.email}</strong>, tu cuenta ya está lista.
      Podés reservar tu espacio de parking favorito desde la app.
    </p>
    <p style="margin:0;text-align:center;">
      <a href="${config.frontendUrl}" style="display:inline-block;background:${BRAND.color};color:#ffffff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">
        Ir a ${BRAND.name}
      </a>
    </p>`;
  return wrap(body);
}

module.exports = { verificationTemplate, passwordResetTemplate, welcomeTemplate };
