const crypto = require('crypto');
const config = require('../config');

// ── Mock mode ──────────────────────────────────────────────────────────
// When ePayco credentials are missing, the service runs in mock mode.
// All operations simulate success responses so the frontend can be tested
// without real ePayco sandbox credentials.

const IS_ENABLED = config.epayco.enabled && config.epayco.apiKey && config.epayco.privateKey;

let Epayco = null;
let epaycoClient = null;

/**
 * Lazily init the ePayco SDK client when credentials are available.
 */
const getClient = () => {
  if (!IS_ENABLED) return null;
  if (epaycoClient) return epaycoClient;

  try {
    Epayco = require('epayco-sdk-node');
    epaycoClient = new Epayco({
      apiKey: config.epayco.apiKey,
      privateKey: config.epayco.privateKey,
      test: config.epayco.test,
    });
    return epaycoClient;
  } catch (err) {
    console.error('[epayco] Failed to init SDK:', err.message);
    return null;
  }
};

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Generate a unique reference string for the transaction.
 * Format: PUNTO-PARK-U-{timestamp}-{random}
 */
const generateRef = () => {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `PPU-${ts}-${rand}`;
};

/**
 * Create a mock checkout response for testing without credentials.
 */
const mockCheckoutResponse = (ref, amount, extra) => ({
  success: true,
  data: {
    ref,
    amount,
    currency: 'COP',
    description: extra?.description || 'Pago Punto Park U',
    redirectUrl: `https://sandbox.epayco.co/pago/${ref}`,
    url: `https://sandbox.epayco.co/pago/${ref}`,
    transactionId: `MOCK-${ref}`,
    status: 'pending',
  },
});

/**
 * Create a mock webhook response for testing without credentials.
 */
