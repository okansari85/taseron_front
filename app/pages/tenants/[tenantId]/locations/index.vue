<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Eye, Filter, MapPin, Plus, Search } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

type LocationStatus = 'active' | 'passive'
type LocationCompany = { id: number; name: string; shortName: string; logo: string }
type Location = {
  id: number
  name: string
  city: string
  district: string
  address: string
  companies: LocationCompany[]
  contractorCount: number
  status: LocationStatus
  image: string
}

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const search = ref('')
const companyFilter = ref('all')
const cityFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)

// Mock data. In the real API, companies and their logos will come from the
// location business entity/company assignment, not from the company master alone.
const locations = ref<Location[]>([
  {
    id: 1,
    name: 'Beylikdüzü Kampüsü',
    city: 'İstanbul',
    district: 'Beylikdüzü',
    address: 'Beylikdüzü OSB Mah. Cumhuriyet Cad. No:1 Beylikdüzü / İstanbul',
    companies: [
      { id: 1, name: 'Arçelik A.Ş.', shortName: 'arcelik', logo: 'AR' },
      { id: 2, name: 'Beko Elektronik A.Ş.', shortName: 'beko', logo: 'BE' },
      { id: 3, name: 'Bıçakçılar A.Ş.', shortName: 'bicakcilar', logo: 'B' },
      { id: 4, name: 'Arçelik Pazarlama A.Ş.', shortName: 'arcelik-pazarlama', logo: 'AP' },
    ],
    contractorCount: 6,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 2,
    name: 'Forum İstanbul',
    city: 'İstanbul',
    district: 'Bayrampaşa',
    address: 'Kocatepe Mah. Paşa Cad. No:22 Bayrampaşa / İstanbul',
    companies: [
      { id: 5, name: 'Arçelik A.Ş.', shortName: 'arcelik', logo: 'AR' },
      { id: 6, name: 'Beko Elektronik A.Ş.', shortName: 'beko', logo: 'BE' },
    ],
    contractorCount: 2,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 3,
    name: 'Kıraç Depo',
    city: 'İstanbul',
    district: 'Esenyurt',
    address: 'Kıraç OSB Mah. 6. Cad. No:12 Esenyurt / İstanbul',
    companies: [
      { id: 7, name: 'Bıçakçılar A.Ş.', shortName: 'bicakcilar', logo: 'B' },
    ],
    contractorCount: 1,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 4,
    name: 'Sütlüce Genel Merkez',
    city: 'İstanbul',
    district: 'Beyoğlu',
    address: 'Sütlüce Mah. İmrahor Cad. No:42/2 Beyoğlu / İstanbul',
    companies: [
      { id: 8, name: 'Arçelik A.Ş.', shortName: 'arcelik', logo: 'AR' },
    ],
    contractorCount: 4,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 5,
    name: 'Çerkezköy Üretim Tesisi',
    city: 'Tekirdağ',
    district: 'Çerkezköy',
    address: 'Veliköy OSB Mah. 1. Cad. No:5 Çerkezköy / Tekirdağ',
    companies: [
      { id: 9, name: 'Arçelik A.Ş.', shortName: 'arcelik', logo: 'AR' },
      { id: 10, name: 'Beko Elektronik A.Ş.', shortName: 'beko', logo: 'BE' },
    ],
    contractorCount: 3,
    status: 'passive',
    image: 'https://images.unsplash.com/photo-1567789884554-0b844b597180?auto=format&fit=crop&w=320&q=80',
  },
  {
    id: 6,
    name: 'Eskişehir Kampüsü',
    city: 'Eskişehir',
    district: 'Odunpazarı',
    address: 'Organize Sanayi Bölgesi 12. Cad. No:10 Odunpazarı / Eskişehir',
    companies: [
      { id: 11, name: 'Arçelik A.Ş.', shortName: 'arcelik', logo: 'AR' },
    ],
    contractorCount: 24,
    status: 'active',
    image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=320&q=80',
  },
])

const companyOptions = computed(() => [...new Set(locations.value.flatMap(location => location.companies.map(company => company.name)))])
const cityOptions = computed(() => [...new Set(locations.value.map(location => location.city))])

