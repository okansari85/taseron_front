<template>
  <v-container fluid class="tenant-page pa-0">
    <div class="page-header">
      <div>
        <h1>Tenantlar</h1>
        <p>Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.</p>
      </div>

      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        rounded="lg"
        class="new-tenant-button"
        @click="goToCreate"
      >
        Yeni Tenant
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" class="filter-card">
      <div class="filter-grid">
        <v-text-field
          v-model="search"
          placeholder="Tenant ara..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
          class="search-field"
        />

        <v-select
          v-model="statusFilter"
          :items="statusOptions"
          label="Durum"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />

        <v-select
          v-model="structureFilter"
          :items="structureOptions"
          label="Kurumsal Yapı"
          variant="outlined"
          density="comfortable"
          hide-details
          clearable
        />

        <v-btn
          variant="text"
          prepend-icon="mdi-filter-remove-outline"
          :disabled="!hasFilters"
          class="clear-button"
          @click="clearFilters"
        >
          Temizle
        </v-btn>
      </div>
    </v-card>

    <v-card rounded="xl" elevation="0" class="table-card">
      <v-table class="tenant-table">
        <thead>
          <tr>
            <th>Tenant</th>
            <th>Slug</th>
            <th>Kurumsal Yapı</th>
            <th>Durum</th>
            <th>Oluşturulma</th>
            <th class="text-end">İşlemler</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="tenant in paginatedTenants"
            :key="tenant.id"
            class="tenant-row"
            @click="openTenant(tenant)"
          >
            <td>
              <div class="tenant-cell">
                <v-avatar size="40" color="primary" variant="tonal">
                  <span class="tenant-initials">{{ getInitials(tenant.name) }}</span>
                </v-avatar>

                <div class="tenant-name-block">
                  <div class="tenant-name">{{ tenant.name }}</div>
                  <div class="tenant-id">#{{ tenant.id }}</div>
                </div>
              </div>
            </td>

            <td class="slug-cell">{{ tenant.slug }}</td>

            <td>
              <v-chip
                size="small"
                variant="tonal"
                class="structure-chip"
                :prepend-icon="getStructureIcon(tenant.onboarding_type)"
              >
                {{ getStructureLabel(tenant.onboarding_type) }}
              </v-chip>
            </td>

            <td>
              <v-chip
                size="small"
                variant="tonal"
                :class="tenant.status === 'active' ? 'status-active' : 'status-passive'"
              >
                <span class="status-dot" />
                {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
              </v-chip>
            </td>

            <td class="date-cell">{{ formatDate(tenant.created_at) }}</td>

            <td class="text-end">
              <v-menu>
                <template #activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    class="action-button"
                    @click.stop
                  />
                </template>

                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-eye-outline"
                    title="Görüntüle"
                    @click="openTenant(tenant)"
                  />
                  <v-list-item
                    prepend-icon="mdi-pencil-outline"
                    title="Düzenle"
                    @click="editTenant(tenant)"
                  />
                  <v-divider class="my-1" />
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
              <div class="empty-state">
                <v-icon icon="mdi-domain-off" size="42" />
                <div class="empty-title">Tenant bulunamadı</div>
                <div class="empty-text">Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</div>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-divider />

      <div class="table-footer">
        <div class="record-count">Toplam {{ filteredTenants.length }} kayıt</div>

        <div class="pagination-area">
          <v-select
            v-model="itemsPerPage"
            :items="[10, 25, 50]"
            density="compact"
            variant="outlined"
            hide-details
            class="page-size"
          />

          <v-pagination
            v-model="page"
            :length="pageCount"
            density="comfortable"
            rounded="circle"
            total-visible="5"
            class="pagination"
          />
        </div>
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
const page = ref(1)
const itemsPerPage = ref(10)

const statusOptions = [
  { title: 'Aktif', value: 'active' },
  { title: 'Pasif', value: 'passive' },
]

const structureOptions = [
  { title: 'Holding', value: 'holding' },
  { title: 'Grup', value: 'group' },
  { title: 'Şirket', value: 'company' },
  { title: 'Marka', value: 'brand' },
]

const tenants = ref<Tenant[]>([
  { id: 1, name: 'Koç Holding', slug: 'koc-holding', status: 'active', onboarding_type: 'holding', created_at: '2026-08-18' },
  { id: 2, name: 'MADO', slug: 'mado', status: 'active', onboarding_type: 'brand', created_at: '2026-08-17' },
  { id: 3, name: 'Arçelik A.Ş.', slug: 'arcelik', status: 'active', onboarding_type: 'company', created_at: '2026-08-16' },
  { id: 4, name: 'İpek Gıda', slug: 'ipek-gida', status: 'passive', onboarding_type: 'group', created_at: '2026-08-15' },
])

const filteredTenants = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('tr-TR')

  return tenants.value.filter((tenant) => {
    const matchesSearch =
      !query ||
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

const hasFilters = computed(() => Boolean(search.value || statusFilter.value || structureFilter.value))

watch([search, statusFilter, structureFilter, itemsPerPage], () => {
  page.value = 1
})

function clearFilters() {
  search.value = ''
  statusFilter.value = null
  structureFilter.value = null
  page.value = 1
}

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

<style scoped>
.tenant-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 22px 32px 72px !important;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0;
  color: rgb(var(--v-theme-on-surface));
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.page-header p {
  margin: 6px 0 0;
  color: rgb(var(--v-theme-on-surface) / 0.58);
  font-size: 14px;
  line-height: 1.4;
}

.new-tenant-button {
  min-width: 128px;
  height: 40px;
  font-weight: 500;
  text-transform: none;
}

.filter-card,
.table-card {
  border: 1px solid rgb(var(--v-theme-on-surface) / 0.055);
  background: rgb(var(--v-theme-surface));
  box-shadow: none !important;
}

.filter-card {
  margin-bottom: 16px;
  padding: 16px;
}

.filter-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.5fr) minmax(150px, 0.55fr) minmax(200px, 0.8fr) 90px;
  gap: 16px;
  align-items: center;
}

.filter-grid :deep(.v-field) {
  border-radius: 6px;
}

.filter-grid :deep(.v-field__input) {
  min-height: 48px;
}

.clear-button {
  min-width: 90px;
  padding: 0 4px;
  color: rgb(var(--v-theme-on-surface) / 0.55);
  text-transform: none;
}

.table-card {
  overflow: hidden;
}

.tenant-table :deep(table) {
  width: 100%;
  table-layout: fixed;
}

.tenant-table :deep(th) {
  height: 54px;
  padding: 0 16px;
  border-bottom: 1px solid rgb(var(--v-theme-on-surface) / 0.08);
  color: rgb(var(--v-theme-on-surface) / 0.78);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.tenant-table :deep(th:nth-child(1)) { width: 24%; }
.tenant-table :deep(th:nth-child(2)) { width: 16%; }
.tenant-table :deep(th:nth-child(3)) { width: 18%; }
.tenant-table :deep(th:nth-child(4)) { width: 13%; }
.tenant-table :deep(th:nth-child(5)) { width: 19%; }
.tenant-table :deep(th:nth-child(6)) { width: 10%; }

.tenant-table :deep(td) {
  height: 52px;
  padding: 0 16px;
  border-bottom: 1px solid rgb(var(--v-theme-on-surface) / 0.075);
  color: rgb(var(--v-theme-on-surface) / 0.78);
  font-size: 13px;
}

.tenant-row {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.tenant-row:hover {
  background: rgb(var(--v-theme-primary) / 0.025);
}

.tenant-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tenant-initials {
  color: rgb(var(--v-theme-primary));
  font-size: 13px;
  font-weight: 600;
}

.tenant-name-block {
  min-width: 0;
}

.tenant-name {
  overflow: hidden;
  color: rgb(var(--v-theme-on-surface) / 0.9);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tenant-id {
  margin-top: 1px;
  color: rgb(var(--v-theme-on-surface) / 0.48);
  font-size: 11px;
}

.slug-cell,
.date-cell {
  color: rgb(var(--v-theme-on-surface) / 0.62) !important;
}

.structure-chip,
.status-active,
.status-passive {
  border-radius: 8px;
  font-size: 11px;
  font-weight: 500;
}

.structure-chip {
  background: rgb(var(--v-theme-on-surface) / 0.085);
  color: rgb(var(--v-theme-on-surface) / 0.78);
}

.status-active {
  background: rgb(16 185 129 / 0.11);
  color: rgb(5 150 105);
}

.status-passive {
  background: rgb(var(--v-theme-on-surface) / 0.08);
  color: rgb(var(--v-theme-on-surface) / 0.65);
}

.status-dot {
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  display: inline-block;
  background: currentColor;
}

.action-button {
  color: rgb(var(--v-theme-on-surface) / 0.68);
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
  padding: 0 16px;
}

.record-count {
  color: rgb(var(--v-theme-on-surface) / 0.58);
  font-size: 12px;
}

.pagination-area {
  display: flex;
  align-items: center;
  gap: 18px;
}

.page-size {
  width: 100px;
}

.page-size :deep(.v-field) {
  border-radius: 6px;
}

.pagination {
  margin-right: -8px;
}

.empty-state {
  min-height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: rgb(var(--v-theme-on-surface) / 0.45);
}

.empty-title {
  margin-top: 12px;
  color: rgb(var(--v-theme-on-surface) / 0.75);
  font-size: 14px;
  font-weight: 600;
}

.empty-text {
  margin-top: 4px;
  font-size: 12px;
}

@media (max-width: 1000px) {
  .tenant-page {
    padding: 20px 20px 60px !important;
  }

  .filter-grid {
    grid-template-columns: minmax(240px, 1fr) minmax(140px, 0.6fr) minmax(180px, 0.8fr) 80px;
    gap: 12px;
  }
}

@media (max-width: 760px) {
  .page-header {
    gap: 20px;
    flex-direction: column;
  }

  .new-tenant-button {
    align-self: flex-start;
  }

  .filter-grid {
    grid-template-columns: 1fr 1fr;
  }

  .search-field {
    grid-column: 1 / -1;
  }

  .clear-button {
    justify-self: start;
  }

  .table-card {
    overflow-x: auto;
  }

  .tenant-table {
    min-width: 900px;
  }
}
</style>
