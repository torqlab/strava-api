/**
 * Handles rate limit responses from Strava API by waiting appropriately.
 *
 * Parses rate limit headers from HTTP response and waits for the appropriate
 * duration before allowing retry. Prioritizes Retry-After header if present,
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
 * @param {Response} response - HTTP Response object containing rate limit headers
 * @returns {Promise<void>} Promise that resolves after waiting for the calculated duration
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

  if (retryAfterHeader !== null) {
    const retryAfterSeconds = Number.parseFloat(retryAfterHeader);

    if (
      !Number.isNaN(retryAfterSeconds) &&
      Number.isFinite(retryAfterSeconds) &&
      retryAfterSeconds > 0
    ) {
      const waitMs = Math.ceil(retryAfterSeconds * 1000);
      await new Promise(resolve => setTimeout(resolve, waitMs));
      return;
    }
  }

  const rateLimitLimit = response.headers.get('X-RateLimit-Limit');
  const rateLimitUsage = response.headers.get('X-RateLimit-Usage');

  if (rateLimitLimit !== null && rateLimitUsage !== null) {
    const limit = Number.parseInt(rateLimitLimit, 10);
    const usage = Number.parseInt(rateLimitUsage, 10);

    if (
      !Number.isNaN(limit) &&
      !Number.isNaN(usage) &&
      Number.isFinite(limit) &&
      Number.isFinite(usage)
    ) {
      if (usage >= limit) {
        const windowMs = 15 * 60 * 1000;
        await new Promise(resolve => setTimeout(resolve, windowMs));
        return;
      }
    }
  }

  const defaultWaitMs = 60 * 1000;
  await new Promise(resolve => setTimeout(resolve, defaultWaitMs));
};

export default handleRateLimit;
