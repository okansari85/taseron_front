import { apiClient } from './client'

export type WorkspaceThemeBrand = {
  id: number
  name: string
  logo_url: string | null
}

export type WorkspaceThemeOrganization = {
  id: number
  name: string
  type: string
  color: string | null
  default_brand: WorkspaceThemeBrand | null
}

export type WorkspaceTheme = {
  tenant_id: number
  tenant_name: string
  featured_brand: WorkspaceThemeBrand | null
  organization: WorkspaceThemeOrganization | null
}

type WorkspaceThemeResponse = { data: WorkspaceTheme }

export const workspaceThemeApi = {
  get: () => apiClient<WorkspaceThemeResponse>('/api/workspace-theme'),
}
