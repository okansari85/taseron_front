<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">
      Oluşturulacak Yapı Önizlemesi
    </div>
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
        <div class="tree-connector tree-connector--vertical" />

        <div class="tree-children" :class="{ 'tree-children--single': !isSahisSirketi }">
          <div class="tree-branch" :class="{ 'tree-branch--single': !isSahisSirketi }">
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
      <div class="text-caption mt-1">
        Company ve Location ayrı varlıklardır. Aralarındaki ilişki sistem tarafından yönetilecektir.
      </div>
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
  {
    title: 'ORGANIZATION',
    icon: 'mdi-domain',
    color: 'primary',
    textClass: 'text-primary',
    desc: 'Hiyerarşi ağacında yer alan düğümdür.',
  },
  {
    title: 'COMPANY',
    icon: 'mdi-domain',
    color: 'success',
    textClass: 'text-success',
    desc: 'Şirket bilgileri Company tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.',
  },
  {
    title: 'LOCATION',
    icon: 'mdi-map-marker',
    color: 'warning',
    textClass: 'text-warning',
    desc: 'Lokasyon bilgileri Locations tablosunda tutulur ve bu organizasyon düğümü ile eşleştirilir.',
  },
]
</script>

<style scoped>
.org-tree {
  position: relative;
  padding: 2px 0 0;
}

.tree-node {
  border-radius: 9px;
  border: 1px solid transparent;
}

.tree-node--purple {
  background: rgb(var(--v-theme-primary) / 0.08);
  border-color: rgb(var(--v-theme-primary) / 0.12);
}

.tree-node--green {
  background: rgb(var(--v-theme-success) / 0.06);
  border-color: rgb(var(--v-theme-success) / 0.22);
}

.tree-node--amber {
  background: rgb(var(--v-theme-warning) / 0.07);
  border-color: rgb(var(--v-theme-warning) / 0.25);
}

.tree-root {
  width: 160px;
  min-height: 58px;
  margin: 0 auto;
  padding: 10px 14px;
  display: flex;
  align-items: center;
}

.tree-connector--vertical {
  width: 1px;
  height: 28px;
  margin: 0 auto;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.7);
}

.tree-children {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  padding: 26px 0 0;
}

.tree-children::before {
  content: '';
  position: absolute;
  top: 0;
  left: 25%;
  right: 25%;
  border-top: 1px dashed rgb(var(--v-theme-primary) / 0.7);
}

.tree-branch {
  position: relative;
  min-width: 0;
}

.tree-branch::before {
  content: '';
  position: absolute;
  top: -26px;
  left: 50%;
  height: 26px;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.7);
}

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

.tree-children--single {
  grid-template-columns: minmax(0, 1fr);
  padding-left: 18%;
  padding-right: 18%;
}

.tree-children--single::before {
  left: 50%;
  right: auto;
  border-top: 0;
}

@media (max-width: 600px) {
  .tree-root {
    width: 100%;
  }

  .tree-children {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tree-children::before {
    left: 50%;
    right: auto;
    height: 26px;
    border-top: 0;
    border-left: 1px dashed rgb(var(--v-theme-primary) / 0.7);
  }

  .tree-branch::before {
    top: -26px;
    left: 50%;
  }

  .tree-children--single {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
