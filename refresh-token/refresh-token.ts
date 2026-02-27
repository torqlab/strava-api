import type {
  StravaApiConfig,
  StravaApiError,
  StravaApiErrorCode,
  StravaApiTokenRefreshResponse,
} from '../types';
import { STRAVA_API_ENDPOINTS } from '../constants';
import type { Output } from './types';

/**
 * Creates an Error.
 * @param {StravaApiErrorCode} code - Error code.
 * @param {string} message - User-friendly error message.
 * @returns {Error} Error.
 * @internal
 */
const createError = (
  code: StravaApiErrorCode,
  message: string,
): Error => {
  const error: StravaApiError = {
    retryable: false,
    code,
    message,
  };

  return new Error(JSON.stringify(error));
};

/**
 * Fetches the token refresh response from Strava OAuth endpoint.
 * @param {URLSearchParams} body - The URL-encoded request body.
 * @returns {Promise<Response>} Promise resolving to the API response.
 * @throws {Error} Throws error with `NETWORK_ERROR` code if fetch fails.
 * @internal
 */
const doRefreshToken = async (
  body: URLSearchParams,
): Promise<Response> => {
  try {
    return await fetch(STRAVA_API_ENDPOINTS.TOKEN, {
      method: 'POST',
      body: body.toString(),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  } catch {
    throw createError('NETWORK_ERROR', 'Failed to connect to Strava OAuth endpoint');
  }
};

/**
 * Parses Strava API response.
 * @param {Response} response - Response object to parse.
 * @returns {Promise<StravaApiTokenRefreshResponse>} Promise resolving to parsed token refresh response.
 * @throws {Error} Throws error with `MALFORMED_RESPONSE` code if JSON parsing fails.
 * @internal
 */
const parseApiResponse = async (
  response: Response,
): Promise<StravaApiTokenRefreshResponse> => {
  try {
    return (await response.json()) as StravaApiTokenRefreshResponse;
  } catch {
    throw createError(
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
 * @param {StravaApiConfig} config - API configuration.
 * @returns {Promise<string>} Promise resolving to the new access token.
 * @throws {Error} Throws an error for various failure scenarios:
 *   - 'UNAUTHORIZED' (not retryable): Refresh token missing or invalid credentials
 *   - 'NETWORK_ERROR' (not retryable): Network connection failure
 *   - 'UNAUTHORIZED' (not retryable): Token refresh request failed
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or missing access_token
 *   - And others...
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
const refreshToken = async (
  config: StravaApiConfig,
): Promise<Output> => {
  if (!config.refreshToken) {
    throw createError('UNAUTHORIZED', 'Refresh token is not available');
  } else if (!config.clientId || !config.clientSecret) {
    throw createError(
      'UNAUTHORIZED',
      'Client ID and client secret are required for token refresh',
    );
  } else {
    const body = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: config.refreshToken,
    });
    const response = await doRefreshToken(body);

    if (!response.ok) {
      throw createError('UNAUTHORIZED', 'Token refresh failed');
    } else {
      // Clone response to avoid consuming the body stream.
      const jsonData = await parseApiResponse(response.clone());

      if (jsonData.access_token && jsonData.refresh_token) {
        return {
          access_token: jsonData.access_token,
          refresh_token: jsonData.refresh_token,
        };
      } else {
        throw createError(
          'MALFORMED_RESPONSE',
          'Access token not found in refresh response',
        );
      }
    }
  }
};

export default refreshToken;
