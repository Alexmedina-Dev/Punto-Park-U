const config = require('../config');
const { verificationTemplate, passwordResetTemplate, welcomeTemplate } = require('./emailTemplates');

// ── Base provider (interface) ──────────────────────────────────────

class EmailProvider {
  async send({ to, subject, html }) {
    throw new Error('send() must be implemented by subclass');
  }
}

// ── Resend provider ───────────────────────────────────────────────

class ResendProvider extends EmailProvider {
  constructor() {
    super();
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      const { Resend } = require('resend');
      this.client = new Resend(config.resendApiKey);
    }
    return this.client;
  }

  async send({ to, subject, html }) {
    const resend = this.getClient();
    const { data, error } = await resend.emails.send({
      from: config.emailFrom,
      to,
      subject,
      html,
    });
    if (error) {
      throw new Error(error.message || JSON.stringify(error));
    }
    return data;
  }
}

// ── Console provider (dev fallback) ───────────────────────────────

class ConsoleProvider extends EmailProvider {
  async send({ to, subject, html }) {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  [email-service] SIMULATED EMAIL');
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  HTML length: ${html.length} chars`);
    console.log('═══════════════════════════════════════════════════════');
    return { id: `sim-${Date.now()}` };
  }
}

// ── Factory ───────────────────────────────────────────────────────

function createEmailProvider() {
  if (config.resendApiKey) {
    console.log('[email-service] Using Resend provider');
    return new ResendProvider();
  }
  console.log('[email-service] No RESEND_API_KEY — using console fallback');
  return new ConsoleProvider();
}

const provider = createEmailProvider();

// ── Public API ────────────────────────────────────────────────────

async function sendEmail({ to, subject, html }) {
  try {
    return await provider.send({ to, subject, html });
  } catch (err) {
    console.error(`[email-service] Send failed: ${err.message}`);
    // Fallback to console if primary provider fails
    if (!(provider instanceof ConsoleProvider)) {
      try {
        return await new ConsoleProvider().send({ to, subject, html });
      } catch (fallbackErr) {
        console.error(`[email-service] Console fallback also failed: ${fallbackErr.message}`);
      }
    }
    // Never throw — caller gets undefined and continues
    return undefined;
  }
}

async function sendVerificationEmail(user, token) {
  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verificá tu email — Punto Park U',
    html: verificationTemplate(user, verifyUrl),
  });
}

async function sendPasswordResetEmail(user, resetUrl) {
  return sendEmail({
    to: user.email,
    subject: 'Restablecé tu contraseña — Punto Park U',
    html: passwordResetTemplate(user, resetUrl),
  });
}

async function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: '¡Bienvenido a Punto Park U!',
    html: welcomeTemplate(user),
  });
}

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
