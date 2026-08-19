<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="text-subtitle-1 font-weight-bold">
      Oluşturulacak Yapı Önizleme{{ reviewMode ? 'si' : '' }}
    </div>
    <p class="text-body-2 text-medium-emphasis mt-1 mb-5">{{ description }}</p>

    <div class="org-tree">
      <div class="tree-root tree-node tree-node--purple">
        <v-avatar size="32" color="surface" class="mr-3">
          <v-icon icon="mdi-domain" size="16" color="primary" />
        </v-avatar>
        <div>
          <div class="text-body-2 font-weight-semibold">{{ rootLabel }}</div>
          <div class="text-caption font-weight-semibold text-primary-strong">ORGANIZATION</div>
        </div>
      </div>

      <template v-if="isCompany">
        <div class="tree-connector tree-connector--vertical" />

        <div class="tree-children" :class="{ 'tree-children--single': !isSahisSirketi }">
          <div class="tree-branch" :class="{ 'tree-branch--single': !isSahisSirketi }">
            <div class="tree-node tree-node--green">
              <v-avatar size="32" color="surface" class="mr-3">
                <v-icon icon="mdi-domain" size="16" color="success" />
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-semibold">{{ rootLabel }}</div>
                <div class="text-caption font-weight-semibold text-success">COMPANY</div>
              </div>
            </div>
          </div>

          <div v-if="isSahisSirketi" class="tree-branch">
            <div class="tree-node tree-node--amber">
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
        </div>
      </template>
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
.org-tree {
  position: relative;
  padding: 0 2px;
}

.tree-node {
  display: flex;
  align-items: flex-start;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid transparent;
}

.tree-node--purple {
  background: rgb(var(--v-theme-primary) / 0.08);
  border-color: rgb(var(--v-theme-primary) / 0.14);
}

.tree-node--green {
  background: rgb(var(--v-theme-success) / 0.08);
  border-color: rgb(var(--v-theme-success) / 0.18);
}

.tree-node--amber {
  background: rgb(var(--v-theme-warning) / 0.08);
  border-color: rgb(var(--v-theme-warning) / 0.2);
}

.tree-root {
  width: fit-content;
  min-width: 184px;
  margin: 0 auto;
}

.tree-connector--vertical {
  width: 1px;
  height: 28px;
  margin: 0 auto;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.75);
}

.tree-children {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding-top: 24px;
}

.tree-children::before {
  content: '';
  position: absolute;
  top: 0;
  left: 25%;
  right: 25%;
  border-top: 1px dashed rgb(var(--v-theme-primary) / 0.75);
}

.tree-branch {
  position: relative;
  min-width: 0;
}

.tree-branch::before {
  content: '';
  position: absolute;
  top: -24px;
  left: 50%;
  height: 24px;
  border-left: 1px dashed rgb(var(--v-theme-primary) / 0.75);
}

.tree-children--single {
  grid-template-columns: minmax(0, 1fr);
  padding-left: 12%;
  padding-right: 12%;
}

.tree-children--single::before {
  left: 50%;
  right: auto;
  width: 0;
  height: 24px;
  top: 0;
  border-top: 0;
}

.tree-branch--single::before {
  left: 50%;
}

@media (max-width: 600px) {
  .tree-root {
    width: 100%;
    min-width: 0;
  }

  .tree-children {
    grid-template-columns: 1fr;
  }

  .tree-children::before {
    left: 50%;
    right: auto;
    height: 24px;
    border-top: 0;
    border-left: 1px dashed rgb(var(--v-theme-primary) / 0.75);
  }

  .tree-branch::before {
    top: -24px;
    left: 50%;
  }

  .tree-children--single {
    padding-left: 0;
    padding-right: 0;
  }
}
</style>
