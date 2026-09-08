<script setup lang="ts">
import { BarChart3, Building2, ChevronRight, Filter, Info, LoaderCircle, Search, Settings, ShieldCheck, Users } from '@lucide/vue'
import { locationApi, type LocationApiItem } from '~/api/location'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const auth = useAuth()
const context = useIsgDesktopContextStore()

const locations = ref<LocationApiItem[]>([])
const loading = ref(true)
const search = ref('')
const selectedId = ref<number | null>(context.locationId)
const continuing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    locations.value = await locationApi.list(auth.user.value?.tenant_id ?? '')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return locations.value
  return locations.value.filter(l => `${l.name} ${l.city?.name ?? ''} ${l.district?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

const config = useRuntimeConfig()
const apiBaseUrl = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
const resolveImageUrl = (image?: string | null) => {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  return `${apiBaseUrl}/storage/${String(image).replace(/^\/+/, '').replace(/^storage\//, '')}`
}

const selected = computed(() => locations.value.find(l => l.id === selectedId.value) ?? null)

const continueNext = async () => {
  if (!selected.value || continuing.value) return
  continuing.value = true
  try {
    const location = selected.value
    context.setLocation({
      id: location.id,
      name: location.name,
      city: location.city?.name,
      district: location.district?.name,
      image: resolveImageUrl(location.image),
      branchCount: location.branch_count ?? 0,
    })

    if (context.isStandaloneLocation) {
      const entities = await locationApi.businessEntities(location.id)
      const only = entities.find(e => e.type === 'company') ?? entities[0]
      if (!only) {
        $toast.error('Bu lokasyona bağlı bir şube bulunamadı.')
        return
      }
      context.setBranch({
        id: only.pivot?.id ?? only.id,
        name: only.pivot?.brands?.[0]?.name || only.company?.name || only.name,
        code: only.pivot?.code,
        logo: only.pivot?.brands?.[0]?.logo_url,
        isActive: only.pivot?.is_active,
      })
      await navigateTo('/isg-portal/desktop')
      return
    }

    await navigateTo('/isg-portal/desktop/select-branch')
  } finally {
    continuing.value = false
  }
}

const features = [
  { icon: ShieldCheck, title: 'Güvenli İş Yerleri', subtitle: 'Riskleri birlikte azaltalım.' },
  { icon: BarChart3, title: 'Verimli Süreçler', subtitle: 'Tüm denetimler tek ekranda.' },
  { icon: Users, title: 'Sürdürülebilir Gelecek', subtitle: 'İnsan odaklı, güvenli yarınlar.' },
]
</script>

<template>
  <IsgContextShell
    variant="location"
    image-src="/images/abc.png"
    headline="Güvenli İşletmeler Güçlü Gelecek"
    description="Yangın güvenliği ve taşeron yönetimi süreçlerinizi tek platformda yönetin. Daha güvenli, daha sürdürülebilir işletmeler için birlikte."
    :features="features"
  >
    <div class="isg-location-page mx-auto max-w-6xl px-8 py-8">
      <div class="mb-8 flex justify-center">
        <IsgContextSteps :current-step="1" />
      </div>

      <h2 class="text-2xl font-bold text-brand-950 dark:text-white/90">Lokasyon Seç</h2>
      <p class="mt-1 text-sm text-gray-500">İşlem yapmak istediğiniz lokasyonu seçin.</p>

      <div class="mt-6 flex items-center gap-3">
        <div class="relative flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Lokasyon ara..." class="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900" />
        </div>
        <button type="button" class="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <Filter :size="15" />
          Filtrele
        </button>
      </div>

      <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="location in filtered"
          :key="location.id"
          type="button"
          class="overflow-hidden rounded-2xl border-2 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900"
          :class="selectedId === location.id ? 'border-error-500 bg-error-50/50 shadow-md ring-4 ring-error-100 dark:border-error-500 dark:bg-error-500/5 dark:ring-error-500/10' : 'border-gray-200 dark:border-gray-800'"
          @click="selectedId = location.id"
        >
          <div class="h-36 w-full overflow-hidden bg-gray-100 dark:bg-white/5">
            <img v-if="location.image" :src="resolveImageUrl(location.image)" :alt="location.name" class="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]" />
            <div v-else class="flex h-full w-full items-center justify-center text-gray-300"><Building2 :size="28" /></div>
          </div>
          <div class="p-4">
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="truncate text-sm font-bold text-brand-950 dark:text-white/90">{{ location.name }}</p>
                <p class="mt-0.5 truncate text-xs text-gray-400">{{ [location.district?.name, location.city?.name].filter(Boolean).join(', ') }}</p>
              </div>
              <ChevronRight :size="16" class="mt-0.5 shrink-0 text-gray-300" />
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                <Building2 :size="13" />{{ location.branch_count ?? 0 }} şube
              </span>
              <span class="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                <Settings :size="13" />{{ location.equipment_count ?? 0 }} ekipman
              </span>
            </div>
          </div>
        </button>
        <p v-if="!filtered.length" class="col-span-full py-16 text-center text-sm text-gray-400">Lokasyon bulunamadı.</p>
      </div>

      <div class="mt-6 flex flex-col gap-4 rounded-2xl border border-brand-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Info :size="15" /></span>
          <div>
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">Listede aradığınız lokasyonu göremiyor musunuz?</p>
            <p class="text-xs text-gray-400">Erişim talebi için sistem yöneticiniz ile iletişime geçin.</p>
          </div>
        </div>
        <button
          type="button"
          :disabled="!selected || continuing"
          class="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-error-500 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-error-600 disabled:opacity-40"
          @click="continueNext"
        >
          <LoaderCircle v-if="continuing" :size="16" class="animate-spin" />
          Devam Et
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>
  </IsgContextShell>
</template>

<style scoped>
.isg-location-page {
  min-height: 100%;
}

.isg-location-page h2 {
  font-size: 32px;
  line-height: 1.1;
}

.isg-location-page > .mb-8 {
  margin-bottom: 34px;
}

.isg-location-page .grid > button {
  border-radius: 10px;
}

.isg-location-page .grid > button > div:first-child {
  height: 122px;
}

.isg-location-page .grid > button > div:last-child {
  padding: 12px 16px 14px;
}

.isg-location-page .grid > button > div:last-child > div:first-child p:first-child {
  font-size: 15px;
}

.isg-location-page .grid > button > div:last-child > div:first-child p:last-child {
  color: #6072ad;
}

.isg-location-page .grid > button > div:last-child > div:last-child span {
  border-radius: 6px;
  background: #edf3ff;
  color: #344d8e;
  padding: 5px 9px;
}

.isg-location-page > div:last-child {
  border-radius: 10px;
  padding: 14px 18px;
}

/* Location page: use abc.png as a full-height sidebar background so its built-in slogan remains visible. */
.isg-location-page :deep(.isg-context-shell--location > .flex > aside) {
  position: relative;
}

.isg-location-page :deep(.isg-context-shell--location > .flex > aside > div) {
  position: relative;
}

.isg-location-page :deep(.isg-context-shell--location > .flex > aside > div > div:first-child) {
  position: relative;
  z-index: 2;
  flex: 1 1 auto;
  min-height: 100%;
}

.isg-location-page :deep(.isg-context-shell--location > .flex > aside > div > div:last-child) {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: 0 !important;
  margin: 0;
}

.isg-location-page :deep(.isg-context-shell--location > .flex > aside > div > div:last-child img) {
  object-position: center center;
}

.isg-location-page :deep(.isg-context-shell--location > .flex > aside > div > div:last-child > div) {
  z-index: 1;
}

@media (max-width: 1023px) {
  .isg-location-page {
    padding-left: 24px;
    padding-right: 24px;
  }
}
</style>
