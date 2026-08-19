<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-chart-wrap">
      <OrganizationChart :data="orgData" :default-expand-all="true" class="tenant-org-chart">
        <template #node-title="{ node }">
          <div class="tenant-node-content" :class="`tenant-node-${node.meta.type.toLowerCase()}`">
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
  width: 100%;
  min-height: 205px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

/* The installed library owns the hierarchy and connector geometry. */
:deep(.tenant-org-chart) {
  --orgchart-line-color: #7864f7;
  width: 100%;
  display: flex;
  justify-content: center;
}

:deep(.tenant-org-chart .orgchart) {
  width: max-content;
  max-width: 100%;
  background: transparent !important;
  margin: 0 auto;
  padding: 0 !important;
}

/* Compact sizing so the two-child tree stays completely inside the preview panel. */
:deep(.tenant-org-chart .orgchart .node) {
  width: 140px !important;
  min-width: 140px !important;
  max-width: 140px !important;
  border: 1px solid #e3dcff !important;
  border-radius: 10px !important;
  box-shadow: none !important;
  background: #f4f1ff !important;
  color: #16213d;
  overflow: hidden;
}

:deep(.tenant-org-chart .orgchart .node .title) {
  position: relative;
  height: 66px !important;
  min-height: 66px !important;
  border: 0 !important;
  border-radius: 10px !important;
  background: transparent !important;
  color: inherit !important;
  padding: 8px 8px 7px !important;
  box-sizing: border-box;
}

:deep(.tenant-org-chart .orgchart .node .content) {
  height: auto !important;
  min-height: 0 !important;
  border: 0 !important;
  background: transparent !important;
  color: inherit !important;
  padding: 0 8px 7px !important;
  box-sizing: border-box;
}

/* Color the whole node, not just the content slot. */
:deep(.tenant-org-chart .orgchart .node:has(.tenant-node-organization)) {
  background: #f3efff !important;
  border-color: #e2d9ff !important;
}

:deep(.tenant-org-chart .orgchart .node:has(.tenant-node-company)) {
  background: #f1fbf5 !important;
  border-color: #d5efdf !important;
}

:deep(.tenant-org-chart .orgchart .node:has(.tenant-node-location)) {
  background: #fff8ed !important;
  border-color: #f5dfbd !important;
}

/* Keep the library's actual connector geometry, but make it look like the reference. */
:deep(.tenant-org-chart .orgchart .lines .downLine),
:deep(.tenant-org-chart .orgchart .lines .topLine),
:deep(.tenant-org-chart .orgchart .lines .leftLine),
:deep(.tenant-org-chart .orgchart .lines .rightLine) {
  border-color: #7864f7 !important;
  border-style: dashed !important;
  border-width: 1px !important;
}

:deep(.tenant-org-chart .orgchart .lines) {
  background: transparent !important;
}

.tenant-node-content {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 7px;
  width: 100%;
  height: 100%;
  padding: 2px 1px 0;
  box-sizing: border-box;
}

.tenant-node-name {
  flex: 1;
  min-width: 0;
  padding-top: 1px;
  font-size: 12px;
  line-height: 1.25;
  font-weight: 700;
  text-align: left;
  overflow-wrap: anywhere;
  color: #26324b;
}

.tenant-node-type {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 1px;
  font-size: 10px;
  line-height: 1;
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.15px;
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
  font-size: 10px;
  line-height: 1.2;
  white-space: nowrap;
}

@media (max-width: 600px) {
  .org-chart-wrap {
    min-height: 205px;
    overflow-x: auto;
  }

  :deep(.tenant-org-chart .orgchart .node) {
    width: 132px !important;
    min-width: 132px !important;
    max-width: 132px !important;
  }
}
</style>
