<script setup lang="ts">
import { Building2, Layers3, Network, ZoomIn, ZoomOut, Maximize2 } from '@lucide/vue'
import OrganizationChart from 'organization-chart-vue3'
import 'organization-chart-vue3/style.css'

definePageMeta({
  layout: 'default',
})

type OrgNode = {
  id: string
  title: string
  member?: []
  children?: OrgNode[]
  meta: {
    type: 'Holding' | 'Grup' | 'Şirket' | 'Marka'
    tone: 'purple' | 'green' | 'blue' | 'orange'
  }
}

const groups = [
  {
    name: 'Dayanıklı Tüketim Grubu',
    companies: [
      {
        name: 'Arçelik A.Ş.',
        shortName: 'arcelik',
        brands: ['Arçelik', 'Beko', 'Altus', 'Grundig'],
      },
      {
        name: 'Arçelik Pazarlama A.Ş.',
        shortName: 'arcelik-pazarlama',
        brands: [],
      },
    ],
  },
  {
    name: 'Otomotiv Grubu',
    companies: [
      {
        name: 'Tofaş Türk Otomobil Fabrikası A.Ş.',
        shortName: 'tofas',
        brands: ['Tofaş'],
      },
      {
        name: 'Otokar A.Ş.',
        shortName: 'otokar',
        brands: ['Otokar'],
      },
    ],
  },
  {
    name: 'Enerji Grubu',
    companies: [
      {
        name: 'Tüpraş - Türkiye Petrol Rafinerileri A.Ş.',
        shortName: 'tupras',
        brands: [],
      },
    ],
  },
]

const orgData = computed<OrgNode>(() => ({
  id: 'koc-holding',
  title: 'Koç Holding',
  member: [],
  meta: { type: 'Holding', tone: 'purple' },
  children: groups.map((group, groupIndex) => ({
    id: `group-${groupIndex}`,
    title: group.name,
    member: [],
    meta: { type: 'Grup', tone: 'purple' },
    children: group.companies.map((company, companyIndex) => ({
      id: `company-${groupIndex}-${companyIndex}`,
      title: company.name,
      member: [],
      meta: { type: 'Şirket', tone: 'green' },
      children: company.brands.map((brand, brandIndex) => ({
        id: `brand-${groupIndex}-${companyIndex}-${brandIndex}`,
        title: brand,
        member: [],
        meta: { type: 'Marka', tone: 'blue' },
      })),
    })),
  })),
}))

const totalCompanies = computed(() => groups.reduce((total, group) => total + group.companies.length, 0))
const totalBrands = computed(() => groups.reduce((total, group) => total + group.companies.reduce((sum, company) => sum + company.brands.length, 0), 0))

const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

const zoomIn = () => {
  zoom.value = Math.min(1.8, Number((zoom.value + 0.1).toFixed(2)))
}

const zoomOut = () => {
  zoom.value = Math.max(0.55, Number((zoom.value - 0.1).toFixed(2)))
}

const resetView = () => {
  zoom.value = 1
  pan.value = { x: 0, y: 0 }
}

const onWheel = (event: WheelEvent) => {
  event.preventDefault()
  zoom.value = Math.min(1.8, Math.max(0.55, Number((zoom.value * (event.deltaY < 0 ? 1.08 : 0.92)).toFixed(3))))
}

const startPan = (event: MouseEvent) => {
  if (event.button !== 0) return
  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    panX: pan.value.x,
    panY: pan.value.y,
  }
}

const movePan = (event: MouseEvent) => {
  if (!isDragging.value) return
  pan.value = {
    x: dragStart.value.panX + event.clientX - dragStart.value.x,
    y: dragStart.value.panY + event.clientY - dragStart.value.y,
  }
}

const endPan = () => {
  isDragging.value = false
}