const mockWebhookResponse = (payload) => ({
  success: true,
  ref_payco: payload.ref_payco || `MOCK-${Date.now()}`,
  x_transaction_id: payload.x_transaction_id || `MOCK-TXN-${Date.now()}`,
  x_amount: payload.x_amount,
  x_currency_code: payload.x_currency_code || 'COP',
  x_response: 'Aceptada',
  x_response_reason_text: 'Transacción aprobada',
  x_approval_code: `MOCK-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
  x_franchise: 'VISA',
  x_customer_email: payload.x_customer_email || 'cliente@example.com',
  x_signature: 'mock-signature',
  x_transaction_date: new Date().toISOString(),
});

// ── Public API ─────────────────────────────────────────────────────────

/**
 * Create an ePayco checkout session.
 *
 * @param {Object} params
 * @param {number} params.amount      - Amount in COP (integer)
 * @param {string} params.description - Description of the payment
 * @param {string} params.email       - Customer email
 * @param {Object} [params.extra]     - Extra fields (billing, etc.)
 * @returns {Promise<{url: string, ref: string}>}
 */
const createCheckout = async ({ amount, description, email, extra = {} }) => {
  const ref = generateRef();

  if (!IS_ENABLED) {
    const mock = mockCheckoutResponse(ref, amount, { description, ...extra });
    return {
      url: mock.data.redirectUrl,
      ref,
      transactionId: mock.data.transactionId,
      raw: mock,
    };
  }

  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('ePayco service unavailable'), { statusCode: 503 });
  }

  try {
    const charge = await client.charge.create({
      name: description || 'Pago Punto Park U',
      description: description || 'Pago por servicios de parqueadero',
      invoice: ref,
      currency: 'COP',
      amount: Math.round(amount),
      tax_base: '0',
      tax: '0',
      country: 'CO',
      lang: 'es',
      test: config.epayco.test,
      extra: JSON.stringify({
        ...extra,
        reference: ref,
      }),
      confidential: 'false',
    });

    return {
      url: charge.data?.url || charge.url,
      ref,
      transactionId: charge.data?.transactionId || charge.transactionId,
      raw: charge,
    };
  } catch (err) {
    console.error('[epayco] Checkout creation failed:', err.message);
    throw Object.assign(new Error('Error al crear el pago en ePayco'), { statusCode: 502 });
  }
};

/**
 * Verify an ePayco webhook signature.
 *
 * ePayco signature format (v2):
 *   SHA256(apiKey ^ amount ^ currency ^ refPayco)
 *
 * @param {Object} params
 * @param {string} params.signature  - The x_signature from the webhook
 * @param {number} params.amount     - x_amount
 * @param {string} params.currency   - x_currency_code
 * @param {string} params.refPayco   - ref_payco
 * @returns {boolean}
 */
const verifySignature = ({ signature, amount, currency, refPayco }) => {
  if (!config.epayco.apiKey) {
    console.warn('[epayco] Cannot verify signature: no API key configured');
    return false;
  }

  const toSign = `${config.epayco.apiKey}^${amount}^${currency}^${refPayco}`;
  const expected = crypto
    .createHmac('sha256', config.epayco.privateKey || '')
    .update(toSign)
    .digest('hex');

  const isValid = expected === signature;
  if (!isValid) {
    console.warn('[epayco] Signature mismatch:', { expected, received: signature });
  }
  return isValid;
};

/**
 * Process an ePayco webhook payload and return normalized result.
 *
 * @param {Object} payload - Raw ePayco webhook body
 * @returns {{ valid: boolean, refPayco: string, amount: number, status: string }}
 */
const processWebhook = (payload) => {
  const {
    ref_payco: refPayco,
    x_transaction_id: transactionId,
    x_amount: amount,
    x_currency_code: currency,
    x_response: response,
    x_signature: signature,
    x_ref_payco: xRefPayco,
  } = payload;

  const actualRef = refPayco || xRefPayco;
  const actualAmount = parseFloat(amount);
  const actualCurrency = currency || 'COP';

  // Verify signature
  const valid = verifySignature({
    signature,
    amount: actualAmount,
    currency: actualCurrency,
    refPayco: actualRef,
  });

  // Map ePayco response to our status
  let status = 'failed';
  if (response === 'Aceptada' || response === 'Approved') {
    status = 'completed';
  } else if (response === 'Pendiente' || response === 'Pending') {
    status = 'pending_epayco';
  } else if (response === 'Rechazada' || response === 'Rejected') {
    status = 'failed';
  }

  return {
    valid,
    refPayco: actualRef,
    transactionId,
    amount: isNaN(actualAmount) ? 0 : actualAmount,
    status,
    response,
    raw: payload,
  };
};

/**
 * Poll the status of a payment from ePayco.
 *
 * @param {string} transactionId - ePayco transaction ID
 * @returns {Promise<{ status: string, amount: number }>}
 */
const getPaymentStatus = async (transactionId) => {
  if (!IS_ENABLED) {
    // Mock: return completed
    return { status: 'completed', amount: 0, transactionId };
  }

  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('ePayco service unavailable'), { statusCode: 503 });
  }

  try {
    const charge = await client.charge.retrieve(transactionId);
    return {
      status: charge.data?.status || charge.status || 'unknown',
      amount: parseFloat(charge.data?.amount || charge.amount || 0),
      transactionId,
    };
  } catch (err) {
    console.error('[epayco] Status poll failed:', err.message);
    throw Object.assign(new Error('Error al consultar el estado del pago'), { statusCode: 502 });
  }
};

/**
 * Refund a payment via ePayco.
 *
 * @param {string} transactionId - ePayco transaction ID
 * @returns {Promise<{ success: boolean, refundId: string }>}
 */
const refundPayment = async (transactionId) => {
  const ref = generateRef();

  if (!IS_ENABLED) {
    return { success: true, refundId: `REFUND-${ref}`, transactionId };
  }

  const client = getClient();
  if (!client) {
    throw Object.assign(new Error('ePayco service unavailable'), { statusCode: 503 });
  }

  try {
    const result = await client.charge.refund(transactionId, { reason: 'Solicitud del administrador' });
    return {
      success: true,
      refundId: result.data?.refundId || result.refundId || `REFUND-${ref}`,
      transactionId,
    };
  } catch (err) {
    console.error('[epayco] Refund failed:', err.message);
    throw Object.assign(new Error('Error al reembolsar el pago'), { statusCode: 502 });
  }
};

module.exports = {
  createCheckout,
  verifySignature,
  processWebhook,
  getPaymentStatus,
  refundPayment,
  generateRef,
  IS_ENABLED,
};
