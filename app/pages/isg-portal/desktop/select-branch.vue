<script setup lang="ts">
import { ArrowLeft, ArrowLeftRight, BarChart3, Building2, ChevronRight, Filter, LoaderCircle, Search, Settings, ShieldCheck, Tag, Users } from '@lucide/vue'
import { locationApi, type LocationBusinessEntity } from '~/api/location'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()

const branches = ref<LocationBusinessEntity[]>([])
const loading = ref(true)
const search = ref('')
const selectedId = ref<number | null>(null)
const continuing = ref(false)

onMounted(async () => {
  if (!context.locationId) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  // Müstakil (tek şubeli) lokasyonlarda bu ekran hiç gösterilmemeli — mantık hatasıydı,
  // burada da select-location.vue'daki otomatik atlama mantığı tekrarlanıyor.
  if (context.isStandaloneLocation) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  loading.value = true
  try {
    const all = await locationApi.businessEntities(context.locationId)
    branches.value = all.filter(b => b.type === 'company')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return branches.value
  return branches.value.filter(b => `${branchLabel(b)} ${b.pivot?.code ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

const branchBrand = (b: LocationBusinessEntity) => b.pivot?.brands?.[0] ?? null
const branchLabel = (b: LocationBusinessEntity) => branchBrand(b)?.name || b.company?.name || b.name
const branchPhoto = (b: LocationBusinessEntity) => b.pivot?.photos?.[0]?.photo_url ?? null

const selected = computed(() => branches.value.find(b => (b.pivot?.id ?? b.id) === selectedId.value) ?? null)

const continueNext = async () => {
  if (!selected.value || continuing.value) return
  continuing.value = true
  try {
    const b = selected.value
    context.setBranch({
      id: b.pivot?.id ?? b.id,
      name: branchLabel(b),
      code: b.pivot?.code,
      logo: branchBrand(b)?.logo_url,
      isActive: b.pivot?.is_active,
    })
    await navigateTo('/isg-portal/desktop')
  } finally {
    continuing.value = false
  }
}

const features = [
  { icon: ShieldCheck, title: 'Riskleri azaltın' },
  { icon: BarChart3, title: 'Süreçleri kolaylaştırın' },
  { icon: Users, title: 'Daha güvenli yarınlara birlikte ulaşın' },
]
</script>

<template>
  <IsgContextShell
    headline="Güvenli İşletmeler Güçlü Yarınlar"
    :features="features"
    footer-note="Güvenlik, sürdürülebilir büyümenin temelidir."
  >
    <div class="mx-auto max-w-6xl px-8 py-8">
      <div class="mb-8 flex items-center justify-between">
        <IsgContextSteps :current-step="2" :location-name="context.locationName" />
        <NuxtLink to="/isg-portal/desktop/select-location" class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <ArrowLeftRight :size="15" />
          Lokasyon Değiştir
        </NuxtLink>
      </div>

      <h2 class="text-2xl font-bold text-brand-950 dark:text-white/90">Şube Seç</h2>
      <p class="mt-1 text-sm text-gray-500">{{ context.locationName }} lokasyonu için işlem yapacağınız şubeyi seçin.</p>

      <div class="mt-6 flex items-center gap-3">
        <div class="relative flex-1">
          <Search :size="16" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Şube adı, kodu veya marka ara..." class="h-12 w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-brand-300 dark:border-gray-700 dark:bg-gray-900" />
        </div>
        <button type="button" class="flex h-12 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <Filter :size="15" />
          Filtrele
        </button>
      </div>

      <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <button
          v-for="b in filtered"
          :key="b.pivot?.id ?? b.id"
          type="button"
          class="overflow-hidden rounded-2xl border-2 bg-white text-left transition-colors dark:bg-gray-900"
          :class="selectedId === (b.pivot?.id ?? b.id) ? 'border-error-400 bg-error-50/40 dark:border-error-500/50 dark:bg-error-500/5' : 'border-gray-200 dark:border-gray-800'"
          @click="selectedId = b.pivot?.id ?? b.id"
        >
          <div class="h-32 w-full overflow-hidden bg-gray-100 dark:bg-white/5">
            <img v-if="branchPhoto(b)" :src="branchPhoto(b)!" :alt="branchLabel(b)" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center text-gray-300"><Building2 :size="26" /></div>
          </div>
          <div class="p-4">
            <div class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white dark:border-gray-700">
                <img v-if="branchBrand(b)?.logo_url" :src="branchBrand(b)!.logo_url!" :alt="branchLabel(b)" class="h-full w-full object-contain" />
                <span v-else class="text-xs font-semibold text-brand-600">{{ branchLabel(b).charAt(0) }}</span>
              </span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-sm font-bold text-gray-900 dark:text-white/90">{{ branchLabel(b) }}</p>
                  <ChevronRight :size="15" class="shrink-0 text-gray-300" />
                </div>
                <p class="truncate text-xs text-gray-400">{{ context.locationName }}</p>
              </div>
            </div>
            <div class="mt-1 flex items-center justify-end">
              <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="b.pivot?.is_active ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'">{{ b.pivot?.is_active ? 'Aktif' : 'Pasif' }}</span>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <span class="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                <Tag :size="13" />Şube Kodu: {{ b.pivot?.code || '—' }}
              </span>
              <span class="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                <Settings :size="13" />Ekipman: {{ b.pivot?.equipment_count ?? 0 }}
              </span>
            </div>
          </div>
        </button>
        <p v-if="!filtered.length" class="col-span-full py-16 text-center text-sm text-gray-400">Şube bulunamadı.</p>
      </div>

      <div class="mt-6 flex items-center justify-between">
        <NuxtLink to="/isg-portal/desktop/select-location" class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <ArrowLeft :size="15" />
          Geri
        </NuxtLink>
        <button
          type="button"
          :disabled="!selected || continuing"
          class="flex items-center justify-center gap-2 rounded-xl bg-error-500 px-6 py-3 text-sm font-semibold text-white disabled:opacity-40"
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
