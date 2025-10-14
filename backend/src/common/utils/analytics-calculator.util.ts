import { Injectable } from "@nestjs/common";
import { AnalyticsResult, Survey, CategoryResult, SubcategoryResult, SurveyResults } from "bizass-shared";
import { ReportDataService } from "../../report/report-data.service";

@Injectable()
export class AnalyticsCalculator {
  constructor(private readonly reportDataService: ReportDataService) {}
  /**
   * Calculates analytics scores based on the formula specified in TRD-96 to TRD-101
   * Formula: P = (R̄ - 1) / 9 × 100%
   * Where R̄ is the average score and P is the final percentage
   */
  calculateScores(
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure?: Survey,
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

    // Validate calculation result
    if (!Number.isFinite(overallScore)) {
      throw new Error('Invalid calculation result: overall score is not finite');
    }

    // Calculate category and subcategory scores if survey structure is provided
    const categoryScores: Record<string, number> = {};
    const subcategoryScores: Record<string, number> = {};

    if (surveyStructure) {
      // Calculate category scores
      for (const category of surveyStructure.structure) {
        const categoryAnswers = answers.filter((answer) =>
          this.isQuestionInCategory(answer.questionId, category),
        );

        if (categoryAnswers.length > 0) {
          const categoryAverage =
            categoryAnswers.reduce((sum, answer) => sum + answer.score, 0) /
            categoryAnswers.length;
          const categoryScore = ((categoryAverage - 1) / 9) * 100;
          categoryScores[category.id] = Number.isFinite(categoryScore) ? Math.round(categoryScore) : 0;
        } else {
          categoryScores[category.id] = 0;
        }

        // Calculate subcategory scores
        for (const subcategory of category.subcategories) {
          const subcategoryAnswers = answers.filter((answer) =>
            subcategory.questions.some((q) => q.id === answer.questionId),
          );

          if (subcategoryAnswers.length > 0) {
            const subcategoryAverage =
              subcategoryAnswers.reduce(
                (sum, answer) => sum + answer.score,
                0,
              ) / subcategoryAnswers.length;
            const subcategoryScore = ((subcategoryAverage - 1) / 9) * 100;
            subcategoryScores[subcategory.id] = Number.isFinite(subcategoryScore) ? Math.round(subcategoryScore) : 0;
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
      totalQuestions: surveyStructure
        ? this.getTotalQuestions(surveyStructure)
        : answers.length,
      answeredQuestions: answers.length,
    };
  }

  /**
   * Checks if a question ID belongs to a specific category
   */
  private isQuestionInCategory(questionId: number, category: any): boolean {
    return category.subcategories.some((subcategory: any) =>
      subcategory.questions.some((question: any) => question.id === questionId),
    );
  }

  /**
   * Gets the total number of questions in a survey structure
   */
  private getTotalQuestions(surveyStructure: Survey): number {
    return surveyStructure.structure.reduce((total, category) => {
      return (
        total +
        category.subcategories.reduce((categoryTotal, subcategory) => {
          return categoryTotal + subcategory.questions.length;
        }, 0)
      );
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
  validateAnswers(
    answers: Array<{ questionId: number; score: number }>,
  ): boolean {
    return answers.every((answer) => this.validateScore(answer.score));
  }

  /**
   * Calculates comprehensive survey results with CSV content for display
   * Follows DRY principle by reusing existing calculation logic
   */
  calculateSurveyResults(
    sessionId: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: Survey,
    surveyType: 'express' | 'full'
  ): SurveyResults {
    // Reuse existing analytics calculation
    const analytics = this.calculateScores(answers, surveyStructure);

    // Get overall content from CSV
    const overallContent = this.reportDataService.findReportContent(
      surveyType,
      'OVERALL', // Special category for overall results
      analytics.overallScore
    );

    // Calculate categories with CSV content
    const categories: CategoryResult[] = [];

    for (const category of surveyStructure.structure) {
      const categoryScore = analytics.categoryScores[category.id] || 0;

      // Get content for this category and score
      const categoryContent = this.reportDataService.findReportContent(
        surveyType,
        category.name.toUpperCase(),
        categoryScore
      );

      const categoryResult: CategoryResult = {
        name: category.name,
        score: categoryScore,
        content: categoryContent || this.getDefaultContent(category.name, categoryScore),
        subcategories: []
      };

      // For full reports, calculate subcategories
      if (surveyType === 'full') {
        for (const subcategory of category.subcategories) {
          const subcategoryScore = analytics.subcategoryScores[subcategory.id] || 0;

          const subcategoryContent = this.reportDataService.findReportContent(
            surveyType,
            category.name.toUpperCase(),
            subcategoryScore,
            subcategory.name.toUpperCase()
          );

          categoryResult.subcategories!.push({
            name: subcategory.name,
            score: subcategoryScore,
            content: subcategoryContent || this.getDefaultContent(subcategory.name, subcategoryScore)
          });
        }
      }

      categories.push(categoryResult);
    }

    return {
      sessionId,
      surveyType,
      overallScore: analytics.overallScore,
      overallContent: overallContent || this.getDefaultContent('Overall', analytics.overallScore),
      categories
    };
  }

  /**
   * Generate free version data for PDF (summary only, no detailed category analysis)
   * Used for first survey report which is free
   *
   * @param sessionId - Survey session ID
   * @param answers - User's answers
   * @param surveyStructure - Survey structure
   * @param surveyType - Survey type (express or full)
   * @returns Report data with category scores for pie chart, without detailed subcategories
   */
  generateFreeVersionData(
    sessionId: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: Survey,
    surveyType: 'express' | 'full'
  ): SurveyResults {
    // Calculate analytics
    const analytics = this.calculateScores(answers, surveyStructure);

    // Get overall content
    const overallContent = this.reportDataService.findReportContent(
      surveyType,
      'OVERALL',
      analytics.overallScore
    );

    // For free version, include categories with scores but no detailed subcategories
    const categories: CategoryResult[] = surveyStructure.structure.map(category => {
      const categoryScore = analytics.categoryScores[category.id] || 0;

      return {
        name: category.name,
        score: categoryScore,
        content: {
          category: category.name.toUpperCase(),
          subcategory: '',
          titleSummary: `${category.name}: ${categoryScore}%`,
          result: `${categoryScore}%`,
          resultDescription: `Your ${category.name.toLowerCase()} score is ${categoryScore}%. Upgrade to paid version for detailed analysis.`,
          min: 0,
          max: 100,
          color: this.reportDataService.getColorForScore(categoryScore)
        },
        subcategories: [] // No subcategories in free version
      };
    });

    return {
      sessionId,
      surveyType,
      overallScore: analytics.overallScore,
      overallContent: overallContent || this.getDefaultContent('Overall', analytics.overallScore),
      categories
    };
  }

  /**
   * Generate paid version data for PDF (full details with all category analysis)
   * Used for subsequent survey reports which require payment
   *
   * @param sessionId - Survey session ID
   * @param answers - User's answers
   * @param surveyStructure - Survey structure
   * @param surveyType - Survey type (express or full)
   * @returns Complete report data with detailed category and subcategory analysis
   */
  generatePaidVersionData(
    sessionId: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: Survey,
    surveyType: 'express' | 'full'
  ): SurveyResults {
    // For paid version, use the full calculateSurveyResults method
    return this.calculateSurveyResults(sessionId, answers, surveyStructure, surveyType);
  }

  /**
   * Get pie chart data formatted for PDF generation
   * Ensures category percentages are properly formatted and sum correctly
   *
   * @param analytics - Analytics result with category scores
   * @param surveyStructure - Survey structure
   * @returns Pie chart data with labels, values, and colors
   */
  getPieChartData(
    analytics: AnalyticsResult,
    surveyStructure: Survey
  ): {
    labels: string[];
    values: number[];
    colors: string[];
    percentages: number[];
  } {
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];
    const percentages: number[] = [];

    // Extract category data in consistent order
    for (const category of surveyStructure.structure) {
      const score = analytics.categoryScores[category.id] || 0;

      labels.push(category.name);
      values.push(score);
      percentages.push(score); // Score IS the percentage (0-100)
      colors.push(this.reportDataService.getColorForScore(score));
    }

    // Verify all percentages are valid (0-100)
    const allValid = percentages.every(p => p >= 0 && p <= 100);
    if (!allValid) {
      throw new Error('Invalid percentage values in pie chart data');
    }

    return {
      labels,
      values,
      colors,
      percentages
    };
  }

  /**
   * Provides default content when CSV data is not available
   * Maintains graceful degradation following clean code principles
   */
  private getDefaultContent(name: string, score: number) {
    const color = this.reportDataService.getColorForScore(score);
    return {
      category: name.toUpperCase(),
      subcategory: '',
      titleSummary: `${name} Results`,
      result: `Score: ${score}%`,
      resultDescription: `Your ${name.toLowerCase()} score is ${score}%.`,
      min: 0,
      max: 100,
      color
    };
  }

  /**
   * Gets detailed category results with subcategories for category detail pages
   */
  getCategoryDetails(
    sessionId: string,
    categoryName: string,
    answers: Array<{ questionId: number; score: number }>,
    surveyStructure: Survey,
    surveyType: 'express' | 'full'
  ): CategoryResult | null {
    const analytics = this.calculateScores(answers, surveyStructure);

    // Find the category in survey structure
    const category = surveyStructure.structure.find(
      cat => cat.name.toUpperCase() === categoryName.toUpperCase()
    );

    if (!category) {
      return null;
    }

    const categoryScore = analytics.categoryScores[category.id] || 0;

    // Get content for this category and score
    const categoryContent = this.reportDataService.findReportContent(
      surveyType,
      categoryName.toUpperCase(),
      categoryScore
    );

    const result: CategoryResult = {
      name: category.name,
      score: categoryScore,
      content: categoryContent || this.getDefaultContent(category.name, categoryScore),
      subcategories: []
    };

    // Add subcategories for full reports
    if (surveyType === 'full') {
      for (const subcategory of category.subcategories) {
        const subcategoryScore = analytics.subcategoryScores[subcategory.id] || 0;

        const subcategoryContent = this.reportDataService.findReportContent(
          surveyType,
          categoryName.toUpperCase(),
          subcategoryScore,
          subcategory.name.toUpperCase()
        );

        result.subcategories!.push({
          name: subcategory.name,
          score: subcategoryScore,
          content: subcategoryContent || this.getDefaultContent(subcategory.name, subcategoryScore)
        });
      }
    }

    return result;
  }
}
