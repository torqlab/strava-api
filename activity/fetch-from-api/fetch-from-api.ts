import { StravaApiError, StravaActivity } from '../../types';
import { StravaApiConfig } from '../../types';
import { STRAVA_API_BASE_URL, STRAVA_API_ENDPOINTS } from '../../constants';
import getAuthHeaders from '../get-auth-headers';

/**
 * Creates an StravaApiError wrapped in an Error object.
 *
 * @param {StravaApiError['code']} code - Error code from StravaApiErrorCode union type
 * @param {string} message - User-friendly error message
 * @param {boolean} [retryable=false] - Whether the error is retryable (default: false)
 * @returns {Error} Error object with JSON-stringified StravaApiError in message
 * @internal
 */
const createActivityError = (
  code: StravaApiError['code'],
  message: string,
  retryable: boolean = false,
): Error => {
  const error: StravaApiError = {
    code,
    message,
    retryable,
  };
  return new Error(JSON.stringify(error));
};

/**
 * Fetches the API response from Strava API.
 *
 * @param {string} url - The full API endpoint URL
 * @param {HeadersInit} headers - Request headers including authorization
 * @returns {Promise<Response>} Promise resolving to the fetch response
 * @throws {Error} Throws ActivityError with 'NETWORK_ERROR' code if fetch fails
 * @internal
 */
const fetchApiResponse = async (url: string, headers: HeadersInit): Promise<Response> => {
  try {
    return await fetch(url, {
      method: 'GET',
      headers,
    });
  } catch {
    throw createActivityError('NETWORK_ERROR', 'Failed to connect to Strava API', true);
  }
};

/**
 * Parses JSON data from the API response.
 *
 * @param {Response} response - Response object to parse
 * @returns {Promise<StravaActivityStravaApiResponse>} Promise resolving to parsed API response
 * @throws {Error} Throws ActivityError with 'MALFORMED_RESPONSE' code if JSON parsing fails
 * @internal
 */
const parseApiJsonData = async (response: Response): Promise<StravaActivity> => {
  try {
    return (await response.json()) as StravaActivity;
  } catch {
    throw createActivityError(
      'MALFORMED_RESPONSE',
      'Invalid response format from Strava API',
      false,
    );
  }
};

/**
 * Fetches activity data from the Strava API.
 *
 * Makes an authenticated HTTP GET request to the Strava API to retrieve
 * complete activity details. Handles various HTTP error responses and maps
 * them to appropriate ActivityError codes.
 *
 * @param {string} activityId - Validated activity ID (must be numeric string)
 * @param {StravaApiConfig} config - Strava API configuration with access token and optional base URL
 * @returns {Promise<StravaActivityStravaApiResponse>} Promise resolving to the raw Strava API response data
 * @throws {Error} Throws an error with ActivityError structure for various failure scenarios:
 *   - 'NETWORK_ERROR' (retryable): Network connection failure
 *   - 'NOT_FOUND' (not retryable): Activity ID doesn't exist (404)
 *   - 'UNAUTHORIZED' (not retryable): Invalid or expired token (401)
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions (403)
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (429)
 *   - 'SERVER_ERROR' (retryable): Strava API server error (5xx)
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response
 *
 * @see {@link https://developers.strava.com/docs/reference/#api-Activities-getActivityById | Strava Get Activity API}
 *
 * @example
 * ```typescript
 * const response = await fetchFromApi('123456', {
 *   accessToken: 'abc123',
 *   baseUrl: 'https://www.strava.com/api/v3'
 * });
 * ```
 */
const fetchFromApi = async (
  activityId: string,
  config: StravaApiConfig,
): Promise<StravaActivity | null> => {
  const baseUrl = config.baseUrl ?? STRAVA_API_BASE_URL;
  const url = `${baseUrl}${STRAVA_API_ENDPOINTS.ACTIVITY}/${activityId}`;
  const headers = getAuthHeaders(config);

  const response = await fetchApiResponse(url, headers);

  if (response.status === 404) {
    throw createActivityError('NOT_FOUND', 'Activity not found', false);
  }

  if (response.status === 401) {
    throw createActivityError(
      'UNAUTHORIZED',
      'Authentication failed. Token may be expired or invalid.',
      false,
    );
  }

  if (response.status === 403) {
    throw createActivityError(
      'FORBIDDEN',
      'Insufficient permissions to access this activity',
      false,
    );
  }

  if (response.status === 429) {
    const error = createActivityError(
      'RATE_LIMITED',
      'Rate limit exceeded. Please try again later.',
      true,
    );
    // Store cloned response in error for rate limit handling (clone to preserve headers)
    const errorWithResponse = error as Error & { response: Response };
    errorWithResponse.response = response.clone();
    throw errorWithResponse;
  }

  if (response.status >= 500) {
    throw createActivityError('SERVER_ERROR', 'Strava API server error', true);
  }

  if (!response.ok) {
    throw createActivityError('SERVER_ERROR', `Unexpected API error: ${response.status}`, false);
  }

  const jsonData = await parseApiJsonData(response);

  return jsonData;
};

export default fetchFromApi;
