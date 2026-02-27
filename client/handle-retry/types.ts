export type RetryFunction<T> = () => Promise<T>;

export interface Input<T> {
  fn: RetryFunction<T>;
  maxRetries: number;
  initialBackoffMs?: number;
}
