<template>
  <aside class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <h3 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Oluşturulacak Yapı Önizlemesi</h3>
    <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{{ description }}</p>

    <div class="relative mt-5 h-[260px] overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <div class="h-full overflow-auto p-4">
        <OrganizationChart :data="orgData" :default-expand-all="true" class="tenant-org-chart">
          <template #node-title="{ node }">
            <div class="flex flex-col items-center gap-1 px-2 py-1">
              <span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ node.title }}</span>
              <span :class="['text-[10px] font-semibold', node.meta?.textClass ?? 'text-brand-500']">
                {{ node.meta?.type }}
              </span>
              <span
                v-if="node.meta?.automatic"
                class="inline-flex rounded-full bg-warning-50 px-2 py-0.5 text-[9px] font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400"
              >
                Otomatik
              </span>
            </div>
          </template>
        </OrganizationChart>
      </div>

      <div class="absolute right-3 top-3 rounded-lg border border-gray-200 bg-white/90 px-2 py-1 text-[11px] text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-gray-800/90 dark:text-gray-400">
        Organizasyon şeması
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
import OrganizationChart from 'organization-chart-vue3'
import 'organization-chart-vue3/style.css'

const props = defineProps<{ reviewMode?: boolean }>()
const form = useTenantForm()

type PreviewMeta = {
  type: string
  textClass: string
  automatic?: boolean
}

type PreviewNode = {
  id: string
  title: string
  member: []
  children?: PreviewNode[]
  meta: PreviewMeta
}

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
      meta: { type: 'Şirket', textClass: 'text-success-600' },
    })

    if (isSahisSirketi.value) {
      children.push({
        id: 'location',
        title: `${rootLabel.value} - Merkez`,
        member: [],
        meta: { type: 'Lokasyon', textClass: 'text-warning-600', automatic: true },
      })
    }
  }

  if (onboardingType.value === 'brand') {
    children.push({
      id: 'brand',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Marka', textClass: 'text-blue-light-600' },
    })
  }

  if (onboardingType.value === 'group') {
    return {
      id: 'group',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Grup', textClass: 'text-brand-500' },
    }
  }

  if (onboardingType.value === 'holding') {
    return {
      id: 'holding',
      title: rootLabel.value,
      member: [],
      meta: { type: 'Holding', textClass: 'text-brand-500' },
    }
  }

  return {
    id: 'organization',
    title: `${rootLabel.value} - Organizasyon`,
    member: [],
    children,
    meta: { type: 'Organizasyon', textClass: 'text-brand-500' },
  }
})

const legend = [
  { title: 'Organizasyon', icon: '⌘', bg: 'bg-brand-50 dark:bg-brand-500/15', text: 'text-brand-500 dark:text-brand-400', desc: 'Kurumsal yapının başlangıç düğümüdür.' },
  { title: 'Şirket', icon: '▣', bg: 'bg-success-50 dark:bg-success-500/15', text: 'text-success-700 dark:text-success-400', desc: 'Şirket seçildiğinde ilk yapı altında şirket bilgileri oluşturulur.' },
  { title: 'Marka', icon: '◆', bg: 'bg-blue-light-50 dark:bg-blue-light-500/15', text: 'text-blue-light-600 dark:text-blue-light-400', desc: 'Marka seçildiğinde marka yapısı oluşturulur; bu aşamada şirket ve lokasyon oluşturulmaz.' },
  { title: 'Lokasyon', icon: '⌖', bg: 'bg-warning-50 dark:bg-warning-500/15', text: 'text-warning-700 dark:text-warning-400', desc: 'Şahıs şirketinde merkez lokasyon otomatik oluşturulur.' },
]
</script>

<style>
.tenant-org-chart .org-container {
  border-color: rgb(229 231 235) !important;
  border-radius: 0.75rem !important;
  box-shadow: none !important;
}

.dark .tenant-org-chart .org-container {
  border-color: rgb(55 65 81) !important;
}
</style>
