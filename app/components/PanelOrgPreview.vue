<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div
      ref="chartWrap"
      class="org-chart-wrap"
      :class="{ 'is-dragging': isDragging }"
      @mousedown="startPan"
      @mousemove="movePan"
      @mouseup="endPan"
      @mouseleave="endPan"
      @wheel.prevent="zoomWithWheel"
    >
      <div class="org-chart-canvas" :style="chartTransform">
        <OrganizationChart :data="orgData" :default-expand-all="true" class="tenant-org-chart">
          <template #node-title="{ node }">
            <div class="tenant-node-content">
              <v-icon :icon="node.meta.icon" :color="node.meta.color" size="20" class="tenant-node-icon" />
              <div class="tenant-node-name">{{ node.title }}</div>
              <div class="tenant-node-type" :class="node.meta.textClass">{{ node.meta.type }}</div>
              <div v-if="node.meta.automatic" class="tree-auto">Otomatik</div>
            </div>
          </template>
        </OrganizationChart>
      </div>

      <div class="org-chart-controls" aria-hidden="true">
        <v-icon icon="mdi-cursor-move" size="14" />
        <v-icon icon="mdi-magnify-plus" size="15" />
      </div>
    </div>

    <v-divider class="my-5" />

    <div v-for="row in legend" :key="row.title" class="d-flex mb-3" style="gap: 12px">
      <v-icon :icon="row.icon" :color="row.color" size="20" class="mt-1" />
      <div>
        <div class="text-caption font-weight-bold" :class="row.textClass">{{ row.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ row.desc }}</div>
      </div>
    </div>

    <v-alert color="primary" variant="tonal" icon="mdi-information-outline" density="comfortable" class="mt-2">
      <div class="text-body-2 font-weight-bold">Bilgi</div>
      <div class="text-caption mt-1">Seçtiğiniz kurumsal yapıya göre ilk yapılandırma burada gösterilir. Şahıs şirketinde merkez lokasyon otomatik oluşturulur.</div>
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import OrganizationChart from 'organization-chart-vue3'
import 'organization-chart-vue3/style.css'

const props = defineProps<{ reviewMode?: boolean }>()

type OrgMeta = { icon: string; color: string; type: string; textClass: string; automatic?: boolean }
type PreviewNode = {
  id: string
  title: string
  member: Array<{ name: string; add?: string }>
  children?: PreviewNode[]
  titleClass?: string
  contentClass?: string
  meta: OrgMeta
}

