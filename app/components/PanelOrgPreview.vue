<template>
  <aside class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <h3 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Oluşturulacak Yapı Önizlemesi</h3>
    <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{{ description }}</p>

    <div
      ref="chartWrap"
      class="relative mt-5 h-[260px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
      :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
      @wheel.prevent="zoomWithWheel"
      @mousedown="startPan"
      @mousemove="movePan"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <div
        ref="chartCanvas"
        class="absolute left-1/2 top-0 origin-top transition-transform duration-150"
        :class="isDragging ? 'duration-0' : ''"
        :style="chartTransform"
      >
        <OrganizationChart
          :data="orgData"
          :default-expand-all="true"
          class="tenant-org-chart"
        >
          <template #node-title="{ node }">
            <div class="tenant-node-content">
              <span class="tenant-node-icon">{{ node.meta?.icon }}</span>
              <span class="tenant-node-title">{{ node.title }}</span>
              <span :class="['tenant-node-type', node.meta?.textClass ?? 'text-brand-500']">
                {{ node.meta?.type }}
              </span>
              <span
                v-if="node.meta?.automatic"
                class="tenant-node-automatic"
              >
                Otomatik
              </span>
            </div>
          </template>
        </OrganizationChart>
      </div>

      <div class="absolute right-3 top-3 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[11px] text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400">
        Tekerlek ile yakınlaştır
      </div>
    </div>

    <div class="my-5 border-t border-gray-200 dark:border-gray-800" />

    <div class="space-y-3">
      <div v-for="row in legend" :key="row.title" class="flex items-start gap-3">
        <span :class="['mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-xs', row.bg, row.text]">{{ row.icon }}</span>
        <div>
          <div :class="['text-theme-xs font-semibold', row.text]">{{ row.title }}</div>
          <div class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">{{ row.desc }}</div>
        </div>
      </div>
    </div>

    <div class="mt-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/10">
      <div class="text-sm font-semibold text-brand-600 dark:text-brand-400">Bilgi</div>
      <div class="mt-1 text-theme-xs text-brand-700 dark:text-brand-400">Seçtiğiniz kurumsal yapıya göre ilk yapılandırma burada gösterilir. Şahıs şirketinde merkez lokasyon otomatik oluşturulur.</div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import OrganizationChart from 'organization-chart-vue3'
import 'organization-chart-vue3/style.css'

const props = defineProps<{ reviewMode?: boolean }>()
const form = useTenantForm()

type PreviewMeta = {
  type: string
  textClass: string
  icon: string
  automatic?: boolean
}

type PreviewNode = {
  id: string
  title: string
  member: []
  children?: PreviewNode[]
  meta: PreviewMeta
}

const chartWrap = ref<HTMLElement | null>(null)
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

