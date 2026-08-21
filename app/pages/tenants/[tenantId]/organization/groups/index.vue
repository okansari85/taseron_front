<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Filter,
  FolderTree,
  Info,
  Plus,
  Search,
} from '@lucide/vue'

definePageMeta({
  layout: 'default',
})

type GroupStatus = 'active' | 'passive'

type Group = {
  id: number
  name: string
  code: string
  parent: string | null
  description: string
  status: GroupStatus
  createdAt: string
}

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))

const search = ref('')
const statusFilter = ref('all')
const parentFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)

const tabs = [
  { label: 'Gruplar', path: 'groups' },
  { label: 'Şirketler', path: 'companies' },
  { label: 'Markalar', path: 'brands' },
  { label: 'Lokasyonlar', path: 'locations' },
  { label: 'Hiyerarşi Görünümü', path: 'hierarchy' },
]

const groups = ref<Group[]>([
  {
    id: 1,
    name: 'Dayanıklı Tüketim Grubu',
    code: '#GRP-001',
    parent: null,
    description: 'Dayanıklı tüketim sektöründeki şirketlerin bağlı olduğu grup.',
    status: 'active',
    createdAt: '18.05.2025 14:32',
  },
  {
    id: 2,
    name: 'Otomotiv Grubu',
    code: '#GRP-002',
    parent: null,
    description: 'Otomotiv sektöründeki şirketlerin bağlı olduğu grup.',
    status: 'active',
    createdAt: '17.05.2025 11:20',
  },
  {
    id: 3,
    name: 'Finans Grubu',
    code: '#GRP-003',
    parent: null,
    description: 'Finans ve yatırım şirketlerinin bağlı olduğu grup.',
    status: 'active',
    createdAt: '16.05.2025 09:15',
  },
  {
    id: 4,
    name: 'Enerji Grubu',
    code: '#GRP-004',
    parent: null,
    description: 'Enerji sektöründeki şirketlerin bağlı olduğu grup.',
    status: 'active',
    createdAt: '15.05.2025 16:45',
  },
  {
    id: 5,
    name: 'Savunma Grubu',
    code: '#GRP-005',
    parent: null,
    description: 'Savunma sanayi şirketlerinin bağlı olduğu grup.',
    status: 'active',
    createdAt: '14.05.2025 10:05',
  },
])

const filteredGroups = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')

  return groups.value.filter((group) => {
    const matchesSearch = !term
      || group.name.toLocaleLowerCase('tr-TR').includes(term)
      || group.code.toLocaleLowerCase('tr-TR').includes(term)

    const matchesStatus = statusFilter.value === 'all'
      || group.status === statusFilter.value

    const matchesParent = parentFilter.value === 'all'
      || (parentFilter.value === 'root' && group.parent === null)
      || group.parent === parentFilter.value

    return matchesSearch && matchesStatus && matchesParent
  })
})

const totalPages = computed(() => (
  Math.max(1, Math.ceil(filteredGroups.value.length / perPage.value))
))

const paginatedGroups = computed(() => {
  const start = (currentPage.value - 1) * perPage.value
  return filteredGroups.value.slice(start, start + perPage.value)
})

const visiblePages = computed(() => {
  const pages: number[] = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, start + 4)

  for (let page = start; page <= end; page += 1) {
    pages.push(page)
  }

  return pages
})

watch([search, statusFilter, parentFilter, perPage], () => {
  currentPage.value = 1
})

const resetFilters = () => {
  search.value = ''
  statusFilter.value = 'all'
  parentFilter.value = 'all'
}

const goToCreate = () => {
  navigateTo(`/tenants/${tenantId.value}/organization/groups/create`)
}

const goToGroup = (groupId: number) => {
  navigateTo(`/tenants/${tenantId.value}/organization/groups/${groupId}`)
}

