import { STRAVA_API_ERROR_CODES, STRAVA_API_STATUS_CODES } from '../../constants';
import { StravaApiConfig, StravaApiErrorWithResponse } from '../../types';
import handleRateLimit from '../handle-rate-limit';
import parseErrorCode from '../parse-error-code';
import refreshToken from '../../refresh-token';

/**
 * Handles errors from API fetch, including rate limits and unauthorized errors.
 *
 * For rate limit errors, it waits for the appropriate duration before retrying.
 * For unauthorized errors, it attempts to refresh the token if possible and retry.
 * For other errors, it rethrows them to be handled by the retry logic.
 *
 * @template T - The expected return type of the API fetch function.
 * @param {Function} fn - The API fetch function to execute during error handling.
 * @param {StravaApiConfig} config - Strava API configuration.
 * @param {unknown} error - The error object thrown from the API fetch attempt.
 * @returns {Promise<T>} Promise resolving to the expected return type if retry is successful.
 * @throws {Error} Throws the original error if it's not a rate limit or unauthorized error, or if retries are exhausted.
 * @internal
 */
const handleFetchError = async <T>(
  fn: (config: StravaApiConfig) => Promise<T>,
  config: StravaApiConfig,
  error: unknown,
): Promise<T> => {
  const errorCode = parseErrorCode(error);
  const isRateLimitedError = errorCode === STRAVA_API_ERROR_CODES.RATE_LIMITED;
  const isUnauthorizedError = errorCode === STRAVA_API_ERROR_CODES.UNAUTHORIZED;

  if (isRateLimitedError) {
    // Use the actual response if available.
    // Otherwise create a mock with default wait.
    const errorWithResponse = error as StravaApiErrorWithResponse;
    const rateLimitedResponse =
      errorWithResponse.response ??
      new Response('Rate Limited', {
        status: STRAVA_API_STATUS_CODES.RATE_LIMITED,
        headers: { 'Retry-After': '60' },
      });

    await handleRateLimit(rateLimitedResponse);
    throw error;
  } else if (isUnauthorizedError) {
    const canRefreshToken =
      Boolean(config.refreshToken) && Boolean(config.clientId) && Boolean(config.clientSecret);

    if (canRefreshToken) {
      try {
        const { access_token } = await refreshToken(config);
        const refreshedConfig: StravaApiConfig = {
          ...config,
          accessToken: access_token,
        };

        return await fn(refreshedConfig);
      } catch {
        throw error;
      }
    } else {
      throw error;
    }
  } else {
    throw error;
  }
};

export default handleFetchError;
