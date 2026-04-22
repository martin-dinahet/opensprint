export type Result<T> = Success<T> | Failure;

export interface Success<T> {
  data: T;
  error: null;
}

export interface Failure {
  data: null;
  error: string;
}
