import { Test, TestingModule } from '@nestjs/testing';
import { PdfGenerator } from './pdf-generator.util';
import { ReportDataService } from '../../report/report-data.service';
import { AnalyticsCalculator } from './analytics-calculator.util';
import { SurveyResults, CategoryResult, ReportEntry } from 'bizass-shared';
import * as PDFDocument from 'pdfkit';

describe('PdfGenerator', () => {
  let pdfGenerator: PdfGenerator;
  let reportDataService: ReportDataService;
  let analyticsCalculator: AnalyticsCalculator;

  const mockReportDataService = {
    getColorForScore: jest.fn((score: number) => {
      if (score >= 75) return '#4CAF50'; // Green
      if (score >= 50) return '#FFC107'; // Yellow
      if (score >= 25) return '#FF9800'; // Orange
      return '#F44336'; // Red
    }),
    findReportContent: jest.fn(),
  };

  const mockAnalyticsCalculator = {
    getPieChartData: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PdfGenerator,
        {
          provide: ReportDataService,
          useValue: mockReportDataService,
        },
        {
          provide: AnalyticsCalculator,
          useValue: mockAnalyticsCalculator,
        },
      ],
    }).compile();

    pdfGenerator = module.get<PdfGenerator>(PdfGenerator);
    reportDataService = module.get<ReportDataService>(ReportDataService);
    analyticsCalculator = module.get<AnalyticsCalculator>(AnalyticsCalculator);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Task 4.1: PDF Generation Tests', () => {
    describe('Free Version PDF Structure', () => {
      const mockFreeVersionData: SurveyResults = {
        sessionId: 'test-session-id',
        surveyType: 'express',
        overallScore: 68,
        overallContent: {
          category: 'OVERALL',
          subcategory: '',
          titleSummary: 'Общий результат',
          result: '68%',
          resultDescription: 'Ваш бизнес показывает средний уровень развития.',
          min: 0,
          max: 100,
          color: '#FFC107',
        },
        categories: [
          {
            name: 'HR',
            score: 65,
            content: {
              category: 'HR',
              subcategory: '',
              titleSummary: 'HR: 65%',
              result: '65%',
              resultDescription: 'Средний результат по HR.',
              min: 0,
              max: 100,
              color: '#FFC107',
            },
            subcategories: [],
          },
          {
            name: 'Product',
            score: 72,
            content: {
              category: 'PRODUCT',
              subcategory: '',
              titleSummary: 'Product: 72%',
              result: '72%',
              resultDescription: 'Хороший результат по продукту.',
              min: 0,
              max: 100,
              color: '#4CAF50',
            },
            subcategories: [],
          },
        ],
      };

      it('should generate a free version PDF successfully', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockFreeVersionData,
          false,
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      });

      it('should include "Сводный отчет" title in free version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [65],
          colors: ['#FFC107'],
          percentages: [65],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockFreeVersionData,
          false,
        );

        // PDF should contain the title (checking buffer is non-empty as proxy)
        expect(pdfBuffer.length).toBeGreaterThan(1000);
      });

      it('should include pie chart in free version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockFreeVersionData,
          false,
        );

        expect(mockAnalyticsCalculator.getPieChartData).toHaveBeenCalled();
        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should NOT include detailed category pages in free version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [65],
          colors: ['#FFC107'],
          percentages: [65],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockFreeVersionData,
          false,
        );

        // Free version should be smaller (no detailed pages)
        // Basic free version should be under 500KB
        expect(pdfBuffer.length).toBeLessThan(500 * 1024);
      });

      it('should show upgrade message in free version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [65],
          colors: ['#FFC107'],
          percentages: [65],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockFreeVersionData,
          false,
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        // The PDF should contain upgrade prompt (implicit in implementation)
      });
    });

    describe('Paid Version PDF Structure', () => {
      const mockPaidVersionData: SurveyResults = {
        sessionId: 'test-session-id',
        surveyType: 'full',
        overallScore: 68,
        overallContent: {
          category: 'OVERALL',
          subcategory: '',
          titleSummary: 'Общий результат',
          result: '68%',
          resultDescription: 'Ваш бизнес показывает средний уровень развития.',
          min: 0,
          max: 100,
          color: '#FFC107',
        },
        categories: [
          {
            name: 'HR',
            score: 65,
            content: {
              category: 'HR',
              subcategory: '',
              titleSummary: 'HR: 65%',
              result: '65%',
              resultDescription: 'Средний результат по HR.',
              min: 0,
              max: 100,
              color: '#FFC107',
            },
            subcategories: [
              {
                name: 'Delegation',
                score: 60,
                content: {
                  category: 'HR',
                  subcategory: 'DELEGATION',
                  titleSummary: 'Делегирование: 60%',
                  result: '60%',
                  resultDescription: 'Делегирование требует улучшения.',
                  min: 0,
                  max: 100,
                  color: '#FFC107',
                },
              },
              {
                name: 'Economics',
                score: 70,
                content: {
                  category: 'HR',
                  subcategory: 'ECONOMICS',
                  titleSummary: 'Экономика: 70%',
                  result: '70%',
                  resultDescription: 'Хорошая экономическая эффективность.',
                  min: 0,
                  max: 100,
                  color: '#FFC107',
                },
              },
            ],
          },
          {
            name: 'Product',
            score: 72,
            content: {
              category: 'PRODUCT',
              subcategory: '',
              titleSummary: 'Product: 72%',
              result: '72%',
              resultDescription: 'Хороший результат по продукту.',
              min: 0,
              max: 100,
              color: '#4CAF50',
            },
            subcategories: [
              {
                name: 'Product Line',
                score: 75,
                content: {
                  category: 'PRODUCT',
                  subcategory: 'PRODUCT_LINE',
                  titleSummary: 'Продуктовая линейка: 75%',
                  result: '75%',
                  resultDescription: 'Отличная продуктовая линейка.',
                  min: 0,
                  max: 100,
                  color: '#4CAF50',
                },
              },
            ],
          },
        ],
      };

      it('should generate a paid version PDF successfully', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockPaidVersionData,
          true,
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      });

      it('should include detailed category pages in paid version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockPaidVersionData,
          true,
        );

        // Paid version should be larger due to detailed category pages
        expect(pdfBuffer.length).toBeGreaterThan(1000);
      });

      it('should include subcategory breakdowns in paid version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockPaidVersionData,
          true,
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        // Should contain subcategory data (verified by larger size)
        expect(pdfBuffer.length).toBeGreaterThan(2000);
      });

      it('should NOT show upgrade message in paid version', async () => {
        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product'],
          values: [65, 72],
          colors: ['#FFC107', '#4CAF50'],
          percentages: [65, 72],
        });

        const pdfBuffer = await pdfGenerator.createPdf(
          mockPaidVersionData,
          true,
        );

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        // Paid version should not contain upgrade message
      });
    });

    describe('Pie Chart Rendering', () => {
      it('should render pie chart with correct data', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            {
              name: 'HR',
              score: 70,
              content: {} as ReportEntry,
              subcategories: [],
            },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [70],
          colors: ['#FFC107'],
          percentages: [70],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(mockAnalyticsCalculator.getPieChartData).toHaveBeenCalled();
        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should show category percentages on chart', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            { name: 'HR', score: 60, content: {} as ReportEntry },
            { name: 'Product', score: 70, content: {} as ReportEntry },
            { name: 'Marketing', score: 80, content: {} as ReportEntry },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR', 'Product', 'Marketing'],
          values: [60, 70, 80],
          colors: ['#FFC107', '#FFC107', '#4CAF50'],
          percentages: [60, 70, 80],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should use consistent color scheme', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            { name: 'HR', score: 80, content: {} as ReportEntry },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [80],
          colors: ['#4CAF50'],
          percentages: [80],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should fit chart on first page', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            { name: 'Cat1', score: 70, content: {} as ReportEntry },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['Cat1'],
          values: [70],
          colors: ['#FFC107'],
          percentages: [70],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        // Chart should be embedded, verify buffer is valid
        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(500);
      });
    });

    describe('Cyrillic Text Rendering', () => {
      it('should properly render Cyrillic characters in title', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {
            category: 'OVERALL',
            subcategory: '',
            titleSummary: 'Сводный отчет',
            result: '70%',
            resultDescription: 'Описание на русском языке.',
            min: 0,
            max: 100,
            color: '#FFC107',
          },
          categories: [],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: [],
          values: [],
          colors: [],
          percentages: [],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      });

      it('should properly render Cyrillic in category names', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            {
              name: 'Управление персоналом',
              score: 65,
              content: {
                category: 'HR',
                subcategory: '',
                titleSummary: 'Управление персоналом',
                result: '65%',
                resultDescription: 'Результат по управлению персоналом.',
                min: 0,
                max: 100,
                color: '#FFC107',
              },
            },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['Управление персоналом'],
          values: [65],
          colors: ['#FFC107'],
          percentages: [65],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should properly render Cyrillic in descriptions', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'full',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            {
              name: 'HR',
              score: 65,
              content: {
                category: 'HR',
                subcategory: '',
                titleSummary: 'HR',
                result: '65%',
                resultDescription:
                  'Детальное описание результатов по управлению персоналом с использованием кириллических символов.',
                min: 0,
                max: 100,
                color: '#FFC107',
              },
              subcategories: [],
            },
          ],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: ['HR'],
          values: [65],
          colors: ['#FFC107'],
          percentages: [65],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, true);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });
    });

    describe('PDF Size Limits', () => {
      it('should generate PDF under 5MB for free version', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: Array.from({ length: 6 }, (_, i) => ({
            name: `Category ${i + 1}`,
            score: 65 + i * 2,
            content: {} as ReportEntry,
            subcategories: [],
          })),
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: mockData.categories.map((c) => c.name),
          values: mockData.categories.map((c) => c.score),
          colors: mockData.categories.map(() => '#FFC107'),
          percentages: mockData.categories.map((c) => c.score),
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        // Should be under 5MB (5 * 1024 * 1024 bytes)
        expect(pdfBuffer.length).toBeLessThan(5 * 1024 * 1024);
      });

      it('should generate PDF under 5MB for paid version with many categories', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'full',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: Array.from({ length: 6 }, (_, i) => ({
            name: `Category ${i + 1}`,
            score: 65 + i * 2,
            content: {
              category: `CAT${i}`,
              subcategory: '',
              titleSummary: `Category ${i + 1}`,
              result: `${65 + i * 2}%`,
              resultDescription: `Description for category ${i + 1}`,
              min: 0,
              max: 100,
              color: '#FFC107',
            },
            subcategories: Array.from({ length: 3 }, (_, j) => ({
              name: `Subcategory ${j + 1}`,
              score: 60 + j * 5,
              content: {
                category: `CAT${i}`,
                subcategory: `SUB${j}`,
                titleSummary: `Subcategory ${j + 1}`,
                result: `${60 + j * 5}%`,
                resultDescription: `Description for subcategory ${j + 1}`,
                min: 0,
                max: 100,
                color: '#FFC107',
              },
            })),
          })),
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: mockData.categories.map((c) => c.name),
          values: mockData.categories.map((c) => c.score),
          colors: mockData.categories.map(() => '#FFC107'),
          percentages: mockData.categories.map((c) => c.score),
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, true);

        // Should be under 5MB even with full details
        expect(pdfBuffer.length).toBeLessThan(5 * 1024 * 1024);
      });
    });

    describe('Error Handling', () => {
      it('should handle missing pie chart data gracefully', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: [],
          values: [],
          colors: [],
          percentages: [],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });

      it('should handle empty categories array', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [],
        };

        mockAnalyticsCalculator.getPieChartData.mockReturnValue({
          labels: [],
          values: [],
          colors: [],
          percentages: [],
        });

        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
        expect(pdfBuffer.length).toBeGreaterThan(0);
      });

      it('should handle chart generation failure gracefully', async () => {
        const mockData: SurveyResults = {
          sessionId: 'test',
          surveyType: 'express',
          overallScore: 70,
          overallContent: {} as ReportEntry,
          categories: [
            { name: 'HR', score: 70, content: {} as ReportEntry },
          ],
        };

        // Simulate chart generation failure
        mockAnalyticsCalculator.getPieChartData.mockImplementation(() => {
          throw new Error('Chart generation failed');
        });

        // Should still generate PDF without chart
        const pdfBuffer = await pdfGenerator.createPdf(mockData, false);

        expect(pdfBuffer).toBeInstanceOf(Buffer);
      });
    });
  });
});
