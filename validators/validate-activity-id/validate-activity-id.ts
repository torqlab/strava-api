import { StravaApiError } from '../../types';

/**
 * Validates the format of a Strava activity ID.
 *
 * Ensures the activity ID is a valid numeric string that can be used to fetch
 * activity data from the Strava API. Activity IDs must be positive numbers.
 *
 * @param {string} activityId - The activity ID to validate (can be string or number).
 * @returns {void}
 * @throws {Error} Throws an error with ActivityError structure if validation fails.
 *   Error codes: 'INVALID_ID' for all validation failures.
 *   The error is not retryable.
 *
 * @example
 * ```typescript
 * validateActivityId('123456789'); // Valid
 * validateActivityId(''); // Throws INVALID_ID error
 * validateActivityId('abc'); // Throws INVALID_ID error
 * ```
 */
const validateActivityId = (activityId: string): void => {
  const trimmedActivityId = String(activityId).trim();
  const numericActivityId = Number(trimmedActivityId);
  const isValidNumericActivityId =
    !Number.isNaN(numericActivityId) && Number.isFinite(numericActivityId) && numericActivityId > 0;

  if (!trimmedActivityId) {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID is required and cannot be empty',
      retryable: false,
    };

    throw new Error(JSON.stringify(error));
  } else if (!isValidNumericActivityId) {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID must be a valid positive number',
      retryable: false,
    };

    throw new Error(JSON.stringify(error));
  }
};

export default validateActivityId;
