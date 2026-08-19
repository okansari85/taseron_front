<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">Oluşturulacak Yapı Önizlemesi</div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-tree">
      <div class="tree-root tree-node tree-node--purple">
        <v-icon icon="mdi-domain" size="22" color="primary" class="mr-3" />
        <div>
          <div class="text-body-2 font-weight-bold">{{ rootLabel }}</div>
          <div class="text-caption font-weight-bold text-primary">ORGANIZATION</div>
        </div>
      </div>

      <template v-if="isCompany">
        <div class="tree-line tree-line--down" aria-hidden="true" />
        <div class="tree-line tree-line--horizontal" aria-hidden="true" />
        <div class="tree-line tree-line--left" aria-hidden="true" />
        <div class="tree-line tree-line--right" aria-hidden="true" />

        <div class="tree-children">
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
              <div class="text-caption text-medium-emphasis">Otomatik</div>
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
.org-tree {
  --tree-line: rgb(var(--v-theme-primary));
  --root-w: 160px;
  --child-gap: 28px;
  position: relative;
  padding: 2px 0 0;
  min-height: 185px;
}

.tree-node {
  border-radius: 9px;
  border: 1px solid transparent;
  box-sizing: border-box;
}

.tree-node--purple { background: rgb(var(--v-theme-primary) / 0.08); border-color: rgb(var(--v-theme-primary) / 0.12); }
.tree-node--green { background: rgb(var(--v-theme-success) / 0.06); border-color: rgb(var(--v-theme-success) / 0.22); }
.tree-node--amber { background: rgb(var(--v-theme-warning) / 0.07); border-color: rgb(var(--v-theme-warning) / 0.25); }

.tree-root {
  position: relative;
  z-index: 3;
  width: var(--root-w);
  min-height: 58px;
  margin: 0 auto;
  padding: 10px 14px;
  display: flex;
  align-items: center;
}

/* These are explicit elements rather than pseudo-elements so the dashed tree is always visible. */
.tree-line {
  position: absolute;
  z-index: 1;
  pointer-events: none;
  border-color: var(--tree-line);
  border-style: dashed;
  border-width: 0;
  opacity: 0.85;
}

.tree-line--down {
  top: 60px;
  left: 50%;
  height: 30px;
  border-left-width: 1.5px;
  transform: translateX(-50%);
}

.tree-line--horizontal {
  top: 90px;
  left: 25%;
  width: 50%;
  border-top-width: 1.5px;
}

.tree-line--left,
.tree-line--right {
  top: 90px;
  height: 28px;
  border-left-width: 1.5px;
}

.tree-line--left { left: 25%; }
.tree-line--right { left: 75%; }

.tree-children {
  position: absolute;
  z-index: 2;
  top: 118px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--child-gap);
}

.tree-branch { min-width: 0; }

.tree-node--child {
  min-height: 105px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.tree-child-name {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.25;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.tree-children:not(:has(+ *)) { }

@media (max-width: 600px) {
  .org-tree { min-height: 320px; }
  .tree-root { width: 100%; }
  .tree-children { position: absolute; top: 118px; grid-template-columns: 1fr; gap: 12px; }
  .tree-line--horizontal { display: none; }
  .tree-line--left { left: 50%; }
  .tree-line--right { display: none; }
}
</style>
