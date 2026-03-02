import getAuthHeaders from './get-auth-headers';
import createError from './create-error';
import handleFetchError from './handle-fetch-error';
import parseResponse from './parse-response';
import type { StravaApiConfig } from '../types';

/**
 * Fetches from Strava API.
 * @template T - The expected return type of the API response (e.g. `StravaActivity`).
 * @param {string} url - The API endpoint URL.
 * @param {StravaApiConfig} config - Strava API configuration.
 * @returns {Promise<T>} Promise resolving to the fetch response.
 * @throws {Error} Throws StravaApiError with 'NETWORK_ERROR' code if fetch fails.
 * @internal
 */
const doFetch = async <T>(url: string, config: StravaApiConfig): Promise<T> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(config),
    });

    return parseResponse(response);
  } catch {
    throw createError('NETWORK_ERROR', 'Failed to connect to Strava API', true);
  }
};

/**
 * Fetches activities list from the Strava API.
 *
 * Makes an authenticated HTTP GET request to the Strava API to retrieve
 * a list of activities for the authenticated athlete. Handles various HTTP
 * error responses and maps them to appropriate `StravaApiError` codes.
 *
 * @template T - The expected return type of the API response (e.g. `StravaActivity`).
 * @param {string} url - The API endpoint URL.
 * @param {StravaApiConfig} config - Strava API configuration with access token and optional base URL.
 * @returns {Promise<T>} Promise resolving to the raw Strava API response data array.
 * @throws {Error} Throws an error with `StravaApiError` structure for various failure scenarios:
 *   - 'NETWORK_ERROR' (retryable): Network connection failure.
 *   - 'UNAUTHORIZED' (not retryable): Invalid or expired token (401).
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions (403).
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (429).
 *   - 'SERVER_ERROR' (retryable): Strava API server error (5xx).
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid JSON response or not an array.
 *   - And others...
 *
 * @see {@link https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities | Strava Get Activities API}
 *
 * @example
 * ```typescript
 * const activities = await client<StravaActivity[]>(
 *  STRAVA_API_ENDPOINTS.ACTIVITIES,
 *  { accessToken: 'abc123' },
 * );
 * ```
 */
const client = async <T>(url: string, config: StravaApiConfig): Promise<T> => {
  try {
    return await doFetch<T>(url, config);
  } catch (error) {
    return await handleFetchError<T>((newConfig) => doFetch<T>(url, newConfig), config, error);
  }
};

export default client;
