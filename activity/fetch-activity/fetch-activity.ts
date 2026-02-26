import { StravaApiConfig } from '../../types';
import { StravaApiError, StravaActivity } from '../../types';
import { STRAVA_API_MAX_RETRIES, STRAVA_API_INITIAL_BACKOFF_MS } from '../../constants';
import validateActivityId from '../validate-activity-id';
import fetchFromApi from '../fetch-from-api';
import handleRetry from '../../handle-retry';
import handleRateLimit from '../../handle-rate-limit';
import refreshToken from '../refresh-token';

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
 * @param {string} activityId - Activity ID to fetch
 * @param {StravaApiConfig} currentConfig - Current Strava API configuration
 * @returns {Promise<StravaActivityApiResponse>} Promise resolving to API response
 * @throws {Error} Throws error for rate limits, unauthorized errors, or other API errors
 * @internal
 */
const fetchApiResponseWithErrorHandling = async (
  activityId: string,
  currentConfig: StravaApiConfig,
): Promise<StravaActivity | null> => {
  try {
    return await fetchFromApi(activityId, currentConfig);
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
          return await fetchFromApi(activityId, refreshedConfig);
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
 * Fetches activity with token refresh support and validation.
 *
 * @param {string} activityId - Activity ID to fetch
 * @param {StravaApiConfig} currentConfig - Current Strava API configuration
 * @param {StravaActivityConfig} originalConfig - Original activity configuration (for guardrails)
 * @returns {Promise<StravaActivity>} Promise resolving to validated activity
 * @throws {Error} Throws error if validation fails or API errors occur
 * @internal
 */
const fetchActivityWithTokenRefresh = async (
  activityId: string,
  currentConfig: StravaApiConfig,
  originalConfig: StravaApiConfig,
): Promise<StravaActivity | null> => {
  const activity = await fetchApiResponseWithErrorHandling(activityId, currentConfig);

  if (originalConfig.guardrails !== undefined) {
    const validationResult = activity
      ? originalConfig.guardrails.validate(activity)
      : { valid: false, errors: ['Activity is null'] };

    if (!validationResult.valid) {
      const error: StravaApiError = {
        code: 'VALIDATION_FAILED',
        message: validationResult.errors?.join(', ') ?? 'Activity validation failed',
        retryable: false,
      };
      throw new Error(JSON.stringify(error));
    }
  }

  return activity;
};

/**
 * Fetches and validates a Strava activity by ID.
 *
 * Main entry point for the Activity module. Orchestrates the complete flow:
 * validates activity ID, fetches data from Strava API with retry logic,
 * handles rate limiting and token refresh, transforms the response to internal
 * format, and validates through Activity Guardrails if provided.
 *
 * This function is typically called when a Strava webhook notification is
 * received containing an activity ID, initiating the activity processing pipeline.
 *
 * The function implements the following flow:
 * 1. Validates activity ID format
 * 2. Fetches from API with automatic retry on retryable errors
 * 3. Handles rate limiting by waiting before retry
 * 4. Attempts token refresh on 401 errors (if refresh token available)
 * 5. Transforms API response to internal format
 * 6. Validates through Activity Guardrails (if provided)
 * 7. Returns validated activity
 *
 * @param {string} activityId - Activity ID from Strava (typically received via webhook)
 * @param {ActivityConfig} config - Activity module configuration including OAuth tokens and optional guardrails
 * @returns {Promise<Activity>} Promise resolving to validated Activity object in internal format
 * @throws {Error} Throws an error with ActivityError structure for various failure scenarios:
 *   - 'INVALID_ID' (not retryable): Invalid activity ID format
 *   - 'NOT_FOUND' (not retryable): Activity doesn't exist
 *   - 'UNAUTHORIZED' (not retryable): Authentication failed (after refresh attempt if applicable)
 *   - 'FORBIDDEN' (not retryable): Insufficient permissions
 *   - 'RATE_LIMITED' (retryable): Rate limit exceeded (handled with retry)
 *   - 'SERVER_ERROR' (retryable): Strava API server error (handled with retry)
 *   - 'NETWORK_ERROR' (retryable): Network connection failure (handled with retry)
 *   - 'VALIDATION_FAILED' (not retryable): Activity Guardrails validation failed
 *   - 'MALFORMED_RESPONSE' (not retryable): Invalid API response format
 *
 * @see {@link https://developers.strava.com/docs/reference/#api-Activities-getActivityById | Strava Get Activity API}
 * @see {@link https://developers.strava.com/docs/webhooks/ | Strava Webhooks}
 *
 * @example
 * ```typescript
 * const activity = await fetchActivity('123456789', {
 *   accessToken: 'abc123',
 *   guardrails: activityGuardrailsInstance
 * });
 * ```
 */
const fetchActivity = async (
  activityId: string,
  config: StravaApiConfig,
): Promise<StravaActivity | null> => {
  validateActivityId(activityId);

  /**
   * Inner function to fetch activity with retry capability.
   * @returns {Promise<StravaActivity | null>} The activity data or null if not found
   */
  const fetchWithRetry = async (): Promise<StravaActivity | null> =>
    fetchActivityWithTokenRefresh(activityId, config, config);

  return handleRetry(fetchWithRetry, STRAVA_API_MAX_RETRIES, STRAVA_API_INITIAL_BACKOFF_MS);
};

export default fetchActivity;
