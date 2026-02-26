import { describe, test, expect } from 'bun:test';
import getAuthHeaders from './get-auth-headers';
import { StravaApiConfig } from '../../types';

type Case = [
  string,
  {
    config: StravaApiConfig;
    expected: HeadersInit;
  },
];

describe('get-auth-headers', () => {
  test.each<Case>([
    [
      'builds Authorization header with Bearer token',
      {
        config: {
          accessToken: 'test-access-token-123',
        },
        expected: {
          Authorization: 'Bearer test-access-token-123',
        },
      },
    ],
    [
      'builds Authorization header with long token',
      {
        config: {
          accessToken: 'a-very-long-access-token-string-that-contains-many-characters',
        },
        expected: {
          Authorization: 'Bearer a-very-long-access-token-string-that-contains-many-characters',
        },
      },
    ],
    [
      'builds Authorization header with token containing special characters',
      {
        config: {
          accessToken: 'token-with-special-chars-123!@#$%',
        },
        expected: {
          Authorization: 'Bearer token-with-special-chars-123!@#$%',
        },
      },
    ],
  ])('%#. %s', (_name, { config, expected }) => {
    const result = getAuthHeaders(config);
    expect(result).toStrictEqual(expected);
  });
});
