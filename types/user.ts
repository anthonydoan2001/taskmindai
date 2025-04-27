export interface UserPreferences {
  militaryTime?: boolean;
  workType?: 'full-time' | 'part-time';
  categories?: string[];
  notifications?: Record<string, any>;
  theme?: 'light' | 'dark' | 'system';
} 