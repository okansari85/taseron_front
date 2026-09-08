<script setup lang="ts">
import { Award, Building2, Check, ChevronRight, LayoutGrid, LoaderCircle } from '@lucide/vue'
import { brandApi } from '~/api/brand'
import type { BrandApiRecord } from '~/types/brand'

const route = useRoute()
const tenantId = Number(route.params.tenantId)
const tenantStore = useTenantStore()
const { $toast } = useNuxtApp()

const tenant = computed(() => tenantStore.currentTenant)
const brands = ref<BrandApiRecord[]>([])
const loading = ref(true)
const saving = ref(false)
const savingOperationalArea = ref(false)
const savingLocationViewMode = ref(false)
const selectedBrandId = ref<number | null>(null)
const operationalAreaEnabled = ref(false)
const locationViewMode = ref<'location' | 'business_entity'>('location')
const error = ref('')

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const [tenantData, brandRes] = await Promise.all([
      tenantStore.fetchTenant(tenantId),
      brandApi.list(),
    ])
    brands.value = brandRes.data
    selectedBrandId.value = tenantData?.featured_brand_id ?? tenantData?.featured_brand?.id ?? null
    operationalAreaEnabled.value = !!tenantData?.operational_area_enabled
    locationViewMode.value = tenantData?.location_view_mode ?? 'location'
  } catch (e) {
    console.error(e)
    error.value = 'Ayarlar alınamadı.'
  } finally {
    loading.value = false
  }
}

onMounted(load)

const selectedBrand = computed(() => brands.value.find(b => b.id === selectedBrandId.value) ?? null)
const isDirty = computed(() => selectedBrandId.value !== (tenant.value?.featured_brand_id ?? tenant.value?.featured_brand?.id ?? null))

const save = async () => {
  saving.value = true
  try {
    await tenantStore.updateTenant(tenantId, { featured_brand_id: selectedBrandId.value })
    $toast.success('Ayarlar kaydedildi.')
  } catch (e) {
    console.error(e)
    $toast.error('Ayarlar kaydedilemedi.')
  } finally {
    saving.value = false
  }
}

const toggleOperationalArea = async () => {
  const next = !operationalAreaEnabled.value
  savingOperationalArea.value = true
  try {
    await tenantStore.updateTenant(tenantId, { operational_area_enabled: next })
    operationalAreaEnabled.value = next
    $toast.success(next ? 'Operasyonel alanlar açıldı.' : 'Operasyonel alanlar kapatıldı.')
  } catch (e) {
    console.error(e)
    $toast.error('Ayar kaydedilemedi.')
  } finally {
    savingOperationalArea.value = false
  }
}

const setLocationViewMode = async (mode: 'location' | 'business_entity') => {
  if (mode === locationViewMode.value) return
  savingLocationViewMode.value = true
  try {
    await tenantStore.updateTenant(tenantId, { location_view_mode: mode })
    locationViewMode.value = mode
    $toast.success('Lokasyonlar görünümü güncellendi.')
  } catch (e) {
    console.error(e)
    $toast.error('Ayar kaydedilemedi.')
  } finally {
    savingLocationViewMode.value = false
  }
}
</script>

<template>
  <div class="mx-auto w-full max-w-[900px] space-y-6">
    <div>
      <div class="mb-3 flex items-center gap-2 text-sm text-gray-400">
        <NuxtLink :to="`/tenants/${tenantId}`" class="transition hover:text-gray-700">{{ tenant?.name ?? 'Tenant' }}</NuxtLink>
        <ChevronRight :size="15" />
        <span class="text-gray-600">Ayarlar</span>
      </div>
      <h1 class="text-2xl font-semibold text-gray-900 dark:text-white/90">Ayarlar</h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenant genelinde geçerli olacak görsel ve yapılandırma ayarları.</p>
    </div>

    <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">Yükleniyor...</div>
    <div v-else-if="error" class="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-error-600 dark:border-gray-800 dark:bg-gray-900">{{ error }}</div>

    <div v-else class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-start gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Award :size="20" /></div>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Öne Çıkan Marka</h2>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Seçtiğin marka, alt yüklenici (contractor) portalının üst menüsünde logo olarak gösterilir. Boş bırakırsan portal varsayılan başlığı gösterir.</p>

          <div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <select v-model.number="selectedBrandId" class="h-11 w-full max-w-xs appearance-none rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option :value="null">— Seçili marka yok —</option>
              <option v-for="brand in brands" :key="brand.id" :value="brand.id">{{ brand.name }}</option>
            </select>

            <div v-if="selectedBrand" class="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800">
              <img v-if="selectedBrand.logo_url" :src="selectedBrand.logo_url" :alt="selectedBrand.name" class="h-8 w-8 rounded-md object-contain" />
              <span class="text-xs font-medium text-gray-600 dark:text-gray-300">{{ selectedBrand.name }}</span>
            </div>
          </div>

          <div class="mt-5 flex justify-end">
            <button type="button" :disabled="saving || !isDirty" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" @click="save">
              <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
              <Check v-else :size="15" />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-start gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><LayoutGrid :size="20" /></div>
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-4">
            <div class="min-w-0">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Operasyonel Alanları Göster</h2>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Açıksa, çalışma bağlamı seçicide (header) Lokasyon'dan sonra bir Operasyonel Alan kutusu da gösterilir. Kapalıysa, bu tenant'ın yapısında operasyonel alan kavramı hiç kullanılmaz.</p>
            </div>
            <button
              type="button"
              role="switch"
              :aria-checked="operationalAreaEnabled"
              :disabled="savingOperationalArea"
              class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="operationalAreaEnabled ? 'bg-brand-500' : 'bg-gray-200 dark:bg-gray-700'"
              @click="toggleOperationalArea"
            >
              <span class="inline-block h-4 w-4 transform rounded-full bg-white transition" :class="operationalAreaEnabled ? 'translate-x-6' : 'translate-x-1'" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && !error" class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-start gap-4">
        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Building2 :size="20" /></div>
        <div class="min-w-0 flex-1">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Lokasyonlar Görünümü</h2>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Lokasyonlar sayfasında her satırın neyi temsil edeceğini belirler. Tek bir kampüste birden fazla işletme varsa (ör. Beko) "Lokasyon Bazlı" uygundur. Aynı bina içinde bağımsız şubeler varsa (ör. bir AVM'deki farklı marka şubeleri) "Şube Bazlı" uygundur.</p>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              :disabled="savingLocationViewMode"
              class="rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="locationViewMode === 'location' ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
              @click="setLocationViewMode('location')"
            >
              <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Lokasyon Bazlı</span>
              <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Her satır fiziksel bir lokasyon (kampüs/bina). İçindeki işletmeler o satırda ikon olarak gösterilir.</span>
            </button>
            <button
              type="button"
              :disabled="savingLocationViewMode"
              class="rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="locationViewMode === 'business_entity' ? 'border-brand-500 bg-brand-50/60 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'"
              @click="setLocationViewMode('business_entity')"
            >
              <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Şube Bazlı</span>
              <span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Her satır bir şube (marka/şirket bağlantısı). Kendi fotoğrafı ve adresiyle ayrı ayrı listelenir.</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
