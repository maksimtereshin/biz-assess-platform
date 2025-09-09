import { Injectable } from '@nestjs/common';
import { AnalyticsResult, Survey } from 'bizass-shared';

@Injectable()
export class AnalyticsCalculator {
  /**
   * Calculates analytics scores based on the formula specified in TRD-96 to TRD-101
   * Formula: P = (R̄ - 1) / 9 × 100%
   * Where R̄ is the average score and P is the final percentage
   */
  calculateScores(
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure?: Survey
  ): AnalyticsResult {
    if (answers.length === 0) {
      return {
        overallScore: 0,
        categoryScores: {},
        subcategoryScores: {},
        totalQuestions: 0,
        answeredQuestions: 0,
      };
    }

    // Calculate overall average score
    const totalScore = answers.reduce((sum, answer) => sum + answer.score, 0);
    const averageScore = totalScore / answers.length;
    
    // Apply the formula: P = (R̄ - 1) / 9 × 100%
    const overallScore = ((averageScore - 1) / 9) * 100;

    // Calculate category and subcategory scores if survey structure is provided
    const categoryScores: Record<string, number> = {};
    const subcategoryScores: Record<string, number> = {};

    if (surveyStructure) {
      // Calculate category scores
      for (const category of surveyStructure.structure) {
        const categoryAnswers = answers.filter(answer => 
          this.isQuestionInCategory(answer.questionId, category)
        );
        
        if (categoryAnswers.length > 0) {
          const categoryAverage = categoryAnswers.reduce((sum, answer) => sum + answer.score, 0) / categoryAnswers.length;
          categoryScores[category.id] = Math.round(((categoryAverage - 1) / 9) * 100);
        } else {
          categoryScores[category.id] = 0;
        }

        // Calculate subcategory scores
        for (const subcategory of category.subcategories) {
          const subcategoryAnswers = answers.filter(answer => 
            subcategory.questions.some(q => q.id === answer.questionId)
          );
          
          if (subcategoryAnswers.length > 0) {
            const subcategoryAverage = subcategoryAnswers.reduce((sum, answer) => sum + answer.score, 0) / subcategoryAnswers.length;
            subcategoryScores[subcategory.id] = Math.round(((subcategoryAverage - 1) / 9) * 100);
          } else {
            subcategoryScores[subcategory.id] = 0;
          }
        }
      }
    }

    return {
      overallScore: Math.round(overallScore),
      categoryScores,
      subcategoryScores,
      totalQuestions: surveyStructure ? this.getTotalQuestions(surveyStructure) : answers.length,
      answeredQuestions: answers.length,
    };
  }

  /**
   * Checks if a question ID belongs to a specific category
   */
  private isQuestionInCategory(questionId: number, category: any): boolean {
    return category.subcategories.some((subcategory: any) =>
      subcategory.questions.some((question: any) => question.id === questionId)
    );
  }

  /**
   * Gets the total number of questions in a survey structure
   */
  private getTotalQuestions(surveyStructure: Survey): number {
    return surveyStructure.structure.reduce((total, category) => {
      return total + category.subcategories.reduce((categoryTotal, subcategory) => {
        return categoryTotal + subcategory.questions.length;
      }, 0);
    }, 0);
  }

  /**
   * Validates that a score is within the valid range (1-10)
   */
  validateScore(score: number): boolean {
    return Number.isInteger(score) && score >= 1 && score <= 10;
  }

  /**
   * Validates all scores in an answers array
   */
  validateAnswers(answers: Array<{ questionId: number; score: number }>): boolean {
    return answers.every(answer => this.validateScore(answer.score));
  }
}
