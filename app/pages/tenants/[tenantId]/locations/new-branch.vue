<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { Building2, Check, ChevronDown, ChevronLeft, ImagePlus, LoaderCircle, Search, Store, Trash2 } from 'lucide-vue-next'
import { locationApi, type LocationApiItem } from '~/api/location'
import { organizationApi } from '~/api/organization'
import { companyApi } from '~/api/company'
import { useLocationOperationalAreaStore } from '~/stores/locationOperationalArea'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tenantId = computed(() => Number(route.params.tenantId))
const { $toast } = useNuxtApp()

const step = ref<1 | 2>(1)
const buildingMode = ref<'existing' | 'standalone' | null>(null)
const errorMessage = ref('')

// --- Adım 1a: mevcut bina seçimi ---
// Sadece allows_multiple_branches=true olan lokasyonlar listelenir — müstakil
// lokasyonlara ikinci bir şube eklemek anlamsız (bkz. locations/multi-branch-buildings).
const buildings = ref<LocationApiItem[]>([])
const buildingsLoaded = ref(false)
const buildingsLoading = ref(false)
const buildingSearch = ref('')
const buildingIl = ref('')
const buildingIlce = ref('')
const selectedBuildingId = ref<number | null>(null)

const loadBuildings = async () => {
  buildingsLoading.value = true
  try {
    buildings.value = await locationApi.multiBranchBuildings()
    buildingsLoaded.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Bina listesi alınamadı.'
  } finally {
    buildingsLoading.value = false
  }
}

const ilOptions = computed(() => Array.from(new Set(buildings.value.map(b => b.city?.name).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'tr-TR')))
const ilceOptions = computed(() => {
  const pool = buildingIl.value ? buildings.value.filter(b => b.city?.name === buildingIl.value) : buildings.value
  return Array.from(new Set(pool.map(b => b.district?.name).filter((v): v is string => !!v))).sort((a, b) => a.localeCompare(b, 'tr-TR'))
})
const filteredBuildings = computed(() => {
  const term = buildingSearch.value.trim().toLocaleLowerCase('tr-TR')
  return buildings.value.filter((b) => {
    const haystack = `${b.name} ${b.city?.name ?? ''} ${b.district?.name ?? ''} ${b.address ?? ''}`.toLocaleLowerCase('tr-TR')
    return (!term || haystack.includes(term))
      && (!buildingIl.value || b.city?.name === buildingIl.value)
      && (!buildingIlce.value || b.district?.name === buildingIlce.value)
  })
})

const selectBuildingMode = (mode: 'existing' | 'standalone') => {
  buildingMode.value = mode
  selectedBuildingId.value = null
  if (mode === 'existing' && !buildingsLoaded.value) loadBuildings()
  if (mode === 'standalone' && !cities.value.length) loadCities()
}

// --- Adım 1b: müstakil yeni bina ---
const standaloneName = ref('')
const standaloneCityId = ref<number | null>(null)
const standaloneDistrictId = ref<number | null>(null)
const standaloneAddress = ref('')
const cities = ref<{ id: number; name: string }[]>([])
const districts = ref<{ id: number; name: string }[]>([])
const districtsLoading = ref(false)

const loadCities = async () => {
  try {
    cities.value = await locationApi.cities()
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'İl listesi alınamadı.'
  }
}

watch(standaloneCityId, async (cityId) => {
  standaloneDistrictId.value = null
  districts.value = []
  if (!cityId) return
  districtsLoading.value = true
  try {
    districts.value = await locationApi.districts(cityId)
  } finally {
    districtsLoading.value = false
  }
})

const canProceedStep1 = computed(() => {
  if (buildingMode.value === 'existing') return selectedBuildingId.value !== null
  if (buildingMode.value === 'standalone') return standaloneName.value.trim().length > 0
  return false
})

// --- Adım 2: şube (LocationBusinessEntity) bilgileri ---
const optionsLoading = ref(false)
const optionsLoaded = ref(false)
const groups = ref<{ id: number; name: string }[]>([])
const companies = ref<{ id: number; name: string; groupId: number | null; businessEntityId: number | null; brands: { id: number; name: string; logo_url?: string | null }[] }[]>([])
const selectedGroup = ref('')
const selectedCompanyId = ref<number | null>(null)
const selectedBrandId = ref<number | null>(null)
const branchAddress = ref('')
const branchIsActive = ref(true)
const nace = ref('')
const hazardClass = ref('')
const sgk = ref('')
const photoFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const areaId = ref<number | null>(null)
const operationalAreaStore = useLocationOperationalAreaStore()
const { areas: operationalAreas } = storeToRefs(operationalAreaStore)
const saving = ref(false)

