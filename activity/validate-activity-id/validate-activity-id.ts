import { StravaApiError } from '../../types';

/**
 * Validates the format of a Strava activity ID.
 *
 * Ensures the activity ID is a valid numeric string that can be used to fetch
 * activity data from the Strava API. Activity IDs must be positive numbers.
 *
 * @param {string} activityId - The activity ID to validate (can be string or number)
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
  if (activityId === undefined || activityId === null) {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID is required',
      retryable: false,
    };
    throw new Error(JSON.stringify(error));
  }

  const trimmedId = String(activityId).trim();

  if (trimmedId === '') {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID cannot be empty',
      retryable: false,
    };
    throw new Error(JSON.stringify(error));
  }

  const numericId = Number(trimmedId);

  if (Number.isNaN(numericId) || !Number.isFinite(numericId)) {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID must be a valid number',
      retryable: false,
    };
    throw new Error(JSON.stringify(error));
  }

  if (numericId <= 0) {
    const error: StravaApiError = {
      code: 'INVALID_ID',
      message: 'Activity ID must be a positive number',
      retryable: false,
    };
    throw new Error(JSON.stringify(error));
  }
};

export default validateActivityId;
