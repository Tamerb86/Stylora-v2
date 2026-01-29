import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Send success response with message
 */
export function sendSuccessWithMessage<T>(
  res: Response,
  data: T,
  message: string,
  statusCode = 200
): void {
  res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

/**
 * Send paginated response
 */
export function sendPaginated<T>(
  res: Response,
  items: T[],
  page: number,
  limit: number,
  total: number
): void {
  res.status(200).json({
    success: true,
    data: {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  error: string,
  message?: string,
  statusCode = 400
): void {
  res.status(statusCode).json({
    success: false,
    error,
    message: message ?? error,
  });
}

/**
 * Send not found response
 */
export function sendNotFound(
  res: Response,
  resource = 'Resource'
): void {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `${resource} not found`,
  });
}

/**
 * Send unauthorized response
 */
export function sendUnauthorized(
  res: Response,
  message = 'Unauthorized'
): void {
  res.status(401).json({
    success: false,
    error: 'Unauthorized',
    message,
  });
}

/**
 * Send forbidden response
 */
export function sendForbidden(
  res: Response,
  message = 'Forbidden'
): void {
  res.status(403).json({
    success: false,
    error: 'Forbidden',
    message,
  });
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response,
  errors: Record<string, string[]> | string
): void {
  res.status(422).json({
    success: false,
    error: 'Validation Error',
    message: typeof errors === 'string' ? errors : 'Invalid input data',
    errors: typeof errors === 'object' ? errors : undefined,
  });
}

/**
 * Send internal server error response
 */
export function sendServerError(
  res: Response,
  message = 'Internal Server Error'
): void {
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message,
  });
}
