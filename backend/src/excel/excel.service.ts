import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as fs from 'fs';
import * as path from 'path';
import { AnalyticsReport, UserEngagement } from '../analytics/dto/analytics.dto';

const MAX_ROWS_PER_SHEET = 10000;
const TELEGRAM_FILE_SIZE_LIMIT_MB = 50;

@Injectable()
export class ExcelService {
  /**
   * Generate an Excel analytics report from AnalyticsReport data
   * @param report Analytics report data
   * @returns File path to the generated Excel file
   */
  async generateAnalyticsReport(report: AnalyticsReport): Promise<string> {
    if (!report) {
      throw new Error('Invalid report data: report is required');
    }

    const workbook = new ExcelJS.Workbook();

    // Set workbook properties
    workbook.creator = 'BizAss Platform';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Create all sheets
    this.createReportInfoSheet(workbook, report);
    this.createUserStatisticsSheet(workbook, report);
    this.createSurveyMetricsSheet(workbook, report);
    this.createFinancialOverviewSheet(workbook, report);
    this.createTopUsersSheet(workbook, report);

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `analytics_report_${timestamp}.xlsx`;
    const filePath = path.join('/tmp', fileName);

    // Write file to disk with stream for memory efficiency
    await workbook.xlsx.writeFile(filePath);

    // Verify file size
    const stats = fs.statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);

    if (fileSizeMB > TELEGRAM_FILE_SIZE_LIMIT_MB) {
      fs.unlinkSync(filePath);
      throw new Error(
        `Generated file size (${fileSizeMB.toFixed(2)}MB) exceeds Telegram limit of ${TELEGRAM_FILE_SIZE_LIMIT_MB}MB`,
      );
    }

