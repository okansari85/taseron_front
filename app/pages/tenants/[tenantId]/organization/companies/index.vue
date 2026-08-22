<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Eye, Filter, Plus, Search } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

type CompanyStatus = 'active' | 'passive'
type Company = { id: number; name: string; shortName: string; group: string; brandCount: number; status: CompanyStatus; createdAt: string }

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const search = ref('')
const groupFilter = ref('all')
const statusFilter = ref('all')
const currentPage = ref(1)
const perPage = ref(10)

const companies = ref<Company[]>([
  { id: 1, name: 'Arçelik A.Ş.', shortName: 'arcelik', group: 'Dayanıklı Tüketim Grubu', brandCount: 5, status: 'active', createdAt: '18.05.2025 14:32' },
  { id: 2, name: 'Beko Elektronik A.Ş.', shortName: 'beko', group: 'Dayanıklı Tüketim Grubu', brandCount: 4, status: 'active', createdAt: '17.05.2025 11:20' },
  { id: 3, name: 'Tofaş Türk Otomobil Fabrikası A.Ş.', shortName: 'tofas', group: 'Otomotiv Grubu', brandCount: 3, status: 'active', createdAt: '16.05.2025 09:15' },
  { id: 4, name: 'Tüpraş - Türkiye Petrol Rafinerileri A.Ş.', shortName: 'tupras', group: 'Enerji Grubu', brandCount: 2, status: 'active', createdAt: '15.05.2025 16:45' },
  { id: 5, name: 'Ford Otomotiv Sanayi A.Ş.', shortName: 'ford', group: 'Otomotiv Grubu', brandCount: 2, status: 'passive', createdAt: '14.05.2025 10:05' },
])

const groupOptions = computed(() => [...new Set(companies.value.map(company => company.group))])
const filteredCompanies = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return companies.value.filter(company => {
    const matchesSearch = !term || company.name.toLocaleLowerCase('tr-TR').includes(term) || company.shortName.toLocaleLowerCase('tr-TR').includes(term)
    return matchesSearch && (groupFilter.value === 'all' || company.group === groupFilter.value) && (statusFilter.value === 'all' || company.status === statusFilter.value)
  })
})
const totalPages = computed(() => Math.max(1, Math.ceil(filteredCompanies.value.length / perPage.value)))
const paginatedCompanies = computed(() => filteredCompanies.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value))
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, index) => Math.min(Math.max(1, currentPage.value - 2) + index, totalPages.value)).filter((page, index, pages) => pages.indexOf(page) === index))
watch([search, groupFilter, statusFilter, perPage], () => { currentPage.value = 1 })
const resetFilters = () => { search.value = ''; groupFilter.value = 'all'; statusFilter.value = 'all' }
const goToCreate = () => navigateTo(`/tenants/${tenantId.value}/organization/companies/create`)
const goToCompany = (id: number) => navigateTo(`/tenants/${tenantId.value}/organization/companies/${id}`)
const companyInitials = (name: string) => name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü ]/g, '').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toLocaleUpperCase('tr-TR')
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6">
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Organizasyon Yönetimi</h1>
        <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızı yönetin ve hiyerarşiyi görüntüleyin.</p>
      </div>

      <OrganizationTabs />

      <div class="mb-5 flex items-center justify-between gap-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">Organizasyon yapınızda yer alan şirketleri görüntüleyin ve yönetin.</p>
        <button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate"><Plus :size="16" />Yeni Şirket</button>
      </div>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-[minmax(220px,1.2fr)_1fr_1fr_auto] md:items-end">
          <label><span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Şirket</span><div class="relative"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="search" type="search" placeholder="Şirket ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div></label>
          <label><span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Grup</span><div class="relative"><select v-model="groupFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="all">Tümü</option><option v-for="group in groupOptions" :key="group" :value="group">{{ group }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label><span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Durum</span><div class="relative"><select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="all">Tümü</option><option value="active">Aktif</option><option value="passive">Pasif</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400" @click="resetFilters"><Filter :size="15" />Filtreleri Temizle</button>
        </div>
      </section>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="overflow-x-auto"><table class="w-full min-w-[980px] text-left"><thead class="border-b border-gray-100 dark:border-gray-800"><tr><th class="px-4 py-4 text-xs font-medium text-gray-500">Şirket</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Kısa Ad</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Grup</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Marka Sayısı</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Oluşturulma Tarihi</th><th class="px-4 py-4 text-right text-xs font-medium text-gray-500">İşlemler</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><tr v-for="company in paginatedCompanies" :key="company.id" class="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"><td class="px-4 py-4"><button type="button" class="flex min-w-[220px] items-center gap-3 text-left" @click="goToCompany(company.id)"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-500">{{ companyInitials(company.name) }}</span><span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ company.name }}</span></button></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ company.shortName }}</td><td class="px-4 py-4"><span class="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500">{{ company.group }}</span></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ company.brandCount }}</td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="company.status === 'active' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'"><span class="h-1.5 w-1.5 rounded-full" :class="company.status === 'active' ? 'bg-success-500' : 'bg-gray-400'" />{{ company.status === 'active' ? 'Aktif' : 'Pasif' }}</span></td><td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{{ company.createdAt }}</td><td class="px-4 py-4"><div class="flex items-center justify-end gap-2"><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" @click="goToCompany(company.id)"><Eye :size="17" /></button><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" aria-label="Şirket işlemleri"><EllipsisVertical :size="17" /></button></div></td></tr></tbody></table></div>
        <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800"><span class="text-sm text-gray-500">Toplam {{ filteredCompanies.length }} kayıt</span><div class="flex items-center justify-center gap-1"><button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="16" /></button><button v-for="page in visiblePages" :key="page" type="button" class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium" :class="page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100'" @click="currentPage = page">{{ page }}</button><button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="16" /></button></div><select v-model.number="perPage" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select></div>
      </section>
    </div>
  </div>
</template>
