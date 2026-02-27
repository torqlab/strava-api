import type { StravaApiErrorCode } from '../../types';
import parseError from '../parse-error/parse-error';

/**
 * Parses error code from an Error object.
 * Attempts to parse the error message as JSON to extract structured `StravaApiError`.
 * Returns `null` if parsing fails or error doesn't contain `StravaApiError` structure.
 * @param {Error} error - Error object potentially containing `StravaApiError` in message.
 * @returns {StravaApiErrorCode | null} `StravaApiErrorCode` if successfully parsed, `null` otherwise.
 * @internal
 */
const parseErrorCode = (error: unknown): StravaApiErrorCode | null => {
  try {
    const errorParsed = parseError(error);

    return errorParsed?.code || null;
  } catch {
    return null;
  }
};

export default parseErrorCode;
