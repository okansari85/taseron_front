<template>
  <v-container
    class="tenant-list-page mx-auto px-0"
    style="max-width: 1120px; width: 100%;"
  >
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <div class="text-h5 font-weight-bold">Tenantlar</div>
        <div class="text-body-2 text-medium-emphasis mt-1">
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

    <v-card class="mb-5 pa-4" rounded="md" elevation="0" border>
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

        <v-col cols="12" md="2" class="pa-1">
          <v-btn
            color="primary"
            rounded="md"
            prepend-icon="mdi-plus"
            class="text-body-2 text-none font-weight-medium"
            height="40"
            block
            @click="goToCreate"
          >
            Yeni Tenant
          </v-btn>
        </v-col>
      </v-row>
    </v-card>

    <v-data-iterator
      v-model:page="page"
      :items="filteredTenants"
      :items-per-page="itemsPerPage"
      :page-count="pageCount"
      hide-default-footer
    >
      <template #default="{ items }">
        <div class="d-flex flex-column ga-3">
          <v-card
            v-for="item in items"
            :key="item.raw.id"
            rounded="lg"
            elevation="2"
            border
            class="tenant-card px-4 py-3"
            @click="openTenant(item.raw)"
          >
            <v-row align="center" class="ma-0">
              <v-col cols="12" md="4" class="pa-0 d-flex align-center">
                <v-img
                  :src="item.raw.logo"
                  :alt="item.raw.name"
                  width="72"
                  max-width="72"
                  height="42"
                  contain
                  class="flex-grow-0"
                />

                <div class="ml-4 min-w-0">
                  <div class="text-body-2 font-weight-semibold text-truncate">
                    {{ item.raw.name }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    #{{ item.raw.id }} · {{ item.raw.slug }}
                  </div>
                </div>
              </v-col>

              <v-col cols="12" md="2" class="pa-0">
                <v-chip
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  :color="getStructureColor(item.raw.onboarding_type)"
                  :prepend-icon="getStructureIcon(item.raw.onboarding_type)"
                  class="text-body-2 px-3"
                >
                  {{ getStructureLabel(item.raw.onboarding_type) }}
                </v-chip>
              </v-col>

              <v-col cols="12" md="2" class="pa-0">
                <v-chip
                  size="small"
                  rounded="lg"
                  variant="tonal"
                  :color="item.raw.status === 'active' ? 'success' : 'default'"
                  class="text-body-2 px-3"
                >
                  <span class="status-dot mr-2" />
                  {{ item.raw.status === 'active' ? 'Aktif' : 'Pasif' }}
                </v-chip>
              </v-col>

              <v-col cols="12" md="3" class="pa-0">
                <div class="d-flex align-center ga-2 text-caption text-medium-emphasis">
                  <v-icon icon="mdi-calendar-outline" size="16" />
                  {{ formatDate(item.raw.created_at) }}
                </div>
              </v-col>

              <v-col cols="12" md="1" class="pa-0 d-flex justify-end">
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
                      @click="openTenant(item.raw)"
                    />
                    <v-list-item
                      prepend-icon="mdi-pencil-outline"
                      title="Düzenle"
                      @click="editTenant(item.raw)"
                    />
                    <v-divider class="my-1" />
                    <v-list-item
                      :prepend-icon="item.raw.status === 'active'
                        ? 'mdi-close-circle-outline'
                        : 'mdi-check-circle-outline'"
                      :title="item.raw.status === 'active' ? 'Pasife Al' : 'Aktifleştir'"
                      @click="toggleStatus(item.raw)"
                    />
                  </v-list>
                </v-menu>
              </v-col>
            </v-row>
          </v-card>

          <v-card
            v-if="items.length === 0"
            rounded="lg"
            elevation="2"
            border
            class="pa-12 text-center"
          >
            <v-icon
              icon="mdi-domain-off"
              size="36"
              class="mb-3 text-medium-emphasis"
            />
            <div class="text-body-2 font-weight-medium">Tenant bulunamadı</div>
            <div class="text-caption text-medium-emphasis mt-1">
              Arama veya filtre kriterlerinizi değiştirmeyi deneyin.
            </div>
          </v-card>
        </div>
      </template>
    </v-data-iterator>

    <div class="d-flex align-center justify-space-between px-1 mt-4">
      <span class="text-caption text-medium-emphasis">
        Toplam {{ totalTenantCount }} kayıt
      </span>

      <v-pagination
        v-model="page"
        :length="pageCount"
        :total-visible="5"
        density="comfortable"
        rounded="circle"
      />

      <v-select
        v-model="itemsPerPage"
        :items="pageSizeOptions"
        item-title="title"
        item-value="value"
        variant="outlined"
        density="comfortable"
        hide-details
        max-width="128"
        class="text-caption flex-grow-0"
      >
        <template #selection="{ item }">
          <span class="text-caption">{{ item.title }} / sayfa</span>
        </template>
      </v-select>
    </div>
  </v-container>
</template>

<script setup lang="ts">
interface Tenant {
  id: number
  name: string
  slug: string
  logo: string
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
  {
    id: 1,
    name: 'Koç Holding',
    slug: 'koc-holding',
    logo: 'https://www.google.com/s2/favicons?domain=koc.com.tr&sz=128',
    status: 'active',
    onboarding_type: 'holding',
    created_at: '2025-05-18T14:32:00',
  },
  {
    id: 2,
    name: 'MADO',
    slug: 'mado',
    logo: 'https://www.google.com/s2/favicons?domain=mado.com.tr&sz=128',
    status: 'active',
    onboarding_type: 'company',
    created_at: '2025-05-17T11:20:00',
  },
  {
    id: 3,
    name: 'Arçelik A.Ş.',
    slug: 'arcelik',
    logo: 'https://www.google.com/s2/favicons?domain=arcelik.com.tr&sz=128',
    status: 'active',
    onboarding_type: 'company',
    created_at: '2025-05-16T09:15:00',
  },
  {
    id: 4,
    name: 'İpek Gıda',
    slug: 'ipek-gida',
    logo: 'https://www.google.com/s2/favicons?domain=ipek.com.tr&sz=128',
    status: 'passive',
    onboarding_type: 'group',
    created_at: '2025-05-15T16:45:00',
  },
  {
    id: 5,
    name: 'Tepe Savunma',
    slug: 'tepe-savunma',
    logo: 'https://www.google.com/s2/favicons?domain=tepesavunma.com.tr&sz=128',
    status: 'active',
    onboarding_type: 'company',
    created_at: '2025-05-14T10:05:00',
  },
  {
    id: 6,
    name: 'Beko',
    slug: 'beko',
    logo: 'https://www.google.com/s2/favicons?domain=beko.com.tr&sz=128',
    status: 'active',
    onboarding_type: 'brand',
    created_at: '2025-05-13T13:30:00',
  },
  {
    id: 7,
    name: 'Setur',
    slug: 'setur',
    logo: 'https://www.google.com/s2/favicons?domain=setur.com.tr&sz=128',
    status: 'passive',
    onboarding_type: 'company',
    created_at: '2025-05-12T08:50:00',
  },
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

const hasFilters = computed(() => Boolean(
  search.value ||
  statusFilter.value ||
  structureFilter.value ||
  dateFilter.value,
))

const pageCount = computed(() => {
  const total = filteredTenants.value.length
  return Math.max(1, Math.ceil(total / itemsPerPage.value))
})

watch([search, statusFilter, structureFilter, dateFilter, itemsPerPage], () => {
  page.value = 1
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

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
.tenant-list-page { width: 100%; }
.tenant-card { cursor: pointer; }
.tenant-card:hover { border-color: rgba(var(--v-theme-primary), 0.24); }
.status-dot { width: 6px; height: 6px; display: inline-block; border-radius: 50%; background: currentColor; }
</style>