const chartTransform = computed(() => ({
  transform: `translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
}))

const toneClasses = {
  purple: 'border-brand-200 bg-brand-50 text-brand-600 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-400',
  green: 'border-success-200 bg-success-50 text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400',
  blue: 'border-blue-light-200 bg-blue-light-50 text-blue-light-700 dark:border-blue-light-500/30 dark:bg-blue-light-500/10 dark:text-blue-light-400',
  orange: 'border-warning-200 bg-warning-50 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400',
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px]">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Organizasyon Yönetimi</h1>
      <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Kurumsal yapının hiyerarşik görünümünü inceleyin.</p>
    </div>

    <OrganizationTabs />

    <div class="mb-5 flex w-full flex-col gap-3 md:flex-row">
      <div class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><Layers3 :size="18" /></span>
          <div><p class="text-xs font-medium text-gray-500 dark:text-gray-400">Grup</p><p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ groups.length }}</p></div>
        </div>
      </div>

      <div class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"><Building2 :size="18" /></span>
          <div><p class="text-xs font-medium text-gray-500 dark:text-gray-400">Şirket</p><p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ totalCompanies }}</p></div>
        </div>
      </div>

      <div class="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-400"><Network :size="18" /></span>
          <div><p class="text-xs font-medium text-gray-500 dark:text-gray-400">Marka</p><p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ totalBrands }}</p></div>
        </div>
      </div>
    </div>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div>
          <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Organizasyon Hiyerarşisi</h2>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Mevcut organizasyon yapısını yakınlaştırıp uzaklaştırarak inceleyin.</p>
        </div>

        <div class="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 shadow-theme-xs dark:border-gray-700 dark:bg-gray-900">
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-50 hover:text-brand-500 dark:hover:bg-white/[0.05]" title="Uzaklaştır" @click="zoomOut"><ZoomOut :size="16" /></button>
          <button type="button" class="flex h-8 min-w-12 items-center justify-center rounded-md px-2 text-xs font-medium text-gray-600 dark:text-gray-300" title="Görünümü sıfırla" @click="resetView">{{ Math.round(zoom * 100) }}%</button>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-50 hover:text-brand-500 dark:hover:bg-white/[0.05]" title="Yakınlaştır" @click="zoomIn"><ZoomIn :size="16" /></button>
          <button type="button" class="ml-1 flex h-8 w-8 items-center justify-center rounded-md border-l border-gray-200 text-gray-500 transition hover:text-brand-500 dark:border-gray-700" title="Görünümü sıfırla" @click="resetView"><Maximize2 :size="15" /></button>
        </div>
      </div>

      <div
        class="relative h-[620px] overflow-hidden bg-gray-50/60 dark:bg-gray-900/40"
        :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
        @wheel="onWheel"
        @mousedown="startPan"
        @mousemove="movePan"
        @mouseup="endPan"
        @mouseleave="endPan"
      >
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_55%)]" />

        <div class="absolute left-1/2 top-8 origin-top-left" :style="chartTransform">
          <ClientOnly>
            <OrganizationChart :data="orgData" :default-expand-all="true" class="hierarchy-org-chart">
              <template #node-title="{ node }">
                <div class="flex min-w-[190px] flex-col items-center gap-2 rounded-xl border bg-white px-5 py-4 text-center shadow-theme-xs dark:bg-gray-900" :class="toneClasses[node.meta?.tone ?? 'purple']">
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-current/10 text-current">
                    <Network v-if="node.meta?.type === 'Holding'" :size="18" />
                    <Layers3 v-else-if="node.meta?.type === 'Grup'" :size="18" />
                    <Building2 v-else-if="node.meta?.type === 'Şirket'" :size="18" />
                    <span v-else class="text-sm font-bold">◆</span>
                  </div>
                  <div class="max-w-[210px] text-sm font-semibold leading-5 text-gray-800 dark:text-white/90">{{ node.title }}</div>
                  <div class="text-[11px] font-medium" :class="node.meta?.tone === 'green' ? 'text-success-600 dark:text-success-400' : node.meta?.tone === 'blue' ? 'text-blue-light-600 dark:text-blue-light-400' : 'text-brand-600 dark:text-brand-400'">{{ node.meta?.type }}</div>
                </div>
              </template>
            </OrganizationChart>
          </ClientOnly>
        </div>

        <div class="absolute bottom-4 left-4 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-xs text-gray-500 shadow-theme-xs backdrop-blur dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-400">
          Sürükleyerek taşı · Tekerlek ile yakınlaştır
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-gray-100 bg-white px-6 py-4 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
        <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-brand-500" /> Holding / Grup</span>
        <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-success-500" /> Şirket</span>
        <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-blue-light-500" /> Marka</span>
        <span class="ml-auto inline-flex items-center gap-2"><Network :size="14" /> Salt okunur</span>
      </div>
    </section>
  </div>
</template>

<style>
.hierarchy-org-chart {
  min-width: max-content;
}

.hierarchy-org-chart .org-table {
  margin: 0 auto !important;
}

.hierarchy-org-chart .org-container {
  border: 0 !important;
  background: transparent !important;
}
</style>