const form = useTenantForm()
const rootLabel = computed(() => form.value.orgName || 'Organizasyon adı')
const onboardingType = computed(() => form.value.onboardingType)
const isCompany = computed(() => onboardingType.value === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
const selectedTypeLabel = computed(() => ORG_TYPES.find((type) => type.value === onboardingType.value)?.label ?? 'Organizasyon')
const description = computed(() =>
  props.reviewMode
    ? 'Tenant oluşturulduğunda aşağıdaki yapı oluşturulacaktır.'
    : `${selectedTypeLabel.value} seçiminize göre oluşturulacak yapı aşağıdaki gibidir.`,
)

const orgData = computed<PreviewNode>(() => {
  const children: PreviewNode[] = []

  if (isCompany.value) {
    children.push({
      id: 'company',
      title: rootLabel.value,
      titleClass: 'tenant-title-company',
      member: [],
      meta: { icon: 'mdi-domain', color: 'success', type: 'Şirket', textClass: 'text-success' },
    })

    if (isSahisSirketi.value) {
      children.push({
        id: 'location',
        title: `${rootLabel.value} - Merkez`,
        titleClass: 'tenant-title-location',
        contentClass: 'tenant-content-location',
        member: [],
        meta: { icon: 'mdi-map-marker', color: 'warning', type: 'Lokasyon', textClass: 'text-warning', automatic: true },
      })
    }
  }

  if (onboardingType.value === 'brand') {
    children.push({
      id: 'brand',
      title: rootLabel.value,
      titleClass: 'tenant-title-brand',
      member: [],
      meta: { icon: 'mdi-tag-outline', color: 'info', type: 'Marka', textClass: 'text-info' },
    })
  }

  const isHolding = onboardingType.value === 'holding'
  const isGroup = onboardingType.value === 'group'

  if (isHolding || isGroup) {
    return {
      id: onboardingType.value,
      title: rootLabel.value,
      titleClass: isHolding ? 'tenant-title-holding' : 'tenant-title-group',
      member: [],
      meta: {
        icon: isHolding ? 'mdi-bank-outline' : 'mdi-account-group-outline',
        color: 'primary',
        type: isHolding ? 'Holding' : 'Grup',
        textClass: 'text-primary',
      },
    }
  }

  return {
    id: 'organization',
    title: rootLabel.value,
    titleClass: 'tenant-title-organization',
    member: [],
    children,
    meta: { icon: 'mdi-domain', color: 'primary', type: 'Organizasyon', textClass: 'text-primary' },
  }
})

const legend = [
  { title: 'Organizasyon', icon: 'mdi-domain', color: 'primary', textClass: 'text-primary', desc: 'Kurumsal yapının başlangıç düğümüdür.' },
  { title: 'Şirket', icon: 'mdi-domain', color: 'success', textClass: 'text-success', desc: 'Şirket seçildiğinde ilk yapı altında şirket bilgileri oluşturulur.' },
  { title: 'Marka', icon: 'mdi-tag-outline', color: 'info', textClass: 'text-info', desc: 'Marka seçildiğinde marka yapısı oluşturulur; bu aşamada şirket ve lokasyon oluşturulmaz.' },
  { title: 'Lokasyon', icon: 'mdi-map-marker', color: 'warning', textClass: 'text-warning', desc: 'Şahıs şirketinde merkez lokasyon otomatik oluşturulur.' },
]

const chartWrap = ref<HTMLElement | null>(null)
const pan = ref({ x: 0, y: 0 })
const zoom = ref(1)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

const chartTransform = computed(() => ({
  transform: `translate(-50%, 0) translate(${pan.value.x}px, ${pan.value.y}px) scale(${zoom.value})`,
}))

const fitChart = async () => {
  await nextTick()
  requestAnimationFrame(() => {
    const wrap = chartWrap.value
    const chart = wrap?.querySelector('.tenant-org-chart') as HTMLElement | null
    if (!wrap || !chart) return

    const contentWidth = chart.offsetWidth || 1
    const contentHeight = chart.offsetHeight || 1
    const availableWidth = Math.max(1, wrap.clientWidth - 12)
    const availableHeight = Math.max(1, wrap.clientHeight - 12)
    const widthScale = availableWidth / contentWidth
    const heightScale = availableHeight / contentHeight
    const nextZoom = Math.min(1.35, widthScale * 1.15, heightScale * 1.15)

    zoom.value = Number(Math.max(0.65, nextZoom).toFixed(3))
    pan.value = {
      x: 0,
      y: (wrap.clientHeight - contentHeight * zoom.value) / 2,
    }
  })
}

const startPan = (event: MouseEvent) => {
  if (event.button !== 0) return
  const target = event.target as HTMLElement
  if (target.closest('.org-container, .org-title, .org-content, button, a, .org-chart-controls')) return

  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY, panX: pan.value.x, panY: pan.value.y }
}

const movePan = (event: MouseEvent) => {
  if (!isDragging.value) return
  pan.value = {
    x: dragStart.value.panX + event.clientX - dragStart.value.x,
    y: dragStart.value.panY + event.clientY - dragStart.value.y,
  }
}

const endPan = () => { isDragging.value = false }

const zoomWithWheel = (event: WheelEvent) => {
  const next = zoom.value * (event.deltaY < 0 ? 1.08 : 0.92)
  zoom.value = Math.min(1.5, Math.max(0.75, next))
}

watch([rootLabel, onboardingType, isSahisSirketi], () => fitChart(), { immediate: true })
onMounted(() => fitChart())
</script>

<style scoped>
.org-chart-wrap {
  position: relative;
  width: 100%;
  height: 225px;
  overflow: hidden;
  display: block;
  cursor: grab;
  user-select: none;
  touch-action: none;
  background: transparent;
}

.org-chart-wrap.is-dragging { cursor: grabbing; }

.org-chart-canvas {
  position: absolute;
  top: 0;
  left: 50%;
  transform-origin: top center;
  transition: transform 140ms ease-out;
  will-change: transform;
}

.org-chart-wrap.is-dragging .org-chart-canvas { transition: none; }

.org-chart-controls {
  position: absolute;
  top: 5px;
  right: 5px;
  z-index: 5;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 6px;
  border: 1px solid #e6e1ff;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  color: #7964f7;
  pointer-events: none;
}

