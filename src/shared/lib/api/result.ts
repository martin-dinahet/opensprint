import { err, handle, ok, type Result } from "@punpun-dev/ts-result";

type ErrorBody = {
  errors?: {
    root?: string | string[];
  };
};

export class ClientApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

const toError = (error: unknown, fallbackMessage: string, status = 0) => {
  if (error instanceof ClientApiError) return error;
  if (error instanceof Error) return new ClientApiError(error.message || fallbackMessage, status);
  return new ClientApiError(fallbackMessage, status);
};

const readJson = async (response: Response): Promise<unknown> => {
  const result = await handle(() => response.json());
  return result.unwrapOr(null);
};

export const toClientApiError = (response: Response, body: unknown, fallbackMessage: string) => {
  const root = (body as ErrorBody | null)?.errors?.root;
  const message = Array.isArray(root) ? root[0] : root;

  return new ClientApiError(message || fallbackMessage, response.status);
};

export const readApiResult = async <T>(
  response: Response,
  fallbackMessage: string,
  readData: (body: unknown) => T | null | undefined = (body) => body as T,
): Promise<Result<T, ClientApiError>> => {
  const body = await readJson(response);

  if (!response.ok) {
    return err(toClientApiError(response, body, fallbackMessage));
  }

  const data = readData(body);

  if (data === null || data === undefined) {
    return err(new ClientApiError(fallbackMessage, response.status));
  }

  return ok(data);
};

export const requestApiResult = async <T>(
  request: () => Promise<Response>,
  fallbackMessage: string,
  readData?: (body: unknown) => T | null | undefined,
): Promise<Result<T, ClientApiError>> => {
  const responseResult = await handle(request);
  if (responseResult.isErr()) {
    return err(toError(responseResult.error, fallbackMessage));
  }

  return readApiResult(responseResult.unwrap(), fallbackMessage, readData);
};

export const handleClientResult = async <T>(
  fn: () => T | Promise<T>,
  fallbackMessage: string,
): Promise<Result<T, ClientApiError>> => {
  const result = await handle(fn);
  return result.mapErr((error) => toError(error, fallbackMessage));
};

export const unwrapClientResult = <T>(result: Result<T, ClientApiError>) => {
  if (result.isErr()) {
    throw result.error;
  }

  return result.unwrap();
};
