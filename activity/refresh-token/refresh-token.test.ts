import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import refreshToken from './refresh-token';
import { StravaApiConfig, StravaApiError } from '../../types';

type Case = [
  string,
  {
    config: StravaApiConfig;
    mockResponse: Response | Error;
    shouldThrow: boolean;
    expectedError?: StravaApiError;
    expectedToken?: string;
  },
];

const parseError = (error: Error): StravaApiError => {
  const parsed = JSON.parse(error.message) as unknown;
  return parsed as StravaApiError;
};

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
      'successfully refreshes token',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token-123',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockResponse: new Response(
          JSON.stringify({
            access_token: 'new-access-token-456',
            refresh_token: 'new-refresh-token-789',
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedToken: 'new-access-token-456',
      },
    ],
    [
      'throws error when refresh token is missing',
      {
        config: {
          accessToken: 'old-token',
        },
        mockResponse: new Response('', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token is not available',
          retryable: false,
        },
      },
    ],
    [
      'throws error when client ID is missing',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          clientSecret: 'client-secret',
        },
        mockResponse: new Response('', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Client ID and client secret are required for token refresh',
          retryable: false,
        },
      },
    ],
    [
      'throws error when client secret is missing',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          clientId: 'client-id',
        },
        mockResponse: new Response('', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Client ID and client secret are required for token refresh',
          retryable: false,
        },
      },
    ],
    [
      'throws error for failed refresh request',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'invalid-refresh-token',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockResponse: new Response('Unauthorized', { status: 401 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Token refresh failed',
          retryable: false,
        },
      },
    ],
    [
      'throws error for network failure',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockResponse: new Error('Network error'),
        shouldThrow: true,
        expectedError: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to Strava OAuth endpoint',
          retryable: false,
        },
      },
    ],
    [
      'throws error for malformed response',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockResponse: new Response('invalid json', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Invalid response format from token refresh endpoint',
          retryable: false,
        },
      },
    ],
    [
      'throws error when access token is missing in response',
      {
        config: {
          accessToken: 'old-token',
          refreshToken: 'refresh-token',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockResponse: new Response(
          JSON.stringify({
            refresh_token: 'new-refresh-token',
          }),
          { status: 200 },
        ),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Access token not found in refresh response',
          retryable: false,
        },
      },
    ],
  ])(
    '%#. %s',
    async (_name, { config, mockResponse, shouldThrow, expectedError, expectedToken }) => {
      if (mockResponse instanceof Error) {
        // @ts-expect-error - mockResponse is an Error
        globalThis.fetch = () => {
          throw mockResponse;
        };
      } else {
        // @ts-expect-error - mockResponse is a Response
        globalThis.fetch = () => Promise.resolve(mockResponse);
      }

      if (shouldThrow) {
        expect(async () => {
          await refreshToken(config);
        }).toThrow();

        try {
          await refreshToken(config);
        } catch (error) {
          const parsedError = parseError(error as Error);
          expect(parsedError.code).toStrictEqual(expectedError!.code);
          expect(parsedError.message).toStrictEqual(expectedError!.message);
        }
      } else {
        const result = await refreshToken(config);
        expect(result).toBe(String(expectedToken));
      }
    },
  );
});
