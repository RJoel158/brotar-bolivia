export interface AppConfig {
  apiUrl: string;
  environment: 'development' | 'production' | 'test';
  enableAnalytics: boolean;
}

export const appConfig: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  environment: (import.meta.env.MODE as 'development' | 'production' | 'test') || 'development',
  enableAnalytics: false,
};
