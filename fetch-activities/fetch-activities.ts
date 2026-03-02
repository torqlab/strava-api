import client, { handleRetry } from '../client';
import {
  STRAVA_API_MAX_RETRIES,
  STRAVA_API_INITIAL_BACKOFF_MS,
  STRAVA_API_ENDPOINTS,
} from '../constants';
import type { StravaApiConfig, StravaActivity } from '../types';

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
 * @param {StravaApiConfig} config - Strava API configuration including OAuth tokens.
 * @returns {Promise<StravaActivityApiResponse[]>} Promise resolving to array of activities in raw Strava API format.
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
const fetchActivities = async (config: StravaApiConfig): Promise<StravaActivity[]> =>
  handleRetry({
    maxRetries: STRAVA_API_MAX_RETRIES,
    initialBackoffMs: STRAVA_API_INITIAL_BACKOFF_MS,

    /**
     * Fetches from Strava API.
     * @returns {Promise<StravaActivityApiResponse[]>} Promise resolving to API response array.
     * @throws {Error} Throws error for rate limits, unauthorized errors, or other API errors.
     * @internal
     */
    fn: (): Promise<StravaActivity[]> =>
      client<StravaActivity[]>(STRAVA_API_ENDPOINTS.ACTIVITIES, config),
  });

export default fetchActivities;
