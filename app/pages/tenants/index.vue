<template>
  <v-container fluid class="tenant-list-page">
    <div class="tenant-list-header">
      <div>
        <h1 class="tenant-list-title">Tenantlar</h1>
        <p class="tenant-list-subtitle">Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.</p>
      </div>
      <v-btn color="primary" class="tenant-create-button" prepend-icon="mdi-plus" rounded="lg" @click="goToCreate">
        Yeni Tenant
      </v-btn>
    </div>

    <v-card class="tenant-filter-card" elevation="0">
      <v-text-field
        v-model="search"
        class="tenant-filter-control tenant-search"
        placeholder="Tenant ara..."
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
      />

      <v-select
        v-model="statusFilter"
        class="tenant-filter-control"
        label="Durum"
        :items="statusOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
      />

      <v-select
        v-model="structureFilter"
        class="tenant-filter-control"
        label="Kurumsal Yapı"
        :items="structureOptions"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
      />

      <v-select
        v-model="dateFilter"
        class="tenant-filter-control"
        label="Oluşturulma Tarihi"
        :items="dateOptions"
        prepend-inner-icon="mdi-calendar-outline"
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
      />

      <v-btn
        color="primary"
        class="tenant-filter-create-button"
        prepend-icon="mdi-plus"
        rounded="lg"
        @click="goToCreate"
      >
        Yeni Tenant
      </v-btn>
    </v-card>

    <v-card class="tenant-table-card" elevation="0">
      <div class="tenant-table-scroll">
        <table class="tenant-table">
          <thead>
            <tr>
              <th>Tenant Adı</th>
              <th>Slug</th>
              <th>Kurumsal Yapı</th>
              <th>Durum</th>
              <th>Oluşturulma Tarihi</th>
              <th class="tenant-actions-heading">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="tenant in paginatedTenants"
              :key="tenant.id"
              class="tenant-table-row"
              @click="openTenant(tenant)"
            >
              <td>
                <div class="tenant-name-cell">
                  <div class="tenant-avatar" :class="`tenant-avatar-${tenant.id}`">
                    {{ getInitials(tenant.name) }}
                  </div>
                  <div>
                    <div class="tenant-name">{{ tenant.name }}</div>
                    <div class="tenant-id">#{{ tenant.id }}</div>
                  </div>
                </div>
              </td>

              <td class="tenant-muted">{{ tenant.slug }}</td>

              <td>
                <span class="tenant-structure-badge" :class="`tenant-structure-${tenant.onboarding_type}`">
                  <v-icon :icon="getStructureIcon(tenant.onboarding_type)" size="14" />
                  {{ getStructureLabel(tenant.onboarding_type) }}
                </span>
              </td>

              <td>
                <span class="tenant-status-badge" :class="tenant.status === 'active' ? 'is-active' : 'is-passive'">
                  <span class="tenant-status-dot" />
                  {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
                </span>
              </td>

              <td class="tenant-muted">{{ formatDate(tenant.created_at) }}</td>

              <td class="tenant-actions-cell">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-eye-outline" title="Görüntüle" @click="openTenant(tenant)" />
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Düzenle" @click="editTenant(tenant)" />
                    <v-divider />
                    <v-list-item
                      :prepend-icon="tenant.status === 'active' ? 'mdi-close-circle-outline' : 'mdi-check-circle-outline'"
                      :title="tenant.status === 'active' ? 'Pasife Al' : 'Aktifleştir'"
                      @click="toggleStatus(tenant)"
                    />
                  </v-list>
                </v-menu>
              </td>
            </tr>

            <tr v-if="paginatedTenants.length === 0">
              <td colspan="6">
                <div class="tenant-empty-state">
                  <v-icon icon="mdi-domain-off" size="40" />
                  <strong>Tenant bulunamadı</strong>
                  <span>Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="tenant-table-footer">
        <span class="tenant-record-count">Toplam 24 kayıt</span>

        <v-pagination
          v-model="page"
          class="tenant-pagination"
          :length="pageCount"
          :total-visible="5"
          density="compact"
        />

        <v-select
          v-model="itemsPerPage"
          class="tenant-page-size"
          :items="[10, 25, 50]"
          variant="outlined"
          density="compact"
          hide-details
          suffix="/ sayfa"
        />
      </div>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
interface Tenant {
  id: number
  name: string
  slug: string
  status: 'active' | 'passive'
  onboarding_type: 'holding' | 'group' | 'company' | 'brand'
  created_at: string
}

const router = useRouter()

const search = ref('')
const statusFilter = ref<string | null>(null)
const structureFilter = ref<string | null>(null)
const dateFilter = ref<string | null>(null)
const page = ref(1)
const itemsPerPage = ref(10)

const statusOptions = [
  { title: 'Tümü', value: null },
  { title: 'Aktif', value: 'active' },
  { title: 'Pasif', value: 'passive' },
]

const structureOptions = [
  { title: 'Tümü', value: null },
  { title: 'Holding', value: 'holding' },
  { title: 'Grup', value: 'group' },
  { title: 'Şirket', value: 'company' },
  { title: 'Marka', value: 'brand' },
]

const dateOptions = [
  { title: 'Tümü', value: null },
  { title: 'Son 7 gün', value: '7' },
  { title: 'Son 30 gün', value: '30' },
]

const tenants = ref<Tenant[]>([
  { id: 1, name: 'Koç Holding', slug: 'koc-holding', status: 'active', onboarding_type: 'holding', created_at: '2025-05-18T14:32:00' },
  { id: 2, name: 'MADO', slug: 'mado', status: 'active', onboarding_type: 'company', created_at: '2025-05-17T11:20:00' },
  { id: 3, name: 'Arçelik A.Ş.', slug: 'arcelik', status: 'active', onboarding_type: 'company', created_at: '2025-05-16T09:15:00' },
  { id: 4, name: 'İpek Gıda', slug: 'ipek-gida', status: 'passive', onboarding_type: 'group', created_at: '2025-05-15T16:45:00' },
  { id: 5, name: 'Tepe Savunma', slug: 'tepe-savunma', status: 'active', onboarding_type: 'company', created_at: '2025-05-14T10:05:00' },
  { id: 6, name: 'Beko', slug: 'beko', status: 'active', onboarding_type: 'brand', created_at: '2025-05-13T13:30:00' },
  { id: 7, name: 'Setur', slug: 'setur', status: 'passive', onboarding_type: 'company', created_at: '2025-05-12T08:50:00' },
])

const filteredTenants = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('tr-TR')

  return tenants.value.filter((tenant) => {
    const matchesSearch = !query ||
      tenant.name.toLocaleLowerCase('tr-TR').includes(query) ||
      tenant.slug.toLocaleLowerCase('tr-TR').includes(query)

    const matchesStatus = !statusFilter.value || tenant.status === statusFilter.value
    const matchesStructure = !structureFilter.value || tenant.onboarding_type === structureFilter.value

    return matchesSearch && matchesStatus && matchesStructure
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredTenants.value.length / itemsPerPage.value)))

