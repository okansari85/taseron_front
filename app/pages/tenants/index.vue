<template>
  <v-container
    class="tenant-list-page mx-auto"
    style="max-width: 1120px; width: 100%;"
  >
    <div class="d-flex align-start justify-space-between mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold mb-1">Tenantlar</h1>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.
        </p>
      </div>
    </div>

    <v-card
      class="mb-4 px-3 py-2"
      rounded="lg"
      elevation="0"
      border
    >
      <v-row
        align="center"
        class="ma-0"
      >
        <v-col cols="12" md="4" class="pa-1">
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

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="statusFilter"
            label="Durum"
            :items="statusOptions"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="structureFilter"
            label="Kurumsal Yapı"
            :items="structureOptions"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-select
            v-model="dateFilter"
            label="Oluşturulma Tarihi"
            :items="dateOptions"
            prepend-inner-icon="mdi-calendar-outline"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
          />
        </v-col>

        <v-col cols="12" sm="6" md="2" class="pa-1">
          <v-btn
            block
            color="primary"
            rounded="lg"
            prepend-icon="mdi-plus"
            @click="goToCreate"
          >
            Yeni Tenant
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-card rounded="lg" elevation="0" border class="overflow-hidden">
      <v-table hover>
        <thead>
          <tr>
            <th>Tenant Adı</th>
            <th>Slug</th>
            <th>Kurumsal Yapı</th>
            <th>Durum</th>
            <th>Oluşturulma Tarihi</th>
            <th class="text-center">İşlemler</th>
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
              <div class="d-flex align-center ga-3">
                <v-avatar
                  size="34"
                  :color="getAvatarColor(tenant.id)"
                  variant="tonal"
                  rounded="lg"
                >
                  <span class="font-weight-semibold text-caption">
                    {{ getInitials(tenant.name) }}
                  </span>
                </v-avatar>

                <div>
                  <div class="text-body-2 font-weight-semibold">
                    {{ tenant.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    #{{ tenant.id }}
                  </div>
                </div>
              </div>
            </td>

            <td class="text-medium-emphasis">{{ tenant.slug }}</td>

            <td>
              <v-chip
                size="small"
                variant="tonal"
                :color="getStructureColor(tenant.onboarding_type)"
                :prepend-icon="getStructureIcon(tenant.onboarding_type)"
              >
                {{ getStructureLabel(tenant.onboarding_type) }}
              </v-chip>
            </td>

            <td>
              <v-chip
                size="small"
                variant="tonal"
                :color="tenant.status === 'active' ? 'success' : 'default'"
              >
                <span class="status-dot mr-2" />
                {{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}
              </v-chip>
            </td>

            <td class="text-medium-emphasis">{{ formatDate(tenant.created_at) }}</td>

            <td class="text-center">
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
                  <v-divider />
                  <v-list-item
                    :prepend-icon="
                      tenant.status === 'active'
                        ? 'mdi-close-circle-outline'
                        : 'mdi-check-circle-outline'
                    "
                    :title="
                      tenant.status === 'active'
                        ? 'Pasife Al'
                        : 'Aktifleştir'
                    "
                    @click="toggleStatus(tenant)"
                  />
                </v-list>
              </v-menu>
            </td>
          </tr>

          <tr v-if="paginatedTenants.length === 0">
            <td colspan="6">
              <div class="py-12 text-center">
                <v-icon icon="mdi-domain-off" size="40" class="mb-3" />
                <div class="text-subtitle-1 font-weight-medium">Tenant bulunamadı</div>
                <div class="text-body-2 text-medium-emphasis mt-1">
                  Arama veya filtre kriterlerinizi değiştirmeyi deneyin.
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </v-table>

      <v-divider />

      <v-row class="ma-0 px-4 py-2" align="center" justify="center">
        <v-col cols="12" md="4" class="pa-0">
          <span class="text-caption text-medium-emphasis">
            Toplam {{ filteredTenants.length }} kayıt
          </span>
        </v-col>

        <v-col cols="12" md="4" class="pa-0 d-flex justify-center">
          <v-pagination
            v-model="page"
            :length="pageCount"
            :total-visible="5"
            density="compact"
            rounded="circle"
          />
        </v-col>

        <v-col cols="12" md="4" class="pa-0 d-flex justify-end">
          <v-select
            v-model="itemsPerPage"
            :items="[10, 25, 50]"
            variant="outlined"
            density="compact"
            hide-details
            suffix="/ sayfa"
            style="max-width: 110px"
          />
        </v-col>
      </v-row>
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
    const matchesSearch =
      !query ||
      tenant.name.toLocaleLowerCase('tr-TR').includes(query) ||
      tenant.slug.toLocaleLowerCase('tr-TR').includes(query)

    const matchesStatus =
      !statusFilter.value || tenant.status === statusFilter.value

    const matchesStructure =
      !structureFilter.value || tenant.onboarding_type === structureFilter.value

    return matchesSearch && matchesStatus && matchesStructure
  })
})

const pageCount = computed(() => {
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
  if (page.value > count) {
    page.value = count
  }
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

function getAvatarColor(id: number) {
  const colors = ['primary', 'success', 'info', 'warning', 'primary', 'error', 'info']
  return colors[(id - 1) % colors.length]
}

function getStructureLabel(type: Tenant['onboarding_type']) {
  return {
    holding: 'Holding',
    group: 'Grup',
    company: 'Şirket',
    brand: 'Marka',
  }[type]
}

function getStructureColor(type: Tenant['onboarding_type']) {
  return {
    holding: 'primary',
    group: 'warning',
    company: 'success',
    brand: 'info',
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
}

.tenant-row {
  cursor: pointer;
}

.tenant-row:hover {
  background: rgba(var(--v-theme-primary), 0.04);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  background: currentColor;
}
</style>
