import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsCalculator } from './analytics-calculator.util';
import { Survey, SurveyType } from 'bizass-shared';

describe('AnalyticsCalculator', () => {
  let calculator: AnalyticsCalculator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AnalyticsCalculator],
    }).compile();

    calculator = module.get<AnalyticsCalculator>(AnalyticsCalculator);
  });

  describe('calculateScores', () => {
    it('should return 0% for empty answers array', () => {
      const result = calculator.calculateScores([]);
      
      expect(result.overallScore).toBe(0);
      expect(result.categoryScores).toEqual({});
      expect(result.subcategoryScores).toEqual({});
      expect(result.totalQuestions).toBe(0);
      expect(result.answeredQuestions).toBe(0);
    });

    it('should calculate 0% for all 1s', () => {
      const answers = [
        { questionId: 1, score: 1 },
        { questionId: 2, score: 1 },
        { questionId: 3, score: 1 },
      ];

      const result = calculator.calculateScores(answers);
      
      expect(result.overallScore).toBe(0);
    });

    it('should calculate 100% for all 10s', () => {
      const answers = [
        { questionId: 1, score: 10 },
        { questionId: 2, score: 10 },
        { questionId: 3, score: 10 },
      ];

      const result = calculator.calculateScores(answers);
      
      expect(result.overallScore).toBe(100);
    });

    it('should calculate 50% for all 5.5s (rounded to 5)', () => {
      const answers = [
        { questionId: 1, score: 5 },
        { questionId: 2, score: 6 },
        { questionId: 3, score: 5 },
      ];

      const result = calculator.calculateScores(answers);
      
      // Average of 5, 6, 5 = 5.33, formula: ((5.33 - 1) / 9) * 100 = 48.11% ≈ 48%
      expect(result.overallScore).toBe(48);
    });

    it('should calculate correct percentage for mixed realistic scores', () => {
      const answers = [
        { questionId: 1, score: 7 },
        { questionId: 2, score: 8 },
        { questionId: 3, score: 6 },
        { questionId: 4, score: 9 },
        { questionId: 5, score: 5 },
      ];

      const result = calculator.calculateScores(answers);
      
      // Average of 7, 8, 6, 9, 5 = 7, formula: ((7 - 1) / 9) * 100 = 66.67% ≈ 67%
      expect(result.overallScore).toBe(67);
    });

    it('should handle single answer correctly', () => {
      const answers = [{ questionId: 1, score: 8 }];

      const result = calculator.calculateScores(answers);
      
      // Formula: ((8 - 1) / 9) * 100 = 77.78% ≈ 78%
      expect(result.overallScore).toBe(78);
    });

    it('should calculate category and subcategory scores with survey structure', () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: 'Test Survey',
        structure: [
          {
            id: 'product',
            name: 'Product',
            subcategories: [
              {
                id: 'product-line',
                name: 'Product Line',
                questions: [
                  { id: 1, text: 'Question 1' },
                  { id: 2, text: 'Question 2' },
                ],
              },
              {
                id: 'personal-brand',
                name: 'Personal Brand',
                questions: [
                  { id: 3, text: 'Question 3' },
                ],
              },
            ],
          },
          {
            id: 'marketing',
            name: 'Marketing',
            subcategories: [
              {
                id: 'monetization',
                name: 'Monetization',
                questions: [
                  { id: 4, text: 'Question 4' },
                  { id: 5, text: 'Question 5' },
                ],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 8 }, // Product Line
        { questionId: 2, score: 6 }, // Product Line
        { questionId: 3, score: 9 }, // Personal Brand
        { questionId: 4, score: 7 }, // Monetization
        { questionId: 5, score: 5 }, // Monetization
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Overall: (8+6+9+7+5)/5 = 7, formula: ((7-1)/9)*100 = 67%
      expect(result.overallScore).toBe(67);

      // Product category: (8+6+9)/3 = 7.67, formula: ((7.67-1)/9)*100 = 74%
      expect(result.categoryScores['product']).toBe(74);

      // Marketing category: (7+5)/2 = 6, formula: ((6-1)/9)*100 = 56%
      expect(result.categoryScores['marketing']).toBe(56);

      // Product Line subcategory: (8+6)/2 = 7, formula: ((7-1)/9)*100 = 67%
      expect(result.subcategoryScores['product-line']).toBe(67);

      // Personal Brand subcategory: 9, formula: ((9-1)/9)*100 = 89%
      expect(result.subcategoryScores['personal-brand']).toBe(89);

      // Monetization subcategory: (7+5)/2 = 6, formula: ((6-1)/9)*100 = 56%
      expect(result.subcategoryScores['monetization']).toBe(56);

      expect(result.totalQuestions).toBe(5);
      expect(result.answeredQuestions).toBe(5);
    });

    it('should handle categories with no answers', () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: 'Test Survey',
        structure: [
          {
            id: 'product',
            name: 'Product',
            subcategories: [
              {
                id: 'product-line',
                name: 'Product Line',
                questions: [
                  { id: 1, text: 'Question 1' },
                ],
              },
            ],
          },
          {
            id: 'marketing',
            name: 'Marketing',
            subcategories: [
              {
                id: 'monetization',
                name: 'Monetization',
                questions: [
                  { id: 2, text: 'Question 2' },
                ],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 8 }, // Only Product category answered
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      expect(result.categoryScores['product']).toBe(78); // 8 -> ((8-1)/9)*100 = 78%
      expect(result.categoryScores['marketing']).toBe(0); // No answers
      expect(result.subcategoryScores['product-line']).toBe(78); // 8 -> 78%
      expect(result.subcategoryScores['monetization']).toBe(0);
    });
  });

  describe('validateScore', () => {
    it('should validate scores in range 1-10', () => {
      expect(calculator.validateScore(1)).toBe(true);
      expect(calculator.validateScore(5)).toBe(true);
      expect(calculator.validateScore(10)).toBe(true);
    });

    it('should reject scores outside range 1-10', () => {
      expect(calculator.validateScore(0)).toBe(false);
      expect(calculator.validateScore(11)).toBe(false);
      expect(calculator.validateScore(-1)).toBe(false);
    });

    it('should reject non-integer scores', () => {
      expect(calculator.validateScore(5.5)).toBe(false);
      expect(calculator.validateScore(3.14)).toBe(false);
      expect(calculator.validateScore(7.0)).toBe(true); // 7.0 is still an integer
    });
  });

  describe('validateAnswers', () => {
    it('should validate all answers in array', () => {
      const validAnswers = [
        { questionId: 1, score: 5 },
        { questionId: 2, score: 8 },
        { questionId: 3, score: 3 },
      ];

      expect(calculator.validateAnswers(validAnswers)).toBe(true);
    });

    it('should reject array with invalid scores', () => {
      const invalidAnswers = [
        { questionId: 1, score: 5 },
        { questionId: 2, score: 11 }, // Invalid
        { questionId: 3, score: 3 },
      ];

      expect(calculator.validateAnswers(invalidAnswers)).toBe(false);
    });

    it('should handle empty array', () => {
      expect(calculator.validateAnswers([])).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very large number of answers', () => {
      const answers = Array.from({ length: 1000 }, (_, i) => ({
        questionId: i + 1,
        score: Math.floor(Math.random() * 10) + 1,
      }));

      const result = calculator.calculateScores(answers);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.answeredQuestions).toBe(1000);
    });

    it('should handle answers with minimum and maximum scores', () => {
      const answers = [
        { questionId: 1, score: 1 },
        { questionId: 2, score: 10 },
        { questionId: 3, score: 1 },
        { questionId: 4, score: 10 },
      ];

      const result = calculator.calculateScores(answers);
      
      // Average of 1, 10, 1, 10 = 5.5, formula: ((5.5 - 1) / 9) * 100 = 50%
      expect(result.overallScore).toBe(50);
    });
  });
});
