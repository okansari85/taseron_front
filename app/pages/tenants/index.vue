<template>
  <v-container
    class="tenant-list-page mx-auto px-0"
    style="max-width: 1120px; width: 100%;"
  >
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h4 font-weight-bold">Tenantlar</div>
        <div class="text-body-1 text-medium-emphasis mt-1">
          Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.
        </div>
      </div>

      <v-btn
        color="primary"
        rounded="md"
        prepend-icon="mdi-plus"
        class="text-body-2 text-none font-weight-medium"
        height="40"
        @click="goToCreate"
      >
        Yeni Tenant
      </v-btn>
    </div>

    <v-card
      class="tenant-filter-card mb-5 pa-4"
      rounded="md"
      elevation="0"
      border
    >
      <v-row align="center" dense class="ma-0">
        <v-col cols="12" md="4" class="pa-1">
          <v-text-field
            v-model="search"
            placeholder="Tenant ara..."
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="statusFilter"
            label="Durum"
            :items="statusOptions"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          >
            <template #selection="{ item }">
              <span class="text-caption">{{ item.title }}</span>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="structureFilter"
            label="Kurumsal Yapı"
            :items="structureOptions"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          >
            <template #selection="{ item }">
              <span class="text-caption">{{ item.title }}</span>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="dateFilter"
            label="Oluşturulma Tarihi"
            :items="dateOptions"
            prepend-inner-icon="mdi-calendar-outline"
            variant="outlined"
            density="compact"
            hide-details
            clearable
          >
            <template #selection="{ item }">
              <span class="text-caption">{{ item.title }}</span>
            </template>
          </v-select>
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-btn
            block
            height="40"
            variant="tonal"
            color="primary"
            rounded="md"
            prepend-icon="mdi-filter-remove-outline"
            class="text-caption text-none font-weight-medium"
            :disabled="!hasFilters"
            @click="clearFilters"
          >
            Filtreleri Temizle
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card
      rounded="md"
      elevation="0"
      border
      class="overflow-hidden"
    >
      <v-table hover>
        <thead class="bg-grey-lighten-5">
          <tr>
            <th class="text-body-2 font-weight-bold text-high-emphasis">Tenant Adı</th>
            <th class="text-body-2 font-weight-bold text-high-emphasis">Slug</th>
            <th class="text-body-2 font-weight-bold text-high-emphasis">Kurumsal Yapı</th>
            <th class="text-body-2 font-weight-bold text-high-emphasis">Durum</th>
            <th class="text-body-2 font-weight-bold text-high-emphasis">Oluşturulma Tarihi</th>
            <th class="text-body-2 font-weight-bold text-high-emphasis text-center">İşlemler</th>
          </tr>
        </thead>

        <tbody>
          <tr
            v-for="tenant in paginatedTenants"
            :key="tenant.id"
            class="tenant-row"
            @click="openTenant(tenant)"
          >
            <td class="py-3">
              <div class="d-flex align-center ga-3">
                <v-avatar
                  size="36"
                  :color="getAvatarColor(tenant.id)"
                  variant="tonal"
                  rounded="0"
                >
                  <span class="font-weight-bold text-caption">
                    {{ getInitials(tenant.name) }}
                  </span>
                </v-avatar>

                <div class="min-w-0">
                  <div class="text-body-2 font-weight-semibold text-truncate">
                    {{ tenant.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    #{{ tenant.id }}
                  </div>
                </div>
              </div>
            </td>

            <td class="py-3 text-caption text-medium-emphasis">{{ tenant.slug }}</td>

            <td class="py-3">
              <v-chip
                size="small"
                variant="tonal"
                :color="getStructureColor(tenant.onboarding_type)"
                :prepend-icon="getStructureIcon(tenant.onboarding_type)"
                class="text-caption"
              >
                {{ getStructureLabel(tenant.onboarding_type) }}
              </v-chip>
            </td>

            <td class="py-3">
              <v-chip
                size="small"
                variant="tonal"
                :color="tenant.status === 'active' ? 'success' : 'default'"
                class="text-caption"
              >
                <span class="status-dot mr-2" />
                {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
              </v-chip>
            </td>

            <td class="py-3 text-caption text-medium-emphasis">{{ formatDate(tenant.created_at) }}</td>

            <td class="py-3 text-center">
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
            <td colspan="6" class="py-12 text-center">
              <v-icon icon="mdi-domain-off" size="36" class="mb-3 text-medium-emphasis" />
              <div class="text-body-2 font-weight-medium">Tenant bulunamadı</div>
              <div class="text-caption text-medium-emphasis mt-1">
                Arama veya filtre kriterlerinizi değiştirmeyi deneyin.
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-divider />

      <div class="d-flex align-center justify-space-between px-4 py-3">
        <span class="text-caption text-medium-emphasis">
          Toplam {{ totalTenantCount }} kayıt
        </span>

        <v-pagination
          v-model="page"
          :length="pageCount"
          :total-visible="5"
          density="compact"
          rounded="circle"
        />

        <v-select
          v-model="itemsPerPage"
          :items="pageSizeOptions"
          item-title="title"
          item-value="value"
          variant="outlined"
          density="compact"
          hide-details
          max-width="120"
          class="text-caption flex-grow-0"
        >
          <template #selection="{ item }">
            <span class="text-caption">{{ item.title }} / sayfa</span>
          </template>
        </v-select>
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

const totalTenantCount = 24

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

const pageSizeOptions = [
  { title: '10', value: 10 },
  { title: '25', value: 25 },
  { title: '50', value: 50 },
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

const hasFilters = computed(() => {
  return Boolean(
    search.value ||
    statusFilter.value ||
    structureFilter.value ||
    dateFilter.value,
  )
})

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

const pageCount = computed(() => {
  if (!hasFilters.value) return 3

  return Math.max(1, Math.ceil(filteredTenants.value.length / itemsPerPage.value))
})

const paginatedTenants = computed(() => {
  const start = (page.value - 1) * itemsPerPage.value
  return filteredTenants.value.slice(start, start + itemsPerPage.value)
})

watch(
  [search, statusFilter, structureFilter, dateFilter, itemsPerPage],
  () => {
    page.value = 1
  },
)

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

function clearFilters() {
  search.value = ''
  statusFilter.value = null
  structureFilter.value = null
  dateFilter.value = null
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

function getAvatarColor(id: number) {
  const colors = ['primary', 'success', 'info', 'warning', 'primary', 'error', 'info']
  return colors[(id - 1) % colors.length]
}

function getStructureLabel(type: Tenant['onboarding_type']) {
  return { holding: 'Holding', group: 'Grup', company: 'Şirket', brand: 'Marka' }[type]
}

function getStructureColor(type: Tenant['onboarding_type']) {
  return { holding: 'primary', group: 'warning', company: 'success', brand: 'info' }[type]
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
.tenant-list-page { width: 100%; }
.tenant-row { cursor: pointer; }
.tenant-row:hover { background: rgba(var(--v-theme-primary), 0.04); }
.status-dot { width: 6px; height: 6px; display: inline-block; border-radius: 50%; background: currentColor; }
</style>