const filteredLocations = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return locations.value.filter(location => {
    const haystack = `${location.name} ${location.city} ${location.district} ${location.address}`.toLocaleLowerCase('tr-TR')
    const matchesSearch = !term || haystack.includes(term)
    const matchesCompany = companyFilter.value === 'all' || location.companies.some(company => company.name === companyFilter.value)
    const matchesCity = cityFilter.value === 'all' || location.city === cityFilter.value
    const matchesStatus = statusFilter.value === 'all' || location.status === statusFilter.value
    return matchesSearch && matchesCompany && matchesCity && matchesStatus
  })
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredLocations.value.length / perPage.value)))
const paginatedLocations = computed(() => filteredLocations.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value))
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, index) => Math.min(Math.max(1, currentPage.value - 2) + index, totalPages.value)).filter((page, index, pages) => pages.indexOf(page) === index))

watch([search, companyFilter, cityFilter, statusFilter, perPage], () => { currentPage.value = 1 })

const resetFilters = () => {
  search.value = ''
  companyFilter.value = 'all'
  cityFilter.value = 'all'
  statusFilter.value = 'all'
}

const goToCreate = () => navigateTo(`/tenants/${tenantId.value}/locations/create`)
const goToLocation = (id: number) => navigateTo(`/tenants/${tenantId.value}/locations/${id}`)
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Lokasyonlar</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Tenant içerisindeki fiziksel lokasyonları görüntüleyin ve yönetin.</p>
        </div>
        <button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate">
          <Plus :size="16" />
          Yeni Lokasyon
        </button>
      </div>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.35fr)_1fr_1fr_1fr_auto] md:items-center">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" placeholder="Lokasyon ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
          <div class="relative">
            <select v-model="companyFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm Şirketler</option>
              <option v-for="company in companyOptions" :key="company" :value="company">{{ company }}</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div class="relative">
            <select v-model="cityFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm İller</option>
              <option v-for="city in cityOptions" :key="city" :value="city">{{ city }}</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div class="relative">
            <select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-white/[0.06]" @click="resetFilters">
            <Filter :size="15" />
            Filtreleri Temizle
          </button>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[1180px] text-left">
            <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.03]">
              <tr>
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Lokasyon</th>
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Adres</th>
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Şirketler</th>
                <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Taşeron</th>
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Durum</th>
                <th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="location in paginatedLocations" :key="location.id" class="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                <td class="px-4 py-3.5">
                  <button type="button" class="flex min-w-[245px] items-center gap-3 text-left" @click="goToLocation(location.id)">
                    <img :src="location.image" :alt="location.name" class="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700" />
                    <span class="min-w-0">
                      <span class="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ location.name }}</span>
                      <span class="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><MapPin :size="12" />{{ location.district }} / {{ location.city }}</span>
                    </span>
                  </button>
                </td>
                <td class="max-w-[320px] px-4 py-3.5 text-sm leading-5 text-gray-600 dark:text-gray-400">{{ location.address }}</td>
                <td class="px-4 py-3.5">
                  <div class="flex items-center">
                    <div v-for="(company, index) in location.companies.slice(0, 3)" :key="company.id" class="relative -ml-2 first:ml-0" :style="{ zIndex: 10 - index }" :title="company.name">
                      <span class="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-[9px] font-bold text-gray-700 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">{{ company.logo }}</span>
                    </div>
                    <span v-if="location.companies.length > 3" class="relative -ml-2 flex h-11 w-11 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-xs font-semibold text-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">+{{ location.companies.length - 3 }}</span>
                  </div>
                </td>
                <td class="px-4 py-3.5 text-center"><span class="inline-flex min-w-8 items-center justify-center rounded-lg bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-300">{{ location.contractorCount }}</span></td>
                <td class="px-4 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="location.status === 'active' ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-300'"><span class="h-1.5 w-1.5 rounded-full" :class="location.status === 'active' ? 'bg-success-500' : 'bg-error-500'" />{{ location.status === 'active' ? 'Aktif' : 'Pasif' }}</span></td>
                <td class="px-4 py-3.5"><div class="flex items-center justify-end gap-2"><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300" @click="goToLocation(location.id)"><Eye :size="17" /></button><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300" aria-label="Lokasyon işlemleri"><EllipsisVertical :size="17" /></button></div></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <span class="text-sm text-gray-500 dark:text-gray-400">Toplam {{ filteredLocations.length }} kayıt</span>
          <div class="flex items-center gap-1">
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="16" /></button>
            <button v-for="page in visiblePages" :key="page" type="button" class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium" :class="page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]'" @click="currentPage = page">{{ page }}</button>
            <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="16" /></button>
          </div>
          <select v-model.number="perPage" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select>
        </div>
      </section>
    </div>
  </div>
</template>
