// ============================================================================
// CAMPUSTRACK - SERVER ACTION RESPONSE TYPES
// ============================================================================
// Standard response format for all Server Actions

/**
 * Standard success response
 */
export interface ActionSuccess<T = unknown> {
    success: true
    data: T
    message?: string
}

/**
 * Standard error response
 */
export interface ActionError {
    success: false
    error: string
    code?: string
}

/**
 * Union type for all action responses
 */
export type ActionResult<T = unknown> = ActionSuccess<T> | ActionError

/**
 * Helper to create success response
 */
export function successResponse<T>(data: T, message?: string): ActionSuccess<T> {
    return {
        success: true,
        data,
        message,
    }
}

/**
 * Helper to create error response
 */
export function errorResponse(error: string, code?: string): ActionError {
    return {
        success: false,
        error,
        code,
    }
}

/**
 * Pagination params
 */
export interface PaginationParams {
    page?: number
    limit?: number
}

/**
 * Paginated response
 */
export interface PaginatedData<T> {
    items: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}
