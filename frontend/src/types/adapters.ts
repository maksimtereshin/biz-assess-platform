/**
 * Type adapters for converting between local frontend types and shared types
 * Ensures backward compatibility during migration to shared types
 */

import { SurveyType } from 'bizass-shared';

export type SurveyVariant = 'express' | 'full';

/**
 * Convert local SurveyVariant to shared SurveyType enum
 */
export function surveyVariantToType(variant: SurveyVariant): SurveyType {
  switch (variant) {
    case 'express':
      return SurveyType.EXPRESS;
    case 'full':
      return SurveyType.FULL;
    default:
      throw new Error(`Unknown survey variant: ${variant}`);
  }
}

/**
 * Convert shared SurveyType enum to local SurveyVariant
 */
export function surveyTypeToVariant(type: SurveyType): SurveyVariant {
  switch (type) {
    case SurveyType.EXPRESS:
      return 'express';
    case SurveyType.FULL:
      return 'full';
    default:
      throw new Error(`Unknown survey type: ${type}`);
  }
}

/**
 * Helper to check if a string is a valid survey variant
 */
export function isSurveyVariant(value: string): value is SurveyVariant {
  return value === 'express' || value === 'full';
}

/**
 * Helper to get survey variant from URL or other string sources safely
 */
export function parseSurveyVariant(value: string): SurveyVariant | null {
  return isSurveyVariant(value) ? value : null;
}