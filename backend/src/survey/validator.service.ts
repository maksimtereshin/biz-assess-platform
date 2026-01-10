import { Injectable, BadRequestException } from "@nestjs/common";
import { SurveyCategory } from "bizass-shared";

/**
 * ValidatorService - Validates survey structure JSONB data
 *
 * Single Responsibility: Survey structure validation
 * Extracted from SurveyVersionService to follow SRP
 * Reusable across services that work with survey structures
 */
@Injectable()
export class ValidatorService {
  /**
   * Validates survey structure before saving to database
   *
   * Checks:
   * - Structure is a non-empty array
   * - All categories have required fields (id, name)
   * - No duplicate category IDs
   * - All subcategories have required fields (id, name)
   * - No duplicate subcategory IDs
   * - All questions have required fields (id, text)
   * - No duplicate question IDs
   * - Answer values are in range 1-10
   *
   * @throws BadRequestException with specific error message if validation fails
   */
  validateSurveyStructure(structure: SurveyCategory[]): void {
    // Validate structure is an array
    if (!structure || !Array.isArray(structure)) {
      throw new BadRequestException("Structure must be an array of categories");
    }

    // Validate structure is not empty
    if (structure.length === 0) {
      throw new BadRequestException("Structure must contain at least one category");
    }

    // Track IDs to detect duplicates
    const categoryIds = new Set<string>();
    const subcategoryIds = new Set<string>();
    const questionIds = new Set<number>();

    // Validate each category
    for (const category of structure) {
      this.validateCategory(category, categoryIds, subcategoryIds, questionIds);
    }
  }

  /**
   * Validates a single category and its nested subcategories/questions
   */
  private validateCategory(
    category: SurveyCategory,
    categoryIds: Set<string>,
    subcategoryIds: Set<string>,
    questionIds: Set<number>,
  ): void {
    // Validate required fields
    if (!category.id || !category.name) {
      throw new BadRequestException(
        "Category must have id and name fields",
      );
    }

    // Check for duplicate category ID
    if (categoryIds.has(category.id)) {
      throw new BadRequestException(
        `Duplicate category ID: ${category.id}`,
      );
    }
    categoryIds.add(category.id);

    // Validate subcategories exist
    if (!category.subcategories || category.subcategories.length === 0) {
      throw new BadRequestException(
        `Category ${category.id} must contain at least one subcategory`,
      );
    }

    // Validate each subcategory
    for (const subcategory of category.subcategories) {
      this.validateSubcategory(subcategory, subcategoryIds, questionIds);
    }
  }

  /**
   * Validates a single subcategory and its nested questions
   */
  private validateSubcategory(
    subcategory: any,
    subcategoryIds: Set<string>,
    questionIds: Set<number>,
  ): void {
    // Validate required fields
    if (!subcategory.id || !subcategory.name) {
      throw new BadRequestException(
        "Subcategory must have id and name fields",
      );
    }

    // Check for duplicate subcategory ID
    if (subcategoryIds.has(subcategory.id)) {
      throw new BadRequestException(
        `Duplicate subcategory ID: ${subcategory.id}`,
      );
    }
    subcategoryIds.add(subcategory.id);

    // Validate questions exist
    if (!subcategory.questions || subcategory.questions.length === 0) {
      throw new BadRequestException(
        `Subcategory ${subcategory.id} must contain at least one question`,
      );
    }

    // Validate each question
    for (const question of subcategory.questions) {
      this.validateQuestion(question, questionIds);
    }
  }

  /**
   * Validates a single question and its answers
   */
  private validateQuestion(question: any, questionIds: Set<number>): void {
    // Validate required fields
    if (!question.id || !question.text) {
      throw new BadRequestException(
        "Question must have id and text fields",
      );
    }

    // Check for duplicate question ID
    if (questionIds.has(question.id)) {
      throw new BadRequestException(
        `Duplicate question ID: ${question.id}`,
      );
    }
    questionIds.add(question.id);

    // Validate answer values (if answers are provided)
    if (question.answers) {
      for (const answer of question.answers) {
        this.validateAnswer(answer, question.id);
      }
    }
  }

  /**
   * Validates a single answer value (must be 1-10)
   */
  private validateAnswer(answer: any, questionId: number): void {
    if (!answer.value || answer.value < 1 || answer.value > 10) {
      throw new BadRequestException(
        `Answer value must be between 1 and 10 (question ${questionId})`,
      );
    }
  }
}
