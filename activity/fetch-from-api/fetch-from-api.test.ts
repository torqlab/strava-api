import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import fetchFromApi from './fetch-from-api';
import { StravaApiConfig } from '../../types';
import { StravaApiError, StravaActivity } from '../../types';

type Case = [
  string,
  {
    activityId: string;
    config: StravaApiConfig;
    mockResponse: Response | Error;
    shouldThrow: boolean;
    expectedError?: StravaApiError;
    expectedData?: StravaActivity;
  },
];

const parseError = (error: Error): StravaApiError => JSON.parse(error.message) as StravaApiError;

describe('fetch-from-api', () => {
  const fetchState = { originalFetch: globalThis.fetch };

  beforeEach(() => {
    fetchState.originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = fetchState.originalFetch;
  });

  test.each<Case>([
    [
      'successfully fetches activity data',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response(
          JSON.stringify({
            id: 123456,
            type: 'Ride',
            sport_type: 'MountainBikeRide',
            name: 'Test Activity',
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedData: {
          id: 123456,
          type: 'Ride',
          sport_type: 'MountainBikeRide',
          name: 'Test Activity',
        },
      },
    ],
    [
      'throws error for 404 not found',
      {
        activityId: '999999',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response('Not Found', { status: 404 }),
        shouldThrow: true,
        expectedError: {
          code: 'NOT_FOUND',
          message: 'Activity not found',
          retryable: false,
        },
      },
    ],
    [
      'throws error for 401 unauthorized',
      {
        activityId: '123456',
        config: {
          accessToken: 'invalid-token',
        },
        mockResponse: new Response('Unauthorized', { status: 401 }),
        shouldThrow: true,
        expectedError: {
          code: 'UNAUTHORIZED',
          message: 'Authentication failed. Token may be expired or invalid.',
          retryable: false,
        },
      },
    ],
    [
      'throws error for 403 forbidden',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response('Forbidden', { status: 403 }),
        shouldThrow: true,
        expectedError: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions to access this activity',
          retryable: false,
        },
      },
    ],
    [
      'throws error for 429 rate limited',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response('Rate Limited', { status: 429 }),
        shouldThrow: true,
        expectedError: {
          code: 'RATE_LIMITED',
          message: 'Rate limit exceeded. Please try again later.',
          retryable: true,
        },
      },
    ],
    [
      'throws error for 500 server error',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response('Server Error', { status: 500 }),
        shouldThrow: true,
        expectedError: {
          code: 'SERVER_ERROR',
          message: 'Strava API server error',
          retryable: true,
        },
      },
    ],
    [
      'throws error for network failure',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Error('Network error'),
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
        activityId: '123456',
        config: {
          accessToken: 'test-token',
        },
        mockResponse: new Response('invalid json', { status: 200 }),
        shouldThrow: true,
        expectedError: {
          code: 'MALFORMED_RESPONSE',
          message: 'Invalid response format from Strava API',
          retryable: false,
        },
      },
    ],
    [
      'uses custom base URL when provided',
      {
        activityId: '123456',
        config: {
          accessToken: 'test-token',
          baseUrl: 'https://custom-api.example.com/api/v3',
        },
        mockResponse: new Response(
          JSON.stringify({
            id: 123456,
            type: 'Ride',
            sport_type: 'MountainBikeRide',
          }),
          { status: 200 },
        ),
        shouldThrow: false,
        expectedData: {
          id: 123456,
          type: 'Ride',
          sport_type: 'MountainBikeRide',
        },
      },
    ],
  ])(
    '%#. %s',
    async (
      _name,
      { activityId, config, mockResponse, shouldThrow, expectedError, expectedData },
    ) => {
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
          await fetchFromApi(activityId, config);
        }).toThrow();

        try {
          await fetchFromApi(activityId, config);
        } catch (error) {
          const parsedError = parseError(error as Error);
          expect(parsedError.code).toStrictEqual(expectedError!.code);
          expect(parsedError.message).toStrictEqual(expectedError!.message);
          expect(parsedError.retryable).toStrictEqual(expectedError!.retryable);
        }
      } else {
        const result = await fetchFromApi(activityId, config);
        expect(result).toStrictEqual(expectedData ?? null);
      }
    },
  );
});
