import { handle as handleResult } from "@punpun-dev/ts-result";
import { AppError } from "@/server/features/shared/errors";

export const toAppError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  return new AppError("database-error", message, 500);
};

export const handle = async <T>(fn: () => T | Promise<T>) => {
  const result = await handleResult(fn);
  return result.mapErr(toAppError);
};
