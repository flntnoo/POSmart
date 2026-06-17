import type { AnalyticsSummary } from "@/types/posmart";
import { apiRequest, queryString } from "./api";

export const analyticsService = {
  summary(filters?: { outletId?: string; startDate?: string; endDate?: string; userId?: string }) {
    return apiRequest<AnalyticsSummary>(`/api/analytics/summary${queryString(filters)}`);
  },
};
