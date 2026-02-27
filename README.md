# @torqlab/strava-api

TypeScript client for the Strava API with automatic rate limiting, retry handling, and comprehensive type safety.

This package provides a robust interface to the Strava API, handling OAuth authentication, automatic token refresh, intelligent rate limiting, and retry logic. Built with TypeScript for complete type safety and designed for production use.

## Install

Published to NPM.

```bash
npm i @torqlab/strava-api
```

Or with Bun:

```bash
bun add @torqlab/strava-api
```

## Quick start

```ts
import { fetchActivity, fetchActivities, getAuthUrl, exchangeToken } from '@torqlab/strava-api';
import type { StravaApiConfig, StravaActivity } from '@torqlab/strava-api';

// OAuth flow - get authorization URL
const authUrl = getAuthUrl({
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'read,activity:read_all',
});

console.log(`Visit: ${authUrl}`);

// Exchange authorization code for tokens
const tokens = await exchangeToken({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  code: 'authorization-code-from-callback',
});

// Configure API client
const config: StravaApiConfig = {
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
};

// Fetch a single activity
const activity: StravaActivity = await fetchActivity(config, 12345678);

console.log(`Activity: ${activity.name}`);
console.log(`Distance: ${activity.distance}m`);
console.log(`Moving time: ${activity.moving_time}s`);

// Fetch multiple activities
const activities: StravaActivity[] = await fetchActivities(config, {
  per_page: 10,
  page: 1,
});

console.log(`Found ${activities.length} activities`);
```

## Features

- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **OAuth 2.0**: Complete OAuth flow with authorization URL generation and token exchange
- **Automatic Token Refresh**: Handles expired access tokens automatically
- **Rate Limiting**: Intelligent rate limit handling with exponential backoff
- **Retry Logic**: Automatic retry for transient failures
- **Error Handling**: Comprehensive error types and messages
- **Validation**: Input validation for activity IDs and configuration
- **Zero Dependencies**: No external runtime dependencies

## API Reference

### Authentication

#### `getAuthUrl(params)`

Generate OAuth authorization URL.

```ts
const authUrl = getAuthUrl({
  clientId: 'your-client-id',
  redirectUri: 'http://localhost:3000/callback',
  scope: 'read,activity:read_all', // Optional, defaults to 'read'
  state: 'random-state-string', // Optional
});
```

#### `exchangeToken(params)`

Exchange authorization code for access tokens.

```ts
const tokens = await exchangeToken({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  code: 'authorization-code',
});
```

### Activities

#### `fetchActivity(config, activityId)`

Fetch a single activity by ID.

```ts
const activity = await fetchActivity(config, 12345678);
```

#### `fetchActivities(config, params?)`

Fetch multiple activities with optional pagination.

```ts
const activities = await fetchActivities(config, {
  per_page: 30,
  page: 1,
  before: 1640995200, // Unix timestamp
  after: 1609459200, // Unix timestamp
});
```

### Configuration

The `StravaApiConfig` interface supports:

- `accessToken`: OAuth2 access token (required)
- `refreshToken`: OAuth2 refresh token for automatic renewal
- `clientId`: OAuth2 client ID for token refresh
- `clientSecret`: OAuth2 client secret for token refresh
- `guardrails`: Optional validation callback for activities

## Error Handling

The package provides comprehensive error handling with typed error codes:

```ts
import { fetchActivity } from '@torqlab/strava-api';
import type { StravaApiError } from '@torqlab/strava-api';

try {
  const activity = await fetchActivity(config, activityId);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    console.log('Rate limited, retry after delay');
  } else if (error.code === 'UNAUTHORIZED') {
    console.log('Token expired, refresh needed');
  } else if (error.code === 'NOT_FOUND') {
    console.log('Activity not found');
  }
}
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Issues and pull requests are welcome on [GitHub](https://github.com/torqlab/strava-api).