const paginatedTenants = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredTenants.value.slice(start, start + itemsPerPage.value)
})

watch([search, statusFilter, structureFilter, dateFilter, itemsPerPage], () => {
  page.value = 1
})

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toLocaleUpperCase('tr-TR')
}

function getStructureLabel(type: Tenant['onboarding_type']) {
  return {
    holding: 'Holding',
    group: 'Grup',
    company: 'Şirket',
    brand: 'Marka',
  }[type]
}

function getStructureIcon(type: Tenant['onboarding_type']) {
  return {
    holding: 'mdi-bank-outline',
    group: 'mdi-account-group-outline',
    company: 'mdi-domain',
    brand: 'mdi-tag-outline',
  }[type]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function goToCreate() {
  router.push('/tenants/new')
}

function openTenant(tenant: Tenant) {
  router.push(`/tenants/${tenant.id}`)
}

function editTenant(tenant: Tenant) {
  router.push(`/tenants/${tenant.id}/edit`)
}

function toggleStatus(tenant: Tenant) {
  tenant.status = tenant.status === 'active' ? 'passive' : 'active'
}
</script>

<style>
.tenant-list-page {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 24px 16px 32px !important;
}

.tenant-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 24px;
}

.tenant-list-title {
  margin: 0;
  color: rgb(var(--v-theme-on-background));
  font-size: 25px;
  line-height: 1.2;
  font-weight: 700;
}

.tenant-list-subtitle {
  margin: 6px 0 0;
  color: rgba(var(--v-theme-on-background), 0.62);
  font-size: 13px;
  line-height: 1.45;
}

.tenant-create-button,
.tenant-filter-create-button {
  min-height: 38px;
  text-transform: none;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0;
  box-shadow: 0 3px 10px rgba(98, 40, 215, 0.2);
}

.tenant-filter-card {
  display: grid;
  grid-template-columns: 1.55fr 0.9fr 1fr 1.15fr auto;
  align-items: center;
  gap: 14px;
  padding: 20px 14px;
  margin-bottom: 18px;
  border: 1px solid rgba(var(--v-theme-on-background), 0.10) !important;
  border-radius: 9px !important;
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface));
}

.tenant-filter-control {
  min-width: 0;
}

.tenant-filter-control :is(.v-field) {
  border-radius: 6px;
}

.tenant-filter-control :is(.v-field__input) {
  min-height: 44px;
  font-size: 13px;
}

.tenant-filter-control :is(.v-label) {
  font-size: 12px;
}

.tenant-filter-create-button {
  padding-inline: 16px;
}

