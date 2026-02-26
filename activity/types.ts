/**
 * Token refresh response from Strava OAuth endpoint.
 */
export interface StravaActivityTokenRefreshResponse {
  /** New access token. */
  access_token?: string;
  /** New refresh token (optional). */
  refresh_token?: string;
}