const groupInitial = (name: string) => (
  name.trim().charAt(0).toLocaleUpperCase('tr-TR')
)
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px]">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">
        Organizasyon Yönetimi
      </h1>
      <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
        Organizasyon yapınızı yönetin ve hiyerarşiyi görüntüleyin.
      </p>
    </div>

    <div class="mb-5 flex overflow-x-auto rounded-xl border border-gray-200 bg-white px-2 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="`/tenants/${tenantId}/organization/${tab.path}`"
        class="relative flex h-11 shrink-0 items-center px-4 text-xs font-medium transition"
        :class="route.path.includes(`/organization/${tab.path}`)
          ? 'text-brand-500'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white/90'"
      >
        {{ tab.label }}
        <span
          v-if="route.path.includes(`/organization/${tab.path}`)"
          class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-brand-500"
        />
      </NuxtLink>
    </div>

    <div class="mb-5 flex items-center justify-between gap-4">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Organizasyon yapınızda yer alan grupları görüntüleyin ve yönetin.
      </p>

      <button
        type="button"
        class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
        @click="goToCreate"
      >
        <Plus :size="16" />
        Yeni Grup
      </button>
    </div>

    <section class="mb-5 rounded-xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.2fr)_1fr_1fr_auto]">
        <label class="relative block">
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            v-model="search"
            type="search"
            placeholder="Grup ara..."
            class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </label>

        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1.5 text-xs font-medium text-gray-400">
            Durum
          </span>
          <select
            v-model="statusFilter"
            class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pt-2 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
          <ChevronDown
            :size="15"
            class="pointer-events-none absolute right-3 top-1/2 translate-y-0.5 text-gray-400"
          />
        </label>

        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1.5 text-xs font-medium text-gray-400">
            Ebeveyn Grup
          </span>
          <select
            v-model="parentFilter"
            class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pt-2 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          >
            <option value="all">Tümü</option>
            <option value="root">Üst Seviye</option>
          </select>
          <ChevronDown
            :size="15"
            class="pointer-events-none absolute right-3 top-1/2 translate-y-0.5 text-gray-400"
          />
        </label>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
          @click="resetFilters"
        >
          <Filter :size="15" />
          Filtreleri Temizle
        </button>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[900px] text-left">
          <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
            <tr>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Grup Adı
              </th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Ebeveyn Grup
              </th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Açıklama
              </th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Durum
              </th>
              <th class="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400">
                Oluşturulma Tarihi
              </th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                İşlemler
              </th>
            </tr>
          </thead>

          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr
              v-for="group in paginatedGroups"
              :key="group.id"
              class="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"
            >
              <td class="px-4 py-3.5">
                <button
                  type="button"
                  class="flex min-w-[210px] items-center gap-3 text-left"
                  @click="goToGroup(group.id)"
                >
                  <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-sm font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                    {{ groupInitial(group.name) }}
                  </span>
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">
                      {{ group.name }}
                    </span>
                    <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                      {{ group.code }}
                    </span>
                  </span>
                </button>
              </td>

              <td class="px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                {{ group.parent ?? '—' }}
              </td>

              <td class="max-w-[250px] px-4 py-3.5 text-sm leading-5 text-gray-500 dark:text-gray-400">
                {{ group.description }}
              </td>

              <td class="px-4 py-3.5">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="group.status === 'active'
                    ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="group.status === 'active' ? 'bg-success-500' : 'bg-gray-400'"
                  />
                  {{ group.status === 'active' ? 'Aktif' : 'Pasif' }}
                </span>
              </td>

              <td class="whitespace-nowrap px-4 py-3.5 text-sm text-gray-500 dark:text-gray-400">
                {{ group.createdAt }}
              </td>

              <td class="px-4 py-3.5">
                <div class="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium text-gray-600 transition hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
                    @click="goToGroup(group.id)"
                  >
                    Görüntüle
                  </button>
                  <button
                    type="button"
                    class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white"
                    aria-label="Grup işlemleri"
                  >
                    <EllipsisVertical :size="16" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="paginatedGroups.length === 0">
              <td colspan="6" class="px-4 py-12 text-center">
                <div class="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800">
                  <FolderTree :size="18" />
                </div>
                <p class="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Grup bulunamadı.
                </p>
                <p class="mt-1 text-sm text-gray-400">
                  Arama veya filtre kriterlerinizi değiştirmeyi deneyin.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <span class="text-xs text-gray-500 dark:text-gray-400">
          Toplam {{ filteredGroups.length }} kayıt
        </span>

        <div class="flex items-center gap-1">
          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft :size="15" />
          </button>

          <button
            v-for="page in visiblePages"
            :key="page"
            type="button"
            class="flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition"
            :class="currentPage === page
              ? 'bg-brand-500 text-white'
              : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>

          <button
            type="button"
            class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:hover:bg-white/5"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight :size="15" />
          </button>
        </div>

        <label class="relative self-start sm:self-auto">
          <select
            v-model.number="perPage"
            class="h-8 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-600 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
          >
            <option :value="10">10 / sayfa</option>
            <option :value="25">25 / sayfa</option>
            <option :value="50">50 / sayfa</option>
          </select>
          <ChevronDown
            :size="13"
            class="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </label>
      </div>
    </section>

    <section class="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3.5 dark:border-brand-500/20 dark:bg-brand-500/5">
      <div class="flex items-start gap-3">
        <Info :size="17" class="mt-0.5 shrink-0 text-brand-500" />
        <div>
          <h2 class="text-sm font-semibold text-brand-600 dark:text-brand-400">
            Bilgilendirme
          </h2>
          <p class="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
            Organizasyon yapınızı Gruplar, Şirketler, Markalar ve Lokasyonlar olarak yönetebilirsiniz.
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
