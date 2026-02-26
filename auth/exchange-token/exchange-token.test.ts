import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import exchangeToken from './exchange-token';
import { StravaAuthConfig, StravaAuthTokenResponse, StravaAuthError } from '../types';

type Case = [
  string,
  {
    code: string;
    config: StravaAuthConfig;
    mockResponse?: Response;
    shouldThrow: boolean;
    expectedError?: StravaAuthError;
    expectedTokens?: StravaAuthTokenResponse;
  },
];

const parseError = (error: Error): StravaAuthError => JSON.parse(error.message) as StravaAuthError;

describe('exchange-token', () => {
  const fetchState = { originalFetch: globalThis.fetch };

  beforeEach(() => {
    fetchState.originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchState.originalFetch;
  });

  test.each<Case>([
    [
      'successfully exchanges authorization code for tokens',
      {
        code: 'auth-code-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            access_token: 'access-token-123',
            refresh_token: 'refresh-token-123',
            expires_at: 1234567890,
            expires_in: 21600,
            token_type: 'Bearer',
            athlete: {
              id: 12345,
            },
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedTokens: {
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          expires_at: 1234567890,
          expires_in: 21600,
          token_type: 'Bearer',
          athlete: {
            id: 12345,
          },
        },
      },
    ],
    [
      'throws error for missing authorization code',
      {
        code: '',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_CODE',
          message: 'Authorization code is required',
        },
      },
    ],
    [
      'throws error for missing client ID',
      {
        code: 'auth-code-123',
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
      'throws error for missing client secret',
      {
        code: 'auth-code-123',
        config: {
          clientId: '12345',
          clientSecret: '',
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
        code: 'invalid-code',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response('Unauthorized', { status: 401 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Invalid client credentials or authorization code',
        },
      },
    ],
    [
      'throws error for missing access token in response',
      {
        code: 'auth-code-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            refresh_token: 'refresh-token-123',
            expires_at: 1234567890,
          }),
          { status: 200 },
        ),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Access token not found in response',
        },
      },
    ],
    [
      'throws error for missing refresh token in response',
      {
        code: 'auth-code-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response(
          JSON.stringify({
            access_token: 'access-token-123',
            expires_at: 1234567890,
          }),
          { status: 200 },
        ),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Refresh token not found in response',
        },
      },
    ],
    [
      'throws error for malformed JSON response',
      {
        code: 'auth-code-123',
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        mockResponse: new Response('invalid json', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Invalid response format from token endpoint',
        },
      },
    ],
    [
      'throws error for network failure',
      {
        code: 'auth-code-123',
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
    async (_name, { code, config, mockResponse, shouldThrow, expectedError, expectedTokens }) => {
      if (mockResponse === undefined) {
        globalThis.fetch = (() => {
          throw new Error('Network error');
        }) as unknown as typeof fetch;
      } else {
        globalThis.fetch = (() => Promise.resolve(mockResponse)) as unknown as typeof fetch;
      }

      if (shouldThrow) {
        expect(async () => {
          await exchangeToken(code, config);
        }).toThrow();

        try {
          await exchangeToken(code, config);
        } catch (error) {
          const parsedError = parseError(error as Error);
          expect(parsedError.code).toStrictEqual(expectedError!.code);
          expect(parsedError.message).toStrictEqual(expectedError!.message);
        }
      } else {
        const result = await exchangeToken(code, config);
        expect(result).toStrictEqual(expectedTokens ?? null);
      }
    },
  );
});