    return filePath;
  }

  /**
   * Create Report Info sheet with metadata
   */
  private createReportInfoSheet(workbook: ExcelJS.Workbook, report: AnalyticsReport): void {
    const sheet = workbook.addWorksheet('Информация об отчёте');

    // Add header
    this.addHeaderRow(sheet, ['Метаданные отчёта', 'Значение']);

    // Add report information
    const dateRangeText = report.dateRange.startDate && report.dateRange.endDate
      ? `${this.formatDate(report.dateRange.startDate)} - ${this.formatDate(report.dateRange.endDate)}`
      : 'За всё время';

    const rows = [
      ['Дата создания', this.formatDateTime(report.generatedAt)],
      ['Период', dateRangeText],
      ['Всего пользователей', report.userStats.totalUsers],
      ['Общая выручка', this.formatCurrency(report.financialMetrics.totalRevenue)],
      ['Тип отчёта', 'Экспорт аналитики'],
    ];

    rows.forEach((row) => {
      sheet.addRow(row);
    });

    // Auto-size columns
    sheet.columns = [
      { key: 'metric', width: 30 },
      { key: 'value', width: 40 },
    ];
  }

  /**
   * Create User Statistics sheet
   */
  private createUserStatisticsSheet(workbook: ExcelJS.Workbook, report: AnalyticsReport): void {
    const sheet = workbook.addWorksheet('Статистика пользователей');

    // Add header
    this.addHeaderRow(sheet, ['Метрика', 'Значение']);

    // Add data rows
    const rows = [
      ['Всего пользователей', report.userStats.totalUsers],
      ['Новых пользователей', report.userStats.newUsers],
      ['Темп роста пользователей (%)', report.userStats.userGrowthRate],
    ];

    rows.forEach((row) => {
      const addedRow = sheet.addRow(row);

      // Format percentage cell
      if (typeof row[0] === 'string' && row[0].includes('%')) {
        const cell = addedRow.getCell(2);
        cell.numFmt = '0.00';
      }
    });

    // Auto-size columns
    sheet.columns = [
      { key: 'metric', width: 35 },
      { key: 'value', width: 20 },
    ];
  }

  /**
   * Create Survey Metrics sheet
   */
  private createSurveyMetricsSheet(workbook: ExcelJS.Workbook, report: AnalyticsReport): void {
    const sheet = workbook.addWorksheet('Метрики опросов');

    // Add header
    this.addHeaderRow(sheet, [
      'Тип опроса',
      'Начато',
      'Завершено',
      'Конверсия (%)',
      'Ср. время (мин)',
      'Средний балл',
    ]);

    // Add data rows
    report.surveyStats.forEach((stat) => {
      const row = sheet.addRow([
        stat.type === 'express' ? 'Экспресс' : 'Полный',
        stat.started,
        stat.completed,
        stat.conversionRate,
        stat.averageCompletionTime ?? 'Н/Д',
        stat.averageScore ?? 'Н/Д',
      ]);

      // Format conversion rate
      const conversionCell = row.getCell(4);
      if (typeof conversionCell.value === 'number') {
        conversionCell.numFmt = '0.00';
      }

      // Format average score
      const scoreCell = row.getCell(6);
      if (typeof scoreCell.value === 'number') {
        scoreCell.numFmt = '0.00';
      }
    });

    // Auto-size columns
    sheet.columns = [
      { key: 'type', width: 15 },
      { key: 'started', width: 12 },
      { key: 'completed', width: 12 },
      { key: 'conversion', width: 15 },
      { key: 'avgTime', width: 18 },
      { key: 'avgScore', width: 15 },
    ];
  }

  /**
   * Create Financial Overview sheet
   */
  private createFinancialOverviewSheet(workbook: ExcelJS.Workbook, report: AnalyticsReport): void {
    const sheet = workbook.addWorksheet('Финансовая сводка');

    // Add header
    this.addHeaderRow(sheet, ['Метрика', 'Значение']);

    // Add data rows
    const rows = [
      ['Платных попыток', report.financialMetrics.paidRetakes],
      ['Общая выручка', report.financialMetrics.totalRevenue],
      ['Выручка за период', report.financialMetrics.periodRevenue],
      ['Средняя выручка на пользователя', report.financialMetrics.averageRevenuePerUser],
      ['Конверсия в оплату (%)', report.financialMetrics.paymentConversionRate],
    ];

    rows.forEach((row) => {
      const addedRow = sheet.addRow(row);
      const valueCell = addedRow.getCell(2);

      // Format currency values
      if (typeof row[0] === 'string' && row[0].includes('выручка') && typeof valueCell.value === 'number') {
        valueCell.numFmt = '#,##0';
      }

      // Format percentage
      if (typeof row[0] === 'string' && row[0].includes('%') && typeof valueCell.value === 'number') {
        valueCell.numFmt = '0.00';
      }

      // Format ARPU
      if (typeof row[0] === 'string' && row[0].includes('Средняя выручка') && typeof valueCell.value === 'number') {
        valueCell.numFmt = '#,##0.00';
      }
    });

    // Auto-size columns
    sheet.columns = [
      { key: 'metric', width: 40 },
      { key: 'value', width: 20 },
    ];
  }

  /**
   * Create Top Users sheet with pagination for large datasets
   */
  private createTopUsersSheet(workbook: ExcelJS.Workbook, report: AnalyticsReport): void {
    const sheet = workbook.addWorksheet('Топ пользователей');

    // Add header
    this.addHeaderRow(sheet, [
      'Место',
      'Telegram ID',
      'Имя',
      'Username',
      'Завершено опросов',
      'Средний балл',
      'Последняя активность',
    ]);

    // Paginate if too many users
    const users = report.topUsers.slice(0, MAX_ROWS_PER_SHEET);

    // Add data rows
    users.forEach((user, index) => {
      const row = sheet.addRow([
        index + 1,
        user.telegramId,
        user.firstName,
        user.username ?? 'Н/Д',
        user.completedSurveys,
        user.averageScore ?? 'Н/Д',
        this.formatDate(user.lastActivityDate),
      ]);

      // Format average score
      const scoreCell = row.getCell(6);
      if (typeof scoreCell.value === 'number') {
        scoreCell.numFmt = '0.00';
      }
    });

    // Add pagination note if needed
    if (report.topUsers.length > MAX_ROWS_PER_SHEET) {
      sheet.addRow([]);
      const noteRow = sheet.addRow([
        `Примечание: Показано первых ${MAX_ROWS_PER_SHEET} пользователей из ${report.topUsers.length} всего`,
      ]);
      noteRow.font = { italic: true, color: { argb: 'FF666666' } };
    }

    // Auto-size columns
    sheet.columns = [
      { key: 'rank', width: 10 },
      { key: 'telegramId', width: 15 },
      { key: 'firstName', width: 20 },
      { key: 'username', width: 20 },
      { key: 'completed', width: 20 },
      { key: 'avgScore', width: 15 },
      { key: 'lastActivity', width: 25 },
    ];
  }

  /**
   * Add styled header row to a worksheet
   */
  private addHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]): void {
    const headerRow = sheet.addRow(headers);

    // Style the header row
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF366092' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add borders
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });
  }

  /**
   * Format date to readable string (Russian locale)
   */
  private formatDate(date: Date): string {
    if (!date || !(date instanceof Date)) {
      return 'Н/Д';
    }

    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format datetime to readable string (Russian locale)
   */
  private formatDateTime(date: Date): string {
    if (!date || !(date instanceof Date)) {
      return 'Н/Д';
    }

    return date.toLocaleString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format currency value
   */
  private formatCurrency(value: number): string {
    if (typeof value !== 'number') {
      return 'Н/Д';
    }

    return `${value.toLocaleString('ru-RU')} руб.`;
  }

  /**
   * Delete a generated report file
   */
  async deleteReportFile(filePath: string): Promise<void> {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
