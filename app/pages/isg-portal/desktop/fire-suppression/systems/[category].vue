<script setup lang="ts">
import {
  AlertTriangle,
  ArrowLeft,
  Container,
  Cylinder,
  Droplets,
  FileText,
  FireExtinguisher,
  Gauge,
  Waves,
} from '@lucide/vue'
import { fireSuppressionSystemApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
} from '~/types/fire-suppression-inventory'
import type { FireSuppressionSystemComponentDetail } from '~/types/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const route = useRoute()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const category = computed<FireSuppressionCategory>(() => {
  const raw = String(route.params.category)
  return (FIRE_SUPPRESSION_CATEGORIES as string[]).includes(raw) ? raw as FireSuppressionCategory : 'diger'
})

const detail = ref<FireSuppressionSystemComponentDetail | null>(null)
const loading = ref(true)
const tab = ref<'components' | 'controls' | 'nonconformities'>('components')

const CATEGORY_ICONS: Record<FireSuppressionCategory, typeof Droplets> = {
  sprinkler: Droplets,
  yangin_dolabi: FireExtinguisher,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Cylinder,
  gazli_sondurme: Container,
  diger: FileText,
}

const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const res = await fireSuppressionSystemApi.detail(context.branchId, category.value)
    detail.value = res.data
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  load()
})

watch([() => context.branchId, category], load)

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const controlItemStatusMeta = (status: string) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Uygulanamıyor', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

const scopeLabel = (scope: string) => ({ all: 'Tüm Bileşenler', specific: 'Belirli Bileşen', area: 'Alan', unknown: 'Belirsiz' }[scope] ?? scope)

const componentDisplayName = (item: { code?: string | null; display_name?: string | null }) =>
  item.display_name || item.code || '—'

const nonconformCount = computed(() => (detail.value?.control_items ?? []).filter(ci => ci.status === 'uygun_degil').length)

