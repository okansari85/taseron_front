<template>
  <v-container fluid class="py-8 page-container">
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h5 font-weight-bold">Tenantlar</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.
        </p>
      </div>

      <v-btn color="primary" prepend-icon="mdi-plus" rounded="lg" @click="goToCreate">
        Yeni Tenant
      </v-btn>
    </div>

    <v-card rounded="xl" elevation="0" class="border-card mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-text-field
              v-model="search"
              placeholder="Tenant ara..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select v-model="statusFilter" :items="statusOptions" label="Durum" variant="outlined" density="comfortable" hide-details clearable />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="structureFilter" :items="structureOptions" label="Kurumsal Yapı" variant="outlined" density="comfortable" hide-details clearable />
          </v-col>
          <v-col cols="12" md="2">
            <v-btn block variant="text" prepend-icon="mdi-filter-remove-outline" :disabled="!hasFilters" @click="clearFilters">
              Temizle
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card rounded="xl" elevation="0" class="border-card">
      <v-card-text class="pa-0">
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
            <tr v-for="tenant in paginatedTenants" :key="tenant.id" class="tenant-row" @click="openTenant(tenant)">
              <td>
                <div class="d-flex align-center ga-3">
                  <v-avatar size="40" color="primary" variant="tonal">
                    <span class="text-subtitle-2 font-weight-bold">{{ getInitials(tenant.name) }}</span>
                  </v-avatar>
                  <div>
                    <div class="font-weight-semibold">{{ tenant.name }}</div>
                    <div class="text-caption text-medium-emphasis">#{{ tenant.id }}</div>
                  </div>
                </div>
              </td>
              <td><span class="text-body-2 text-medium-emphasis">{{ tenant.slug }}</span></td>
              <td>
                <v-chip size="small" variant="tonal" :prepend-icon="getStructureIcon(tenant.onboarding_type)">
                  {{ getStructureLabel(tenant.onboarding_type) }}
                </v-chip>
              </td>
              <td>
                <v-chip size="small" :color="tenant.status === 'active' ? 'success' : 'default'" variant="tonal">
                  <span class="status-dot" />
                  {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
                </v-chip>
              </td>
              <td><span class="text-body-2 text-medium-emphasis">{{ formatDate(tenant.created_at) }}</span></td>
              <td class="text-end">
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" size="small" @click.stop />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-eye-outline" title="Görüntüle" @click="openTenant(tenant)" />
                    <v-list-item prepend-icon="mdi-pencil-outline" title="Düzenle" @click="editTenant(tenant)" />
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
                  <v-icon icon="mdi-domain-off" size="42" class="mb-3" />
                  <div class="text-subtitle-1 font-weight-medium">Tenant bulunamadı</div>
                  <div class="text-body-2 text-medium-emphasis mt-1">Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</div>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>

      <v-divider />
      <div class="d-flex align-center justify-space-between pa-4">
        <div class="text-body-2 text-medium-emphasis">Toplam {{ filteredTenants.length }} kayıt</div>
        <div class="d-flex align-center ga-4">
          <v-select v-model="itemsPerPage" :items="[10, 25, 50]" density="compact" variant="outlined" hide-details style="width: 100px" />
          <v-pagination v-model="page" :length="pageCount" density="comfortable" rounded="circle" total-visible="5" />
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
    const matchesSearch = !query || tenant.name.toLocaleLowerCase('tr-TR').includes(query) || tenant.slug.toLocaleLowerCase('tr-TR').includes(query)
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

watch([search, statusFilter, structureFilter, itemsPerPage], () => { page.value = 1 })

function clearFilters() {
  search.value = ''
  statusFilter.value = null
  structureFilter.value = null
  page.value = 1
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('tr-TR')
}

function getStructureLabel(type: Tenant['onboarding_type']) {
  return { holding: 'Holding', group: 'Grup', company: 'Şirket', brand: 'Marka' }[type]
}

function getStructureIcon(type: Tenant['onboarding_type']) {
  return { holding: 'mdi-bank-outline', group: 'mdi-account-group-outline', company: 'mdi-domain', brand: 'mdi-tag-outline' }[type]
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

function goToCreate() { router.push('/tenants/new') }
function openTenant(tenant: Tenant) { router.push(`/tenants/${tenant.id}`) }
function editTenant(tenant: Tenant) { router.push(`/tenants/${tenant.id}/edit`) }
function toggleStatus(tenant: Tenant) { tenant.status = tenant.status === 'active' ? 'passive' : 'active' }
</script>

<style scoped>
.page-container { max-width: 1200px; margin: 0 auto; }
.border-card { border: 1px solid rgb(var(--v-theme-on-surface) / 0.08); }
.tenant-table :deep(th) { height: 52px; font-size: 0.75rem; font-weight: 600; white-space: nowrap; color: rgb(var(--v-theme-on-surface) / 0.65); }
.tenant-table :deep(td) { height: 72px; }
.tenant-row { cursor: pointer; transition: background-color 0.15s ease; }
.tenant-row:hover { background: rgb(var(--v-theme-primary) / 0.035); }
.status-dot { width: 6px; height: 6px; border-radius: 50%; margin-right: 6px; display: inline-block; background: currentColor; }
.empty-state { min-height: 260px; display: flex; align-items: center; justify-content: center; flex-direction: column; text-align: center; color: rgb(var(--v-theme-on-surface) / 0.45); }
@media (max-width: 900px) {
  .tenant-table { min-width: 850px; }
  .tenant-table :deep(.v-table__wrapper) { overflow-x: auto; }
}
</style>