const loadStep2Options = async () => {
  optionsLoading.value = true
  try {
    const [orgs, companyList] = await Promise.all([
      organizationApi.listForTenant(tenantId.value),
      companyApi.list(),
    ])
    groups.value = orgs.filter((o: any) => o.type === 'group').map((o: any) => ({ id: o.id, name: o.name }))
    companies.value = companyList.map((c: any) => ({
      id: c.id,
      name: c.name,
      groupId: c.organizations?.find((o: any) => groups.value.some(g => g.id === o.id))?.id ?? null,
      businessEntityId: c.business_entity_id ?? null,
      brands: c.brands || [],
    }))
    optionsLoaded.value = true
  } catch (e: any) {
    errorMessage.value = e?.data?.message || e?.message || 'Grup/firma seçenekleri alınamadı.'
  } finally {
    optionsLoading.value = false
  }
}

const goToStep2 = async () => {
  if (!canProceedStep1.value) return
  errorMessage.value = ''
  step.value = 2
  if (!optionsLoaded.value) await loadStep2Options()
  if (buildingMode.value === 'existing' && selectedBuildingId.value) {
    await operationalAreaStore.fetchAreas(selectedBuildingId.value)
  }
}
const backToStep1 = () => { step.value = 1; errorMessage.value = '' }

const filteredCompanies = computed(() => {
  const group = groups.value.find(g => g.name === selectedGroup.value)
  return group ? companies.value.filter(c => c.groupId === group.id) : []
})
const selectedCompany = computed(() => filteredCompanies.value.find(c => c.id === selectedCompanyId.value) ?? null)
const companyBrands = computed(() => selectedCompany.value?.brands ?? [])
const brandSelectionRequired = computed(() => companyBrands.value.length > 1)

watch(selectedGroup, () => { selectedCompanyId.value = null })
watch(companyBrands, (brands) => { selectedBrandId.value = brands.length === 1 ? brands[0].id : null })

