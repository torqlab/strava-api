import type {
  StravaApiError,
  StravaApiErrorCode,
} from '../../types';

/**
 * Creates an `StravaApiError` wrapped in an `Error` object.
 * @param {StravaApiErrorCode} code - Error code from `StravaApiErrorCode` union type.
 * @param {string} message - User-friendly error message.
 * @param {boolean} [retryable=false] - Whether the error is retryable (default: false).
 * @param {Response} [response] - Optional fetch `Response` object to include in the error for additional context (e.g. rate limit headers).
 * @returns {Error} Error object with JSON-stringified `StravaApiError` in message.
 * @internal
 */
const createError = (
  code: StravaApiErrorCode,
  message: string,
  retryable: boolean = false,
  response?: Response,
): Error => {
  if (response) {
    const error: StravaApiError = {
      code,
      message,
      retryable,
    };

    return new Error(JSON.stringify({ ...error, response }));
  } else {
    const error: StravaApiError = {
      code,
      message,
      retryable,
    };

    return new Error(JSON.stringify(error));
  }
};

export default createError;
