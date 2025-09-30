import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'csv-parse/sync';

export interface ReportEntry {
  category: string;
  subcategory: string;
  titleSummary: string;
  result: string;
  resultDescription: string;
  min: number;
  max: number;
  color: string;
}

@Injectable()
export class ReportDataService implements OnModuleInit {
  private readonly logger = new Logger(ReportDataService.name);
  private reportData: Map<string, ReportEntry[]> = new Map();

  async onModuleInit() {
    await this.loadReportData();
  }

  private async loadReportData() {
    try {
      this.logger.log('Loading report data from CSV files...');

      const expressData = await this.parseCSV('express_report.csv');
      const fullData = await this.parseCSV('full_report.csv');

      this.reportData.set('express', expressData);
      this.reportData.set('full', fullData);

      this.logger.log(`Loaded ${expressData.length} express report entries and ${fullData.length} full report entries`);
    } catch (error) {
      this.logger.error('Failed to load report data:', error);
      throw new Error('Failed to load report data');
    }
  }

  private async parseCSV(filename: string): Promise<ReportEntry[]> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const basePath = isDevelopment ? 'src' : 'dist';
    const filePath = join(process.cwd(), basePath, 'data', 'reports', filename);

    try {
      const fileContent = readFileSync(filePath, 'utf-8');

      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      return records.map((record: any) => ({
        category: this.sanitizeCSVValue(record.category || ''),
        subcategory: this.sanitizeCSVValue(record.subcategory || ''),
        titleSummary: this.sanitizeCSVValue(record.title_summary || ''),
        result: this.sanitizeCSVValue(record.result || ''),
        resultDescription: this.sanitizeCSVValue(record.result_description || ''),
        min: parseInt(record.min) || 0,
        max: parseInt(record.max) || 100,
        color: this.sanitizeColorValue(record.color || '#000000'),
      }));
    } catch (error) {
      this.logger.error(`Failed to parse CSV file ${filename}:`, error);
      throw error;
    }
  }

  findReportContent(
    reportType: 'express' | 'full',
    category: string,
    percentage: number,
    subcategory?: string
  ): ReportEntry | null {
    const data = this.reportData.get(reportType);

    if (!data) {
      this.logger.warn(`No data found for report type: ${reportType}`);
      return null;
    }

    const entry = data.find(entry =>
      entry.category === category &&
      entry.subcategory === (subcategory || '') &&
      percentage >= entry.min &&
      percentage <= entry.max
    );

    if (!entry) {
      this.logger.warn(`No report content found for ${reportType} report, category: ${category}, subcategory: ${subcategory}, percentage: ${percentage}`);
    }

    return entry || null;
  }

  getColorForScore(score: number): string {
    if (score <= 20) return '#eb2f06';
    if (score <= 35) return '#f6b93b';
    if (score <= 49) return '#fad390';
    if (score <= 74) return '#b8e994';
    if (score <= 89) return '#78e08f';
    return '#6ab04c';
  }

  getCategories(reportType: 'express' | 'full'): string[] {
    const data = this.reportData.get(reportType);

    if (!data) {
      return [];
    }

    const categories = new Set<string>();
    data.forEach(entry => {
      if (entry.category && entry.subcategory === '') {
        categories.add(entry.category);
      }
    });

    return Array.from(categories);
  }

  getSubcategories(reportType: 'express' | 'full', category: string): string[] {
    const data = this.reportData.get(reportType);

    if (!data) {
      return [];
    }

    const subcategories = new Set<string>();
    data.forEach(entry => {
      if (entry.category === category && entry.subcategory) {
        subcategories.add(entry.subcategory);
      }
    });

    return Array.from(subcategories);
  }

  private sanitizeCSVValue(value: string): string {
    if (!value || typeof value !== 'string') {
      return '';
    }

    // Remove potential formula injection characters at the beginning
    const sanitized = value.replace(/^[=+\-@]/, '');

    // Additional sanitization for control characters
    return sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  }

  private sanitizeColorValue(value: string): string {
    if (!value || typeof value !== 'string') {
      return '#000000';
    }

    // Only allow valid hex color format
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexColorRegex.test(value) ? value : '#000000';
  }
}