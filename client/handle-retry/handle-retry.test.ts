import { describe, test, expect } from 'bun:test';

import handleRetry from './handle-retry';
import type { StravaApiError } from '../../types';
import type { Input } from './types';

type Case = [
  string,
  Input<string>,
  {
    expectedOk: boolean;
    expectedAttempts: number;
  },
];

const createRetryableError = (): Error => {
  const error: StravaApiError = {
    code: 'SERVER_ERROR',
    message: 'Server error',
    retryable: true,
  };

  return new Error(JSON.stringify(error));
};

const createNonRetryableError = (): Error => {
  const error: StravaApiError = {
    code: 'INVALID_ID',
    message: 'Invalid ID',
    retryable: false,
  };

  return new Error(JSON.stringify(error));
};

describe('handle-retry', () => {
  test.each<Case>([
    [
      'succeeds on first attempt',
      {
        fn: () => Promise.resolve('success'),
        maxRetries: 3,
      },
      {
        expectedOk: true,
        expectedAttempts: 1,
      },
    ],
    [
      'retries and succeeds on second attempt',
      {
        fn: (() => {
          const attemptCounter = { count: 0 };
          return () => {
            attemptCounter.count = attemptCounter.count + 1;
            if (attemptCounter.count === 1) {
              throw createRetryableError();
            }
            return Promise.resolve('success');
          };
        })(),
        maxRetries: 3,
      },
      {
        expectedOk: true,
        expectedAttempts: 2,
      },
    ],
    [
      'retries up to max retries then throws',
      {
        fn: () => {
          throw createRetryableError();
        },
        maxRetries: 2,
      },
      {
        expectedOk: false,
        expectedAttempts: 3,
      },
    ],
    [
      'does not retry non-retryable errors',
      {
        fn: () => {
          throw createNonRetryableError();
        },
        maxRetries: 3,
      },
      {
        expectedOk: false,
        expectedAttempts: 1,
      },
    ],
    [
      'succeeds after multiple retries',
      {
        fn: (() => {
          const attemptCounter = { count: 0 };
          return () => {
            attemptCounter.count = attemptCounter.count + 1;
            if (attemptCounter.count < 3) {
              throw createRetryableError();
            }
            return Promise.resolve('success');
          };
        })(),
        maxRetries: 3,
      },
      {
        expectedOk: true,
        expectedAttempts: 3,
      },
    ],
  ])(
    '%#. %s',
    async (_name, input, { expectedOk, expectedAttempts }) => {
      const attemptCounter = { count: 0 };
      const wrappedFn = async () => {
        attemptCounter.count = attemptCounter.count + 1;
        return await input.fn();
      };

      if (expectedOk) {
        const result = await handleRetry({
          ...input,
          fn: wrappedFn,
        });

        expect(result).toBe('success');
        expect(attemptCounter.count).toBe(expectedAttempts);
      } else {
        expect(async () => {
          await handleRetry({
            ...input,
            fn: wrappedFn,
          });
        }).toThrow();
        expect(attemptCounter.count).toBe(expectedAttempts);
      }
    },
  );
});
