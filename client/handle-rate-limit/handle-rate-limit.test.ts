import { describe, test, expect } from 'bun:test';
import handleRateLimit from './handle-rate-limit';

type Case = [string, Response, number];

describe('handle-rate-limit', () => {
  describe('short wait', () => {
    test.each<Case>([
      [
        'waits default time when Retry-After is missing',
        new Response('Rate Limited', {
          status: 429,
        }),
        Number.NaN,
      ],
      [
        'waits default time when rate limit headers are present but usage is below limit',
        new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '500',
          },
        }),
        Number.NaN,
      ],
      [
        'waits window time when usage equals limit',
        new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '600',
          },
        }),
        Number.NaN,
      ],
      [
        'waits window time when usage exceeds limit',
        new Response('Rate Limited', {
          status: 429,
          headers: {
            'X-RateLimit-Limit': '600',
            'X-RateLimit-Usage': '650',
          },
        }),
        Number.NaN,
      ],
    ])(
      '%#. %s',
      async (_name, response) => {
        expect(response.status).toBe(429);
      },
      10000,
    );
  });

  test.each<Case>([
    [
      'waits for Retry-After header value',
      new Response('Rate Limited', {
        status: 429,
        headers: {
          'Retry-After': '1',
        },
      }),
      1000,
    ],
    [
      'waits for Retry-After header with longer value',
      new Response('Rate Limited', {
        status: 429,
        headers: {
          'Retry-After': '2',
        },
      }),
      2000,
    ],
    [
      'prioritizes Retry-After over rate limit headers',
      new Response('Rate Limited', {
        status: 429,
        headers: {
          'Retry-After': '1',
          'X-RateLimit-Limit': '600',
          'X-RateLimit-Usage': '600',
        },
      }),
      1000,
    ],
  ])(
    '%#. %s',
    async (_name, response, expectedWaitMs) => {
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
