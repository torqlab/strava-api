import { StravaAuthConfig, StravaAuthTokenRefreshResponse, StravaAuthError } from '../types';
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
 * Fetches the token refresh response from Strava OAuth endpoint.
 *
 * @param {string} url - The OAuth token endpoint URL
 * @param {string} body - The URL-encoded request body
 * @returns {Promise<Response>} Promise resolving to the fetch response
 * @throws {Error} Throws AuthError with 'NETWORK_ERROR' code if fetch fails
 * @internal
 */
const fetchTokenRefreshResponse = async (url: string, body: string): Promise<Response> => {
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
 * Parses JSON data from the token refresh response.
 *
 * @param {Response} response - Response object to parse
 * @returns {Promise<StravaAuthTokenRefreshResponse>} Promise resolving to parsed token refresh response
 * @throws {Error} Throws AuthError with 'MALFORMED_RESPONSE' code if JSON parsing fails
 * @internal
 */
const parseTokenRefreshResponse = async (
  response: Response,
): Promise<StravaAuthTokenRefreshResponse> => {
  try {
    return (await response.json()) as StravaAuthTokenRefreshResponse;
  } catch {
    throw createAuthError(
      'MALFORMED_RESPONSE',
      'Invalid response format from token refresh endpoint',
    );
  }
};

/**
 * Refreshes an expired OAuth2 access token using a refresh token.
 *
 * Access tokens expire after 6 hours. This function uses the refresh token
 * to obtain a new access token without requiring user re-authorization.
 *
 * @param {string} refreshToken - OAuth2 refresh token
 * @param {StravaAuthConfig} config - OAuth2 configuration including client ID and secret
 * @returns {Promise<StravaTokenRefreshResponse>} Promise resolving to token refresh response containing new access token and expiration info
 *
 * @throws {Error} Throws an error with StravaAuthError structure for various failure scenarios:
 *   - 'INVALID_CONFIG' (not retryable): Missing required configuration
 *   - 'INVALID_CODE' (not retryable): Refresh token is missing
 *   - 'NETWORK_ERROR' (retryable): Network connection failure
 *   - 'UNAUTHORIZED' (not retryable): Invalid client credentials or refresh token
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or missing access_token
 *
 * @see {@link https://developers.strava.com/docs/authentication/#refreshingexpiredaccesstokens | Strava Token Refresh}
 *
 * @example
 * ```typescript
 * const tokens = await refreshToken('refresh-token-123', {
 *   clientId: '12345',
 *   clientSecret: 'secret',
 *   redirectUri: 'http://localhost'
 * });
 * // Returns: { access_token: '...', expires_at: 1234567890, ... }
 * ```
 */
const refreshToken = async (
  refreshToken: string,
  config: StravaAuthConfig,
): Promise<StravaAuthTokenRefreshResponse | null> => {
  if (!config.clientId || !config.clientSecret) {
    throw createAuthError('INVALID_CONFIG', 'Client ID and client secret are required');
  }

  if (!refreshToken) {
    throw createAuthError('INVALID_CODE', 'Refresh token is required');
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetchTokenRefreshResponse(STRAVA_AUTH_TOKEN_URL, body.toString());

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw createAuthError('UNAUTHORIZED', 'Invalid client credentials or refresh token');
    }
    throw createAuthError('UNAUTHORIZED', `Token refresh failed with status ${response.status}`);
  }

  // Clone response to avoid consuming the body stream
  const clonedResponse = response.clone();
  const tokenData = await parseTokenRefreshResponse(clonedResponse);

  if (!tokenData.access_token) {
    throw createAuthError('MALFORMED_RESPONSE', 'Access token not found in refresh response');
  }

  return tokenData;
};

export default refreshToken;
