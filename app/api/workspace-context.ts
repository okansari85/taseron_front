import { apiClient } from './client'
import type {
  WorkspaceContextBootstrap,
  WorkspaceLocationsResponse,
  WorkspaceOperationalAreasResponse,
  WorkspaceOrganizationsResponse,
} from '~/types/workspace-context'

export const workspaceContextApi = {
  bootstrap: () =>
    apiClient<{ data: WorkspaceContextBootstrap }>('/api/workspace-context').then(r => r.data),
  organizations: () =>
    apiClient<{ data: WorkspaceOrganizationsResponse }>('/api/workspace-context/organizations').then(r => r.data),
  locations: (organizationId: number, kind: 'organization' | 'brand' = 'organization') =>
    apiClient<{ data: WorkspaceLocationsResponse }>('/api/workspace-context/locations', {
      query: { organization_id: organizationId, kind },
    }).then(r => r.data),
  operationalAreas: (locationId: number) =>
    apiClient<{ data: WorkspaceOperationalAreasResponse }>('/api/workspace-context/operational-areas', {
      query: { location_id: locationId },
    }).then(r => r.data),
}