const onboardingType = computed(() => form.value.onboardingType)
const isCompany = computed(() => onboardingType.value === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
const rootLabel = computed(() => form.value.orgName || 'Organizasyon adı')
const selectedTypeLabel = computed(() => ORG_TYPES.find((type) => type.value === onboardingType.value)?.label ?? 'Organizasyon')
const description = computed(() =>
  props.reviewMode
    ? 'Tenant oluşturulduğunda aşağıdaki yapı oluşturulacaktır.'
    : `${selectedTypeLabel.value} seçiminize göre oluşturulacak yapı aşağıdaki gibidir.`,
)

const orgData = computed<PreviewNode>(() => {
  const children: PreviewNode[] = []

  if (onboardingType.value === 'company') {
    children.push({
      id: 'company',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Şirket', textClass: 'text-success-700 dark:text-success-400', icon: '▣' },
    })

    if (isSahisSirketi.value) {
      children.push({
        id: 'location',
        title: `${rootLabel.value} - Merkez`,
        member: [],
        meta: { type: 'Lokasyon', textClass: 'text-warning-700 dark:text-warning-400', icon: '⌖', automatic: true },
      })
    }
  }

  if (onboardingType.value === 'brand') {
    children.push({
      id: 'brand',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Marka', textClass: 'text-blue-light-600 dark:text-blue-light-400', icon: '◆' },
    })
  }

  if (onboardingType.value === 'group') {
    return {
      id: 'group',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Grup', textClass: 'text-brand-500 dark:text-brand-400', icon: '♧' },
    }
  }

  if (onboardingType.value === 'holding') {
    return {
      id: 'holding',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Holding', textClass: 'text-brand-500 dark:text-brand-400', icon: '⌂' },
    }
  }

  return {
    id: 'organization',
    title: `${rootLabel.value} - Organizasyon`,
    member: [],
    children,
    meta: { type: 'Organizasyon', textClass: 'text-brand-500 dark:text-brand-400', icon: '⌘' },
  }
})

const legend = [
  { title: 'Organizasyon', icon: '⌘', bg: 'bg-brand-50 dark:bg-brand-500/15', text: 'text-brand-500 dark:text-brand-400', desc: 'Kurumsal yapının başlangıç düğümüdür.' },
  { title: 'Şirket', icon: '▣', bg: 'bg-success-50 dark:bg-success-500/15', text: 'text-success-700 dark:text-success-400', desc: 'Şirket seçildiğinde ilk yapı altında şirket bilgileri oluşturulur.' },
  { title: 'Marka', icon: '◆', bg: 'bg-blue-light-50 dark:bg-blue-light-500/15', text: 'text-blue-light-600 dark:text-blue-light-400', desc: 'Marka seçildiğinde marka yapısı oluşturulur; bu aşamada şirket ve lokasyon oluşturulmaz.' },
  { title: 'Lokasyon', icon: '⌖', bg: 'bg-warning-50 dark:bg-warning-500/15', text: 'text-warning-700 dark:text-warning-400', desc: 'Şahıs şirketinde merkez lokasyon otomatik oluşturulur.' },
]

const chartTransform = computed(() => ({
  transform: `translateX(calc(-50% + ${pan.value.x}px)) translateY(${pan.value.y}px) scale(${zoom.value})`,
}))

const fitChart = async () => {
  await nextTick()

  requestAnimationFrame(() => {
    const wrap = chartWrap.value
    const chart = wrap?.querySelector('.tenant-org-chart') as HTMLElement | null
    if (!wrap || !chart) return

    const contentWidth = chart.offsetWidth || 1
    const contentHeight = chart.offsetHeight || 1
    const availableWidth = Math.max(1, wrap.clientWidth - 18)
    const availableHeight = Math.max(1, wrap.clientHeight - 18)

    const widthScale = availableWidth / contentWidth
    const heightScale = availableHeight / contentHeight
    const fitScale = Math.min(widthScale, heightScale)

    zoom.value = Number(Math.min(1.2, Math.max(0.72, fitScale)).toFixed(3))
    pan.value = {
      x: 0,
      y: Math.max(0, (wrap.clientHeight - contentHeight * zoom.value) / 2),
    }
  })
}

function startPan(event: MouseEvent) {
  if (event.button !== 0) return
  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY,
    panX: pan.value.x,
    panY: pan.value.y,
  }
}

function movePan(event: MouseEvent) {
  if (!isDragging.value) return

  pan.value = {
    x: dragStart.value.panX + event.clientX - dragStart.value.x,
    y: dragStart.value.panY + event.clientY - dragStart.value.y,
  }
}

function endPan() {
  isDragging.value = false
}

function zoomWithWheel(event: WheelEvent) {
  const nextZoom = zoom.value * (event.deltaY < 0 ? 1.08 : 0.92)
  zoom.value = Math.min(1.5, Math.max(0.65, nextZoom))
}

watch(
  [() => form.value.orgName, () => form.value.onboardingType, () => form.value.companyKind],
  () => fitChart(),
  { immediate: true },
)

onMounted(() => fitChart())
</script>

<style>
.tenant-org-chart {
  display: flex !important;
  justify-content: center !important;
}

.tenant-org-chart .org-table {
  margin: 0 auto !important;
}

.tenant-org-chart .org-container {
  width: 180px !important;
  min-width: 180px !important;
  min-height: 72px !important;
  border: 1px solid rgb(229 231 235) !important;
  border-radius: 0.75rem !important;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04) !important;
  overflow: hidden !important;
  background: transparent !important;
}

.dark .tenant-org-chart .org-container {
  border-color: rgb(55 65 81) !important;
}

.tenant-org-chart .org-title {
  min-height: 72px !important;
  padding: 12px !important;
  background: rgb(248 247 255) !important;
  border-radius: 0.75rem !important;
}

.tenant-org-chart .org-content {
  min-height: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
}

.tenant-org-chart .org-child-level,
.tenant-org-chart .org-extend {
  background: transparent !important;
}

.tenant-org-chart .tenant-node-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 48px;
}

.tenant-org-chart .tenant-node-icon {
  font-size: 18px;
  line-height: 1;
  color: #4f46e5;
}

.tenant-org-chart .tenant-node-title {
  max-width: 156px;
  overflow-wrap: anywhere;
  text-align: center;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.25;
  color: #1f2937;
}

.tenant-org-chart .tenant-node-type {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.tenant-org-chart .tenant-node-automatic {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  background: #fffbeb;
  padding: 2px 8px;
  font-size: 9px;
  font-weight: 500;
  line-height: 1;
  color: #b45309;
}

.dark .tenant-org-chart .tenant-node-title {
  color: #f8fafc;
}

.dark .tenant-org-chart .tenant-node-automatic {
  background: rgb(245 158 11 / 0.15);
  color: #fbbf24;
}
</style>
