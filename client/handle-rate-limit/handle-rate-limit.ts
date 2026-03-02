import { DEFAULT_WAIT_MS, WINDOW_MS } from './constants';

/**
 * Handles rate limit responses from Strava API by waiting appropriately.
 *
 * Parses rate limit headers from HTTP response and waits for the appropriate
 * duration before allowing retry. Prioritizes `Retry-After` header if present,
 * otherwise uses rate limit usage headers to calculate wait time. Falls back
 * to default 60-second wait if no rate limit information is available.
 *
 * Rate limit headers parsed:
 * - `Retry-After`: Seconds to wait (highest priority)
 * - `X-RateLimit-Limit`: Maximum requests per window
 * - `X-RateLimit-Usage`: Current request count
 *
 * If usage >= limit, waits for full 15-minute window.
 *
 * @param {Response} response - HTTP Response object containing rate limit headers.
 * @returns {Promise<void>} Promise that resolves after waiting for the calculated duration.
 *
 * @see {@link https://developers.strava.com/docs/rate-limits/ | Strava API Rate Limits}
 *
 * @example
 * ```typescript
 * const response = new Response('Rate Limited', {
 *   status: 429,
 *   headers: { 'Retry-After': '5' }
 * });
 * await handleRateLimit(response); // Waits 5 seconds
 * ```
 */
const handleRateLimit = async (response: Response): Promise<void> => {
  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfterSeconds = retryAfterHeader ? Number.parseFloat(retryAfterHeader) : NaN;
  const shouldWaitAndRetry =
    !Number.isNaN(retryAfterSeconds) && Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0;

  if (shouldWaitAndRetry) {
    const waitMs = Math.ceil(retryAfterSeconds * 1000);

    await new Promise((resolve) => {
      setTimeout(resolve, waitMs);
    });
  } else {
    const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
    const rateLimitUsage = response.headers.get('X-RateLimit-Usage');
    const limit = rateLimitLimit ? Number.parseInt(rateLimitLimit, 10) : NaN;
    const usage = rateLimitUsage ? Number.parseInt(rateLimitUsage, 10) : NaN;
    const shouldWaitInWindow =
      !Number.isNaN(limit) &&
      !Number.isNaN(usage) &&
      Number.isFinite(limit) &&
      Number.isFinite(usage) &&
      usage >= limit;

    if (shouldWaitInWindow) {
      await new Promise((resolve) => {
        setTimeout(resolve, WINDOW_MS);
      });
    } else {
      await new Promise((resolve) => {
        setTimeout(resolve, DEFAULT_WAIT_MS);
      });
    }
  }
};

export default handleRateLimit;
