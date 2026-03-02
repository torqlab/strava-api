import { describe, test, expect } from 'bun:test';

import getAuthHeaders from './get-auth-headers';
import { StravaApiConfig } from '../../types';

type Case = [string, StravaApiConfig, HeadersInit];

describe('get-auth-headers', () => {
  test.each<Case>([
    [
      'builds Authorization header with Bearer token',
      {
        accessToken: 'test-access-token-123',
      },
      {
        Authorization: 'Bearer test-access-token-123',
      },
    ],
    [
      'builds Authorization header with long token',
      {
        accessToken: 'a-very-long-access-token-string-that-contains-many-characters',
      },
      {
        Authorization: 'Bearer a-very-long-access-token-string-that-contains-many-characters',
      },
    ],
    [
      'builds Authorization header with token containing special characters',
      {
        accessToken: 'token-with-special-chars-123!@#$%',
      },
      {
        Authorization: 'Bearer token-with-special-chars-123!@#$%',
      },
    ],
  ])('%#. %s', (_name, config, expected) => {
    const result = getAuthHeaders(config);

    expect(result).toStrictEqual(expected);
  });
});
