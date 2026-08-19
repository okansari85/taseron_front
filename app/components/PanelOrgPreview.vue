<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-chart-wrap">
      <OrganizationChart :data="orgData" :default-expand-all="true" class="tenant-org-chart">
        <template #node-title="{ node }">
          <div class="tenant-node-content">
            <v-icon :icon="node.meta.icon" :color="node.meta.color" size="22" />
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
      contentClass: 'org-node-company',
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
        contentClass: 'org-node-location',
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
    contentClass: 'org-node-root',
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
  min-height: 190px;
  width: 100%;
  overflow: hidden;
}

/* The installed library owns the hierarchy and connector geometry. */
:deep(.tenant-org-chart) {
  --orgchart-line-color: #7864f7;
}

:deep(.tenant-org-chart .orgchart) {
  width: 100%;
  background: transparent;
  margin: 0;
  padding: 0;
}

:deep(.tenant-org-chart .orgchart .node) {
  min-width: 160px;
  border: 1px solid #e5deff;
  border-radius: 10px;
  box-shadow: none;
  background: #f2efff;
  padding: 0;
  color: #16213d;
}

:deep(.tenant-org-chart .orgchart .node .title) {
  position: relative;
  height: auto;
  min-height: 58px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: inherit;
  padding: 9px 14px;
}

:deep(.tenant-org-chart .orgchart .node .content) {
  border: 0;
  height: auto;
  min-height: 0;
  background: transparent;
  color: inherit;
  padding: 0 8px 8px;
}

:deep(.tenant-org-chart .orgchart .node .content.org-node-company) {
  background: #f1fbf6;
  border-radius: 10px;
}

:deep(.tenant-org-chart .orgchart .node .content.org-node-location) {
  background: #fff8ed;
  border-radius: 10px;
}

:deep(.tenant-org-chart .orgchart .node .content.org-node-root) {
  background: #f2efff;
  border-radius: 10px;
}

/* The chart library creates these connector elements. We only change their stroke style. */
:deep(.tenant-org-chart .orgchart .lines .downLine),
:deep(.tenant-org-chart .orgchart .lines .topLine),
:deep(.tenant-org-chart .orgchart .lines .leftLine),
:deep(.tenant-org-chart .orgchart .lines .rightLine) {
  border-color: #7864f7 !important;
  border-style: dashed !important;
}

.tenant-node-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding-bottom: 12px;
}

.tenant-node-name {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 700;
  text-align: left;
  overflow-wrap: anywhere;
}

.tenant-node-type {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  text-align: center;
}

.text-primary { color: #6746f5 !important; }
.text-success { color: #00a968 !important; }
.text-warning { color: #e98400 !important; }

.tree-auto {
  display: inline-block;
  margin: 0 auto 3px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fff0d5;
  color: #777;
  font-size: 11px;
  line-height: 1.2;
}

@media (max-width: 600px) {
  .org-chart-wrap { min-height: 300px; }
}
</style>
