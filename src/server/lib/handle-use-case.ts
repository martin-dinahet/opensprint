import type { Result } from "@punpun-dev/ts-result";
import type { AppError, HttpStatusCode } from "@/server/features/shared/errors";

export interface UseCaseError {
  code: string;
  message: string;
  statusCode: HttpStatusCode;
}

export interface UseCaseResult<T> {
  data: T | null;
  error: UseCaseError | null;
}

export const handleUseCase = async <T>(
  resultOrPromise: Result<T, AppError> | Promise<Result<T, AppError>>,
): Promise<UseCaseResult<T>> => {
  const result = await resultOrPromise;

  if (result.isErr()) {
    const error = result.error;
    const useCaseError: UseCaseError = {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
    };
    return { data: null, error: useCaseError };
  }

  return { data: result.unwrap(), error: null };
};
