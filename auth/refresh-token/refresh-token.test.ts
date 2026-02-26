import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import refreshToken from './refresh-token';
import { StravaAuthConfig, StravaAuthTokenRefreshResponse, StravaAuthError } from '../types';

type Case = [
  string,
  {
    refreshToken: string;
    config: StravaAuthConfig;
    mockResponse?: Response | Error;
    shouldThrow: boolean;
    expectedError?: StravaAuthError;
    expectedTokens?: StravaAuthTokenRefreshResponse;
  },
];

const parseError = (error: Error): StravaAuthError => JSON.parse(error.message) as StravaAuthError;

describe('refresh-token', () => {
  const fetchState = { originalFetch: globalThis.fetch };

  beforeEach(() => {
    fetchState.originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchState.originalFetch;
  });

  test.each<Case>([
    [
      'successfully refreshes access token',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            access_token: 'new-access-token-123',
            refresh_token: 'new-refresh-token-123',
            expires_at: 1234567890,
            expires_in: 21600,
            token_type: 'Bearer',
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedTokens: {
          access_token: 'new-access-token-123',
          refresh_token: 'new-refresh-token-123',
          expires_at: 1234567890,
          expires_in: 21600,
          token_type: 'Bearer',
        },
      },
    ],
    [
      'successfully refreshes token without new refresh token',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            access_token: 'new-access-token-123',
            expires_at: 1234567890,
            expires_in: 21600,
            token_type: 'Bearer',
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedTokens: {
          access_token: 'new-access-token-123',
          expires_at: 1234567890,
          expires_in: 21600,
          token_type: 'Bearer',
        },
      },
    ],
    [
      'throws error for missing refresh token',
      {
        refreshToken: '',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_CODE',
          message: 'Refresh token is required',
        },
      },
    ],
    [
      'throws error for missing client ID',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_CONFIG',
          message: 'Client ID and client secret are required',
        },
      },
    ],
    [
      'throws error for 401 unauthorized',
      {
        refreshToken: 'invalid-refresh-token',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response('Unauthorized', { status: 401 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Invalid client credentials or refresh token',
        },
      },
    ],
    [
      'throws error for missing access token in response',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            refresh_token: 'new-refresh-token-123',
            expires_at: 1234567890,
          }),
          { status: 200 },
        ),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Access token not found in refresh response',
        },
      },
    ],
    [
      'throws error for malformed JSON response',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response('invalid json', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Invalid response format from token refresh endpoint',
        },
      },
    ],
    [
      'throws error for network failure',
      {
        refreshToken: 'refresh-token-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: undefined,
        shouldThrow: true,
        expectedError: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to Strava OAuth endpoint',
        },
      },
    ],
  ])(
    '%#. %s',
    async (
      _name,
      { refreshToken: token, config, mockResponse, shouldThrow, expectedError, expectedTokens },
    ) => {
      if (mockResponse === undefined) {
        // @ts-expect-error - mockResponse is an Error
        globalThis.fetch = () => {
          throw new Error('Network error');
        };
      } else {
        // @ts-expect-error - mockResponse is a Response
        globalThis.fetch = () => Promise.resolve(mockResponse);
      }

      if (shouldThrow) {
        expect(async () => {
          await refreshToken(token, config);
        }).toThrow();

        try {
          await refreshToken(token, config);
        } catch (error) {
          const parsedError = parseError(error as Error);
          expect(parsedError.code).toStrictEqual(expectedError!.code);
          expect(parsedError.message).toStrictEqual(expectedError!.message);
        }
      } else {
        const result = await refreshToken(token, config);
        expect(result).toStrictEqual(expectedTokens ?? null);
      }
    },
  );
});
