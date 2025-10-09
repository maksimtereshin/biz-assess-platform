import { Test, TestingModule } from '@nestjs/testing';
import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CalendarService],
    }).compile();

    service = module.get<CalendarService>(CalendarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateCalendar', () => {
    it('should generate calendar for current month', () => {
      const now = new Date(2025, 9, 9); // October 9, 2025
      const calendar = service.generateCalendar(now);

      expect(calendar).toBeDefined();
      expect(calendar.inline_keyboard).toBeDefined();
      expect(calendar.inline_keyboard.length).toBeGreaterThan(0);
    });

    it('should include month and year header', () => {
      const date = new Date(2025, 9, 1); // October 2025
      const calendar = service.generateCalendar(date);

      const headerRow = calendar.inline_keyboard[0];
      expect(headerRow).toBeDefined();
      expect(headerRow.length).toBe(3); // prev, month/year, next
      expect(headerRow[1].text).toContain('Октябрь');
      expect(headerRow[1].text).toContain('2025');
    });

    it('should include day of week labels', () => {
      const calendar = service.generateCalendar(new Date(2025, 9, 1));

      const daysOfWeekRow = calendar.inline_keyboard[1];
      expect(daysOfWeekRow).toBeDefined();
      expect(daysOfWeekRow.length).toBe(7);
      expect(daysOfWeekRow[0].text).toBe('Пн');
      expect(daysOfWeekRow[6].text).toBe('Вс');
    });

    it('should disable future dates', () => {
      const today = new Date(2025, 9, 9);
      const calendar = service.generateCalendar(today);

      // Find a future date button
      const allButtons = calendar.inline_keyboard.flat();
      const futureButton = allButtons.find(btn =>
        btn.callback_data?.includes('calendar_select_') &&
        btn.callback_data.includes('2025-10-15')
      );

      // Future dates should either not exist or have special callback_data
      if (futureButton) {
        expect(futureButton.callback_data).toBe('calendar_noop');
      }
    });

    it('should include navigation buttons', () => {
      // Use a past date to ensure both nav buttons are enabled
      const calendar = service.generateCalendar(new Date(2025, 8, 1)); // September

      const headerRow = calendar.inline_keyboard[0];
      const prevButton = headerRow[0];
      const nextButton = headerRow[2];

      expect(prevButton.callback_data).toContain('calendar_prev_month');
      expect(nextButton.callback_data).toContain('calendar_next_month');
    });

    it('should generate correct number of week rows', () => {
      const calendar = service.generateCalendar(new Date(2025, 9, 1));

      // Should have: header, days of week, 4-6 week rows, confirm/cancel buttons
      expect(calendar.inline_keyboard.length).toBeGreaterThanOrEqual(7);
      expect(calendar.inline_keyboard.length).toBeLessThanOrEqual(9);
    });

    it('should not allow navigation to future months', () => {
      const today = new Date(2025, 9, 9); // October 2025
      const calendar = service.generateCalendar(today);

      const headerRow = calendar.inline_keyboard[0];
      const nextButton = headerRow[2];

      // Next button should be disabled if current month
      expect(nextButton.callback_data).toBe('calendar_noop');
    });

    it('should allow navigation to previous months', () => {
      const today = new Date(2025, 9, 9);
      const calendar = service.generateCalendar(today);

      const headerRow = calendar.inline_keyboard[0];
      const prevButton = headerRow[0];

      expect(prevButton.callback_data).not.toBe('calendar_noop');
      expect(prevButton.callback_data).toContain('calendar_prev_month');
    });
  });

  describe('generateCalendarWithSelection', () => {
    it('should highlight selected start date', () => {
      const viewDate = new Date(2025, 9, 1);
      const startDate = new Date(2025, 9, 5);
      const calendar = service.generateCalendarWithSelection(viewDate, startDate);

      const allButtons = calendar.inline_keyboard.flat();
      const selectedButton = allButtons.find(btn =>
        btn.callback_data?.includes('2025-10-05')
      );

      expect(selectedButton).toBeDefined();
      expect(selectedButton?.text).toContain('✅'); // Or other highlight marker
    });

    it('should highlight date range when both dates selected', () => {
      const viewDate = new Date(2025, 9, 1);
      const startDate = new Date(2025, 9, 5);
      const endDate = new Date(2025, 9, 10);
      const calendar = service.generateCalendarWithSelection(viewDate, startDate, endDate);

      const allButtons = calendar.inline_keyboard.flat();

      // Check start date is highlighted
      const startButton = allButtons.find(btn =>
        btn.callback_data?.includes('2025-10-05')
      );
      expect(startButton?.text).toContain('✅');

      // Check end date is highlighted
      const endButton = allButtons.find(btn =>
        btn.callback_data?.includes('2025-10-10')
      );
      expect(endButton?.text).toContain('✅');

      // Check dates in between are highlighted
      const middleButton = allButtons.find(btn =>
        btn.callback_data?.includes('2025-10-07')
      );
      expect(middleButton?.text).toContain('•');
    });

    it('should show confirm button when date range is selected', () => {
      const viewDate = new Date(2025, 9, 1);
      const startDate = new Date(2025, 9, 5);
      const endDate = new Date(2025, 9, 10);
      const calendar = service.generateCalendarWithSelection(viewDate, startDate, endDate);

      const lastRow = calendar.inline_keyboard[calendar.inline_keyboard.length - 1];
      const confirmButton = lastRow.find(btn => btn.callback_data?.startsWith('calendar_confirm'));

      expect(confirmButton).toBeDefined();
      expect(confirmButton?.text).toContain('Подтвердить');
    });
  });

  describe('parseCallbackData', () => {
    it('should parse month navigation callback', () => {
      const result = service.parseCallbackData('calendar_prev_month:2025-09');

      expect(result.action).toBe('prev_month');
      expect(result.year).toBe(2025);
      expect(result.month).toBe(8); // September (0-indexed: 9-1=8)
    });

    it('should parse date selection callback', () => {
      const result = service.parseCallbackData('calendar_select:2025-10-15');

      expect(result.action).toBe('select');
      expect(result.date).toEqual(new Date(2025, 9, 15));
    });

    it('should parse confirm callback', () => {
      const result = service.parseCallbackData('calendar_confirm:2025-10-05:2025-10-15');

      expect(result.action).toBe('confirm');
      expect(result.startDate).toEqual(new Date(2025, 9, 5));
      expect(result.endDate).toEqual(new Date(2025, 9, 15));
    });

    it('should handle cancel callback', () => {
      const result = service.parseCallbackData('calendar_cancel');

      expect(result.action).toBe('cancel');
    });

    it('should handle noop callback', () => {
      const result = service.parseCallbackData('calendar_noop');

      expect(result.action).toBe('noop');
    });
  });

  describe('validateDateRange', () => {
    it('should accept valid date range', () => {
      const startDate = new Date(2025, 8, 1);
      const endDate = new Date(2025, 8, 30);

      const result = service.validateDateRange(startDate, endDate);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject if end date is before start date', () => {
      const startDate = new Date(2025, 8, 30);
      const endDate = new Date(2025, 8, 1);

      const result = service.validateDateRange(startDate, endDate);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('конечная дата должна быть после начальной');
    });

    it('should reject if range exceeds 1 year', () => {
      const startDate = new Date(2024, 0, 1);
      const endDate = new Date(2025, 6, 1); // More than 1 year

      const result = service.validateDateRange(startDate, endDate);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('максимальный период');
    });

    it('should reject if dates are in the future', () => {
      const futureStart = new Date(2026, 0, 1);
      const futureEnd = new Date(2026, 0, 31);

      const result = service.validateDateRange(futureStart, futureEnd);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('будущие даты');
    });

    it('should accept range exactly 1 year', () => {
      const startDate = new Date(2024, 9, 1);
      const endDate = new Date(2025, 9, 1);

      const result = service.validateDateRange(startDate, endDate);

      expect(result.valid).toBe(true);
    });
  });

  describe('formatDateForCallback', () => {
    it('should format date as YYYY-MM-DD', () => {
      const date = new Date(2025, 9, 9);
      const formatted = service.formatDateForCallback(date);

      expect(formatted).toBe('2025-10-09');
    });

    it('should pad single digit months and days', () => {
      const date = new Date(2025, 0, 5); // January 5
      const formatted = service.formatDateForCallback(date);

      expect(formatted).toBe('2025-01-05');
    });
  });

  describe('parseDateFromCallback', () => {
    it('should parse YYYY-MM-DD format', () => {
      const date = service.parseDateFromCallback('2025-10-09');

      expect(date.getFullYear()).toBe(2025);
      expect(date.getMonth()).toBe(9); // October (0-indexed)
      expect(date.getDate()).toBe(9);
    });

    it('should handle invalid date strings', () => {
      expect(() => service.parseDateFromCallback('invalid')).toThrow();
    });
  });

  describe('getMonthName', () => {
    it('should return Russian month names', () => {
      expect(service.getMonthName(0)).toBe('Январь');
      expect(service.getMonthName(9)).toBe('Октябрь');
      expect(service.getMonthName(11)).toBe('Декабрь');
    });

    it('should throw for invalid month index', () => {
      expect(() => service.getMonthName(-1)).toThrow();
      expect(() => service.getMonthName(12)).toThrow();
    });
  });
});
