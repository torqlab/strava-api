import { describe, test, expect } from 'bun:test';
import validateActivityId from './validate-activity-id';
import { StravaApiError } from '../../types';

type Case = [
  string,
  {
    activityId: string | undefined | null;
    shouldThrow: boolean;
    expectedError?: StravaApiError;
  },
];

const parseError = (error: Error): StravaApiError => JSON.parse(error.message) as StravaApiError;

describe('validate-activity-id', () => {
  test.each<Case>([
    [
      'validates numeric string activity ID',
      {
        activityId: '123456789',
        shouldThrow: false,
      },
    ],
    [
      'validates numeric activity ID as string',
      {
        activityId: '987654321',
        shouldThrow: false,
      },
    ],
    [
      'throws error for undefined activity ID',
      {
        activityId: undefined,
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID is required',
          retryable: false,
        },
      },
    ],
    [
      'throws error for null activity ID',
      {
        activityId: null as unknown as string,
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID is required',
          retryable: false,
        },
      },
    ],
    [
      'throws error for empty string activity ID',
      {
        activityId: '',
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID cannot be empty',
          retryable: false,
        },
      },
    ],
    [
      'throws error for whitespace-only activity ID',
      {
        activityId: '   ',
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID cannot be empty',
          retryable: false,
        },
      },
    ],
    [
      'throws error for non-numeric activity ID',
      {
        activityId: 'abc123',
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID must be a valid number',
          retryable: false,
        },
      },
    ],
    [
      'throws error for zero activity ID',
      {
        activityId: '0',
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID must be a positive number',
          retryable: false,
        },
      },
    ],
    [
      'throws error for negative activity ID',
      {
        activityId: '-123',
        shouldThrow: true,
        expectedError: {
          code: 'INVALID_ID',
          message: 'Activity ID must be a positive number',
          retryable: false,
        },
      },
    ],
    [
      'validates large numeric activity ID',
      {
        activityId: '12345678987654321',
        shouldThrow: false,
      },
    ],
    [
      'trims whitespace from valid activity ID',
      {
        activityId: '  123456  ',
        shouldThrow: false,
      },
    ],
  ])('%#. %s', (_name, { activityId, shouldThrow, expectedError }) => {
    if (shouldThrow) {
      expect(() => {
        validateActivityId(activityId!);
      }).toThrow();

      try {
        validateActivityId(activityId!);
      } catch (error) {
        const parsedError = parseError(error as Error);
        expect(parsedError.code).toStrictEqual(expectedError!.code);
        expect(parsedError.message).toStrictEqual(expectedError!.message);
        expect(parsedError.retryable).toStrictEqual(expectedError!.retryable);
      }
    } else {
      expect(() => {
        validateActivityId(activityId!);
      }).not.toThrow();
    }
  });
});
