export const STRAVA_RATE_LIMIT = 600; // requests per 15 minutes
export const STRAVA_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
export const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 504];
export const NON_RETRYABLE_STATUS_CODES = [400, 401, 403, 404];
