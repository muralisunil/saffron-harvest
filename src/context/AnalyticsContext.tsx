import React, { createContext, useContext, ReactNode } from 'react';
import { useAnalytics, ProductEventData, SearchEventData, PerformanceEventData, GenericEventData } from '@/hooks/useAnalytics';

interface AnalyticsContextType {
  trackEvent: (data: GenericEventData) => Promise<void>;
  trackProductEvent: (data: ProductEventData) => Promise<void>;
  trackSearchEvent: (data: SearchEventData) => Promise<void>;
  trackPerformance: (data: PerformanceEventData) => Promise<void>;
  sessionId: string;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const analytics = useAnalytics();

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalyticsContext = (): AnalyticsContextType => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

// Export types for external use
export type { ProductEventData, SearchEventData, PerformanceEventData, GenericEventData };
