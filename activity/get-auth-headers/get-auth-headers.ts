import { StravaApiConfig } from '../../types';

/**
 * Builds HTTP headers for Strava API authentication.
 *
 * Creates the Authorization header using OAuth2 Bearer token format as required
 * by the Strava API. The header format follows RFC 6750 Bearer Token Usage.
 *
 * @param {StravaApiConfig} config - Strava API configuration containing the access token
 * @returns {HeadersInit} Headers object with Authorization header set to "Bearer {token}"
 *
 * @see {@link https://developers.strava.com/docs/authentication/ | Strava API Authentication}
 * @see {@link https://datatracker.ietf.org/doc/html/rfc6750 | RFC 6750: Bearer Token Usage}
 *
 * @example
 * ```typescript
 * const headers = getAuthHeaders({ accessToken: 'abc123' });
 * // Returns: { Authorization: 'Bearer abc123' }
 * ```
 */
const getAuthHeaders = (config: StravaApiConfig): HeadersInit => {
  const headers: HeadersInit = {
    Authorization: `Bearer ${config.accessToken}`,
  };

  return headers;
};

export default getAuthHeaders;
