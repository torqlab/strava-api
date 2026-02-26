/**
 * OAuth2 authorization configuration for Strava API.
 */
export interface StravaAuthConfig {
  /** OAuth2 client ID from Strava application. */
  clientId: string;
  /** OAuth2 client secret from Strava application. */
  clientSecret: string;
  /** OAuth2 redirect URI (must match application settings). */
  redirectUri: string;
  /** OAuth2 scopes (e.g., 'activity:read' or 'activity:read_all'). */
  scope?: string;
}

/**
 * Token exchange response from Strava OAuth endpoint.
 */
export interface StravaAuthTokenResponse {
  /** OAuth2 access token. */
  access_token: string;
  /** OAuth2 refresh token. */
  refresh_token: string;
  /** Token expiration timestamp (Unix time). */
  expires_at: number;
  /** Token expiration time in seconds. */
  expires_in: number;
  /** Token type (typically 'Bearer'). */
  token_type: string;
  /** Athlete information. */
  athlete?: {
    id: number;
    username?: string;
    resource_state?: number;
    firstname?: string;
    lastname?: string;
    bio?: string;
    city?: string;
    state?: string;
    country?: string;
    sex?: string;
    premium?: boolean;
    summit?: boolean;
    created_at?: string;
    updated_at?: string;
    badge_type_id?: number;
    weight?: number;
    profile_medium?: string;
    profile?: string;
    friend?: unknown;
    follower?: unknown;
  };
}

/**
 * Token refresh response from Strava OAuth endpoint.
 */
export interface StravaAuthTokenRefreshResponse {
  /** New OAuth2 access token. */
  access_token: string;
  /** New OAuth2 refresh token (optional, may not be provided). */
  refresh_token?: string;
  /** Token expiration timestamp (Unix time). */
  expires_at: number;
  /** Token expiration time in seconds. */
  expires_in: number;
  /** Token type (typically 'Bearer'). */
  token_type: string;
}

/**
 * Authorization error codes.
 */
export type StravaAuthErrorCode =
  | 'INVALID_CONFIG'
  | 'INVALID_CODE'
  | 'NETWORK_ERROR'
  | 'UNAUTHORIZED'
  | 'MALFORMED_RESPONSE';

/**
 * Authorization error structure.
 */
export interface StravaAuthError {
  /** Error code. */
  code: StravaAuthErrorCode;
  /** User-friendly error message. */
  message: string;
}
