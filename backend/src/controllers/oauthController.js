const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const { createSession } = require('./sessionController');

// ── Helpers ──────────────────────────────────────────────────────────

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    config.jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
};

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username || user.email?.split('@')[0],
  name: user.name,
  nombres: user.name?.split(' ').slice(0, -1).join(' ') || user.name,
  apellidos: user.name?.split(' ').slice(-1).join(' ') || '',
  email: user.email,
  cedula: user.cedula || '',
  rol: user.role,
  role: user.role,
  phone: user.phone || '',
});

// ── GET /api/oauth/google ────────────────────────────────────────────
// Redirect user to Google's OAuth 2.0 consent screen.

const googleAuth = (req, res) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(503).json({ error: 'Google OAuth is not configured' });
  }

  const oauth2Client = new OAuth2Client(
    config.googleClientId,
    config.googleClientSecret,
    config.googleCallbackUrl
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ],
  });

  res.redirect(authUrl);
};

// ── GET /api/oauth/google/callback ───────────────────────────────────
// Handle the OAuth 2.0 callback from Google.

// ── Google callback redirect targets ────────────────────────────────────

const MOBILE_REDIRECT_URI = 'puntoparku://auth/callback';

/**
 * Determine the final redirect URL after Google OAuth callback.
 * Supports:
 *   - Web: redirects to frontend web callback
 *   - Mobile: redirects to deep link (puntoparku://auth/callback)
 * The `state` parameter from Google can optionally carry a `source=mobile` flag.
 */
const buildRedirectUrl = (accessToken, refreshToken, userData, source) => {
  const userEncoded = Buffer.from(JSON.stringify(userData)).toString('base64');

  if (source === 'mobile') {
    const deepLink = new URL(MOBILE_REDIRECT_URI);
    deepLink.searchParams.set('token', accessToken);
    deepLink.searchParams.set('refreshToken', refreshToken);
    deepLink.searchParams.set('user', userEncoded);
    return deepLink.toString();
  }

  const redirectUrl = new URL(`${config.frontendUrl}/oauth/callback`);
  redirectUrl.searchParams.set('token', accessToken);
  redirectUrl.searchParams.set('refreshToken', refreshToken);
  redirectUrl.searchParams.set('user', userEncoded);
  return redirectUrl.toString();
};

const googleCallback = async (req, res, next) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      // User denied access or no code returned
      return res.redirect(`${config.frontendUrl}/login?error=google_auth_cancelled`);
    }

    if (!config.googleClientId || !config.googleClientSecret) {
      return res.redirect(`${config.frontendUrl}/login?error=google_not_configured`);
    }

    const oauth2Client = new OAuth2Client(
      config.googleClientId,
      config.googleClientSecret,
      config.googleCallbackUrl
    );

    // Exchange authorization code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Verify ID token
    const ticket = await oauth2Client.verifyIdToken({
      idToken: tokens.id_token,
      audience: config.googleClientId,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.redirect(`${config.frontendUrl}/login?error=google_no_email`);
    }

    // Check if user already exists by email
    let user = await User.findOne({ email });

    if (user) {
      // Auto-link Google account to existing user
      // Keep the original authProvider — only set googleId and picture
      user.googleId = googleId;
      if (picture) user.googlePicture = picture;
      await user.save();
    } else {
      // Create new user with Google profile data
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        authProvider: 'google',
        googlePicture: picture || '',
        role: 'user',
      });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Create session record
    await createSession(req, user._id, accessToken, refreshToken);

    // Encode user data and redirect (web or mobile)
    const userData = formatUserResponse(user);

    // Parse state to determine source (web vs mobile)
    let source = 'web';
    try {
      const stateParsed = JSON.parse(state || '{}');
      if (stateParsed.source === 'mobile') source = 'mobile';
    } catch {
      // state is a simple string or undefined — default to web
    }

    const redirectUrl = buildRedirectUrl(accessToken, refreshToken, userData, source);
    res.redirect(redirectUrl);
  } catch (err) {
    console.error('[OAuth] Google callback error:', err.message);
    res.redirect(`${config.frontendUrl}/login?error=google_auth_failed`);
  }
};

module.exports = { googleAuth, googleCallback };
