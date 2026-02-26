import { StravaAuthConfig, StravaAuthTokenResponse, StravaAuthError } from '../types';
import { STRAVA_AUTH_TOKEN_URL } from '../constants';

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
 * Fetches the token exchange response from Strava OAuth endpoint.
 *
 * @param {string} url - The OAuth token endpoint URL
 * @param {string} body - The URL-encoded request body
 * @returns {Promise<Response>} Promise resolving to the fetch response
 * @throws {Error} Throws AuthError with 'NETWORK_ERROR' code if fetch fails
 * @internal
 */
const fetchTokenResponse = async (url: string, body: string): Promise<Response> => {
  try {
    return await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch {
    throw createAuthError('NETWORK_ERROR', 'Failed to connect to Strava OAuth endpoint');
  }
};

/**
 * Parses JSON data from the token response.
 *
 * @param {Response} response - Response object to parse
 * @returns {Promise<StravaAuthTokenResponse>} Promise resolving to parsed token response
 * @throws {Error} Throws AuthError with 'MALFORMED_RESPONSE' code if JSON parsing fails
 * @internal
 */
const parseTokenResponse = async (response: Response): Promise<StravaAuthTokenResponse> => {
  try {
    return (await response.json()) as StravaAuthTokenResponse;
  } catch {
    throw createAuthError('MALFORMED_RESPONSE', 'Invalid response format from token endpoint');
  }
};

/**
 * Exchanges an authorization code for OAuth2 access and refresh tokens.
 *
 * After a user authorizes the application via the authorization URL, Strava
 * redirects to the redirect URI with an authorization code. This function
 * exchanges that code for access and refresh tokens that can be used to make
 * API requests.
 *
 * @param {string} authorizationCode - Authorization code received from Strava redirect
 * @param {StravaAuthConfig} config - OAuth2 configuration including client ID, secret, and redirect URI
 * @returns {Promise<StravaTokenResponse>} Promise resolving to token response containing access token, refresh token, and expiration info
 *
 * @throws {Error} Throws an error with StravaAuthError structure for various failure scenarios:
 *   - 'INVALID_CONFIG' (not retryable): Missing required configuration
 *   - 'INVALID_CODE' (not retryable): Authorization code is missing or invalid
 *   - 'NETWORK_ERROR' (retryable): Network connection failure
 *   - 'UNAUTHORIZED' (not retryable): Invalid client credentials or authorization code
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or missing required fields
 *
 * @see {@link https://developers.strava.com/docs/authentication/#tokenexchange | Strava Token Exchange}
 *
 * @example
 * ```typescript
 * const tokens = await exchangeToken('authorization-code-123', {
 *   clientId: '12345',
 *   clientSecret: 'secret',
 *   redirectUri: 'http://localhost'
 * });
 * // Returns: { access_token: '...', refresh_token: '...', expires_at: 1234567890, ... }
 * ```
 */
const exchangeToken = async (
  authorizationCode: string,
  config: StravaAuthConfig,
): Promise<StravaAuthTokenResponse | null> => {
  if (!config.clientId || !config.clientSecret) {
    throw createAuthError('INVALID_CONFIG', 'Client ID and client secret are required');
  }

  if (!config.redirectUri) {
    throw createAuthError('INVALID_CONFIG', 'Redirect URI is required');
  }

  if (!authorizationCode) {
    throw createAuthError('INVALID_CODE', 'Authorization code is required');
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  });

  const response = await fetchTokenResponse(STRAVA_AUTH_TOKEN_URL, body.toString());

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw createAuthError('UNAUTHORIZED', 'Invalid client credentials or authorization code');
    }
    throw createAuthError('UNAUTHORIZED', `Token exchange failed with status ${response.status}`);
  }

  // Clone response to avoid consuming the body stream
  const clonedResponse = response.clone();
  const tokenData = await parseTokenResponse(clonedResponse);

  if (!tokenData.access_token) {
    throw createAuthError('MALFORMED_RESPONSE', 'Access token not found in response');
  }

  if (!tokenData.refresh_token) {
    throw createAuthError('MALFORMED_RESPONSE', 'Refresh token not found in response');
  }

  return tokenData;
};

export default exchangeToken;
