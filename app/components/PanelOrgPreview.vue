<template>
  <aside class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <h3 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Oluşturulacak Yapı Önizlemesi</h3>
    <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{{ description }}</p>

    <div
      class="relative mt-5 h-[260px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
      @wheel.prevent="zoomWithWheel"
      @mousedown="startPan"
      @mousemove="movePan"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <div
        class="absolute left-1/2 top-6 flex origin-top flex-col items-center transition-transform duration-150"
        :class="isDragging ? 'cursor-grabbing duration-0' : 'cursor-grab'"
        :style="{ transform: `translateX(calc(-50% + ${pan.x}px)) translateY(${pan.y}px) scale(${zoom})` }"
      >
        <div :class="nodeClass(rootTone)">
          <div class="flex items-center justify-center text-base">{{ rootIcon }}</div>
          <div class="mt-1 text-xs font-semibold text-gray-800 dark:text-white/90">{{ rootLabel }}</div>
          <div :class="['mt-1 text-[10px] font-semibold', rootText]">{{ selectedTypeLabel }}</div>
        </div>

        <template v-if="children.length">
          <div class="h-7 w-px border-l border-dashed border-brand-400" />
          <div class="flex items-start gap-4">
            <div v-for="child in children" :key="child.id" class="flex flex-col items-center">
              <div class="h-3 w-px border-l border-dashed border-brand-400" />
              <div :class="nodeClass(child.tone)">
                <div class="flex items-center justify-center text-base">{{ child.icon }}</div>
                <div class="mt-1 text-xs font-semibold text-gray-800 dark:text-white/90">{{ child.title }}</div>
                <div :class="['mt-1 text-[10px] font-semibold', child.text]">{{ child.type }}</div>
                <div v-if="child.automatic" class="mt-1 inline-flex rounded-full bg-warning-50 px-2 py-0.5 text-[9px] font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">Otomatik</div>
              </div>
            </div>
          </div>
        </template>
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
const props = defineProps<{ reviewMode?: boolean }>()
const form = useTenantForm()

const rootLabel = computed(() => form.value.orgName || 'Organizasyon adı')
const onboardingType = computed(() => form.value.onboardingType)
const isCompany = computed(() => onboardingType.value === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
const selectedTypeLabel = computed(() => ORG_TYPES.find((type) => type.value === onboardingType.value)?.label ?? 'Organizasyon')
const description = computed(() => props.reviewMode ? 'Tenant oluşturulduğunda aşağıdaki yapı oluşturulacaktır.' : `${selectedTypeLabel.value} seçiminize göre oluşturulacak yapı aşağıdaki gibidir.`)

const rootTone = computed(() => {
  if (onboardingType.value === 'company') return 'green'
  if (onboardingType.value === 'brand') return 'blue'
  return 'purple'
})

const rootIcon = computed(() => ({ holding: '⌂', group: '♧', company: '▣', brand: '◆' }[onboardingType.value ?? 'holding']))
const rootText = computed(() => rootTone.value === 'green' ? 'text-success-600' : rootTone.value === 'blue' ? 'text-blue-light-600' : 'text-brand-500')

const children = computed(() => {
  if (onboardingType.value === 'company') {
    const result = [
      { id: 'company', title: rootLabel.value, type: 'Şirket', icon: '▣', tone: 'green', text: 'text-success-600' },
    ]
    if (isSahisSirketi.value) result.push({ id: 'location', title: `${rootLabel.value} - Merkez`, type: 'Lokasyon', icon: '⌖', tone: 'orange', text: 'text-warning-600', automatic: true })
    return result
  }

  if (onboardingType.value === 'brand') return [{ id: 'brand', title: rootLabel.value, type: 'Marka', icon: '◆', tone: 'blue', text: 'text-blue-light-600' }]
  return []
})

const legend = [
  { title: 'Organizasyon', icon: '⌘', bg: 'bg-brand-50 dark:bg-brand-500/15', text: 'text-brand-500 dark:text-brand-400', desc: 'Kurumsal yapının başlangıç düğümüdür.' },
  { title: 'Şirket', icon: '▣', bg: 'bg-success-50 dark:bg-success-500/15', text: 'text-success-700 dark:text-success-400', desc: 'Şirket seçildiğinde ilk yapı altında şirket bilgileri oluşturulur.' },
  { title: 'Marka', icon: '◆', bg: 'bg-blue-light-50 dark:bg-blue-light-500/15', text: 'text-blue-light-600 dark:text-blue-light-400', desc: 'Marka seçildiğinde marka yapısı oluşturulur; bu aşamada şirket ve lokasyon oluşturulmaz.' },
  { title: 'Lokasyon', icon: '⌖', bg: 'bg-warning-50 dark:bg-warning-500/15', text: 'text-warning-700 dark:text-warning-400', desc: 'Şahıs şirketinde merkez lokasyon otomatik oluşturulur.' },
]

const zoom = ref(1)
const pan = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, panX: 0, panY: 0 })

function nodeClass(tone: string) {
  const toneClasses: Record<string, string> = {
    purple: 'border-brand-200 bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/10',
    green: 'border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10',
    blue: 'border-blue-light-200 bg-blue-light-50 dark:border-blue-light-500/30 dark:bg-blue-light-500/10',
    orange: 'border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10',
  }
  return `w-36 rounded-lg border px-3 py-3 text-center shadow-theme-xs ${toneClasses[tone] ?? toneClasses.purple}`
}

function zoomWithWheel(event: WheelEvent) {
  zoom.value = Math.min(1.5, Math.max(0.75, zoom.value * (event.deltaY < 0 ? 1.08 : 0.92)))
}

function startPan(event: MouseEvent) {
  if (event.button !== 0) return
  isDragging.value = true
  dragStart.value = { x: event.clientX, y: event.clientY, panX: pan.value.x, panY: pan.value.y }
}

function movePan(event: MouseEvent) {
  if (!isDragging.value) return
  pan.value = { x: dragStart.value.panX + event.clientX - dragStart.value.x, y: dragStart.value.panY + event.clientY - dragStart.value.y }
}

function endPan() {
  isDragging.value = false
}
</script>
