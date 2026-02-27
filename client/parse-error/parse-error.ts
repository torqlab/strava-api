import type { StravaApiError } from '../../types';

/**
 * Parses an `Error` object to extract `StravaApiError` if present.
 *
 * Attempts to parse the error message as JSON to extract structured `StravaApiError`.
 * Returns `null` if parsing fails or error doesn't contain `StravaApiError` structure.
 *
 * @param {Error} error - Error object potentially containing `StravaApiError` in message.
 * @returns {StravaApiError | null} `StravaApiError` if successfully parsed, `null` otherwise.
 * @internal
 */
const parseError = (error: unknown): StravaApiError | null => {
  try {
    return JSON.parse((error as Error).message) as StravaApiError;
  } catch {
    return null;
  }
};

export default parseError;
