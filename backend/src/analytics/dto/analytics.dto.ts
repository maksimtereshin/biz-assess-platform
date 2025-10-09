export interface UserStatistics {
  totalUsers: number;
  newUsers: number;
  userGrowthRate: number;
}

export interface SurveyStatistics {
  type: string;
  started: number;
  completed: number;
  conversionRate: number;
  averageCompletionTime: number | null;
  averageScore: number | null;
}

export interface FinancialMetrics {
  paidRetakes: number;
  totalRevenue: number;
  periodRevenue: number;
  averageRevenuePerUser: number;
  paymentConversionRate: number;
}

export interface UserEngagement {
  telegramId: number;
  firstName: string;
  username?: string;
  completedSurveys: number;
  averageScore?: number;
  lastActivityDate: Date;
}

export interface AnalyticsReport {
  userStats: UserStatistics;
  surveyStats: SurveyStatistics[];
  financialMetrics: FinancialMetrics;
  topUsers: UserEngagement[];
  generatedAt: Date;
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export interface DateRangeDto {
  startDate?: Date;
  endDate?: Date;
}
