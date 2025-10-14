import { Injectable, Logger } from '@nestjs/common';
import { SurveyResults, CategoryResult } from 'bizass-shared';
import * as PDFDocument from 'pdfkit';
import { Chart, registerables } from 'chart.js';
import { createCanvas } from 'canvas';
import { AnalyticsCalculator } from './analytics-calculator.util';

@Injectable()
export class PdfGenerator {
  private readonly logger = new Logger(PdfGenerator.name);

  constructor(private readonly analyticsCalculator: AnalyticsCalculator) {
    // Register Chart.js components
    Chart.register(...registerables);
  }

  /**
   * Generates a PDF report based on survey results data
   * Task 4.2: Supports both free and paid versions
   *
   * @param data - Survey results data with categories and scores
   * @param isPaid - Whether this is a paid report (includes detailed category pages)
   * @returns Promise<Buffer> - PDF file as a buffer
   */
  async createPdf(
    data: SurveyResults,
    isPaid: boolean = false,
  ): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        // Task 4.6: Optimize PDF file size with compression
        const doc = new PDFDocument({
          margin: 50,
          compress: true,
          autoFirstPage: true,
          bufferPages: true,
          size: 'A4',
        });

        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          this.logger.log(
            `Generated ${isPaid ? 'PAID' : 'FREE'} PDF: ${(pdfData.length / 1024).toFixed(2)}KB`,
          );
          resolve(pdfData);
        });
        doc.on('error', (error) => {
          this.logger.error('PDF generation error:', error);
          reject(error);
        });

        // Task 4.2 & 4.5: Add "Сводный отчет" title with proper Cyrillic support
        await this.addFirstPage(doc, data, isPaid);

        // Task 4.4: Add category detail pages for paid version only
        if (isPaid && data.categories && data.categories.length > 0) {
          for (const category of data.categories) {
            if (category.subcategories && category.subcategories.length > 0) {
              await this.addCategoryDetailPage(doc, category);
            }
          }
        }

        // Add footer to last page
        this.addFooter(doc, isPaid);

        doc.end();
      } catch (error) {
        this.logger.error('Failed to create PDF:', error);
        reject(error);
      }
    });
  }

  /**
   * Task 4.2: Adds the first page with summary and pie chart
   * Includes "Сводный отчет" title and overall score
   */
  private async addFirstPage(
    doc: typeof PDFDocument,
    data: SurveyResults,
    isPaid: boolean,
  ): Promise<void> {
    // Task 4.5: Use proper font size and spacing
    // Title: "Сводный отчет" (Cyrillic)
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('Сводный отчет', { align: 'center' })
      .moveDown(0.5);

    // Survey type and date
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(
        `Тип опроса: ${data.surveyType === 'express' ? 'Экспресс' : 'Полный'}`,
        { align: 'center' },
      )
      .text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, {
        align: 'center',
      })
      .moveDown(1.5);

    // Overall score
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor(data.overallContent.color || '#000000')
      .text(`Общий результат: ${data.overallScore}%`, { align: 'center' })
      .fillColor('#000000')
      .moveDown(0.5);

    // Overall description
    if (data.overallContent.resultDescription) {
      doc
        .fontSize(12)
        .font('Helvetica')
        .text(data.overallContent.resultDescription, {
          align: 'center',
          width: 450,
        })
        .moveDown(2);
    }

    // Task 4.3: Generate and add pie chart
    try {
      const chartBuffer = await this.generatePieChart(data);
      if (chartBuffer) {
        // Check if we need a new page for the chart
        if (doc.y > 400) {
          doc.addPage();
        }

        doc.image(chartBuffer, {
          fit: [450, 300],
          align: 'center',
        });
        doc.moveDown(1.5);
      }
    } catch (error) {
      this.logger.warn('Failed to generate pie chart:', error);
      // Continue without chart
    }

    // Category summary list
    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .text('Результаты по категориям:', { align: 'left' })
      .moveDown(0.5);

    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((category) => {
        const scoreColor = category.content.color || this.getColorForScore(category.score);

        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .fillColor(scoreColor)
          .text(`${category.name}: ${category.score}%`, { continued: false })
          .fillColor('#000000')
          .font('Helvetica')
          .fontSize(10)
          .text(`  ${category.content.resultDescription || ''}`, {
            indent: 20,
          })
          .moveDown(0.5);
      });
    }

    doc.moveDown(1);

    // Task 4.2: Show upgrade message for free version
    if (!isPaid) {
      doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .fillColor('#FF6B6B')
        .text('🔒 Детальный анализ доступен в платной версии', {
          align: 'center',
        })
        .fontSize(11)
        .fillColor('#666666')
        .font('Helvetica')
        .text(
          'Обновите до полного отчета для получения подробного анализа по каждой категории и подкатегории',
          { align: 'center', width: 450 },
        )
        .fillColor('#000000')
        .moveDown(1);
    }
  }

  /**
   * Task 4.4: Adds a detailed page for a category (paid version only)
   * Includes subcategory breakdowns and descriptive text
   */
  private async addCategoryDetailPage(
    doc: typeof PDFDocument,
    category: CategoryResult,
  ): Promise<void> {
    doc.addPage();

    // Category title
    const categoryColor = category.content.color || this.getColorForScore(category.score);

    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .fillColor(categoryColor)
      .text(category.name, { align: 'left' })
      .fillColor('#000000')
      .moveDown(0.5);

    // Category score
    doc
      .fontSize(18)
      .font('Helvetica-Bold')
      .text(`Результат: ${category.score}%`, { align: 'left' })
      .moveDown(0.5);

    // Category description
    if (category.content.resultDescription) {
      doc
        .fontSize(11)
        .font('Helvetica')
        .text(category.content.resultDescription, {
          align: 'left',
          width: 495,
        })
        .moveDown(1.5);
    }

    // Subcategories section
    if (category.subcategories && category.subcategories.length > 0) {
      doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Подкатегории:', { align: 'left' })
        .moveDown(0.5);

      for (const subcategory of category.subcategories) {
        const subColor = subcategory.content.color || this.getColorForScore(subcategory.score);

        // Check if we need a new page
        if (doc.y > 650) {
          doc.addPage();
        }

        // Subcategory name and score
        doc
          .fontSize(14)
          .font('Helvetica-Bold')
          .fillColor(subColor)
          .text(`${subcategory.name}: ${subcategory.score}%`)
          .fillColor('#000000')
          .moveDown(0.3);

        // Subcategory description with proper text wrapping
        if (subcategory.content.resultDescription) {
          doc
            .fontSize(10)
            .font('Helvetica')
            .text(subcategory.content.resultDescription, {
              indent: 20,
              width: 475,
              align: 'left',
            })
            .moveDown(0.8);
        }
      }
    }
  }

  /**
   * Task 4.3: Generates a pie chart for category scores
   * Shows category percentages with consistent color scheme
   */
  private async generatePieChart(data: SurveyResults): Promise<Buffer | null> {
    try {
      // Task 4.6: Use appropriate canvas size for optimal file size
      const canvas = createCanvas(500, 350);
      const ctx = canvas.getContext('2d');

      if (!data.categories || data.categories.length === 0) {
        return null;
      }

      // Get pie chart data from analytics calculator
      const pieChartData = this.analyticsCalculator.getPieChartData(
        {
          overallScore: data.overallScore,
          categoryScores: data.categories.reduce(
            (acc, cat) => {
              acc[cat.name] = cat.score;
              return acc;
            },
            {} as Record<string, number>,
          ),
          subcategoryScores: {},
          totalQuestions: 0,
          answeredQuestions: 0,
        },
        // We need to provide a minimal survey structure
        {
          id: 1,
          type: data.surveyType === 'express' ? 'EXPRESS' : 'FULL',
          name: data.surveyType,
          structure: data.categories.map((cat, idx) => ({
            id: cat.name.toLowerCase(),
            name: cat.name,
            subcategories: [],
          })),
        } as any,
      );

      // Task 4.3: Create the chart with percentages displayed
      const chart = new Chart(ctx as any, {
        type: 'pie',
        data: {
          labels: pieChartData.labels.map(
            (label, idx) => `${label} (${pieChartData.percentages[idx]}%)`,
          ),
          datasets: [
            {
              data: pieChartData.values,
              backgroundColor: pieChartData.colors,
              borderColor: '#ffffff',
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 15,
                usePointStyle: true,
                font: {
                  size: 11,
                  family: 'Helvetica',
                },
              },
            },
            title: {
              display: true,
              text: 'Распределение результатов по категориям',
              font: {
                size: 16,
                weight: 'bold',
                family: 'Helvetica',
              },
              padding: {
                top: 10,
                bottom: 20,
              },
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.label}: ${context.parsed}%`;
                },
              },
            },
          },
        },
      });

      // Wait for chart to render
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Task 4.6: Convert canvas to buffer with compression
      const buffer = canvas.toBuffer('image/png', {
        compressionLevel: 6,
      });

      chart.destroy();

      return buffer;
    } catch (error) {
      this.logger.error('Error generating pie chart:', error);
      return null;
    }
  }

  /**
   * Adds footer to the PDF
   */
  private addFooter(doc: typeof PDFDocument, isPaid: boolean): void {
    const pageCount = doc.bufferedPageRange().count;

    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);

      const oldBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      doc
        .fontSize(9)
        .fillColor('#666666')
        .text(
          'Сгенерировано Business Assessment Platform',
          50,
          doc.page.height - 50,
          { align: 'center' },
        )
        .text(
          `Страница ${i + 1} из ${pageCount}`,
          50,
          doc.page.height - 35,
          { align: 'center' },
        );

      doc.page.margins.bottom = oldBottomMargin;
    }

    doc.fillColor('#000000');
  }

  /**
   * Gets color based on score value
   * Task 4.3: Consistent color scheme
   */
  private getColorForScore(score: number): string {
    if (score >= 75) return '#4CAF50'; // Green - Excellent
    if (score >= 50) return '#FFC107'; // Yellow - Good
    if (score >= 25) return '#FF9800'; // Orange - Needs Improvement
    return '#F44336'; // Red - Critical
  }

  /**
   * Generates a simple text-based report for testing purposes
   * Kept for backward compatibility
   */
  generateTextReport(data: SurveyResults): string {
    let report = `
Business Assessment Report
========================

Тип опроса: ${data.surveyType === 'express' ? 'Экспресс' : 'Полный'}
Общий результат: ${data.overallScore}%

${data.overallContent.resultDescription || ''}

Результаты по категориям:
`;

    if (data.categories && data.categories.length > 0) {
      data.categories.forEach((category) => {
        report += `\n- ${category.name}: ${category.score}%`;
        if (category.content.resultDescription) {
          report += `\n  ${category.content.resultDescription}`;
        }

        if (category.subcategories && category.subcategories.length > 0) {
          category.subcategories.forEach((sub) => {
            report += `\n  - ${sub.name}: ${sub.score}%`;
          });
        }
      });
    }

    return report.trim();
  }
}
