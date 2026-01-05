// ============================================================================
// CAMPUSTRACK - OBSERVABILITY UTILITIES
// ============================================================================
// Production-grade error tracking and performance monitoring
// This module provides passive, non-intrusive observability

/**
 * Error severity levels
 */
export type ErrorSeverity = "error" | "warning" | "info"

/**
 * Error context for logging
 */
export interface ErrorContext {
    actionName?: string
    route?: string
    userRole?: string
    userId?: string
    timestamp: string
    severity: ErrorSeverity
}

/**
 * Performance timing context
 */
export interface TimingContext {
    actionName: string
    durationMs: number
    timestamp: string
    success: boolean
}

/**
 * Redact sensitive fields from objects
 * NEVER log passwords, tokens, or PII
 */
function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ["password", "token", "secret", "authorization", "cookie", "email"]
    const redacted: Record<string, unknown> = {}

    for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase()
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            redacted[key] = "[REDACTED]"
        } else if (typeof value === "object" && value !== null) {
            redacted[key] = redactSensitiveData(value as Record<string, unknown>)
        } else {
            redacted[key] = value
        }
    }

    return redacted
}

/**
 * Log error to console in production-safe format
 * In production, this would send to Sentry/Datadog/etc.
 */
export function logError(
    error: Error | unknown,
    context: Partial<ErrorContext> = {}
): void {
    const fullContext: ErrorContext = {
        timestamp: new Date().toISOString(),
        severity: "error",
        ...context,
    }

    const errorMessage = error instanceof Error ? error.message : String(error)
    const errorStack = error instanceof Error ? error.stack : undefined

    // Production logging format (console for now, can be replaced with external service)
    if (process.env.NODE_ENV === "production") {
        console.error(JSON.stringify({
            type: "ERROR",
            message: errorMessage,
            context: fullContext,
            // Stack trace only in non-production or for critical errors
        }))
    } else {
        // Development: more verbose logging
        console.error("[CampusTrack Error]", {
            message: errorMessage,
            context: fullContext,
            stack: errorStack,
        })
    }

    // TODO: Replace with actual error tracking service integration
    // Example: Sentry.captureException(error, { extra: fullContext })
}

/**
 * Log warning (non-critical issues)
 */
export function logWarning(
    message: string,
    context: Partial<ErrorContext> = {}
): void {
    const fullContext: ErrorContext = {
        timestamp: new Date().toISOString(),
        severity: "warning",
        ...context,
    }

    if (process.env.NODE_ENV === "production") {
        console.warn(JSON.stringify({
            type: "WARNING",
            message,
            context: fullContext,
        }))
    } else {
        console.warn("[CampusTrack Warning]", message, fullContext)
    }
}

/**
 * Log performance timing
 */
export function logTiming(timing: TimingContext): void {
    // Only log slow operations (>1000ms) in production
    if (process.env.NODE_ENV === "production" && timing.durationMs < 1000) {
        return
    }

    if (process.env.NODE_ENV === "production") {
        console.info(JSON.stringify({
            type: "TIMING",
            ...timing,
        }))
    } else {
        console.info(`[CampusTrack Timing] ${timing.actionName}: ${timing.durationMs}ms`, {
            success: timing.success,
            timestamp: timing.timestamp,
        })
    }
}

/**
 * Wrap a server action with observability
 * Adds timing and error logging without changing behavior
 */
export function withObservability<T extends (...args: unknown[]) => Promise<unknown>>(
    actionName: string,
    action: T
): T {
    return (async (...args: unknown[]) => {
        const startTime = Date.now()
        const timestamp = new Date().toISOString()

        try {
            const result = await action(...args)

            logTiming({
                actionName,
                durationMs: Date.now() - startTime,
                timestamp,
                success: true,
            })

            return result
        } catch (error) {
            logTiming({
                actionName,
                durationMs: Date.now() - startTime,
                timestamp,
                success: false,
            })

            logError(error, {
                actionName,
                severity: "error",
            })

            // Re-throw to preserve original behavior
            throw error
        }
    }) as T
}

/**
 * Create a performance timer for manual timing
 */
export function createTimer(name: string): { stop: (success?: boolean) => void } {
    const startTime = Date.now()
    const timestamp = new Date().toISOString()

    return {
        stop: (success = true) => {
            logTiming({
                actionName: name,
                durationMs: Date.now() - startTime,
                timestamp,
                success,
            })
        },
    }
}

/**
 * Report client-side error (for error boundary)
 */
export function reportClientError(
    error: Error,
    errorInfo?: { componentStack?: string }
): void {
    logError(error, {
        actionName: "client-error-boundary",
        severity: "error",
    })

    // In development, log component stack
    if (process.env.NODE_ENV !== "production" && errorInfo?.componentStack) {
        console.error("[Component Stack]", errorInfo.componentStack)
    }
}
