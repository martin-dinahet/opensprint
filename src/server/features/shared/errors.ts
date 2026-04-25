export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 500;

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: HttpStatusCode = 400,
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource.toLowerCase()}-not-found`, `${resource} not found`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super("unauthorized", message, 403);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super("forbidden", message, 403);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("validation-error", message, 400);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("conflict", message, 409);
  }
}