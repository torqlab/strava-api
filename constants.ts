export const STRAVA_API_INITIAL_BACKOFF_MS = 1000;

export const STRAVA_API_MAX_BACKOFF_MS = 16000;

export const STRAVA_API_MAX_RETRIES = 3;

export const STRAVA_AUTH_DEFAULT_SCOPE = 'activity:read';

export const STRAVA_OAUTH_BASE_URL = 'https://www.strava.com/oauth';

export const STRAVA_API_BASE_URL = 'https://www.strava.com/api/v3';

export const STRAVA_API_ENDPOINTS = {
  TOKEN: `${STRAVA_OAUTH_BASE_URL}/token`,
  AUTH: `${STRAVA_OAUTH_BASE_URL}/authorize`,
  ACTIVITIES: `${STRAVA_API_BASE_URL}/athlete/activities`,

  /**
   * Returns the API endpoint URL for fetching a specific activity by ID.
   * @param {string} id - The ID of the activity to fetch.
   * @returns {string} The full API endpoint URL for the specified activity.
   * @example
   * const url = STRAVA_API_ENDPOINTS.ACTIVITY('123456789');
   * => 'https://www.strava.com/api/v3/activities/123456789'
   */
  ACTIVITY: (id: string) => `${STRAVA_API_BASE_URL}/activities/${id}`,
};

export const STRAVA_API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
  INVALID_ID: 'INVALID_ID',
  NOT_FOUND: 'NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  INVALID_CODE: 'INVALID_CODE',
} as const;

export const STRAVA_API_STATUS_CODES = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  RATE_LIMITED: 429,
  SERVER_ERROR: 500,
} as const;
