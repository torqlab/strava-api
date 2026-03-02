import { StravaApiError } from '../../types';
import { Input, RetryFunction } from './types';
import { STRAVA_API_INITIAL_BACKOFF_MS, STRAVA_API_MAX_BACKOFF_MS } from '../../constants';

/**
 * Parses an Error object to extract `ActivityError` if present.
 * Attempts to parse the error message as JSON to extract structured `StravaApiError`.
 * Returns null if parsing fails or error doesn't contain `StravaApiError` structure.
 * @param {Error} error - Error object potentially containing `ActivityError` in message.
 * @returns {StravaApiError | null} `StravaApiError` if successfully parsed, null otherwise.
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
 * Attempts to execute a function with exponential backoff retry logic.
 * @template T - The return type of the function being retried.
 * @param {RetryFunction<T>} fn - Async function to execute and retry on failure.
 * @param {number} attemptIndex - Current attempt index (0-based).
 * @param {number} maxRetries - Maximum number of retry attempts.
 * @param {number} currentBackoffMs - Current backoff delay in milliseconds.
 * @param {Error | null} _previousError - Previous error encountered (if any) (unused).
 * @returns {Promise<T>} Promise resolving to the function's return value on success.
 * @throws {Error} Throws the error if all retries are exhausted or error is non-retryable.
 * @internal
 */
const attemptWithBackoff = async <T>(
  fn: RetryFunction<T>,
  attemptIndex: number,
  maxRetries: number,
  currentBackoffMs: number,
  _previousError: Error | null,
): Promise<T> => {
  // _previousError may be used for
  // enhanced error reporting in the future.
  void _previousError;

  try {
    return await fn();
  } catch (error) {
    const currentError = error as Error;
    const activityError = parseError(currentError);

    if (activityError !== null && activityError.retryable === false) {
      throw currentError;
    } else {
      const isLastAttempt = attemptIndex >= maxRetries;

      if (isLastAttempt) {
        throw currentError;
      } else {
        const delayMs = Math.min(currentBackoffMs, STRAVA_API_MAX_BACKOFF_MS);

        await new Promise((resolve) => {
          setTimeout(resolve, delayMs);
        });

        const nextBackoffMs = currentBackoffMs * 2;
        const nextAttemptIndex = attemptIndex + 1;

        return attemptWithBackoff(fn, nextAttemptIndex, maxRetries, nextBackoffMs, currentError);
      }
    }
  }
};

/**
 * Implements retry logic with exponential backoff for async operations.
 *
 * Executes a function with automatic retries on failure. Uses exponential backoff
 * strategy (doubling delay on each retry) up to a maximum delay. Only retries
 * errors marked as retryable (`ActivityError.retryable === true`). Non-retryable
 * errors are immediately thrown without retry attempts.
 *
 * @template T - The return type of the function being retried.
 * @param {Input<T>} params - Parameters for the retry logic.
 * @param {RetryFunction<T>} params.fn - Async function to execute and retry on failure.
 * @param {number} params.maxRetries - Maximum number of retry attempts before giving up.
 * @param {number} [params.initialBackoffMs=STRAVA_API_INITIAL_BACKOFF_MS] - Initial backoff delay in milliseconds (default is 1000ms).
 * @returns {Promise<T>} Promise resolving to the function's return value on success.
 * @throws {Error} Throws the last error encountered if all retries are exhausted.
 *
 * @example
 * ```typescript
 * const result = await handleRetry(
 *   () => fetchFromApi('123456', config),
 *   3, // max 3 retries
 *   1000 // start with 1 second delay
 * );
 * // Retry delays: 1s, 2s, 4s (capped at MAX_BACKOFF_MS)
 * ```
 */
const handleRetry = async <T>({
  fn,
  maxRetries,
  initialBackoffMs = STRAVA_API_INITIAL_BACKOFF_MS,
}: Input<T>): Promise<T> => attemptWithBackoff(fn, 0, maxRetries, initialBackoffMs, null);

export default handleRetry;
