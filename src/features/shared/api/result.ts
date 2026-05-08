import { err, ok, type Result } from "@punpun-dev/ts-result";

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

const readJson = async (response: Response): Promise<unknown> => {
  try {
    return await response.json();
  } catch {
    return null;
  }
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

export const unwrapClientResult = <T>(result: Result<T, ClientApiError>) => {
  if (result.isErr()) {
    throw result.error;
  }

  return result.unwrap();
};
