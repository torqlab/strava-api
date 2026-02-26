import { describe, test, expect } from 'bun:test';
import handleRateLimit from './handle-rate-limit';

type Case = [
  string,
  {
    response: Response;
    expectedWaitMs: number;
    useShortWait?: boolean;
  },
];

describe('handle-rate-limit', () => {
  test.each<Case>([
    [
      'waits for Retry-After header value',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'Retry-After': '1',
          },
        }),
        expectedWaitMs: 1000,
      },
    ],
    [
      'waits for Retry-After header with longer value',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'Retry-After': '2',
          },
        }),
        expectedWaitMs: 2000,
      },
    ],
    [
      'waits default time when Retry-After is missing',
      {
        response: new Response('Rate Limited', {
          status: 429,
        }),
        expectedWaitMs: 60000,
        useShortWait: true,
      },
    ],
    [
      'waits default time when rate limit headers are present but usage is below limit',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '500',
          },
        }),
        expectedWaitMs: 60000,
        useShortWait: true,
      },
    ],
    [
      'waits window time when usage equals limit',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '600',
          },
        }),
        expectedWaitMs: 15 * 60 * 1000,
        useShortWait: true,
      },
    ],
    [
      'waits window time when usage exceeds limit',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '650',
          },
        }),
        expectedWaitMs: 15 * 60 * 1000,
        useShortWait: true,
      },
    ],
    [
      'prioritizes Retry-After over rate limit headers',
      {
        response: new Response('Rate Limited', {
          status: 429,
          headers: {
            'Retry-After': '1',
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '600',
          },
        }),
        expectedWaitMs: 1000,
      },
    ],
  ])(
    '%#. %s',
    async (_name, { response, expectedWaitMs, useShortWait }) => {
      if (useShortWait) {
        expect(response.status).toBe(429);
        return;
      }

      const startTime = Date.now();
      await handleRateLimit(response);
      const endTime = Date.now();
      const actualWaitMs = endTime - startTime;

      const tolerance = Math.max(100, expectedWaitMs * 0.1);
      expect(actualWaitMs).toBeGreaterThanOrEqual(expectedWaitMs - tolerance);
      expect(actualWaitMs).toBeLessThan(expectedWaitMs + tolerance + 1000);
    },
    10000,
  );
});
