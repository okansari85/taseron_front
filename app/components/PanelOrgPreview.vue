<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">
      Oluşturulacak Yapı Önizlemesi
    </div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-tree">
      <div class="tree-root tree-node tree-node--purple">
        <v-icon icon="mdi-domain" size="25" color="primary" />
        <div class="tree-root-content">
          <div class="tree-root-name">{{ rootLabel }}</div>
          <div class="tree-root-type">ORGANIZATION</div>
        </div>
      </div>

      <template v-if="isCompany">
        <div class="tree-stem" />

        <div class="tree-children">
          <div class="tree-branch">
            <div class="tree-node tree-node--child tree-node--green">
              <v-icon icon="mdi-domain" size="25" color="success" />
              <div class="tree-child-name">{{ rootLabel }}</div>
              <div class="tree-child-type text-success">COMPANY</div>
            </div>
          </div>

          <div v-if="isSahisSirketi" class="tree-branch">
            <div class="tree-node tree-node--child tree-node--amber">
              <v-icon icon="mdi-map-marker" size="25" color="warning" />
              <div class="tree-child-name">{{ rootLabel }} - Merkez</div>
              <div class="tree-child-type text-warning">LOCATION</div>
              <span class="automatic-badge">Otomatik</span>
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
  padding: 4px 0 0;
}

.tree-node {
  box-sizing: border-box;
  border-radius: 9px;
  box-shadow: none !important;
}

.tree-node--purple {
  background: #f5f1ff;
  border: 1px solid #eee8ff !important;
}

.tree-node--green {
  background: #f1fbf5;
  border: 1px solid #d8f0df !important;
}

.tree-node--amber {
  background: #fff8ed;
  border: 1px solid #f8e6c7 !important;
}

.tree-root {
  width: 160px;
  min-height: 58px;
  margin: 0 auto;
  padding: 9px 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.tree-root-content {
  min-width: 0;
}

.tree-root-name {
  font-size: 13px;
  line-height: 1.2;
  font-weight: 700;
  color: #18213d;
  white-space: nowrap;
}

.tree-root-type,
.tree-child-type {
  margin-top: 3px;
  font-size: 11px;
  line-height: 1.15;
  font-weight: 800;
  letter-spacing: 0.1px;
}

.tree-root-type {
  color: rgb(var(--v-theme-primary));
}

.tree-stem {
  position: relative;
  width: 1px;
  height: 28px;
  margin: 0 auto;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.7);
}

.tree-stem::after {
  content: '';
  position: absolute;
  left: 0;
  top: 27px;
  width: 214px;
  border-top: 1px dashed rgb(var(--v-theme-primary) / 0.7);
  transform: translateX(-50%);
}

.tree-children {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  padding-top: 25px;
}

.tree-branch {
  position: relative;
  min-width: 0;
}

.tree-branch::before {
  content: '';
  position: absolute;
  top: -25px;
  left: 50%;
  height: 25px;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.7);
}

.tree-node--child {
  width: 100%;
  min-height: 92px;
  padding: 11px 8px 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.tree-child-name {
  margin-top: 5px;
  font-size: 13px;
  line-height: 1.2;
  font-weight: 700;
  color: #18213d;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.automatic-badge {
  margin-top: 5px;
  padding: 3px 8px;
  border-radius: 999px;
  background: #fff0d5;
  color: #8b6425;
  font-size: 10px;
  line-height: 1;
  font-weight: 700;
}

@media (max-width: 600px) {
  .tree-root {
    width: 160px;
  }

  .tree-stem::after {
    width: 50%;
  }

  .tree-children {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .tree-children .tree-branch::before {
    top: -25px;
    left: 50%;
  }
}
</style>
