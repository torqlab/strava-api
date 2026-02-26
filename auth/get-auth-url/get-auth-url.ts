import { StravaAuthConfig, StravaAuthError } from '../types';
import { STRAVA_AUTH_URL, STRAVA_AUTH_DEFAULT_SCOPE } from '../constants';

/**
 * Creates an AuthorizationError wrapped in an Error object.
 *
 * @param {StravaAuthError['code']} code - Error code
 * @param {string} message - User-friendly error message
 * @returns {Error} Error object with JSON-stringified error in message
 * @internal
 */
const createAuthError = (code: StravaAuthError['code'], message: string): Error => {
  const error: StravaAuthError = {
    code,
    message,
  };
  return new Error(JSON.stringify(error));
};

/**
 * Generates the Strava OAuth2 authorization URL.
 *
 * Creates a URL that users can visit to authorize the application and grant
 * access to their Strava data. After authorization, Strava redirects to the
 * configured redirect URI with an authorization code that can be exchanged for tokens.
 *
 * @param {StravaAuthConfig} config - OAuth2 configuration including client ID, redirect URI, and optional scope
 * @returns {string} Complete authorization URL ready to be opened in a browser
 *
 * @throws {Error} Throws an error if configuration is invalid:
 *   - 'INVALID_CONFIG': Missing required configuration (clientId or redirectUri)
 *
 * @see {@link https://developers.strava.com/docs/authentication/ | Strava API Authentication}
 *
 * @example
 * ```typescript
 * const url = getAuthUrl({
 *   clientId: '12345',
 *   clientSecret: 'secret',
 *   redirectUri: 'http://localhost',
 *   scope: 'activity:read'
 * });
 * // Returns: https://www.strava.com/oauth/authorize?client_id=12345&...
 * ```
 */
const getAuthUrl = (config: StravaAuthConfig): string => {
  if (!config.clientId) {
    throw createAuthError('INVALID_CONFIG', 'Client ID is required');
  }

  if (!config.redirectUri) {
    throw createAuthError('INVALID_CONFIG', 'Redirect URI is required');
  }

  const scope = config.scope ?? STRAVA_AUTH_DEFAULT_SCOPE;
  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri,
    scope: scope,
    approval_prompt: 'force',
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
};

export default getAuthUrl;
