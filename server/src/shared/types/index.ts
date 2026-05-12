import type { Request } from 'express';

export interface AuthPayload { id: string; email: string; username: string; }
export interface AuthenticatedRequest extends Request { user: AuthPayload; }
export interface ApiResponse<T = unknown> { success: boolean; data?: T; message?: string; }
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}
export interface PaginationQuery { page?: number; limit?: number; }
