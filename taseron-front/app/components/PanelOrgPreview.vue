<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">
      Oluşturulacak Yapı Önizleme{{ reviewMode ? 'si' : '' }}
    </div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="tree-node tree-node--purple mb-3">
      <v-avatar size="32" color="surface" class="mr-3">
        <v-icon icon="mdi-domain" size="16" color="primary" />
      </v-avatar>
      <div>
        <div class="text-body-2 font-weight-semibold">{{ rootLabel }}</div>
        <div class="text-caption font-weight-semibold text-primary-strong">ORGANIZATION</div>
      </div>
    </div>

    <div v-if="isCompany" class="pl-6" :class="isSahisSirketi ? 'children-grid' : ''">
      <div class="tree-node tree-node--green mb-3">
        <v-avatar size="32" color="surface" class="mr-3">
          <v-icon icon="mdi-domain" size="16" color="success" />
        </v-avatar>
        <div>
          <div class="text-body-2 font-weight-semibold">{{ rootLabel }}</div>
          <div class="text-caption font-weight-semibold text-success">COMPANY</div>
        </div>
      </div>

      <div v-if="isSahisSirketi" class="tree-node tree-node--amber mb-3">
        <v-avatar size="32" color="surface" class="mr-3">
          <v-icon icon="mdi-map-marker" size="16" color="warning" />
        </v-avatar>
        <div>
          <div class="text-body-2 font-weight-semibold">{{ rootLabel }} - Merkez</div>
          <div class="text-caption font-weight-semibold text-warning">LOCATION</div>
          <div class="text-caption text-medium-emphasis">Otomatik</div>
        </div>
      </div>
    </div>

    <v-divider class="my-5" />

    <div v-for="row in legend" :key="row.title" class="d-flex mb-3" style="gap: 12px">
      <v-icon :icon="row.icon" :color="row.color" size="16" class="mt-1" />
      <div>
        <div class="text-caption font-weight-bold" :class="row.textClass">{{ row.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ row.desc }}</div>
      </div>
    </div>

    <v-alert color="primary" variant="tonal" icon="mdi-information-outline" density="comfortable" class="mt-2">
      <div class="text-body-2 font-weight-semibold">Bilgi</div>
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
    textClass: 'text-primary-strong',
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
.tree-node {
  display: flex;
  align-items: flex-start;
  border-radius: 12px;
  padding: 12px 14px;
}
.tree-node--purple {
  background: rgb(var(--v-theme-primary) / 0.08);
}
.tree-node--green {
  background: rgb(var(--v-theme-success) / 0.1);
}
.tree-node--amber {
  background: rgb(var(--v-theme-warning) / 0.1);
}
.children-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 600px) {
  .children-grid {
    grid-template-columns: 1fr;
  }
}
</style>
