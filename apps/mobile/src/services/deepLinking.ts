import * as Linking from 'expo-linking';
import { useAuthStore } from '@punto-park-u/shared-stores';

// ── Deep Link Handler ───────────────────────────────────────────────

/**
 * Handle incoming deep links (puntoparku:// scheme).
 * Called from app initialization or when the app is already open.
 * For OAuth callbacks, it uses the store's handleOAuthCallback method
 * which persists tokens and updates auth state.
 */
export function handleDeepLink(url: string | null): void {
  if (!url) return;

  const parsed = Linking.parse(url);

  // Example: puntoparku://auth/callback?token=xxx&refreshToken=yyy&user=zzz
  if (parsed.path === 'auth/callback' && parsed.queryParams) {
    const { token, refreshToken, user: userEncoded, error } = parsed.queryParams as Record<string, string>;

    if (error) {
      console.warn('[deepLinking] OAuth error:', error);
      return;
    }

    if (token && userEncoded) {
      let user;
      try {
        user = JSON.parse(
          typeof atob === 'function'
            ? atob(userEncoded)
            : Buffer.from(userEncoded, 'base64').toString('utf-8')
        );
      } catch {
        console.error('[deepLinking] Failed to parse user data from deep link');
        return;
      }

      // Store auth data via shared store
      const { handleOAuthCallback } = useAuthStore.getState();
      handleOAuthCallback(token, refreshToken || '', user);
    }
  }
}

// ── Subscribe to deep links ─────────────────────────────────────────

export function subscribeToDeepLinks(): () => void {
  // Handle URL when app is opened from a cold start
  Linking.getInitialURL().then(handleDeepLink);

  // Handle URL when app is already running
  const subscription = Linking.addEventListener('url', (event) => {
    handleDeepLink(event.url);
  });

  return () => {
    subscription.remove();
  };
}

// ── Open OAuth URL in browser ───────────────────────────────────────

/**
 * Opens the Google OAuth URL in the device browser.
 * The backend handles the redirect back to the app via deep link.
 */
export async function openGoogleOAuth(): Promise<void> {
  const apiUrl =
    Linking.createURL('/auth/google').replace(/^puntoparku:\/\//, '') ||
    '/auth/google';
  const oauthUrl = `${
    __DEV__ ? 'http://localhost:3000' : 'https://puntoparku.com'
  }/api${apiUrl}`;

  await Linking.openURL(oauthUrl);
}
