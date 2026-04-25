import type { Result } from "@/lib/types/result";

type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export const handle = async <T>(promise: Promise<T>): Promise<Result<T>> => {
  try {
    const data = await promise;
    return { data, error: null };
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { data: null, error };
  }
};

export interface UseCaseError {
  code: string;
  message: string;
  statusCode: HttpStatusCode;
}

export interface UseCaseResult<T> {
  data: T | null;
  error: UseCaseError | null;
}

export const handleUseCase = async <T>(promise: Promise<T>): Promise<UseCaseResult<T>> => {
  const result = await handle(promise);
  if (result.error) {
    const useCaseError: UseCaseError = {
      code: "unknown",
      message: result.error,
      statusCode: 500,
    };
    return { data: null, error: useCaseError };
  }
  return { data: result.data, error: null };
};