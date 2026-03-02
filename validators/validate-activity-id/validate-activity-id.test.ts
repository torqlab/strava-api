import { describe, test, expect } from 'bun:test';
import validateActivityId from './validate-activity-id';
import { StravaApiError } from '../../types';

type Case = [string, string, StravaApiError | null];

const parseError = (error: Error): StravaApiError => JSON.parse(error.message) as StravaApiError;

describe('validate-activity-id', () => {
  test.each<Case>([
    ['validates numeric string activity ID', '123456789', null],
    ['validates numeric activity ID as string', '987654321', null],
    [
      'throws error for undefined activity ID',
      undefined as unknown as string,
      {
        code: 'INVALID_ID',
        message: 'Activity ID must be a valid positive number',
        retryable: false,
      },
    ],
    [
      'throws error for null activity ID',
      null as unknown as string,
      {
        code: 'INVALID_ID',
        message: 'Activity ID must be a valid positive number',
        retryable: false,
      },
    ],
    [
      'throws error for empty string activity ID',
      '',
      {
        code: 'INVALID_ID',
        message: 'Activity ID is required and cannot be empty',
        retryable: false,
      },
    ],
    [
      'throws error for whitespace-only activity ID',
      '   ',
      {
        code: 'INVALID_ID',
        message: 'Activity ID is required and cannot be empty',
        retryable: false,
      },
    ],
    [
      'throws error for non-numeric activity ID',
      'abc123',
      {
        code: 'INVALID_ID',
        message: 'Activity ID must be a valid positive number',
        retryable: false,
      },
    ],
    [
      'throws error for zero activity ID',
      '0',
      {
        code: 'INVALID_ID',
        message: 'Activity ID must be a valid positive number',
        retryable: false,
      },
    ],
    [
      'throws error for negative activity ID',
      '-123',
      {
        code: 'INVALID_ID',
        message: 'Activity ID must be a valid positive number',
        retryable: false,
      },
    ],
    ['validates large numeric activity ID', '12345678987654321', null],
    ['trims whitespace from valid activity ID', '  123456  ', null],
  ])('%#. %s', (_name, activityId, expectedError) => {
    if (expectedError) {
      expect(() => {
        validateActivityId(activityId);
      }).toThrow();

      try {
        validateActivityId(activityId);
      } catch (error) {
        const parsedError = parseError(error as Error);

        expect(parsedError.code).toStrictEqual(expectedError.code);
        expect(parsedError.message).toStrictEqual(expectedError.message);
        expect(parsedError.retryable).toStrictEqual(expectedError.retryable);
      }
    } else {
      expect(() => {
        validateActivityId(activityId!);
      }).not.toThrow();
    }
  });
});
