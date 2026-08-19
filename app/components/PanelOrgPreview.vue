<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-tree" :class="{ 'org-tree--single': !isSahisSirketi }">
      <div class="tree-root tree-node tree-node--purple">
        <v-icon icon="mdi-domain" size="22" color="primary" class="mr-3" />
        <div>
          <div class="text-body-2 font-weight-bold">{{ rootLabel }}</div>
          <div class="text-caption font-weight-bold text-primary">ORGANIZATION</div>
        </div>
      </div>

      <template v-if="isCompany">
        <div class="tree-children" :class="{ 'tree-children--split': isSahisSirketi, 'tree-children--single': !isSahisSirketi }">
          <div class="tree-branch">
            <div class="tree-node tree-node--child tree-node--green">
              <v-icon icon="mdi-domain" size="24" color="success" />
              <div class="tree-child-name">{{ rootLabel }}</div>
              <div class="text-caption font-weight-bold text-success">COMPANY</div>
            </div>
          </div>

          <div v-if="isSahisSirketi" class="tree-branch">
            <div class="tree-node tree-node--child tree-node--amber">
              <v-icon icon="mdi-map-marker" size="24" color="warning" />
              <div class="tree-child-name">{{ rootLabel }} - Merkez</div>
              <div class="text-caption font-weight-bold text-warning">LOCATION</div>
              <div class="text-caption text-medium-emphasis tree-auto">Otomatik</div>
            </div>
          </div>
        </div>
      </template>
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
const props = defineProps<{ reviewMode?: boolean }>()

const form = useTenantForm()
const rootLabel = computed(() => form.value.orgName || form.value.tenantName || 'Organizasyon adı')
const isCompany = computed(() => form.value.orgType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')

const description = computed(() =>
  props.reviewMode
    ? 'Tenant oluşturulduğunda aşağıdaki yapı oluşturulacaktır.'
    : 'Bu adımla birlikte oluşturulacak yapı aşağıdaki gibidir.'
)

const legend = [
  { title: 'ORGANIZATION', icon: 'mdi-domain', color: 'primary', textClass: 'text-primary', desc: 'Hiyerarşi ağacında yer alan düğümdür.' },
  { title: 'COMPANY', icon: 'mdi-domain', color: 'success', textClass: 'text-success', desc: 'Şirket bilgileri Company tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.' },
  { title: 'LOCATION', icon: 'mdi-map-marker', color: 'warning', textClass: 'text-warning', desc: 'Lokasyon bilgileri Locations tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.' },
]
</script>

<style scoped>
/* Locked tenant creation organization tree. Keep this component as the single source of truth for the preview. */
.org-tree {
  --tree-purple: #6746f5;
  --tree-purple-bg: #f2efff;
  --tree-purple-border: #e5deff;
  --tree-green: #00a968;
  --tree-green-bg: #f1fbf6;
  --tree-green-border: #d5f0e1;
  --tree-amber: #f59a00;
  --tree-amber-bg: #fff8ed;
  --tree-amber-border: #f6dfbd;
  --tree-line: #7864f7;
  position: relative;
  padding: 2px 0 0;
  min-height: 185px;
}

.tree-node {
  border-radius: 10px;
  border: 1px solid;
  box-sizing: border-box;
}

.tree-node--purple {
  background: var(--tree-purple-bg) !important;
  border-color: var(--tree-purple-border) !important;
}

.tree-node--green {
  background: var(--tree-green-bg) !important;
  border-color: var(--tree-green-border) !important;
}

.tree-node--amber {
  background: var(--tree-amber-bg) !important;
  border-color: var(--tree-amber-border) !important;
}

.tree-root {
  position: relative;
  z-index: 3;
  width: 160px;
  min-height: 58px;
  margin: 0 auto;
  padding: 9px 14px;
  display: flex;
  align-items: center;
}

.tree-root .v-icon {
  color: var(--tree-purple) !important;
}

.tree-children {
  position: absolute;
  z-index: 2;
  left: 0;
  right: 0;
  display: grid;
}

.tree-children--split {
  top: 118px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
}

/* The connector is part of the branch structure: it physically meets each child card. */
.tree-children--split::after {
  content: '';
  position: absolute;
  top: -60px;
  left: 25%;
  width: 50%;
  height: 30px;
  border-top: 1.5px dashed var(--tree-line);
  border-left: 1.5px dashed var(--tree-line);
  border-right: 1.5px dashed var(--tree-line);
  box-sizing: border-box;
  pointer-events: none;
}

.tree-children--split::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -60px;
  left: 50%;
  height: 30px;
  border-left: 1.5px dashed var(--tree-line);
  transform: translateX(-50%);
  pointer-events: none;
}

.tree-children--split .tree-branch::before {
  content: '';
  position: absolute;
  top: -30px;
  height: 30px;
  border-left: 1.5px dashed var(--tree-line);
  pointer-events: none;
}

.tree-children--split .tree-branch:first-child::before {
  left: 25%;
}

.tree-children--split .tree-branch:last-child::before {
  left: 75%;
}

.tree-children--single {
  top: 118px;
  grid-template-columns: minmax(0, 160px);
  justify-content: center;
}

/* Corporate company: one real branch, so there is no orphaned horizontal/second connector. */
.tree-children--single::before {
  content: '';
  position: absolute;
  top: -60px;
  left: 50%;
  height: 60px;
  border-left: 1.5px dashed var(--tree-line);
  transform: translateX(-50%);
  pointer-events: none;
}

.tree-branch {
  position: relative;
  min-width: 0;
}

.tree-node--child {
  min-height: 105px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  z-index: 2;
}

.tree-node--child .v-icon { margin-bottom: 4px; }

.tree-node--green .v-icon { color: var(--tree-green) !important; }
.tree-node--amber .v-icon { color: var(--tree-amber) !important; }

.tree-child-name {
  margin-top: 3px;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 700;
  color: #16213d;
}

.tree-node--green .text-success { color: var(--tree-green) !important; }
.tree-node--amber .text-warning { color: #e98400 !important; }
.tree-node--purple .text-primary { color: var(--tree-purple) !important; }

.tree-auto {
  margin-top: 3px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #fff0d5;
  color: #777 !important;
}

@media (max-width: 600px) {
  .org-tree { min-height: 320px; }
  .tree-root { width: 100%; }
  .tree-children--split,
  .tree-children--single {
    top: 118px;
  }
  .tree-children--split {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  .tree-children--split::after,
  .tree-children--split::before,
  .tree-children--split .tree-branch::before {
    display: none;
  }
  .tree-children--single {
    grid-template-columns: 1fr;
  }
  .tree-children--single::before {
    height: 60px;
  }
}
</style>
