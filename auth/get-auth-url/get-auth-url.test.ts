import { describe, test, expect } from 'bun:test';
import getAuthorizationUrl from './get-auth-url';
import { StravaAuthConfig, StravaAuthError } from '../types';

type Case = [
  string,
  {
    config: StravaAuthConfig;
    shouldThrow: boolean;
    expectedError?: StravaAuthError;
    expectedUrlContains?: string[];
  },
];

const parseError = (error: Error): StravaAuthError => JSON.parse(error.message) as StravaAuthError;

describe('get-authorization-url', () => {
  test.each<Case>([
    [
      'generates authorization URL with all parameters',
      {
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
          scope: 'activity:read',
        },
        shouldThrow: false,
        expectedUrlContains: [
          'https://www.strava.com/oauth/authorize',
          'client_id=12345',
          'response_type=code',
          'redirect_uri=http%3A%2F%2Flocalhost',
          'scope=activity%3Aread',
          'approval_prompt=force',
        ],
      },
    ],
    [
      'generates authorization URL with default scope',
      {
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        shouldThrow: false,
        expectedUrlContains: [
          'https://www.strava.com/oauth/authorize',
          'client_id=12345',
          'scope=activity%3Aread',
        ],
      },
    ],
    [
      'generates authorization URL with activity:read_all scope',
      {
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
          scope: 'activity:read_all',
        },
        shouldThrow: false,
        expectedUrlContains: ['scope=activity%3Aread_all'],
      },
    ],
    [
      'throws error for missing client ID',
      {
        config: {
          clientId: '',
          clientSecret: 'secret',
          redirectUri: 'http://localhost',
        },
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_CONFIG',
          message: 'Client ID is required',
        },
      },
    ],
    [
      'throws error for missing redirect URI',
      {
        config: {
          clientId: '12345',
          clientSecret: 'secret',
          redirectUri: '',
        },
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_CONFIG',
          message: 'Redirect URI is required',
        },
      },
    ],
  ])('%#. %s', (_name, { config, shouldThrow, expectedError, expectedUrlContains }) => {
    if (shouldThrow) {
      expect(() => {
        getAuthorizationUrl(config);
      }).toThrow();

      try {
        getAuthorizationUrl(config);
      } catch (error) {
        const parsedError = parseError(error as Error);
        expect(parsedError.code).toStrictEqual(expectedError!.code);
        expect(parsedError.message).toStrictEqual(expectedError!.message);
      }
    } else {
      const url = getAuthorizationUrl(config);
      expect(url).toBeString();
      expect(url).toStartWith('https://www.strava.com/oauth/authorize');

      if (expectedUrlContains) {
        for (const contains of expectedUrlContains) {
          expect(url).toContain(contains);
        }
      }
    }
  });
});
