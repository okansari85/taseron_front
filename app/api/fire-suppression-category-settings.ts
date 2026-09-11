import { apiClient } from './client'
import type { FireSuppressionCategory } from '~/types/fire-suppression-inventory'

export type FireSuppressionCategorySettingItem = {
  category: FireSuppressionCategory
  custom_label: string | null
  is_enabled: boolean
}

type ListResponse = { data: FireSuppressionCategorySettingItem[] }
type ItemResponse = { data: FireSuppressionCategorySettingItem }

export const fireSuppressionCategorySettingApi = {
  list: () => apiClient<ListResponse>('/api/fire-suppression-category-settings'),
  update: (category: FireSuppressionCategory, payload: { custom_label?: string | null; is_enabled: boolean }) =>
    apiClient<ItemResponse>(`/api/fire-suppression-category-settings/${category}`, {
      method: 'PUT',
      body: payload,
    }),
}
