<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-chart-wrap">
      <OrganizationChart :data="orgData" :default-expand-all="true" class="tenant-org-chart">
        <template #node-title="{ node }">
          <div class="tenant-node-content">
            <v-icon :icon="node.meta.icon" :color="node.meta.color" size="20" class="tenant-node-icon" />
            <div class="tenant-node-name">{{ node.title }}</div>
            <div class="tenant-node-type" :class="node.meta.textClass">{{ node.meta.type }}</div>
          </div>
        </template>

        <template #member="{ member }">
          <div v-if="member.add === 'auto'" class="tree-auto">Otomatik</div>
        </template>
      </OrganizationChart>
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
      <div class="text-caption mt-1">Company ve Location ayrı varlıklardır. Aralarındaki ilişki sistem tarafından yönetilecektir.</div>
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
import OrganizationChart from 'organization-chart-vue3'
import 'organization-chart-vue3/style.css'

const props = defineProps<{ reviewMode?: boolean }>()

type OrgMeta = {
  icon: string
  color: string
  type: string
  textClass: string
}

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
const rootLabel = computed(() => form.value.orgName || form.value.tenantName || 'Organizasyon adı')
const isCompany = computed(() => form.value.orgType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')

const description = computed(() =>
  props.reviewMode
    ? 'Tenant oluşturulduğunda aşağıdaki yapı oluşturulacaktır.'
    : 'Bu adımla birlikte oluşturulacak yapı aşağıdaki gibidir.'
)

const orgData = computed<PreviewNode>(() => {
  const children: PreviewNode[] = []

  if (isCompany.value) {
    children.push({
      id: 'company',
      title: rootLabel.value,
      titleClass: 'tenant-title-company',
      member: [],
      meta: {
        icon: 'mdi-domain',
        color: 'success',
        type: 'COMPANY',
        textClass: 'text-success',
      },
    })

    if (isSahisSirketi.value) {
      children.push({
        id: 'location',
        title: `${rootLabel.value} - Merkez`,
        titleClass: 'tenant-title-location',
        contentClass: 'tenant-content-location',
        member: [{ name: 'Otomatik', add: 'auto' }],
        meta: {
          icon: 'mdi-map-marker',
          color: 'warning',
          type: 'LOCATION',
          textClass: 'text-warning',
        },
      })
    }
  }

  return {
    id: 'organization',
    title: rootLabel.value,
    titleClass: 'tenant-title-organization',
    member: [],
    children,
    meta: {
      icon: 'mdi-domain',
      color: 'primary',
      type: 'ORGANIZATION',
      textClass: 'text-primary',
    },
  }
})

const legend = [
  { title: 'ORGANIZATION', icon: 'mdi-domain', color: 'primary', textClass: 'text-primary', desc: 'Hiyerarşi ağacında yer alan düğümdür.' },
  { title: 'COMPANY', icon: 'mdi-domain', color: 'success', textClass: 'text-success', desc: 'Şirket bilgileri Company tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.' },
  { title: 'LOCATION', icon: 'mdi-map-marker', color: 'warning', textClass: 'text-warning', desc: 'Lokasyon bilgileri Locations tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.' },
]
</script>

<style scoped>
.org-chart-wrap {
  width: 100%;
  min-height: 205px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

:deep(.tenant-org-chart) {
  width: 100%;
  display: flex;
  justify-content: center;
}

/* organization-chart-vue3 uses real table/node classes. Style those classes directly. */
:deep(.tenant-org-chart .org-table) {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  margin: 0 auto !important;
}

:deep(.tenant-org-chart .org-table td) {
  padding: 0 0 34px 0 !important;
  vertical-align: top;
  text-align: center;
}

:deep(.tenant-org-chart .org-child-level) {
  padding-left: 4px !important;
  padding-right: 4px !important;
}

:deep(.tenant-org-chart .org-node) {
  margin: 0 4px !important;
  box-sizing: border-box;
}

:deep(.tenant-org-chart .org-container) {
  width: 132px !important;
  min-width: 132px !important;
  box-sizing: border-box;
  border: 1px solid #ddd6ff !important;
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: none !important;
}

:deep(.tenant-org-chart .org-title) {
  width: 100% !important;
  min-height: 66px !important;
  padding: 8px 8px 7px !important;
  box-sizing: border-box;
  border: 0 !important;
  border-radius: 9px !important;
  background: transparent !important;
  white-space: normal !important;
}

:deep(.tenant-org-chart .tenant-title-organization) {
  background: #f3efff !important;
  border-color: #ddd3ff !important;
}

:deep(.tenant-org-chart .tenant-title-company) {
  background: #effaf4 !important;
  border-color: #cfead9 !important;
}

:deep(.tenant-org-chart .tenant-title-location) {
  background: #fff7e9 !important;
  border-color: #f2d9ad !important;
}

:deep(.tenant-org-chart .org-content) {
  width: 100% !important;
  margin: 0 !important;
  padding: 0 0 7px !important;
  box-sizing: border-box;
  border: 0 !important;
  background: transparent !important;
  white-space: normal !important;
  text-align: center !important;
}

:deep(.tenant-org-chart .tenant-content-location) {
  background: #fff7e9 !important;
  border: 0 !important;
}

:deep(.tenant-org-chart .org-content .org-content-item) {
  justify-content: center !important;
  padding: 0 !important;
  border: 0 !important;
}

/* The library owns the connector geometry; only its appearance is themed here. */
:deep(.tenant-org-chart .org-child-level::before),
:deep(.tenant-org-chart .org-child-level::after),
:deep(.tenant-org-chart .org-extend::after) {
  border-color: #7964f7 !important;
  border-style: dashed !important;
  border-width: 1px !important;
}

:deep(.tenant-org-chart .org-child-level:first-child::after),
:deep(.tenant-org-chart .org-child-level:last-child::after) {
  border-style: dashed !important;
  border-color: #7964f7 !important;
}

:deep(.tenant-org-chart .org-child-level:first-child.org-child-level:last-child::after) {
  border-left-style: dashed !important;
  border-left-color: #7964f7 !important;
}

:deep(.tenant-org-chart .org-extend-arrow::before) {
  border-color: #7964f7 #7964f7 transparent transparent !important;
}

.tenant-node-content {
  display: grid;
  grid-template-columns: 22px minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 5px;
  width: 100%;
  min-height: 48px;
  box-sizing: border-box;
}

.tenant-node-icon {
  grid-row: 1 / span 2;
  align-self: center;
}

.tenant-node-name {
  min-width: 0;
  font-size: 11px;
  line-height: 1.2;
  font-weight: 700;
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
  color: #26324b;
}

.tenant-node-type {
  font-size: 9px;
  line-height: 1.05;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.1px;
}

.text-primary { color: #6746f5 !important; }
.text-success { color: #00a968 !important; }
.text-warning { color: #e98400 !important; }

.tree-auto {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fff0d5;
  color: #777;
  font-size: 9px;
  line-height: 1.15;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .org-chart-wrap {
    overflow-x: auto;
  }

  :deep(.tenant-org-chart .org-container) {
    width: 124px !important;
    min-width: 124px !important;
  }
}
</style>