// Bazı ana bileşenler (Yangın Pompa Dairesi gibi) TEK bir kapsayıcı kayıt
// (code=null) + onun altında ayrı kayıtlı ekipman (Pompa 1, Pompa 2...)
// şeklinde tutuluyor — kapsayıcının kendisi bir "bileşen" olarak
// listelenmez, sadece alt kayıtlar gösterilir.
const visibleComponents = computed(() => (detail.value?.components ?? []).filter(c => !!c.code))
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1200px]">
          <NuxtLink to="/isg-portal/desktop/fire-suppression/inventory" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#111827] dark:hover:text-white">
            <ArrowLeft :size="16" />
            Tesisat Durumuna Dön
          </NuxtLink>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>

          <template v-else-if="detail">
            <section class="mb-5 flex items-center gap-3 rounded-xl border border-[#e7e9ed] bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] dark:border-gray-800 dark:bg-gray-900">
              <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
                <component :is="CATEGORY_ICONS[category]" :size="22" />
              </span>
              <div>
                <p class="text-lg font-bold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[category] }}</p>
                <p class="text-xs text-gray-400">{{ visibleComponents.length }} bileşen kayıtlı<span v-if="detail.report"> · Son rapor: {{ formatDate(detail.report.report_date) }}{{ detail.report.report_no ? ` (${detail.report.report_no})` : '' }}</span></p>
              </div>
            </section>

            <div class="mb-5 inline-flex flex-wrap rounded-lg border border-[#e7e9ed] bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'components' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'components'">Bileşenler ({{ visibleComponents.length }})</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'controls' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'controls'">Kontroller ({{ detail.control_items.length }})</button>
              <button type="button" class="rounded-md px-4 py-2 text-sm font-semibold transition" :class="tab === 'nonconformities' ? 'bg-[#d71920] text-white' : 'text-gray-500'" @click="tab = 'nonconformities'">Uygunsuzluklar ({{ detail.findings.length }})</button>
            </div>

            <!-- Bileşenler -->
            <section v-if="tab === 'components'" class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
              <div v-if="!visibleComponents.length" class="py-12 text-center text-sm text-gray-400">Bu sistem için henüz kayıtlı bileşen yok.</div>
              <table v-else class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                    <th class="px-4 py-2.5">Kod / Ad</th>
                    <th class="px-4 py-2.5">Konum</th>
                    <th class="px-4 py-2.5">Son Kontrol</th>
                    <th class="px-4 py-2.5">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in visibleComponents" :key="item.id" class="border-b border-[#f1f2f4] last:border-0 dark:border-gray-800">
                    <td class="px-4 py-2.5 font-semibold text-[#172033] dark:text-white">{{ componentDisplayName(item) }}</td>
                    <td class="px-4 py-2.5 text-gray-600 dark:text-gray-300">{{ item.location_note || '—' }}</td>
                    <td class="px-4 py-2.5 text-gray-600 dark:text-gray-300">{{ formatDate(item.last_control_date) }}</td>
                    <td class="px-4 py-2.5">
                      <span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="item.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5'">{{ item.is_active ? 'Aktif' : 'Pasif' }}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>

            <!-- Kontroller -->
            <section v-else-if="tab === 'controls'" class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
              <div v-if="!detail.report" class="py-12 text-center text-sm text-gray-400">Bu sistem için henüz rapor yüklenmedi.</div>
              <div v-else-if="!detail.control_items.length" class="py-12 text-center text-sm text-gray-400">Son raporda bu sisteme ait kontrol maddesi yok.</div>
              <table v-else class="w-full text-left text-sm">
                <thead>
                  <tr class="border-b border-[#f1f2f4] text-xs font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                    <th class="px-4 py-2.5">Bileşen</th>
                    <th class="px-4 py-2.5">Kod</th>
                    <th class="px-4 py-2.5">Kontrol Maddesi</th>
                    <th class="px-4 py-2.5">Durum</th>
                    <th class="px-4 py-2.5">Açıklama</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ci in detail.control_items" :key="ci.id" class="border-b border-[#f1f2f4] last:border-0 dark:border-gray-800">
                    <td class="px-4 py-2.5 text-xs font-semibold text-gray-500">{{ ci.equipment_code || '—' }}</td>
                    <td class="px-4 py-2.5 text-xs font-semibold text-gray-500">{{ ci.code || '—' }}</td>
                    <td class="px-4 py-2.5 text-gray-700 dark:text-gray-200">{{ ci.title }}</td>
                    <td class="px-4 py-2.5"><span class="rounded-full px-2 py-0.5 text-[11px] font-semibold" :class="controlItemStatusMeta(ci.status).cls">{{ controlItemStatusMeta(ci.status).label }}</span></td>
                    <td class="px-4 py-2.5 text-xs text-gray-500">{{ ci.description || '—' }}</td>
                  </tr>
                </tbody>
              </table>
              <p v-if="detail.control_items.length" class="border-t border-[#f1f2f4] px-4 py-2.5 text-xs text-gray-400 dark:border-gray-800">{{ nonconformCount }} madde uygun değil</p>
            </section>

            <!-- Uygunsuzluklar -->
            <section v-else class="space-y-3">
              <div v-if="!detail.report" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-12 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">Bu sistem için henüz rapor yüklenmedi.</div>
              <div v-else-if="!detail.findings.length" class="rounded-xl border border-dashed border-[#dfe3e8] bg-white py-12 text-center text-sm text-gray-400 dark:border-gray-700 dark:bg-gray-900">Son raporda bu sisteme ait uygunsuzluk yok.</div>
              <div v-for="finding in detail.findings" :key="finding.id" class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <div class="flex items-start gap-3">
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><AlertTriangle :size="16" /></span>
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span v-if="finding.control_item" class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ finding.control_item }}</span>
                      <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 dark:bg-white/5">{{ scopeLabel(finding.scope) }}</span>
                      <span class="rounded-full px-2 py-0.5 text-[10px] font-semibold" :class="finding.status === 'open' ? 'bg-red-50 text-[#d71920] dark:bg-red-500/10' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10'">{{ finding.status === 'open' ? 'Açık' : 'Kapalı' }}</span>
                    </div>
                    <p class="mt-1.5 text-sm text-gray-700 dark:text-gray-200">{{ finding.description }}</p>
                    <p v-if="finding.area_note" class="mt-1 text-xs text-gray-400">Alan: {{ finding.area_note }}</p>
                  </div>
                </div>
              </div>
            </section>
          </template>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
