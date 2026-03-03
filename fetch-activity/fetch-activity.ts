import { validateActivityId } from '../validators';
import type { StravaApiConfig, StravaActivity } from '../types';
import client, { createError, handleRetry } from '../client';
import {
  STRAVA_API_MAX_RETRIES,
  STRAVA_API_INITIAL_BACKOFF_MS,
  STRAVA_API_ENDPOINTS,
} from '../constants';

/**
 * Fetches activity with token refresh support and validation.
 * @param {StravaApiConfig} config - Strava API configuration.
 * @param {string} activityId - Activity ID to fetch.
 * @returns {Promise<StravaActivity>} Promise resolving to validated activity.
 * @throws {Error} Throws error if validation fails or API errors occur.
 * @internal
 */
const fetchActivityWithValidation = async (
  config: StravaApiConfig,
  activityId: string,
): Promise<StravaActivity | null> => {
  const activity = await client<StravaActivity | null>(
    STRAVA_API_ENDPOINTS.ACTIVITY(activityId),
    config,
  );

  if (config.guardrails) {
    const validationResult = activity
      ? config.guardrails.validate(activity)
      : { valid: false, errors: ['Activity is empty'] };

    if (!validationResult.valid) {
      const error = createError(
        'VALIDATION_FAILED',
        validationResult.errors?.join(', ') ?? 'Activity validation failed',
        false,
      );

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

  return handleRetry({
    maxRetries: STRAVA_API_MAX_RETRIES,
    initialBackoffMs: STRAVA_API_INITIAL_BACKOFF_MS,

    /**
     * Fetches activity with retry capability.
     * @returns {Promise<StravaActivity | null>} The activity data or null if not found.
     */
    fn: async (): Promise<StravaActivity | null> => fetchActivityWithValidation(config, activityId),
  });
};

export default fetchActivity;
