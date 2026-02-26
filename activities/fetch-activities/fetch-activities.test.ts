import { describe, test, expect, beforeEach, afterEach } from 'bun:test';

import fetchActivities from './fetch-activities';
import { StravaApiConfig, StravaActivity, StravaApiError } from '../../types';

type Case = [
  string,
  {
    config: StravaApiConfig;
    mockFetch?: () => Promise<Response>;
    shouldThrow: boolean;
    expectedError?: StravaApiError;
    expectedActivities?: StravaActivity[];
  },
];

// Set longer timeout for tests that involve retries (default is 5000ms)
// Network failure test needs ~7s for retries (1s + 2s + 4s) plus execution time
const TEST_TIMEOUT = 15000;

const parseError = (error: Error): StravaApiError => JSON.parse(error.message) as StravaApiError;

describe('fetch-activities', () => {
  const fetchState = { originalFetch: globalThis.fetch };

  beforeEach(() => {
    fetchState.originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchState.originalFetch;
  });

  test.each<Case>([
    [
      'successfully fetches activities list',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () =>
          Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 123456,
                  type: 'Ride',
                  sport_type: 'MountainBikeRide',
                  name: 'Test Activity 1',
                  distance: 10000,
                  moving_time: 3600,
                  elapsed_time: 3800,
                  start_date: '2024-01-01T10:00:00Z',
                  total_elevation_gain: 500,
                },
                {
                  id: 123457,
                  type: 'Run',
                  sport_type: 'Run',
                  name: 'Test Activity 2',
                  distance: 5000,
                  moving_time: 1800,
                  elapsed_time: 1900,
                  start_date: '2024-01-02T08:00:00Z',
                  total_elevation_gain: 100,
                },
              ]),
              { status: 200 },
            ),
          ),
        shouldThrow: false,
        expectedActivities: [
          {
            id: 123456,
            type: 'Ride',
            sport_type: 'MountainBikeRide',
            name: 'Test Activity 1',
            distance: 10000,
            moving_time: 3600,
            elapsed_time: 3800,
            start_date: '2024-01-01T10:00:00Z',
            total_elevation_gain: 500,
          },
          {
            id: 123457,
            type: 'Run',
            sport_type: 'Run',
            name: 'Test Activity 2',
            distance: 5000,
            moving_time: 1800,
            elapsed_time: 1900,
            start_date: '2024-01-02T08:00:00Z',
            total_elevation_gain: 100,
          },
        ],
      },
    ],
    [
      'returns empty array when no activities',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () => Promise.resolve(new Response(JSON.stringify([]), { status: 200 })),
        shouldThrow: false,
        expectedActivities: [],
      },
    ],
    [
      'throws error for 401 unauthorized without refresh token',
      {
        config: {
          accessToken: 'invalid-token',
        },
        mockFetch: () => Promise.resolve(new Response('Unauthorized', { status: 401 })),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed. Token may be expired or invalid.',
          retryable: false,
        },
      },
    ],
    [
      'refreshes token and retries on 401 with refresh token available',
      {
        config: {
          accessToken: 'expired-token',
          refreshToken: 'refresh-token-123',
          clientId: 'client-id',
          clientSecret: 'client-secret',
        },
        mockFetch: (() => {
          const callCounter = { count: 0 };
          return () => {
            callCounter.count = callCounter.count + 1;
            if (callCounter.count === 1) {
              return Promise.resolve(new Response('Unauthorized', { status: 401 }));
            }
            if (callCounter.count === 2) {
              return Promise.resolve(
                new Response(
                  JSON.stringify({
                    access_token: 'new-access-token',
                  }),
                  { status: 200 },
                ),
              );
            }
            return Promise.resolve(
              new Response(
                JSON.stringify([
                  {
                    id: 123456,
                    type: 'Ride',
                    sport_type: 'Ride',
                  },
                ]),
                { status: 200 },
              ),
            );
          };
        })(),
        shouldThrow: false,
        expectedActivities: [
          {
            id: 123456,
            type: 'Ride',
            sport_type: 'Ride',
          },
        ],
      },
    ],
    [
      'throws error for 403 forbidden',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () => Promise.resolve(new Response('Forbidden', { status: 403 })),
        shouldThrow: true,
        expectedError: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access activities',
          retryable: false,
        },
      },
    ],
    [
      'retries on rate limit error',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: (() => {
          const callCounter = { count: 0 };
          return () => {
            callCounter.count = callCounter.count + 1;
            if (callCounter.count === 1) {
              return Promise.resolve(
                new Response('Rate Limited', {
                  status: 429,
                  headers: {
                    'Retry-After': '0.1',
                  },
                }),
              );
            }
            return Promise.resolve(
              new Response(
                JSON.stringify([
                  {
                    id: 123456,
                    type: 'Ride',
                    sport_type: 'Ride',
                  },
                ]),
                { status: 200 },
              ),
            );
          };
        })(),
        shouldThrow: false,
        expectedActivities: [
          {
            id: 123456,
            type: 'Ride',
            sport_type: 'Ride',
          },
        ],
      },
    ],
    [
      'retries on server error',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: (() => {
          const callCounter = { count: 0 };
          return () => {
            callCounter.count = callCounter.count + 1;
            if (callCounter.count === 1) {
              return Promise.resolve(new Response('Server Error', { status: 500 }));
            }
            return Promise.resolve(
              new Response(
                JSON.stringify([
                  {
                    id: 123456,
                    type: 'Ride',
                    sport_type: 'Ride',
                  },
                ]),
                { status: 200 },
              ),
            );
          };
        })(),
        shouldThrow: false,
        expectedActivities: [
          {
            id: 123456,
            type: 'Ride',
            sport_type: 'Ride',
          },
        ],
      },
    ],
    [
      'throws error for network failure',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () => {
          throw new Error('Network error');
        },
        shouldThrow: true,
        expectedError: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to Strava API',
          retryable: true,
        },
      },
    ],
    [
      'throws error for malformed JSON response',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () => Promise.resolve(new Response('invalid json', { status: 200 })),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Invalid response format from Strava API',
          retryable: false,
        },
      },
    ],
    [
      'throws error for non-array response',
      {
        config: {
          accessToken: 'test-token',
        },
        mockFetch: () =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                id: 123456,
                type: 'Ride',
              }),
              { status: 200 },
            ),
          ),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Expected array response from Strava API',
          retryable: false,
        },
      },
    ],
    [
      'uses custom base URL when provided',
      {
        config: {
          accessToken: 'test-token',
          baseUrl: 'https://custom-api.example.com/api/v3',
        },
        mockFetch: () =>
          Promise.resolve(
            new Response(
              JSON.stringify([
                {
                  id: 123456,
                  type: 'Ride',
                  sport_type: 'MountainBikeRide',
                },
              ]),
              { status: 200 },
            ),
          ),
        shouldThrow: false,
        expectedActivities: [
          {
            id: 123456,
            type: 'Ride',
            sport_type: 'MountainBikeRide',
          },
        ],
      },
    ],
  ])(
    '%#. %s',
    async (_name, { config, mockFetch, shouldThrow, expectedError, expectedActivities }) => {
      // Use longer timeout for network failure test to account for retries with backoff
      const timeout = _name === 'throws error for network failure' ? TEST_TIMEOUT : undefined;

      if (mockFetch !== undefined) {
        // @ts-expect-error - mockFetch is a function
        globalThis.fetch = mockFetch;
      }

      const testFn = async () => {
        if (shouldThrow) {
          expect(async () => {
            await fetchActivities(config);
          }).toThrow();

          try {
            await fetchActivities(config);
          } catch (error) {
            const parsedError = parseError(error as Error);
            expect(parsedError.code).toStrictEqual(expectedError!.code);
            expect(parsedError.message).toStrictEqual(expectedError!.message);
            if (expectedError!.retryable !== undefined) {
              expect(parsedError.retryable).toStrictEqual(expectedError!.retryable);
            }
          }
        } else {
          const result = await fetchActivities(config);
          expect(result).toStrictEqual(expectedActivities ?? []);
        }
      };

      if (timeout !== undefined) {
        await Promise.race([
          testFn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Test timeout')), timeout)),
        ]).catch((error: unknown) => {
          if ((error as Error).message === 'Test timeout') {
            throw new Error(`Test timed out after ${timeout}ms`);
          }
          throw error;
        });
      } else {
        await testFn();
      }
    },
    TEST_TIMEOUT,
  );
});
