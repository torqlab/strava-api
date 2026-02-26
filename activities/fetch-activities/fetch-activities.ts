import { StravaApiConfig } from '../../types';
import { StravaApiError, StravaActivity } from '../../types';
import { STRAVA_API_MAX_RETRIES, STRAVA_API_INITIAL_BACKOFF_MS } from '../../constants';
import fetchActivitiesFromApi from './fetch-activities-from-api';
import handleRetry from '../../handle-retry';
import handleRateLimit from '../../handle-rate-limit';
import refreshToken from '../../activity/refresh-token';

/**
 * Parses an Error object to extract StravaApiError if present.
 *
 * Attempts to parse the error message as JSON to extract structured StravaApiError.
 * Returns null if parsing fails or error doesn't contain StravaApiError structure.
 *
 * @param {Error} error - Error object potentially containing StravaApiError in message
 * @returns {StravaApiError | null} StravaApiError if successfully parsed, null otherwise
 * @internal
 */
const parseError = (error: Error): StravaApiError | null => {
  try {
    return JSON.parse(error.message) as StravaApiError;
  } catch {
    return null;
  }
};

/**
 * Fetches API response with error handling for rate limits and token refresh.
 *
 * @param {StravaApiConfig} currentConfig - Current Strava API configuration
 * @returns {Promise<StravaActivityApiResponse[]>} Promise resolving to API response array
 * @throws {Error} Throws error for rate limits, unauthorized errors, or other API errors
 * @internal
 */
const fetchApiResponseWithErrorHandling = async (
  currentConfig: StravaApiConfig,
): Promise<StravaActivity[]> => {
  try {
    return (await fetchActivitiesFromApi(currentConfig)) as StravaActivity[];
  } catch (error) {
    const activityError = parseError(error as Error);

    if (activityError !== null && activityError.code === 'RATE_LIMITED') {
      // Use the actual response if available, otherwise create a mock with default wait
      const errorWithResponse = error as Error & { response?: Response };
      const rateLimitResponse =
        errorWithResponse.response ??
        new Response('Rate Limited', {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      await handleRateLimit(rateLimitResponse);
      throw error;
    }

    if (activityError !== null && activityError.code === 'UNAUTHORIZED') {
      const canRefreshToken =
        currentConfig.refreshToken !== undefined &&
        currentConfig.clientId !== undefined &&
        currentConfig.clientSecret !== undefined;

      if (canRefreshToken) {
        try {
          const newAccessToken = await refreshToken(currentConfig);
          const refreshedConfig: StravaApiConfig = {
            ...currentConfig,
            accessToken: newAccessToken,
          };
          return (await fetchActivitiesFromApi(refreshedConfig)) as StravaActivity[];
        } catch {
          throw error;
        }
      } else {
        throw error;
      }
    } else {
      throw error;
    }
  }
};

/**
 * Fetches activities list with token refresh support.
 *
 * @param {StravaApiConfig} currentConfig - Current Strava API configuration
 * @param {StravaApiConfig} _originalConfig - Original Strava API configuration (unused)
 * @returns {Promise<StravaActivityApiResponse[]>} Promise resolving to activities array
 * @throws {Error} Throws error if API errors occur
 * @internal
 */
const fetchActivitiesWithTokenRefresh = async (
  currentConfig: StravaApiConfig,
  _originalConfig: StravaApiConfig,
): Promise<StravaActivity[]> => {
  // _originalConfig reserved for future use (e.g., fallback scenarios)
  void _originalConfig;
  return await fetchApiResponseWithErrorHandling(currentConfig);
};

/**
 * Fetches a list of activities from Strava API for the authenticated athlete.
 *
 * Main entry point for fetching activities list. Orchestrates the complete flow:
 * fetches data from Strava API with retry logic, handles rate limiting and token
 * refresh, and returns the raw Strava API response format.
 *
 * This function is typically called to retrieve a list of activities for display
 * or processing purposes.
 *
 * The function implements the following flow:
 * 1. Fetches from API with automatic retry on retryable errors
 * 2. Handles rate limiting by waiting before retry
 * 3. Attempts token refresh on 401 errors (if refresh token available)
 * 4. Returns raw API response array
 *
 * @param {StravaApiConfig} config - Strava API configuration including OAuth tokens
 * @returns {Promise<StravaActivityApiResponse[]>} Promise resolving to array of activities in raw Strava API format
 * @throws {Error} Throws an error with StravaActivityError structure for various failure scenarios:
 *   - 'UNAUTHORIZED' (not retryable): Authentication failed (after refresh attempt if applicable)
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (handled with retry)
 *   - 'SERVER_ERROR' (retryable): Strava API server error (handled with retry)
 *   - 'NETWORK_ERROR' (retryable): Network connection failure (handled with retry)
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid API response format
 *
 * @see {@link https://developers.strava.com/docs/reference/#api-Activities-getLoggedInAthleteActivities | Strava Get Activities API}
 *
 * @example
 * ```typescript
 * const activities = await fetchActivities({
 *   accessToken: 'abc123',
 * });
 * ```
 */
const fetchActivities = async (config: StravaApiConfig): Promise<StravaActivity[]> => {
  /**
   * Inner function to fetch activities with retry capability.
   * @returns {Promise<StravaActivity[]>} Array of activities
   */
  const fetchWithRetry = async (): Promise<StravaActivity[]> =>
    fetchActivitiesWithTokenRefresh(config, config);

  return handleRetry(fetchWithRetry, STRAVA_API_MAX_RETRIES, STRAVA_API_INITIAL_BACKOFF_MS);
};

export default fetchActivities;
