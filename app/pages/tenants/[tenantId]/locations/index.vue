<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Eye, Filter, MapPin, Plus, Search } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

type LocationStatus = 'active' | 'passive'
type LogoTone = 'arcelik' | 'beko' | 'bicakcilar' | 'grundig' | 'arcelikLg'
type LocationBusinessEntity = {
  id: number
  companyName: string
  brandName?: string
  logoUrl: string
}
type Location = {
  id: number
  name: string
  city: string
  district: string
  address: string
  businessEntities: LocationBusinessEntity[]
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

// Mock data. Production response will come from LocationBusinessEntity.
// The logo is determined by the company + brand assignment on that location.
const logos = {
  arcelik: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg',
  beko: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg',
  grundig: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Grundig_Logo_2019.svg',
  bicakcilar: 'https://www.massiad.org.tr/dosya/uye/bicakcilar-tibbi-cihaz-san-ve-tic-a-s-IyYgxJ.jpg',
  arcelikLg: 'https://s3.eu-central-1.amazonaws.com/stajim/media/images/company/photos/origin/r_9157_20240506133829.jpg',
}

const locations = ref<Location[]>([
  {
    id: 1,
    name: 'Beylikdüzü Kampüsü',
    city: 'İstanbul',
    district: 'Beylikdüzü',
    address: 'Beylikdüzü Kampüsü, Beylikdüzü / İstanbul',
    businessEntities: [
      { id: 1, companyName: 'Arçelik A.Ş.', brandName: 'Beko', logoUrl: logos.beko },
      { id: 2, companyName: 'Arçelik Pazarlama A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
      { id: 3, companyName: 'Bıçakçılar A.Ş.', logoUrl: logos.bicakcilar },
    ],
    contractorCount: 6,
    status: 'active',
    image: 'https://s1.dmcdn.net/v/OrN9e1eobEe84Yfu6/x720',
  },
  {
    id: 2,
    name: 'Sütlüce Genel Müdürlük',
    city: 'İstanbul',
    district: 'Beyoğlu',
    address: 'Karaağaç Caddesi No:2-6, Sütlüce, Beyoğlu / İstanbul',
    businessEntities: [
      { id: 4, companyName: 'Arçelik A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
      { id: 5, companyName: 'Arçelik Pazarlama A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
    ],
    contractorCount: 4,
    status: 'active',
    image: 'https://avatars.mds.yandex.net/get-altay/14731058/2a00000194b37f714a325289aa7cc5ff0976/XXL_height',
  },
  {
    id: 3,
    name: 'Çayırova Kampüsü',
    city: 'İstanbul',
    district: 'Tuzla',
    address: 'Şifa Mahallesi 34950, Tuzla / İstanbul',
    businessEntities: [
      { id: 6, companyName: 'Arçelik A.Ş.', brandName: 'Beko', logoUrl: logos.beko },
    ],
    contractorCount: 8,
    status: 'active',
    image: 'https://static.daktilo.com/sites/302/uploads/2022/01/20/arcelik-fabrika.jpg',
  },
  {
    id: 4,
    name: 'Eskişehir Kampüsü',
    city: 'Eskişehir',
    district: 'Odunpazarı',
    address: '75. Yıl OSB Mah. 1. Cadde No:1, Odunpazarı / Eskişehir',
    businessEntities: [
      { id: 7, companyName: 'Arçelik A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
    ],
    contractorCount: 24,
    status: 'active',
    image: 'https://stendustricomtr.teimg.com/stendustri-com-tr/images/haberler/2020/06/arcelik_eskisehir_buzdolabi_ve_kompresor_tesisine_tse_covid_19_guvenli_uretim_belgesi_h106580_8fef3.png',
  },
  {
    id: 5,
    name: 'Çerkezköy Kampüsü',
    city: 'Tekirdağ',
    district: 'Kapaklı',
    address: 'Çerkezköy Organize Sanayi Bölgesi, Karaağaç Mah. 8. Sokak No:1A, Kapaklı / Tekirdağ',
    businessEntities: [
      { id: 8, companyName: 'Arçelik A.Ş.', brandName: 'Beko', logoUrl: logos.beko },
      { id: 9, companyName: 'Arçelik A.Ş.', brandName: 'Grundig', logoUrl: logos.grundig },
    ],
    contractorCount: 9,
    status: 'active',
    image: 'https://turkishtimedergi.com/wp-content/uploads/2018/10/arcelik.jpg',
  },
  {
    id: 6,
    name: 'Manisa Kampüsü',
    city: 'Manisa',
    district: 'Yunusemre',
    address: 'Manisa Organize Sanayi Bölgesi, Yunusemre / Manisa',
    businessEntities: [
      { id: 10, companyName: 'Arçelik A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
      { id: 11, companyName: 'Arçelik A.Ş.', brandName: 'Beko', logoUrl: logos.beko },
    ],
    contractorCount: 7,
    status: 'active',
    image: 'https://hemelektrik.com.tr/Assets/Images/arcelik-camasir-bulasik-makinesi-fabrikasi-b.jpg',
  },
  {
    id: 7,
    name: 'Bolu Pişirici Cihazlar İşletmesi',
    city: 'Bolu',
    district: 'Merkez',
    address: 'Yukarı Soku Mahallesi, Arçelik Sk. No:1, Merkez / Bolu',
    businessEntities: [
      { id: 12, companyName: 'Arçelik A.Ş.', brandName: 'Arçelik', logoUrl: logos.arcelik },
    ],
    contractorCount: 5,
    status: 'active',
    image: 'https://bthaber.com/SFolder/ckeditor/images/Arcelik_Bolu_Pisirici_Cihazlar_Isletmesi_1.jpg',
  },
  {
    id: 8,
    name: 'Ankara Bulaşık Makinesi İşletmesi',
    city: 'Ankara',
    district: 'Sincan',
    address: '1. OSB, Altınordu Cad. No:3, Sincan / Ankara',
    businessEntities: [
      { id: 13, companyName: 'Arçelik A.Ş.', brandName: 'Beko', logoUrl: logos.beko },
    ],
    contractorCount: 5,
    status: 'active',
    image: 'https://i.gazeteoksijen.com/2/850/478/storage/files/images/2026/05/08/arcelikin-ankaradaki-fabrikasi-469-saniyede-bir-bulasik-makinesi-uretiliyor-54-ulkeye-ihrac-ediliyor-a5dd.jpg',
  },
  {
    id: 9,
    name: 'Arçelik-LG Klima',
    city: 'Kocaeli',
    district: 'Gebze',
    address: 'Gebze Organize Sanayi Bölgesi / Kocaeli',
    businessEntities: [
      { id: 14, companyName: 'Arçelik-LG Klima San. ve Tic. A.Ş.', brandName: 'Arçelik-LG', logoUrl: logos.arcelikLg },
    ],
    contractorCount: 3,
    status: 'active',
    image: 'https://s3.eu-central-1.amazonaws.com/stajim/media/images/company/photos/origin/r_9157_20240506133829.jpg',
  },
])

const companyOptions = computed(() => [...new Set(locations.value.flatMap(location => location.businessEntities.map(entity => entity.companyName)))])
const cityOptions = computed(() => [...new Set(locations.value.map(location => location.city))])

const filteredLocations = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return locations.value.filter(location => {
    const entityText = location.businessEntities.map(entity => `${entity.companyName} ${entity.brandName ?? ''}`).join(' ')
    const haystack = `${location.name} ${location.city} ${location.district} ${location.address} ${entityText}`.toLocaleLowerCase('tr-TR')
    return (!term || haystack.includes(term))
      && (companyFilter.value === 'all' || location.businessEntities.some(entity => entity.companyName === companyFilter.value))
      && (cityFilter.value === 'all' || location.city === cityFilter.value)
      && (statusFilter.value === 'all' || location.status === statusFilter.value)
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
          <Plus :size="16" /> Yeni Lokasyon
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
            <Filter :size="15" /> Filtreleri Temizle
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
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Şirketler / Markalar</th>
                <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Taşeron</th>
                <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Durum</th>
                <th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="location in paginatedLocations" :key="location.id" class="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                <td class="px-4 py-3.5">
                  <button type="button" class="flex min-w-[255px] items-center gap-3 text-left" @click="goToLocation(location.id)">
                    <img :src="location.image" :alt="location.name" class="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700" loading="lazy" />
                    <span class="min-w-0">
                      <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">{{ location.name }}</span>
                      <span class="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><MapPin :size="12" />{{ location.district }} / {{ location.city }}</span>
                    </span>
                  </button>
                </td>
                <td class="max-w-[360px] px-4 py-3.5 align-middle text-sm leading-5 text-gray-600 dark:text-gray-400"><span class="line-clamp-3">{{ location.address }}</span></td>
                <td class="px-4 py-3.5">
                  <div class="flex items-center gap-1">
                    <div v-for="(entity, index) in location.businessEntities.slice(0, 3)" :key="entity.id" class="relative -ml-2 first:ml-0" :style="{ zIndex: 10 - index }" :title="entity.companyName + (entity.brandName ? ' • ' + entity.brandName : '')">
                      <span class="flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-950">
                        <img :src="entity.logoUrl" :alt="entity.brandName || entity.companyName" class="max-h-9 max-w-11 object-contain" loading="lazy" />
                      </span>
                    </div>
                    <span v-if="location.businessEntities.length > 3" class="relative -ml-2 flex h-13 w-13 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-xs font-semibold text-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">+{{ location.businessEntities.length - 3 }}</span>
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
