export class NeyrsError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'NeyrsError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class ParseError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'PARSE_ERROR', 400, details);
    this.name = 'ParseError';
  }
}

export class InsufficientBalanceError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'INSUFFICIENT_BALANCE', 400, details);
    this.name = 'InsufficientBalanceError';
  }
}

export class TransactionError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'TRANSACTION_ERROR', 500, details);
    this.name = 'TransactionError';
  }
}

export class NetworkError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', 503, details);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends NeyrsError {
  constructor(message: string, public retryAfter: number) {
    super(message, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
    this.name = 'RateLimitError';
  }
}

export class CommerceError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'COMMERCE_ERROR', 500, details);
    this.name = 'CommerceError';
  }
}

export class AIServiceError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'AI_SERVICE_ERROR', 503, details);
    this.name = 'AIServiceError';
  }
}

export class ConfigurationError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 500, details);
    this.name = 'ConfigurationError';
  }
}

export class TimeoutError extends NeyrsError {
  constructor(message: string, details?: unknown) {
    super(message, 'TIMEOUT_ERROR', 408, details);
    this.name = 'TimeoutError';
  }
}