const onPhotoChange = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  files.forEach((file) => {
    photoFiles.value.push(file)
    photoPreviews.value.push(URL.createObjectURL(file))
  })
  if (fileInput.value) fileInput.value.value = ''
}
const removePhoto = (index: number) => {
  URL.revokeObjectURL(photoPreviews.value[index])
  photoFiles.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const canSave = computed(() =>
  !!selectedGroup.value
  && !!selectedCompanyId.value
  && !!hazardClass.value
  && (!brandSelectionRequired.value || !!selectedBrandId.value)
  && !saving.value
)

const save = async () => {
  if (!canSave.value) return
  const businessEntityId = selectedCompany.value?.businessEntityId
  if (!businessEntityId) {
    errorMessage.value = 'Seçilen firma için işletme kaydı bulunamadı.'
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    let locationId = selectedBuildingId.value

    if (buildingMode.value === 'standalone') {
      const form = new FormData()
      form.append('name', standaloneName.value.trim())
      if (standaloneCityId.value !== null) form.append('city_id', String(standaloneCityId.value))
      if (standaloneDistrictId.value !== null) form.append('district_id', String(standaloneDistrictId.value))
      if (standaloneAddress.value.trim()) form.append('address', standaloneAddress.value.trim())
      form.append('allows_multiple_branches', '0')
      form.append('is_active', '1')
      const created = await locationApi.create(tenantId.value, form)
      locationId = created.id
    }

    if (!locationId) {
      errorMessage.value = 'Lokasyon belirlenemedi.'
      return
    }

    await locationApi.createBusinessEntity(locationId, {
      business_entity_id: businessEntityId,
      operational_region_id: areaId.value || null,
      nace_code: nace.value || null,
      hazard_class: hazardClass.value,
      sgk_workplace_number: sgk.value || null,
      address: branchAddress.value || null,
      is_active: branchIsActive.value,
      brand_ids: selectedBrandId.value ? [selectedBrandId.value] : [],
      photos: photoFiles.value,
    })

    $toast.success('Şube eklendi.')
    await navigateTo(`/tenants/${tenantId.value}/locations`)
  } catch (e: any) {
    const message = e?.data?.message || e?.message || 'Şube kaydedilemedi.'
    errorMessage.value = message
    $toast.error(message)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[900px]">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Yeni Şube</h1>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Bir marka/şirketin faaliyet gösterdiği şubeyi ekleyin.</p>
      </div>

      <div class="mb-6 flex items-center gap-3">
        <div class="flex items-center gap-2 text-sm font-medium" :class="step === 1 ? 'text-brand-600' : 'text-gray-400'">
          <span class="flex h-7 w-7 items-center justify-center rounded-full border-2" :class="step === 1 ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-300 text-gray-400'">1</span>
          Bina
        </div>
        <div class="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
        <div class="flex items-center gap-2 text-sm font-medium" :class="step === 2 ? 'text-brand-600' : 'text-gray-400'">
          <span class="flex h-7 w-7 items-center justify-center rounded-full border-2" :class="step === 2 ? 'border-brand-500 bg-brand-50 text-brand-600' : 'border-gray-300 text-gray-400'">2</span>
          Şube Bilgileri
        </div>
      </div>

      <div v-if="errorMessage" class="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ errorMessage }}</div>

      <!-- Adım 1 -->
      <div v-if="step === 1" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Bu şube mevcut bir bina/AVM içinde mi, yoksa müstakil mi?</p>
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" class="rounded-xl border p-4 text-left transition" :class="buildingMode === 'existing' ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'" @click="selectBuildingMode('existing')">
            <Building2 :size="20" class="mb-2 text-brand-500" />
            <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Mevcut Bina</span>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Bu şube, sistemde zaten kayıtlı çok şubeli bir bina/AVM içinde.</span>
          </button>
          <button type="button" class="rounded-xl border p-4 text-left transition" :class="buildingMode === 'standalone' ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'" @click="selectBuildingMode('standalone')">
            <Store :size="20" class="mb-2 text-brand-500" />
            <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Müstakil</span>
            <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Bu şubenin kendi bağımsız binası var.</span>
          </button>
        </div>

        <!-- Mevcut bina seçimi -->
        <div v-if="buildingMode === 'existing'" class="mt-5">
          <div class="relative mb-3">
            <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="buildingSearch" type="search" placeholder="Bina/AVM ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950" />
          </div>
          <div class="mb-3 grid grid-cols-2 gap-2">
            <div class="relative"><select v-model="buildingIl" class="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs dark:border-gray-700 dark:bg-gray-950"><option value="">Tüm İller</option><option v-for="opt in ilOptions" :key="opt" :value="opt">{{ opt }}</option></select><ChevronDown :size="12" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div>
            <div class="relative"><select v-model="buildingIlce" class="h-10 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-xs dark:border-gray-700 dark:bg-gray-950"><option value="">Tüm İlçeler</option><option v-for="opt in ilceOptions" :key="opt" :value="opt">{{ opt }}</option></select><ChevronDown :size="12" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div>
          </div>
          <div v-if="buildingsLoading" class="py-8 text-center text-sm text-gray-500">Yükleniyor...</div>
          <div v-else class="max-h-72 overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
            <button v-for="b in filteredBuildings" :key="b.id" type="button" class="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2.5 text-left last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5" :class="b.id === selectedBuildingId ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''" @click="selectedBuildingId = b.id">
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ b.name }}</span>
                <span class="block truncate text-xs text-gray-400">{{ [b.district?.name, b.city?.name].filter(Boolean).join(' / ') }}</span>
              </span>
              <Check v-if="b.id === selectedBuildingId" :size="16" class="shrink-0 text-brand-500" />
            </button>
            <p v-if="!filteredBuildings.length" class="px-3 py-8 text-center text-xs text-gray-400">Çok şubeli bina bulunamadı.</p>
          </div>
        </div>

        <!-- Müstakil yeni bina -->
        <div v-else-if="buildingMode === 'standalone'" class="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Bina/Şube Adı</span><input v-model="standaloneName" type="text" placeholder="Örn. Beşiktaş Şubesi" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950" /></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">İl</span><div class="relative"><select v-model.number="standaloneCityId" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm dark:border-gray-700 dark:bg-gray-950"><option :value="null">İl seçiniz</option><option v-for="c in cities" :key="c.id" :value="c.id">{{ c.name }}</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">İlçe</span><div class="relative"><select v-model.number="standaloneDistrictId" :disabled="!standaloneCityId || districtsLoading" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-950"><option :value="null">İlçe seçiniz</option><option v-for="d in districts" :key="d.id" :value="d.id">{{ d.name }}</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Adres</span><input v-model="standaloneAddress" type="text" placeholder="Açık adres" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950" /></label>
        </div>

        <div class="mt-6 flex justify-end">
          <button type="button" :disabled="!canProceedStep1" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" @click="goToStep2">Devam Et</button>
        </div>
      </div>

      <!-- Adım 2 -->
      <div v-else class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div v-if="optionsLoading" class="flex items-center justify-center gap-2 py-12 text-sm text-gray-500"><LoaderCircle :size="18" class="animate-spin" /> Veriler yükleniyor...</div>
        <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Grup</span><div class="relative"><select v-model="selectedGroup" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm dark:border-gray-700 dark:bg-gray-950"><option value="">Grup seçiniz</option><option v-for="g in groups" :key="g.id" :value="g.name">{{ g.name }}</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Firma</span><div class="relative"><select v-model.number="selectedCompanyId" :disabled="!selectedGroup" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-950"><option :value="null">Firma seçiniz</option><option v-for="c in filteredCompanies" :key="c.id" :value="c.id">{{ c.name }}</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>

          <div v-if="brandSelectionRequired" class="sm:col-span-2">
            <span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Marka</span>
            <div class="flex flex-wrap gap-2">
              <button v-for="brand in companyBrands" :key="brand.id" type="button" class="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition" :class="selectedBrandId === brand.id ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300'" @click="selectedBrandId = brand.id">{{ brand.name }}</button>
            </div>
          </div>

          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Şube Adresi <span class="font-normal text-gray-400">(opsiyonel — binanın adresinden farklıysa, ör. kat/kapı no)</span></span><input v-model="branchAddress" type="text" placeholder="Örn. B Blok, 2. Kat, No:12" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-950" /></label>

          <label v-if="operationalAreas.length"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Operasyonel Alan <span class="font-normal text-gray-400">(opsiyonel)</span></span><div class="relative"><select v-model.number="areaId" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm dark:border-gray-700 dark:bg-gray-950"><option :value="null">Operasyonel alan seçiniz</option><option v-for="a in operationalAreas" :key="a.id" :value="a.id">{{ a.name }}</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>

          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">SGK Sicil No</span><input v-model="sgk" type="text" placeholder="SGK sicil numarası" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-950" /></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">NACE Kodu</span><input v-model="nace" type="text" placeholder="Örn. 27.51.01" class="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-950" /></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tehlike Sınıfı</span><div class="relative"><select v-model="hazardClass" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-8 text-sm dark:border-gray-700 dark:bg-gray-950"><option value="">Tehlike sınıfı seçiniz</option><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select><ChevronDown :size="14" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label class="flex items-center gap-2 pt-6"><input v-model="branchIsActive" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" /><span class="text-xs font-semibold text-gray-700 dark:text-gray-300">Şube aktif</span></label>

          <div class="sm:col-span-2">
            <span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Şube Fotoğrafları <span class="font-normal text-gray-400">(opsiyonel)</span></span>
            <div class="flex flex-wrap items-center gap-3">
              <div v-for="(preview, index) in photoPreviews" :key="index" class="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-brand-200 dark:border-brand-500/40">
                <img :src="preview" alt="Şube fotoğrafı" class="h-full w-full object-cover" />
                <button type="button" class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white hover:bg-error-600" @click="removePhoto(index)"><Trash2 :size="11" /></button>
              </div>
              <input ref="fileInput" type="file" accept="image/png,image/jpeg,image/webp" multiple class="hidden" @change="onPhotoChange" />
              <button type="button" class="flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-brand-400 hover:text-brand-500 dark:border-gray-700" @click="fileInput?.click()"><ImagePlus :size="18" /><span class="text-[10px] font-medium">Ekle</span></button>
            </div>
          </div>
        </div>

        <div class="mt-6 flex justify-between">
          <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="backToStep1"><ChevronLeft :size="15" /> Geri</button>
          <button type="button" :disabled="!canSave" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" @click="save">
            <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
            <Check v-else :size="15" />
            Şubeyi Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
