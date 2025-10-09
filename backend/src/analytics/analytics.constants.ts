/**
 * Constants for Analytics Service
 */

export enum PaymentStatusEnum {
  PENDING = 'PENDING',
  SUCCESSFUL = 'SUCCESSFUL',
  FAILED = 'FAILED',
}

export enum SurveySessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export const CACHE_TTL = 3600000; // 1 hour in milliseconds
