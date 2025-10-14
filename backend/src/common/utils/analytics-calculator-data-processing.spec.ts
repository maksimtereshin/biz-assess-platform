import { Test, TestingModule } from "@nestjs/testing";
import { AnalyticsCalculator } from "./analytics-calculator.util";
import { Survey, SurveyType } from "bizass-shared";
import { ReportDataService } from "../../report/report-data.service";

/**
 * Test suite for Task 3.1: Analytics Calculations for Data Processing
 * Tests category scores, pie chart data, subcategory breakdowns, and data aggregation accuracy
 */
describe("AnalyticsCalculator - Data Processing for Reports", () => {
  let calculator: AnalyticsCalculator;
  let reportDataService: ReportDataService;

  const mockReportDataService = {
    findReportContent: jest.fn().mockReturnValue({
      category: "TEST",
      subcategory: "",
      titleSummary: "Test Results",
      result: "Test Score",
      resultDescription: "Test description",
      min: 0,
      max: 100,
      color: "green",
    }),
    getColorForScore: jest.fn((score: number) => {
      if (score >= 75) return "green";
      if (score >= 50) return "yellow";
      if (score >= 25) return "orange";
      return "red";
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsCalculator,
        {
          provide: ReportDataService,
          useValue: mockReportDataService,
        },
      ],
    }).compile();

    calculator = module.get<AnalyticsCalculator>(AnalyticsCalculator);
    reportDataService = module.get<ReportDataService>(ReportDataService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Category Score Calculations", () => {
    const surveyStructure: Survey = {
      id: 1,
      type: SurveyType.EXPRESS,
      name: "Test Survey",
      structure: [
        {
          id: "hr",
          name: "HR",
          subcategories: [
            {
              id: "hr-recruitment",
              name: "Recruitment",
              questions: [
                { id: 1, text: "Q1" },
                { id: 2, text: "Q2" },
              ],
            },
          ],
        },
        {
          id: "product",
          name: "Product",
          subcategories: [
            {
              id: "product-development",
              name: "Development",
              questions: [
                { id: 3, text: "Q3" },
                { id: 4, text: "Q4" },
              ],
            },
          ],
        },
        {
          id: "marketing",
          name: "Marketing",
          subcategories: [
            {
              id: "marketing-digital",
              name: "Digital",
              questions: [
                { id: 5, text: "Q5" },
                { id: 6, text: "Q6" },
              ],
            },
          ],
        },
      ],
    };

    it("should calculate category scores correctly for all categories", () => {
      const answers = [
        { questionId: 1, score: 8 },
        { questionId: 2, score: 6 },
        { questionId: 3, score: 7 },
        { questionId: 4, score: 9 },
        { questionId: 5, score: 5 },
        { questionId: 6, score: 5 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // HR: (8+6)/2 = 7, formula: ((7-1)/9)*100 = 67%
      expect(result.categoryScores["hr"]).toBe(67);

      // Product: (7+9)/2 = 8, formula: ((8-1)/9)*100 = 78%
      expect(result.categoryScores["product"]).toBe(78);

      // Marketing: (5+5)/2 = 5, formula: ((5-1)/9)*100 = 44%
      expect(result.categoryScores["marketing"]).toBe(44);
    });

    it("should handle categories with different numbers of questions", () => {
      const unevenStructure: Survey = {
        ...surveyStructure,
        structure: [
          {
            id: "small",
            name: "Small",
            subcategories: [
              {
                id: "small-sub",
                name: "Sub",
                questions: [{ id: 1, text: "Q1" }],
              },
            ],
          },
          {
            id: "large",
            name: "Large",
            subcategories: [
              {
                id: "large-sub",
                name: "Sub",
                questions: [
                  { id: 2, text: "Q2" },
                  { id: 3, text: "Q3" },
                  { id: 4, text: "Q4" },
                  { id: 5, text: "Q5" },
                ],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 10 },
        { questionId: 2, score: 6 },
        { questionId: 3, score: 6 },
        { questionId: 4, score: 6 },
        { questionId: 5, score: 6 },
      ];

      const result = calculator.calculateScores(answers, unevenStructure);

      // Small: 10 -> ((10-1)/9)*100 = 100%
      expect(result.categoryScores["small"]).toBe(100);

      // Large: (6+6+6+6)/4 = 6 -> ((6-1)/9)*100 = 56%
      expect(result.categoryScores["large"]).toBe(56);
    });

    it("should ensure category percentages are properly calculated", () => {
      const answers = [
        { questionId: 1, score: 1 },
        { questionId: 2, score: 1 },
        { questionId: 3, score: 10 },
        { questionId: 4, score: 10 },
        { questionId: 5, score: 5 },
        { questionId: 6, score: 6 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Verify all category scores are within valid range
      Object.values(result.categoryScores).forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Pie Chart Data Generation", () => {
    it("should generate data suitable for pie chart visualization", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "cat1",
            name: "Category 1",
            subcategories: [
              {
                id: "sub1",
                name: "Sub 1",
                questions: [{ id: 1, text: "Q1" }],
              },
            ],
          },
          {
            id: "cat2",
            name: "Category 2",
            subcategories: [
              {
                id: "sub2",
                name: "Sub 2",
                questions: [{ id: 2, text: "Q2" }],
              },
            ],
          },
          {
            id: "cat3",
            name: "Category 3",
            subcategories: [
              {
                id: "sub3",
                name: "Sub 3",
                questions: [{ id: 3, text: "Q3" }],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 8 },
        { questionId: 2, score: 5 },
        { questionId: 3, score: 7 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Verify we have scores for all categories (required for pie chart)
      expect(Object.keys(result.categoryScores)).toHaveLength(3);
      expect(result.categoryScores["cat1"]).toBeDefined();
      expect(result.categoryScores["cat2"]).toBeDefined();
      expect(result.categoryScores["cat3"]).toBeDefined();

      // Verify scores are integers (required for clean pie chart labels)
      Object.values(result.categoryScores).forEach((score) => {
        expect(Number.isInteger(score)).toBe(true);
      });
    });

    it("should provide percentage values for pie chart segments", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "cat1",
            name: "Category 1",
            subcategories: [
              {
                id: "sub1",
                name: "Sub 1",
                questions: [{ id: 1, text: "Q1" }],
              },
            ],
          },
          {
            id: "cat2",
            name: "Category 2",
            subcategories: [
              {
                id: "sub2",
                name: "Sub 2",
                questions: [{ id: 2, text: "Q2" }],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 10 },
        { questionId: 2, score: 1 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Cat1: 10 -> 100%, Cat2: 1 -> 0%
      expect(result.categoryScores["cat1"]).toBe(100);
      expect(result.categoryScores["cat2"]).toBe(0);

      // Both should be valid percentage values
      expect(result.categoryScores["cat1"]).toBeGreaterThanOrEqual(0);
      expect(result.categoryScores["cat1"]).toBeLessThanOrEqual(100);
      expect(result.categoryScores["cat2"]).toBeGreaterThanOrEqual(0);
      expect(result.categoryScores["cat2"]).toBeLessThanOrEqual(100);
    });

    it("should handle empty categories gracefully for pie charts", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "answered",
            name: "Answered",
            subcategories: [
              {
                id: "sub1",
                name: "Sub 1",
                questions: [{ id: 1, text: "Q1" }],
              },
            ],
          },
          {
            id: "unanswered",
            name: "Unanswered",
            subcategories: [
              {
                id: "sub2",
                name: "Sub 2",
                questions: [{ id: 2, text: "Q2" }],
              },
            ],
          },
        ],
      };

      const answers = [{ questionId: 1, score: 8 }];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Unanswered categories should have 0% for pie chart
      expect(result.categoryScores["unanswered"]).toBe(0);
      expect(result.categoryScores["answered"]).toBe(78);
    });
  });

  describe("Subcategory Breakdowns", () => {
    const surveyStructure: Survey = {
      id: 1,
      type: SurveyType.FULL,
      name: "Full Survey",
      structure: [
        {
          id: "hr",
          name: "HR",
          subcategories: [
            {
              id: "recruitment",
              name: "Recruitment",
              questions: [
                { id: 1, text: "Q1" },
                { id: 2, text: "Q2" },
              ],
            },
            {
              id: "retention",
              name: "Retention",
              questions: [
                { id: 3, text: "Q3" },
                { id: 4, text: "Q4" },
              ],
            },
            {
              id: "training",
              name: "Training",
              questions: [{ id: 5, text: "Q5" }],
            },
          ],
        },
      ],
    };

    it("should calculate subcategory scores accurately", () => {
      const answers = [
        { questionId: 1, score: 8 },
        { questionId: 2, score: 6 },
        { questionId: 3, score: 9 },
        { questionId: 4, score: 7 },
        { questionId: 5, score: 5 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Recruitment: (8+6)/2 = 7 -> 67%
      expect(result.subcategoryScores["recruitment"]).toBe(67);

      // Retention: (9+7)/2 = 8 -> 78%
      expect(result.subcategoryScores["retention"]).toBe(78);

      // Training: 5 -> 44%
      expect(result.subcategoryScores["training"]).toBe(44);
    });

    it("should handle subcategories with single question", () => {
      const answers = [{ questionId: 5, score: 10 }];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Single question should calculate correctly
      expect(result.subcategoryScores["training"]).toBe(100);
    });

    it("should calculate subcategory scores independently", () => {
      const answers = [
        { questionId: 1, score: 10 },
        { questionId: 2, score: 10 },
        { questionId: 3, score: 1 },
        { questionId: 4, score: 1 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Subcategories should have different scores
      expect(result.subcategoryScores["recruitment"]).toBe(100);
      expect(result.subcategoryScores["retention"]).toBe(0);

      // Category score should be average
      expect(result.categoryScores["hr"]).toBe(50);
    });
  });

  describe("Data Aggregation Accuracy", () => {
    it("should maintain accuracy with large datasets", () => {
      const largeStructure: Survey = {
        id: 1,
        type: SurveyType.FULL,
        name: "Large Survey",
        structure: [
          {
            id: "category",
            name: "Category",
            subcategories: [
              {
                id: "subcategory",
                name: "Subcategory",
                questions: Array.from({ length: 100 }, (_, i) => ({
                  id: i + 1,
                  text: `Q${i + 1}`,
                })),
              },
            ],
          },
        ],
      };

      const answers = Array.from({ length: 100 }, (_, i) => ({
        questionId: i + 1,
        score: 5,
      }));

      const result = calculator.calculateScores(answers, largeStructure);

      // All 5s should give 44%
      expect(result.categoryScores["category"]).toBe(44);
      expect(result.subcategoryScores["subcategory"]).toBe(44);
      expect(result.overallScore).toBe(44);
    });

    it("should handle floating point precision correctly", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "cat",
            name: "Category",
            subcategories: [
              {
                id: "sub",
                name: "Sub",
                questions: [
                  { id: 1, text: "Q1" },
                  { id: 2, text: "Q2" },
                  { id: 3, text: "Q3" },
                ],
              },
            ],
          },
        ],
      };

      // Scores that create floating point average: (7+8+9)/3 = 8.0
      const answers = [
        { questionId: 1, score: 7 },
        { questionId: 2, score: 8 },
        { questionId: 3, score: 9 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Should be rounded to integer
      expect(Number.isInteger(result.categoryScores["cat"])).toBe(true);
      expect(result.categoryScores["cat"]).toBe(78);
    });

    it("should calculate overall score as average of all answers", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "cat1",
            name: "Cat 1",
            subcategories: [
              {
                id: "sub1",
                name: "Sub 1",
                questions: [
                  { id: 1, text: "Q1" },
                  { id: 2, text: "Q2" },
                ],
              },
            ],
          },
          {
            id: "cat2",
            name: "Cat 2",
            subcategories: [
              {
                id: "sub2",
                name: "Sub 2",
                questions: [
                  { id: 3, text: "Q3" },
                  { id: 4, text: "Q4" },
                ],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 10 },
        { questionId: 2, score: 10 },
        { questionId: 3, score: 1 },
        { questionId: 4, score: 1 },
      ];

      const result = calculator.calculateScores(answers, surveyStructure);

      // Overall: (10+10+1+1)/4 = 5.5 -> 50%
      expect(result.overallScore).toBe(50);

      // Cat1: 100%, Cat2: 0%
      expect(result.categoryScores["cat1"]).toBe(100);
      expect(result.categoryScores["cat2"]).toBe(0);
    });

    it("should maintain consistency across multiple calculations", () => {
      const surveyStructure: Survey = {
        id: 1,
        type: SurveyType.EXPRESS,
        name: "Test Survey",
        structure: [
          {
            id: "cat",
            name: "Category",
            subcategories: [
              {
                id: "sub",
                name: "Sub",
                questions: [{ id: 1, text: "Q1" }],
              },
            ],
          },
        ],
      };

      const answers = [{ questionId: 1, score: 7 }];

      // Calculate multiple times
      const result1 = calculator.calculateScores(answers, surveyStructure);
      const result2 = calculator.calculateScores(answers, surveyStructure);
      const result3 = calculator.calculateScores(answers, surveyStructure);

      // Results should be identical
      expect(result1.overallScore).toBe(result2.overallScore);
      expect(result2.overallScore).toBe(result3.overallScore);
      expect(result1.categoryScores["cat"]).toBe(result2.categoryScores["cat"]);
      expect(result2.categoryScores["cat"]).toBe(result3.categoryScores["cat"]);
    });
  });

  describe("Report Version Data Generation", () => {
    const surveyStructure: Survey = {
      id: 1,
      type: SurveyType.EXPRESS,
      name: "Test Survey",
      structure: [
        {
          id: "hr",
          name: "HR",
          subcategories: [
            {
              id: "recruitment",
              name: "Recruitment",
              questions: [{ id: 1, text: "Q1" }],
            },
          ],
        },
      ],
    };

    it("should generate free version data (summary only)", () => {
      const answers = [{ questionId: 1, score: 7 }];

      const results = calculator.calculateSurveyResults(
        "session-123",
        answers,
        surveyStructure,
        "express"
      );

      // Free version should have overall score and categories
      expect(results.overallScore).toBeDefined();
      expect(results.categories).toBeDefined();
      expect(results.categories.length).toBeGreaterThan(0);
    });

    it("should generate paid version data (full details)", () => {
      const fullStructure: Survey = {
        id: 1,
        type: SurveyType.FULL,
        name: "Full Survey",
        structure: [
          {
            id: "hr",
            name: "HR",
            subcategories: [
              {
                id: "recruitment",
                name: "Recruitment",
                questions: [{ id: 1, text: "Q1" }],
              },
              {
                id: "retention",
                name: "Retention",
                questions: [{ id: 2, text: "Q2" }],
              },
            ],
          },
        ],
      };

      const answers = [
        { questionId: 1, score: 8 },
        { questionId: 2, score: 6 },
      ];

      const results = calculator.calculateSurveyResults(
        "session-456",
        answers,
        fullStructure,
        "full"
      );

      // Paid version should include subcategories
      expect(results.categories[0].subcategories).toBeDefined();
      expect(results.categories[0].subcategories!.length).toBe(2);
    });
  });

  describe("Edge Cases and Validation", () => {
    it("should handle missing survey structure gracefully", () => {
      const answers = [
        { questionId: 1, score: 7 },
        { questionId: 2, score: 8 },
      ];

      const result = calculator.calculateScores(answers);

      expect(result.overallScore).toBe(72);
      expect(result.categoryScores).toEqual({});
      expect(result.subcategoryScores).toEqual({});
    });

    it("should validate score ranges", () => {
      expect(calculator.validateScore(1)).toBe(true);
      expect(calculator.validateScore(10)).toBe(true);
      expect(calculator.validateScore(0)).toBe(false);
      expect(calculator.validateScore(11)).toBe(false);
    });

    it("should reject non-finite calculation results", () => {
      // This should not happen in practice, but tests defensive coding
      const answers = [{ questionId: 1, score: 5 }];

      const result = calculator.calculateScores(answers);

      expect(Number.isFinite(result.overallScore)).toBe(true);
    });
  });
});
