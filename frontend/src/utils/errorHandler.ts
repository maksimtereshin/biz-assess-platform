/**
 * Centralized error handling utility for consistent error logging and handling
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorContext {
  component?: string;
  operation?: string;
  userId?: string;
  sessionId?: string;
  additionalData?: Record<string, unknown>;
}

class ErrorHandler {
  /**
   * Logs errors with consistent format and context
   */
  static log(
    error: unknown,
    context: ErrorContext,
    severity: ErrorSeverity = 'error'
  ): void {
    const timestamp = new Date().toISOString();
    const errorMessage = this.extractErrorMessage(error);

    const logEntry = {
      timestamp,
      severity,
      message: errorMessage,
      context,
      error: error instanceof Error ? {
        name: error.name,
        stack: error.stack
      } : error
    };

    // Use appropriate console method based on severity
    switch (severity) {
      case 'error':
        console.error(`[ERROR] ${context.component || 'Unknown'}:${context.operation || 'Unknown'}`, logEntry);
        break;
      case 'warning':
        console.warn(`[WARN] ${context.component || 'Unknown'}:${context.operation || 'Unknown'}`, logEntry);
        break;
      case 'info':
        console.log(`[INFO] ${context.component || 'Unknown'}:${context.operation || 'Unknown'}`, logEntry);
        break;
    }
  }

  /**
   * Handles async operation errors with optional fallback
   */
  static async handleAsync<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    fallback?: () => T | Promise<T>
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      this.log(error, context, 'error');

      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          this.log(fallbackError, { ...context, operation: `${context.operation}_fallback` }, 'error');
          return null;
        }
      }

      return null;
    }
  }

  /**
   * Handles sync operation errors with optional fallback
   */
  static handleSync<T>(
    operation: () => T,
    context: ErrorContext,
    fallback?: () => T
  ): T | null {
    try {
      return operation();
    } catch (error) {
      this.log(error, context, 'error');

      if (fallback) {
        try {
          return fallback();
        } catch (fallbackError) {
          this.log(fallbackError, { ...context, operation: `${context.operation}_fallback` }, 'error');
          return null;
        }
      }

      return null;
    }
  }

  /**
   * Logs warning with context
   */
  static warn(message: string, context: ErrorContext): void {
    this.log(new Error(message), context, 'warning');
  }

  /**
   * Logs info with context
   */
  static info(message: string, context: ErrorContext): void {
    this.log(new Error(message), context, 'info');
  }

  /**
   * Extracts readable error message from unknown error type
   */
  private static extractErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }

    return 'Unknown error occurred';
  }
}

export default ErrorHandler;