export interface SurveyQuestion {
  id: string;
  text: string;
  category: string;
  subcategory?: string;
  version?: string[];
}

export interface SurveyCategory {
  id: string;
  name: string;
  description?: string;
  subcategories?: Record<string, any>;
}

export interface SurveyVersion {
  id: string;
  name: string;
  description?: string;
}