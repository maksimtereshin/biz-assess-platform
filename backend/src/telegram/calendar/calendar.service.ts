import { Injectable, Logger } from '@nestjs/common';

interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

interface CalendarCallbackData {
  action: 'prev_month' | 'next_month' | 'select' | 'confirm' | 'cancel' | 'noop';
  year?: number;
  month?: number;
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

interface DateRangeValidation {
  valid: boolean;
  error?: string;
}

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  private readonly MONTH_NAMES = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];

  private readonly DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  private readonly MAX_RANGE_DAYS = 365;

  /**
   * Get Russian month name by index (0-11)
   */
  getMonthName(monthIndex: number): string {
    if (monthIndex < 0 || monthIndex > 11) {
      throw new Error(`Invalid month index: ${monthIndex}`);
    }
    return this.MONTH_NAMES[monthIndex];
  }

  /**
   * Format date as YYYY-MM-DD for callback data
   */
  formatDateForCallback(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse date from callback data format YYYY-MM-DD
   */
  parseDateFromCallback(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return new Date(year, month - 1, day);
  }

  /**
   * Generate calendar keyboard for a specific month
   */
  generateCalendar(viewDate: Date, today: Date = new Date()): InlineKeyboardMarkup {
    return this.generateCalendarWithSelection(viewDate, undefined, undefined, today);
  }

  /**
   * Generate calendar keyboard with date selection highlighting
   */
  generateCalendarWithSelection(
    viewDate: Date,
    startDate?: Date,
    endDate?: Date,
    today: Date = new Date(),
  ): InlineKeyboardMarkup {
    const keyboard: InlineKeyboardButton[][] = [];

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // Header with navigation
    keyboard.push(this.createHeaderRow(year, month, today));

    // Day of week labels
    keyboard.push(this.createDayLabelsRow());

    // Calendar days
    const dayRows = this.createDayRows(year, month, startDate, endDate, today);
    keyboard.push(...dayRows);

    // Action buttons (confirm/cancel)
    keyboard.push(this.createActionRow(startDate, endDate));

    return { inline_keyboard: keyboard };
  }

  /**
   * Create header row with month/year and navigation buttons
   */
  private createHeaderRow(year: number, month: number, today: Date): InlineKeyboardButton[] {
    const monthName = this.getMonthName(month);
    const headerText = `${monthName} ${year}`;

    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Determine if we can navigate to previous/next month
    const canGoPrev = true; // Can always go to previous months
    const canGoNext = year < currentYear || (year === currentYear && month < currentMonth);

    const prevCallback = canGoPrev
      ? `calendar_prev_month:${year}-${String(month + 1).padStart(2, '0')}`
      : 'calendar_noop';

    const nextCallback = canGoNext
      ? `calendar_next_month:${year}-${String(month + 1).padStart(2, '0')}`
      : 'calendar_noop';

    return [
      { text: '◀️', callback_data: prevCallback },
      { text: headerText, callback_data: 'calendar_noop' },
      { text: canGoNext ? '▶️' : ' ', callback_data: nextCallback },
    ];
  }

  /**
   * Create day of week labels row
   */
  private createDayLabelsRow(): InlineKeyboardButton[] {
    return this.DAY_NAMES.map((day) => ({
      text: day,
      callback_data: 'calendar_noop',
    }));
  }

  /**
   * Create rows of calendar days
   */
  private createDayRows(
    year: number,
    month: number,
    startDate?: Date,
    endDate?: Date,
    today: Date = new Date(),
  ): InlineKeyboardButton[][] {
    const rows: InlineKeyboardButton[][] = [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get day of week (0 = Monday, 6 = Sunday)
    let dayOfWeek = firstDay.getDay();
    dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday from 0 to 6

    let currentRow: InlineKeyboardButton[] = [];

    // Fill empty days before month starts
    for (let i = 0; i < dayOfWeek; i++) {
      currentRow.push({ text: ' ', callback_data: 'calendar_noop' });
    }

    // Fill days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      const dateString = this.formatDateForCallback(date);

      // Determine if this date is in the future
      const isFuture = date > today;

      // Determine display text and callback
      let displayText = String(day);
      let callbackData = isFuture ? 'calendar_noop' : `calendar_select:${dateString}`;

      // Highlight selected dates
      if (startDate && endDate) {
        if (this.isSameDay(date, startDate) || this.isSameDay(date, endDate)) {
          displayText = `✅${day}`;
        } else if (date > startDate && date < endDate) {
          displayText = `•${day}`;
        }
      } else if (startDate && this.isSameDay(date, startDate)) {
        displayText = `✅${day}`;
      }

      currentRow.push({ text: displayText, callback_data: callbackData });

      // Start new row after Sunday
      if (currentRow.length === 7) {
        rows.push(currentRow);
        currentRow = [];
      }
    }

    // Fill remaining empty days in the last row
    while (currentRow.length > 0 && currentRow.length < 7) {
      currentRow.push({ text: ' ', callback_data: 'calendar_noop' });
    }

    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    return rows;
  }

  /**
   * Create action buttons row (confirm/cancel)
   */
  private createActionRow(startDate?: Date, endDate?: Date): InlineKeyboardButton[] {
    const buttons: InlineKeyboardButton[] = [];

    if (startDate && endDate) {
      const startStr = this.formatDateForCallback(startDate);
      const endStr = this.formatDateForCallback(endDate);
      buttons.push({
        text: '✅ Подтвердить выбор',
        callback_data: `calendar_confirm:${startStr}:${endStr}`,
      });
    }

    buttons.push({
      text: '❌ Отмена',
      callback_data: 'calendar_cancel',
    });

    return buttons;
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Parse callback data from button press
   */
  parseCallbackData(callbackData: string): CalendarCallbackData {
    const parts = callbackData.split(':');
    const action = parts[0].replace('calendar_', '');

    switch (action) {
      case 'prev_month':
      case 'next_month': {
        const [yearMonth] = parts.slice(1);
        const [year, month] = yearMonth.split('-').map(Number);
        return {
          action: action as 'prev_month' | 'next_month',
          year,
          month: month - 1, // Convert to 0-indexed
        };
      }

      case 'select': {
        const dateString = parts[1];
        const date = this.parseDateFromCallback(dateString);
        return { action: 'select', date };
      }

      case 'confirm': {
        const startStr = parts[1];
        const endStr = parts[2];
        return {
          action: 'confirm',
          startDate: this.parseDateFromCallback(startStr),
          endDate: this.parseDateFromCallback(endStr),
        };
      }

      case 'cancel':
        return { action: 'cancel' };

      case 'noop':
      default:
        return { action: 'noop' };
    }
  }

  /**
   * Validate date range selection
   */
  validateDateRange(startDate: Date, endDate: Date): DateRangeValidation {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    // Check if dates are in the future
    if (startDate > today || endDate > today) {
      return {
        valid: false,
        error: 'Нельзя выбрать будущие даты',
      };
    }

    // Check if end date is before start date
    if (endDate < startDate) {
      return {
        valid: false,
        error: 'Ошибка: конечная дата должна быть после начальной',
      };
    }

    // Check if range exceeds maximum
    const daysDiff = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff > this.MAX_RANGE_DAYS) {
      return {
        valid: false,
        error: `Ошибка: максимальный период - ${this.MAX_RANGE_DAYS} дней (1 год)`,
      };
    }

    return { valid: true };
  }

  /**
   * Navigate to previous month
   */
  getPreviousMonth(currentYear: number, currentMonth: number): { year: number; month: number } {
    if (currentMonth === 0) {
      return { year: currentYear - 1, month: 11 };
    }
    return { year: currentYear, month: currentMonth - 1 };
  }

  /**
   * Navigate to next month
   */
  getNextMonth(currentYear: number, currentMonth: number): { year: number; month: number } {
    if (currentMonth === 11) {
      return { year: currentYear + 1, month: 0 };
    }
    return { year: currentYear, month: currentMonth + 1 };
  }
}
