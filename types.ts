import { STRAVA_API_ERROR_CODES } from './constants';

export type StravaApiErrorCode = keyof typeof STRAVA_API_ERROR_CODES;

export interface StravaApiError {
  code: StravaApiErrorCode;
  message: string;
  retryable?: boolean;
}

export interface StravaApiErrorWithResponse extends Error {
  response?: Response;
}

/**
 * Entity validation result from Guardrails.
 */
export interface StravaApiConfigGuardrailsValidationResult {
  /** Whether the entity is valid. */
  valid: boolean;
  /** Validation errors if any. */
  errors?: string[];
}

export interface StravaApiConfig {
  /** OAuth2 access token for Strava API. */
  accessToken: string;
  /** OAuth2 refresh token for token refresh. */
  refreshToken?: string;
  /** OAuth2 client ID for token refresh. */
  clientId?: string;
  /** OAuth2 client secret for token refresh. */
  clientSecret?: string;
  /** Guardrails instance for validation (dependency injection). */
  guardrails?: {
    /**
     * Validates an entity and returns validation result.
     * @param {object} input - The entity to validate
     * @returns {StravaApiConfigGuardrailsValidationResult} Validation result
     */
    validate: (input: StravaActivity) => StravaApiConfigGuardrailsValidationResult;
  };
}

export interface StravaApiTokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
}

/**
 * Strava Activity type.
 * The type is dictated by the Strava API and used internally by the system.
 * @see {@link https://developers.strava.com/docs/reference/#api-Activities-getActivityById | Strava Activity Response Format}
 */
export interface StravaActivity {
  id: number;
  resource_state?: number;
  external_id?: string;
  upload_id?: number;
  athlete?: {
    id: number;
    resource_state?: number;
  };
  name?: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  type: string;
  sport_type: string;
  start_date?: string;
  start_date_local?: string;
  timezone?: string;
  utc_offset?: number;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  achievement_count?: number;
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  map?: {
    id?: string;
    polyline?: string;
    resource_state?: number;
    summary_polyline?: string;
  };
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  flagged?: boolean;
  gear_id?: string;
  from_accepted_tag?: boolean;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number;
  average_temp?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate?: boolean;
  max_watts?: number;
  elev_high?: number;
  elev_low?: number;
  pr_count?: number;
  total_photo_count?: number;
  has_kudoed?: boolean;
  workout_type?: number;
  suffer_score?: number | null;
  description?: string;
  calories?: number;
  segment_efforts?: Record<string, unknown>[];
  splits_metric?: Record<string, unknown>[];
  laps?: Record<string, unknown>[];
  gear?: {
    id?: string;
    primary?: boolean;
    name?: string;
    resource_state?: number;
    distance?: number;
  };
  partner_brand_tag?: string | null;
  photos?: Record<string, unknown>;
  highlighted_kudosers?: Record<string, unknown>[];
  hide_from_home?: boolean;
  device_name?: string;
  embed_token?: string;
  segment_leaderboard_opt_out?: boolean;
  leaderboard_opt_out?: boolean;
}

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
