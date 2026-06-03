import client, { handleRetry } from '../client';
import {
  STRAVA_API_MAX_RETRIES,
  STRAVA_API_INITIAL_BACKOFF_MS,
  STRAVA_API_ENDPOINTS,
} from '../constants';
import type { StravaApiConfig, StravaAthlete } from '../types';

/**
 * Fetches the authenticated athlete from Strava API.
 *
 * Main entry point for fetching authenticated athlete data. Orchestrates the complete flow:
 * fetches data from Strava API with retry logic, handles rate limiting and token refresh,
 * and returns the raw Strava API response format.
 *
 * This function is typically called to retrieve the current user's athlete profile
 * for display or processing purposes.
 *
 * The function implements the following flow:
 * 1. Fetches from API with automatic retry on retryable errors
 * 2. Handles rate limiting by waiting before retry
 * 3. Attempts token refresh on 401 errors (if refresh token available)
 * 4. Returns raw API response
 *
 * @param {StravaApiConfig} config - Strava API configuration including OAuth tokens.
 * @returns {Promise<StravaAthlete>} Promise resolving to authenticated athlete in raw Strava API format.
 * @throws {Error} Throws an error with StravaApiError structure for various failure scenarios:
 *   - 'UNAUTHORIZED' (not retryable): Authentication failed (after refresh attempt if applicable)
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (handled with retry)
 *   - 'SERVER_ERROR' (retryable): Strava API server error (handled with retry)
 *   - 'NETWORK_ERROR' (retryable): Network connection failure (handled with retry)
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid API response format
 *
 * @see {@link https://developers.strava.com/docs/reference/#api-Athletes-getLoggedInAthlete | Strava Get Logged In Athlete API}
 *
 * @example
 * ```typescript
 * const athlete = await fetchAthlete({
 *   accessToken: 'abc123',
 * });
 * ```
 */
const fetchAthlete = async (config: StravaApiConfig): Promise<StravaAthlete> =>
  handleRetry({
    maxRetries: STRAVA_API_MAX_RETRIES,
    initialBackoffMs: STRAVA_API_INITIAL_BACKOFF_MS,

    /**
     * Fetches from Strava API.
     * @returns {Promise<StravaAthlete>} Promise resolving to API response.
     * @throws {Error} Throws error for rate limits, unauthorized errors, or other API errors.
     * @internal
     */
    fn: (): Promise<StravaAthlete> => client<StravaAthlete>(STRAVA_API_ENDPOINTS.ATHLETE, config),
  });

export default fetchAthlete;