:deep(.tenant-org-chart) { display: flex; justify-content: center; }
:deep(.tenant-org-chart .org-table) { border-collapse: separate !important; border-spacing: 0 !important; margin: 0 auto !important; }
:deep(.tenant-org-chart .org-table td) { vertical-align: top; text-align: center; padding: 0 0 30px 0 !important; position: relative; }
:deep(.tenant-org-chart .org-child-level) { padding-left: 4px !important; padding-right: 4px !important; background: transparent !important; border: 0 !important; outline: 0 !important; box-shadow: none !important; }
:deep(.tenant-org-chart .org-child-level::before) { border-left: 1px dashed #8a73ff !important; height: 15px !important; background: transparent !important; }
:deep(.tenant-org-chart .org-child-level::after) { border-top: 1px dashed #8a73ff !important; background: transparent !important; }
:deep(.tenant-org-chart .org-child-level:first-child::before), :deep(.tenant-org-chart .org-child-level:last-child::before) { display: none !important; }
:deep(.tenant-org-chart .org-child-level:first-child::after) { border: 1px dashed transparent !important; border-color: #8a73ff transparent transparent #8a73ff !important; height: 13px !important; background: transparent !important; }
:deep(.tenant-org-chart .org-child-level:last-child::after) { border: 1px dashed #8a73ff !important; border-color: #8a73ff #8a73ff transparent transparent !important; height: 13px !important; background: transparent !important; }
:deep(.tenant-org-chart .org-child-level:first-child:last-child::after) { border: 0 !important; border-left: 1px dashed #8a73ff !important; left: 50% !important; right: auto !important; height: 15px !important; }
:deep(.tenant-org-chart .org-extend::after) { border-left: 1px dashed #8a73ff !important; background: transparent !important; }
:deep(.tenant-org-chart .org-extend-arrow::before) { border-color: #8a73ff #8a73ff transparent transparent !important; }
:deep(.tenant-org-chart .org-node) { margin: 0 4px !important; box-sizing: border-box; background: transparent !important; border: 0 !important; }
:deep(.tenant-org-chart .org-container) { width: 132px !important; min-width: 132px !important; box-sizing: border-box; border: 1px solid #ddd6ff !important; border-radius: 10px !important; overflow: hidden; box-shadow: none !important; background: transparent !important; }
:deep(.tenant-org-chart .org-title) { width: 100% !important; min-height: 72px !important; padding: 8px 8px 7px !important; box-sizing: border-box; border: 0 !important; border-radius: 9px !important; background: transparent !important; white-space: normal !important; }
:deep(.tenant-org-chart .tenant-title-organization) { background: #f3efff !important; }
:deep(.tenant-org-chart .tenant-title-holding), :deep(.tenant-org-chart .tenant-title-group) { background: #f3efff !important; }
:deep(.tenant-org-chart .tenant-title-company) { background: #effaf4 !important; }
:deep(.tenant-org-chart .tenant-title-brand) { background: #eef7ff !important; }
:deep(.tenant-org-chart .tenant-title-location) { background: #fff7e9 !important; }
:deep(.tenant-org-chart .org-content) { width: 100% !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box; border: 0 !important; background: transparent !important; white-space: normal !important; text-align: center !important; }
:deep(.tenant-org-chart .tenant-content-location) { background: #fff7e9 !important; border: 0 !important; }
:deep(.tenant-org-chart .org-content .org-content-item) { justify-content: center !important; padding: 0 !important; border: 0 !important; }

.tenant-node-content { display: grid; grid-template-columns: 22px minmax(0, 1fr); grid-template-rows: auto auto auto; align-items: center; column-gap: 5px; width: 100%; min-height: 56px; box-sizing: border-box; }
.tenant-node-icon { grid-row: 1 / span 2; align-self: center; }
.tenant-node-name { min-width: 0; font-size: 11px; line-height: 1.2; font-weight: 700; text-align: center; overflow-wrap: anywhere; word-break: break-word; color: #26324b; }
.tenant-node-type { font-size: 9px; line-height: 1.05; font-weight: 800; text-align: center; letter-spacing: 0.1px; }
.text-primary { color: #6746f5 !important; }
.text-success { color: #00a968 !important; }
.text-warning { color: #e98400 !important; }

.tree-auto { grid-column: 1 / -1; justify-self: center; display: inline-block; margin-top: 2px; padding: 2px 8px; border-radius: 10px; background: #fff0d5; color: #777; font-size: 9px; line-height: 1.15; white-space: nowrap; }

@media (max-width: 600px) {
  .org-chart-wrap { height: 215px; }
  :deep(.tenant-org-chart .org-container) { width: 124px !important; min-width: 124px !important; }
}
</style>
