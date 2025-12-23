export class RepositoryError extends Error {
  constructor(message, status = 500, type = "repository", details) {
    super(message);
    this.name = "RepositoryError";
    this.status = status;
    this.type = type;
    this.details = details;
  }
}

export class ValidationError extends RepositoryError {
  constructor(message, details) {
    super(message, 400, "validation", details);
    this.name = "ValidationError";
  }
}

export class ConflictError extends RepositoryError {
  constructor(message, details) {
    super(message, 409, "conflict", details);
    this.name = "ConflictError";
  }
}

export class NotFoundError extends RepositoryError {
  constructor(message, details) {
    super(message, 404, "not_found", details);
    this.name = "NotFoundError";
  }
}

