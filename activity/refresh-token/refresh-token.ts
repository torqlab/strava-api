import { StravaApiConfig, StravaApiError } from '../../types';
import { StravaActivityTokenRefreshResponse } from '../types';

/**
 * Creates an ActivityError wrapped in an Error object.
 *
 * @param {ActivityError['code']} code - Error code from ActivityErrorCode union type
 * @param {string} message - User-friendly error message
 * @returns {Error} Error object with JSON-stringified ActivityError in message
 * @internal
 */
const createActivityError = (code: StravaApiError['code'], message: string): Error => {
  const error: StravaApiError = {
    code,
    message,
    retryable: false,
  } as const;
  return new Error(JSON.stringify(error));
};

/**
 * Fetches the token refresh response from Strava OAuth endpoint.
 *
 * @param {string} url - The OAuth token endpoint URL
 * @param {string} body - The URL-encoded request body
 * @returns {Promise<Response>} Promise resolving to the fetch response
 * @throws {Error} Throws ActivityError with 'NETWORK_ERROR' code if fetch fails
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
    throw createActivityError('NETWORK_ERROR', 'Failed to connect to Strava OAuth endpoint');
  }
};

/**
 * Parses JSON data from a cloned response.
 *
 * @param {Response} clonedResponse - Cloned response object to parse
 * @returns {Promise<StravaActivityTokenRefreshResponse>} Promise resolving to parsed token refresh response
 * @throws {Error} Throws ActivityError with 'MALFORMED_RESPONSE' code if JSON parsing fails
 * @internal
 */
const parseTokenRefreshJsonData = async (
  clonedResponse: Response,
): Promise<StravaActivityTokenRefreshResponse> => {
  try {
    return (await clonedResponse.json()) as StravaActivityTokenRefreshResponse;
  } catch {
    throw createActivityError(
      'MALFORMED_RESPONSE',
      'Invalid response format from token refresh endpoint',
    );
  }
};

/**
 * Refreshes an expired OAuth2 access token using refresh token.
 *
 * Calls the Strava OAuth token refresh endpoint to obtain a new access token
 * when the current one has expired. Requires refresh token, client ID, and
 * client secret to be present in the configuration.
 *
 * @param {StravaApiConfig} config - Activity module configuration containing refresh token and OAuth credentials
 * @returns {Promise<string>} Promise resolving to the new access token string
 * @throws {Error} Throws an error with ActivityError structure for various failure scenarios:
 *   - 'UNAUTHORIZED' (not retryable): Refresh token missing or invalid credentials
 *   - 'NETWORK_ERROR' (not retryable): Network connection failure
 *   - 'UNAUTHORIZED' (not retryable): Token refresh request failed
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or missing access_token
 *
 * @see {@link https://developers.strava.com/docs/authentication/#refreshingexpiredaccesstokens | Strava Token Refresh}
 * @see {@link https://www.oauth.com/oauth2-servers/access-tokens/refreshing-access-tokens/ | OAuth2 Token Refresh}
 *
 * @example
 * ```typescript
 * const newToken = await refreshToken({
 *   accessToken: 'expired-token',
 *   refreshToken: 'refresh-token-123',
 *   clientId: 'client-id',
 *   clientSecret: 'client-secret'
 * });
 * ```
 */
const refreshToken = async (config: StravaApiConfig): Promise<string> => {
  if (config.refreshToken === undefined) {
    throw createActivityError('UNAUTHORIZED', 'Refresh token is not available');
  }

  if (config.clientId === undefined || config.clientSecret === undefined) {
    throw createActivityError(
      'UNAUTHORIZED',
      'Client ID and client secret are required for token refresh',
    );
  }

  const url = 'https://www.strava.com/oauth/token';
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: config.refreshToken,
  });

  const response = await fetchTokenRefreshResponse(url, body.toString());

  if (!response.ok) {
    throw createActivityError('UNAUTHORIZED', 'Token refresh failed');
  }

  // Clone response to avoid consuming the body stream
  const clonedResponse = response.clone();
  const jsonData = await parseTokenRefreshJsonData(clonedResponse);

  if (jsonData.access_token === undefined || jsonData.access_token === null) {
    throw createActivityError('MALFORMED_RESPONSE', 'Access token not found in refresh response');
  }

  return jsonData.access_token;
};

export default refreshToken;
