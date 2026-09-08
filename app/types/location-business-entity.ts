export type LocationBusinessEntityBrand = { id: number; name: string; logo_url?: string | null }
export type LocationBusinessEntityPhoto = { id: number; photo_path: string; order_no: number; photo_url: string }
export type LocationBusinessEntityCity = { id: number; name: string }
export type LocationBusinessEntityDistrict = { id: number; name: string }
export type LocationBusinessEntityLocation = {
  id: number
  name: string
  city: LocationBusinessEntityCity | null
  district: LocationBusinessEntityDistrict | null
}
export type LocationBusinessEntityCompany = { id: number; name: string }
export type LocationBusinessEntityRef = { id: number; name: string; company: LocationBusinessEntityCompany | null }
export type LocationBusinessEntityOperationalRegion = { id: number; name: string }

export type LocationBusinessEntityItem = {
  id: number
  location_id: number
  business_entity_id: number
  operational_region_id: number | null
  nace_code: string | null
  hazard_class: string
  sgk_workplace_number: string | null
  address: string | null
  is_active: boolean
  location: LocationBusinessEntityLocation | null
  business_entity: LocationBusinessEntityRef | null
  brands: LocationBusinessEntityBrand[]
  operational_region: LocationBusinessEntityOperationalRegion | null
  photos: LocationBusinessEntityPhoto[]
}
