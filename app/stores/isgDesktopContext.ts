import { defineStore } from 'pinia'

export const useIsgDesktopContextStore = defineStore('isgDesktopContext', () => {
  const locationId = ref<number | null>(null)
  const locationName = ref('')
  const locationCity = ref('')
  const locationDistrict = ref('')
  const locationImage = ref('')
  const branchCount = ref(0)

  const branchId = ref<number | null>(null)
  const branchName = ref('')
  const branchCode = ref('')
  const branchLogo = ref('')
  const branchIsActive = ref(true)

  // Tek şubeli (müstakil) bir lokasyonda "Şube Seç" adımının hiç gösterilmemesi gerekir.
  const isStandaloneLocation = computed(() => branchCount.value <= 1)

  const setLocation = (params: { id: number; name: string; city?: string | null; district?: string | null; image?: string | null; branchCount: number }) => {
    locationId.value = params.id
    locationName.value = params.name
    locationCity.value = params.city ?? ''
    locationDistrict.value = params.district ?? ''
    locationImage.value = params.image ?? ''
    branchCount.value = params.branchCount
    branchId.value = null
    branchName.value = ''
    branchCode.value = ''
    branchLogo.value = ''
    branchIsActive.value = true
  }

  const setBranch = (params: { id: number; name: string; code?: string | null; logo?: string | null; isActive?: boolean }) => {
    branchId.value = params.id
    branchName.value = params.name
    branchCode.value = params.code ?? ''
    branchLogo.value = params.logo ?? ''
    branchIsActive.value = params.isActive ?? true
  }

  const reset = () => {
    locationId.value = null
    locationName.value = ''
    locationCity.value = ''
    locationDistrict.value = ''
    locationImage.value = ''
    branchCount.value = 0
    branchId.value = null
    branchName.value = ''
    branchCode.value = ''
    branchLogo.value = ''
    branchIsActive.value = true
  }

  const ready = computed(() => locationId.value !== null && branchId.value !== null)

  return {
    locationId, locationName, locationCity, locationDistrict, locationImage, branchCount,
    branchId, branchName, branchCode, branchLogo, branchIsActive,
    isStandaloneLocation, ready,
    setLocation, setBranch, reset,
  }
})
