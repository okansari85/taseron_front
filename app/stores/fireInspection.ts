import { defineStore } from 'pinia'
import { workspaceContextApi } from '~/api/workspace-context'

export const useFireInspectionStore = defineStore('fireInspection', () => {
  const locationViewMode = ref<'location' | 'business_entity' | null>(null)
  let locationViewModePromise: Promise<void> | null = null

  const loadLocationViewMode = () => {
    if (locationViewMode.value !== null) return Promise.resolve()
    if (!locationViewModePromise) {
      locationViewModePromise = workspaceContextApi.bootstrap()
        .then((data) => { locationViewMode.value = data.location_view_mode })
        .catch(() => { locationViewModePromise = null })
    }
    return locationViewModePromise
  }

  // location_view_mode='location' olan tenantlarda (ör. Beko kampüs senaryosu) ikinci adım
  // "Şube Seç" değil "Operasyonel Alan Seç" olmalı — masaüstündeki aynı ayrımın mobil karşılığı.
  const step2Path = computed(() =>
    locationViewMode.value === 'location'
      ? '/isg-portal/fire-inspection/operational-area'
      : '/isg-portal/fire-inspection/branch',
  )

  const locationId = ref<number | null>(null)
  const locationName = ref<string>('')
  const locationCity = ref<string>('')
  const locationDistrict = ref<string>('')
  const locationImage = ref<string>('')

  const branchId = ref<number | null>(null)
  const branchName = ref<string>('')
  const branchLocationNote = ref<string>('')
  const branchLogo = ref<string>('')

  const setLocation = (id: number, name: string, city?: string | null, district?: string | null, image?: string | null) => {
    locationId.value = id
    locationName.value = name
    locationCity.value = city ?? ''
    locationDistrict.value = district ?? ''
    locationImage.value = image ?? ''
    branchId.value = null
    branchName.value = ''
    branchLocationNote.value = ''
    branchLogo.value = ''
  }

  const setBranch = (id: number, name: string, locationNote?: string | null, logo?: string | null) => {
    branchId.value = id
    branchName.value = name
    branchLocationNote.value = locationNote ?? ''
    branchLogo.value = logo ?? ''
  }

  const reset = () => {
    locationId.value = null
    locationName.value = ''
    locationCity.value = ''
    locationDistrict.value = ''
    locationImage.value = ''
    branchId.value = null
    branchName.value = ''
    branchLocationNote.value = ''
    branchLogo.value = ''
  }

  const ready = computed(() => locationId.value !== null && branchId.value !== null)

  return {
    locationViewMode, step2Path, loadLocationViewMode,
    locationId, locationName, locationCity, locationDistrict, locationImage,
    branchId, branchName, branchLocationNote, branchLogo,
    ready,
    setLocation, setBranch, reset,
  }
})
