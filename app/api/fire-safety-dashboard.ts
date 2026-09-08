import { apiClient } from './client'
import type { FireSafetyDashboard } from '~/types/fire-safety-dashboard'

const unwrap = <T>(response: any): T => response?.data ?? response

export const fireSafetyDashboardApi = {
  get: async () => unwrap<FireSafetyDashboard>(await apiClient<any>('/api/fire-safety/dashboard')),
}
