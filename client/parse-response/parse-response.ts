import parseError from '../parse-error';
import createError from '../create-error';
import { STRAVA_API_STATUS_CODES } from '../../constants';

/**
 * Parses JSON data from the API response.
 * @template T - The expected return type of the parsed API response (e.g. `StravaActivity`).
 * @param {Response} response - Response object to parse.
 * @returns {Promise<T>} Promise resolving to parsed API response array.
 * @throws {Error} Throws StravaApiError with 'MALFORMED_RESPONSE' code if JSON parsing fails.
 * @internal
 */
const parseApiResponse = async <T>(response: Response): Promise<T> => {
  try {
    const data = (await response.json()) as unknown;

    if (!data) {
      throw createError('MALFORMED_RESPONSE', 'Expected non-empty response from Strava API', false);
    } else {
      return data as T;
    }
  } catch (error) {
    const parsedError = parseError(error);

    if (parsedError) {
      throw createError('MALFORMED_RESPONSE', 'Invalid response format from Strava API', false);
    } else {
      throw error;
    }
  }
};

/**
 * Parses Strava API response.
 * Handles various HTTP error responses and maps them to appropriate `StravaApiError` codes.
 * @template T - The expected return type of the parsed API response (e.g. `StravaActivity`).
 * @param {Response} response - The fetch `Response` object from the API request.
 * @returns {Promise<T>} Promise resolving to the raw Strava API response.
 * @throws {Error} Throws an error with `StravaApiError` structure for various failure scenarios:
 *   - 'NETWORK_ERROR' (retryable): Network connection failure.
 *   - 'UNAUTHORIZED' (not retryable): Invalid or expired token (401).
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions (403).
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (429).
 *   - 'SERVER_ERROR' (retryable): Strava API server error (5xx).
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or empty response.
 *   - And others...
 *
 * @see {@link https://developers.strava.com/docs/reference/ | Strava API}
 *
 * @example
 * ```typescript
 * const response = await fetch('https://www.strava.com/api/v3/athlete/activities', {
 *   headers: {
 *     Authorization: 'Bearer abc123',
 *   },
 * });
 * const data = await parseResponse(response);
 * ```
 */
const parseResponse = async <T>(response: Response): Promise<T> => {
  const isUnauthorized = response.status === STRAVA_API_STATUS_CODES.UNAUTHORIZED;
  const isForbidden = response.status === STRAVA_API_STATUS_CODES.FORBIDDEN;
  const isRateLimited = response.status === STRAVA_API_STATUS_CODES.RATE_LIMITED;
  const isServerError = response.status >= STRAVA_API_STATUS_CODES.SERVER_ERROR;

  if (isUnauthorized) {
    throw createError(
      'UNAUTHORIZED',
      'Authentication failed. Token may be expired or invalid.',
      false,
    );
  } else if (isForbidden) {
    throw createError('FORBIDDEN', 'Insufficient permissions to access Strava API', false);
  } else if (isRateLimited) {
    throw createError(
      'RATE_LIMITED',
      'Rate limit exceeded. Please try again later.',
      true,
      response,
    );
  } else if (isServerError) {
    throw createError('SERVER_ERROR', 'Strava API server error', true);
  } else if (!response.ok) {
    throw createError('SERVER_ERROR', `Unexpected API error: ${response.status}`, false);
  } else {
    return parseApiResponse<T>(response);
  }
};

export default parseResponse;