.tenant-table-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-background), 0.10) !important;
  border-radius: 9px !important;
  background: rgb(var(--v-theme-surface)) !important;
  color: rgb(var(--v-theme-on-surface));
}

.tenant-table-scroll {
  overflow-x: auto;
}

.tenant-table {
  width: 100%;
  min-width: 850px;
  table-layout: fixed;
  border-collapse: collapse;
}

.tenant-table th {
  height: 42px;
  padding: 0 16px;
  color: rgba(var(--v-theme-on-surface), 0.88);
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.10);
}

.tenant-table th:nth-child(1) { width: 21%; }
.tenant-table th:nth-child(2) { width: 17%; }
.tenant-table th:nth-child(3) { width: 18%; }
.tenant-table th:nth-child(4) { width: 14%; }
.tenant-table th:nth-child(5) { width: 21%; }
.tenant-table th:nth-child(6) { width: 9%; }

.tenant-table td {
  height: 54px;
  padding: 0 16px;
  color: rgb(var(--v-theme-on-surface));
  font-size: 12px;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.tenant-table-row {
  cursor: pointer;
  transition: background 120ms ease;
}

.tenant-table-row:hover {
  background: rgba(var(--v-theme-primary), 0.035);
}

.tenant-name-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-avatar {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  font-size: 12px;
  font-weight: 600;
}

.tenant-avatar-1 { background: #eee9ff; color: #6546e8; }
.tenant-avatar-2 { background: #e8f9f1; color: #0aa56b; }
.tenant-avatar-3 { background: #e9f5ff; color: #1681d7; }
.tenant-avatar-4 { background: #fff5e7; color: #f19a17; }
.tenant-avatar-5 { background: #f1edff; color: #6546e8; }
.tenant-avatar-6 { background: #fff0f3; color: #ef3b56; }
.tenant-avatar-7 { background: #e7f8fc; color: #0a9fc4; }

.tenant-name {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
}

.tenant-id {
  margin-top: 3px;
  color: rgba(var(--v-theme-on-surface), 0.55);
  font-size: 10px;
  line-height: 1;
}

.tenant-muted {
  color: rgba(var(--v-theme-on-surface), 0.62) !important;
}

.tenant-structure-badge,
.tenant-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
  border-radius: 7px;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 500;
}

.tenant-structure-holding { background: #eee9ff; color: #6546e8; }
.tenant-structure-group { background: #fff4df; color: #ef8c00; }
.tenant-structure-company { background: #e8f8f0; color: #079455; }
.tenant-structure-brand { background: #eaf2ff; color: #2563eb; }

.tenant-status-badge.is-active { background: #e8f8f1; color: #0aa56b; }
.tenant-status-badge.is-passive { background: rgba(var(--v-theme-on-surface), 0.07); color: rgba(var(--v-theme-on-surface), 0.62); }

.tenant-status-dot {
  width: 5px;
  height: 5px;
  flex: 0 0 5px;
  border-radius: 50%;
  background: currentColor;
}

.tenant-actions-heading,
.tenant-actions-cell {
  text-align: center !important;
}

.tenant-actions-cell :is(.v-btn) {
  color: rgba(var(--v-theme-on-surface), 0.75);
}

.tenant-table-footer {
  position: relative;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
}

.tenant-record-count {
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 12px;
}

.tenant-pagination {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.tenant-pagination :is(.v-pagination__list) {
  gap: 4px;
}

.tenant-pagination :is(.v-btn) {
  min-width: 32px;
  width: 32px;
  height: 32px;
  font-size: 12px;
}

.tenant-page-size {
  width: 84px;
  margin-left: auto;
}

.tenant-page-size :is(.v-field) {
  min-height: 34px;
  border-radius: 5px;
}

.tenant-page-size :is(.v-field__input) {
  min-height: 34px;
  padding: 0 8px;
  font-size: 12px;
}

.tenant-page-size :is(.v-field__suffix) {
  padding-inline-start: 0;
  color: rgba(var(--v-theme-on-surface), 0.62);
  font-size: 11px;
}

.tenant-empty-state {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 5px;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.tenant-empty-state strong { font-size: 13px; }
.tenant-empty-state span { font-size: 12px; }

@media (max-width: 1050px) {
  .tenant-filter-card {
    grid-template-columns: 1.5fr 1fr 1fr;
  }

  .tenant-filter-create-button {
    width: 100%;
  }
}

@media (max-width: 700px) {
  .tenant-list-page {
    padding: 16px !important;
  }

  .tenant-list-header {
    flex-direction: column;
  }

  .tenant-create-button {
    width: 100%;
  }

  .tenant-filter-card {
    grid-template-columns: 1fr;
  }

  .tenant-table {
    min-width: 850px;
  }

  .tenant-table-footer {
    min-width: 850px;
  }
}
</style>
