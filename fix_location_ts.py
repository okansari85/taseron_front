f = 'app/stores/location.ts'
s = open(f, encoding='utf-8').read()

old_type = """export type LocationBusinessEntity = {
  id: number
  companyName: string
  brandName?: string
  logoUrl: string
}"""
new_type = """export type LocationBusinessEntityBrand = {
  id: number
  name: string
  logoUrl: string
}

export type LocationBusinessEntity = {
  id: number
  companyName: string
  brands: LocationBusinessEntityBrand[]
}"""
assert old_type in s, 'type pattern not found'
s = s.replace(old_type, new_type)

old_map = """    businessEntities: entities
      .filter((entity: any) => entity.company)
      .map((entity: any) => {
        const brand = entity.pivot?.brands?.[0]
        return {
          id: entity.id,
          companyName: entity.company.name,
          brandName: brand?.name || '',
          logoUrl: brand?.logo_url || '',
        }
      }),"""
new_map = """    businessEntities: entities
      .filter((entity: any) => entity.company)
      .map((entity: any) => {
        const brands: any[] = entity.pivot?.brands || []
        return {
          id: entity.id,
          companyName: entity.company.name,
          brands: brands.map((brand: any) => ({
            id: brand.id,
            name: brand.name || '',
            logoUrl: brand.logo_url || '',
          })),
        }
      }),"""
assert old_map in s, 'map pattern not found'
s = s.replace(old_map, new_map)

open(f, 'w', encoding='utf-8').write(s)
print('OK')
