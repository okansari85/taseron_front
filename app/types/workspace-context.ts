export type WorkspaceOrganizationType = 'holding' | 'group' | 'company' | 'brand'

export type WorkspaceOrganizationOption = {
  id: number
  name: string
  type: WorkspaceOrganizationType
  parent_id: number | null
}

export type WorkspaceLocationOption = {
  id: number
  name: string
  city: string | null
  district: string | null
  region: string | null
}

export type WorkspaceOperationalAreaOption = {
  id: number
  name: string
}

export type WorkspaceLocationExpertRegion = {
  id: number
  name: string
  location_id: number
  location_name: string | null
}

export type WorkspaceLocationExpertContext = {
  mode: 'none' | 'locked' | 'choice'
  regions: WorkspaceLocationExpertRegion[]
}

export type WorkspaceContextBootstrap = {
  operational_area_enabled: boolean
  location_view_mode: 'location' | 'business_entity'
  home: {
    organization_id: number | null
    location_id: number | null
    operational_region_id: number | null
  }
  location_expert: WorkspaceLocationExpertContext
}

export type WorkspaceOrganizationsResponse = {
  home_organization_id: number | null
  items: WorkspaceOrganizationOption[]
}

export type WorkspaceLocationsResponse = {
  organization_id: number
  items: WorkspaceLocationOption[]
}

export type WorkspaceOperationalAreasResponse = {
  location_id: number
  enabled: boolean
  items: WorkspaceOperationalAreaOption[]
}
