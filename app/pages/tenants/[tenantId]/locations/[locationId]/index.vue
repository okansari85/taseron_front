<script setup lang="ts">
import { Building2, CalendarDays, Check, ChevronDown, EllipsisVertical, Mail, MapPin, Pencil, Plus, Search, ShieldCheck, UserRound, Users, X } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

type Company = {
  id: number
  name: string
  logo: string
  operationalArea: string
  nace: string
  dangerClass: string
  sgk: string
  status: 'active' | 'passive'
}

type Contractor = {
  id: number
  name: string
  type: 'Daimi' | 'Geçici'
  company: string
  sgk: string
  status: 'active' | 'passive'
}

type OperationalArea = {
  id: number
  name: string
  description: string
  status: 'active' | 'passive'
}

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const locationId = computed(() => Number(route.params.locationId ?? 1))
const { setScope } = useOrganizationScope()

const location = computed(() => ({
  id: locationId.value,
  name: 'Beylikdüzü Kampüsü',
  city: 'İstanbul',
  district: 'Beylikdüzü',
  address: 'Şifa Mahallesi 34950, Tudaş Caddesi No:2-6, Beylikdüzü / İstanbul',
  organization: 'Arçelik A.Ş.',
  phone: '0212 123 45 67',
  email: 'beylikduzu@arcelik.com.tr',
  createdAt: '15.03.2024',
  updatedAt: '21.05.2025',
  image: 'https://static.daktilo.com/sites/302/uploads/2022/01/20/arcelik-fabrika.jpg',
  status: 'active' as const,
}))

const activeTab = ref<'companies' | 'contractors' | 'areas'>('companies')
const search = ref('')
const showCompanyModal = ref(false)
const selectedCompany = ref('')
const selectedArea = ref('Üretim Alanı')
const nace = ref('')
const dangerClass = ref('')
const sgk = ref('')

const companies = ref<Company[]>([
  { id: 1, name: 'Arçelik A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg', operationalArea: 'Üretim Alanı', nace: '27.51.01', dangerClass: 'Çok Tehlikeli', sgk: '1234567890', status: 'active' },
  { id: 2, name: 'Arçelik Pazarlama A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg', operationalArea: 'İdari Alan', nace: '46.43.02', dangerClass: 'Az Tehlikeli', sgk: '9876543210', status: 'active' },
  { id: 3, name: 'Beko Elektronik A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg', operationalArea: 'Üretim Alanı', nace: '27.51.02', dangerClass: 'Çok Tehlikeli', sgk: '1122334455', status: 'active' },
])

const contractors = ref<Contractor[]>([
  { id: 1, name: 'ISS Tesis Yönetim Hizmetleri A.Ş.', type: 'Daimi', company: 'Arçelik A.Ş.', sgk: '481210101103597601140113000', status: 'active' },
  { id: 2, name: 'Tepe Savunma ve Güvenlik Sistemleri A.Ş.', type: 'Daimi', company: 'Arçelik A.Ş.', sgk: '48001010110479600140166000', status: 'active' },
  { id: 3, name: 'ABC Teknik Hizmetler Ltd. Şti.', type: 'Geçici', company: 'Beko Elektronik A.Ş.', sgk: '—', status: 'active' },
])

const areas = ref<OperationalArea[]>([
  { id: 1, name: 'Üretim Alanı', description: 'Ana üretim faaliyetlerinin yürütüldüğü alan.', status: 'active' },
  { id: 2, name: 'Bakım Alanı', description: 'Bakım ve teknik faaliyetlerin yürütüldüğü alan.', status: 'active' },
  { id: 3, name: 'İdari Alan', description: 'Ofis ve idari faaliyetlerin yürütüldüğü alan.', status: 'active' },
])

const filteredCompanies = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return companies.value.filter(item => !term || `${item.name} ${item.operationalArea} ${item.nace} ${item.sgk}`.toLocaleLowerCase('tr-TR').includes(term))
})
const filteredContractors = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return contractors.value.filter(item => !term || `${item.name} ${item.type} ${item.company}`.toLocaleLowerCase('tr-TR').includes(term))
})
const filteredAreas = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  return areas.value.filter(item => !term || `${item.name} ${item.description}`.toLocaleLowerCase('tr-TR').includes(term))
})

onMounted(() => {
  setScope('location', {
    id: location.value.id,
    name: location.value.name,
    description: 'Tesis',
    icon: undefined,
  })
})

const openCompanyModal = () => {
  selectedCompany.value = ''
  selectedArea.value = areas.value[0]?.name || ''
  nace.value = ''
  dangerClass.value = ''
  sgk.value = ''
  showCompanyModal.value = true
}

const addCompany = () => {
  const company = companyOptions.find(item => item.name === selectedCompany.value)
  if (!company || !selectedArea.value || !nace.value || !dangerClass.value || !sgk.value) return
  companies.value.push({
    id: Date.now(),
    name: company.name,
    logo: company.logo,
    operationalArea: selectedArea.value,
    nace: nace.value,
    dangerClass: dangerClass.value,
    sgk: sgk.value,
    status: 'active',
  })
  showCompanyModal.value = false
}

const companyOptions = [
  { name: 'Arçelik A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg' },
  { name: 'Arçelik Pazarlama A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg' },
  { name: 'Beko Elektronik A.Ş.', logo: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg' },
]
</script>

<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <!-- Existing global header/breadcrumb/context is intentionally provided by the default layout. -->
    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid lg:grid-cols-[300px_minmax(0,1fr)_300px]">
        <div class="h-[210px] overflow-hidden border-b border-gray-100 lg:h-[220px] lg:border-b-0 lg:border-r dark:border-gray-800">
          <img :src="location.image" :alt="location.name" class="h-full w-full object-cover" />
        </div>
        <div class="min-w-0 p-5 lg:p-6">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-xl font-semibold tracking-tight text-gray-900 dark:text-white/90">{{ location.name }}</h1>
            <span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400"><span class="h-1.5 w-1.5 rounded-full bg-success-500" />Aktif</span>
          </div>
          <div class="mt-5 grid gap-3 text-sm text-gray-600 sm:grid-cols-2 dark:text-gray-300">
            <div class="flex items-start gap-2.5"><MapPin :size="16" class="mt-0.5 shrink-0 text-brand-500" /><span>{{ location.district }} / {{ location.city }}</span></div>
            <div class="flex items-start gap-2.5"><Building2 :size="16" class="mt-0.5 shrink-0 text-brand-500" /><span>Organizasyon: {{ location.organization }}</span></div>
            <div class="flex items-start gap-2.5"><CalendarDays :size="16" class="mt-0.5 shrink-0 text-brand-500" /><span>Oluşturulma: {{ location.createdAt }}</span></div>
            <div class="flex items-start gap-2.5"><CalendarDays :size="16" class="mt-0.5 shrink-0 text-brand-500" /><span>Son güncelleme: {{ location.updatedAt }}</span></div>
          </div>
        </div>
        <div class="border-t border-gray-100 p-5 lg:border-l lg:border-t-0 lg:p-6 dark:border-gray-800">
          <div class="flex items-center justify-between gap-3">
            <div><p class="text-xs font-semibold text-gray-800 dark:text-gray-200">Adres</p><p class="mt-1.5 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ location.address }}</p></div>
          </div>
          <div class="mt-4 space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
            <p><span class="font-semibold text-gray-800 dark:text-gray-200">Telefon</span> <span class="ml-2">{{ location.phone }}</span></p>
            <p class="break-all"><span class="font-semibold text-gray-800 dark:text-gray-200">E-posta</span> <span class="ml-2">{{ location.email }}</span></p>
          </div>
          <div class="mt-4 h-20 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-700 dark:bg-gray-900">
            <div class="flex h-full items-center justify-center bg-[radial-gradient(circle_at_60%_45%,rgba(99,102,241,.18),transparent_30%),linear-gradient(135deg,#eef2ff,#f8fafc)] dark:bg-[radial-gradient(circle_at_60%_45%,rgba(99,102,241,.22),transparent_30%),linear-gradient(135deg,#111827,#0f172a)]"><MapPin :size="22" class="text-brand-500" /></div>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
        <button type="button" class="inline-flex h-9 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06]"><Pencil :size="14" /> Düzenle</button>
        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.06]"><EllipsisVertical :size="16" /></button>
      </div>
    </section>

    <section class="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="flex overflow-x-auto border-b border-gray-200 px-2 dark:border-gray-800">
        <button v-for="tab in [{ key: 'companies', label: 'Firmalar' }, { key: 'contractors', label: 'Taşeronlar' }, { key: 'areas', label: 'Operasyonel Alanlar' }]" :key="tab.key" type="button" class="whitespace-nowrap border-b-2 px-5 py-3.5 text-sm font-semibold transition" :class="activeTab === tab.key ? 'border-brand-500 text-brand-500' : 'border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'" @click="activeTab = tab.key as typeof activeTab">
          {{ tab.label }}
        </button>
      </div>

      <div class="p-4 md:p-5">
        <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div class="relative w-full sm:max-w-xs">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" :placeholder="activeTab === 'companies' ? 'Firma ara...' : activeTab === 'contractors' ? 'Taşeron ara...' : 'Alan ara...'" class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
          <button v-if="activeTab === 'companies'" type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600" @click="openCompanyModal"><Plus :size="16" /> Firma Ekle</button>
          <button v-else-if="activeTab === 'contractors'" type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600"><Plus :size="16" /> Alt Yüklenici Ekle</button>
          <button v-else type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600"><Plus :size="16" /> Operasyonel Alan Ekle</button>
        </div>

        <div v-if="activeTab === 'companies'" class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="min-w-[950px] w-full text-left">
            <thead class="bg-gray-50 dark:bg-white/[0.03]"><tr class="border-b border-gray-200 dark:border-gray-800"><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Firma</th><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Operasyonel Alan</th><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">NACE Kodu</th><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Tehlike Sınıfı</th><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">SGK Sicil No</th><th class="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Durum</th><th class="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400">İşlemler</th></tr></thead>
            <tbody><tr v-for="company in filteredCompanies" :key="company.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800/70"><td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-1.5 dark:border-gray-700"><img :src="company.logo" :alt="company.name" class="h-full w-full object-contain" /></div><span class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ company.name }}</span></div></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ company.operationalArea }}</td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ company.nace }}</td><td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="company.dangerClass === 'Çok Tehlikeli' ? 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400' : company.dangerClass === 'Tehlikeli' ? 'bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400' : 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400'">{{ company.dangerClass }}</span></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ company.sgk }}</td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400"><span class="h-1.5 w-1.5 rounded-full bg-success-500" />Aktif</span></td><td class="px-4 py-4 text-right"><button type="button" class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.06]"><UserRound :size="14" /> Uzman Ata</button></td></tr></tbody>
          </table>
          <div v-if="filteredCompanies.length === 0" class="px-4 py-10 text-center text-sm text-gray-500">Kayıt bulunamadı.</div>
        </div>

        <div v-else-if="activeTab === 'contractors'" class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="min-w-[850px] w-full text-left"><thead class="bg-gray-50 dark:bg-white/[0.03]"><tr class="border-b border-gray-200 dark:border-gray-800"><th class="px-4 py-3 text-xs font-semibold text-gray-500">Alt Yüklenici</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">Tür</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">Bağlı Firma</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">SGK Sicil No</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">Durum</th><th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">İşlemler</th></tr></thead><tbody><tr v-for="item in filteredContractors" :key="item.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800/70"><td class="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{{ item.name }}</td><td class="px-4 py-4"><span class="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{{ item.type }}</span></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ item.company }}</td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ item.sgk }}</td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400"><span class="h-1.5 w-1.5 rounded-full bg-success-500" />Aktif</span></td><td class="px-4 py-4 text-right"><button type="button" class="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"><EllipsisVertical :size="15" class="mx-auto" /></button></td></tr></tbody></table>
        </div>

        <div v-else class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
          <table class="min-w-[760px] w-full text-left"><thead class="bg-gray-50 dark:bg-white/[0.03]"><tr class="border-b border-gray-200 dark:border-gray-800"><th class="px-4 py-3 text-xs font-semibold text-gray-500">Operasyonel Alan</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">Açıklama</th><th class="px-4 py-3 text-xs font-semibold text-gray-500">Durum</th><th class="px-4 py-3 text-right text-xs font-semibold text-gray-500">İşlemler</th></tr></thead><tbody><tr v-for="item in filteredAreas" :key="item.id" class="border-b border-gray-100 last:border-0 dark:border-gray-800/70"><td class="px-4 py-4 text-sm font-semibold text-gray-800 dark:text-gray-200">{{ item.name }}</td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">{{ item.description }}</td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[11px] font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400"><span class="h-1.5 w-1.5 rounded-full bg-success-500" />Aktif</span></td><td class="px-4 py-4 text-right"><button type="button" class="h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700"><EllipsisVertical :size="15" class="mx-auto" /></button></td></tr></tbody></table>
        </div>

        <div class="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400"><span>Toplam {{ activeTab === 'companies' ? filteredCompanies.length : activeTab === 'contractors' ? filteredContractors.length : filteredAreas.length }} kayıt</span><div class="flex items-center gap-1"><button class="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700">‹</button><button class="h-8 w-8 rounded-lg bg-brand-500 font-semibold text-white">1</button><button class="h-8 w-8 rounded-lg border border-gray-200 dark:border-gray-700">›</button></div></div>
      </div>
    </section>

    <div v-if="showCompanyModal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[2px]">
      <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800"><div><h2 class="text-base font-semibold text-gray-900 dark:text-white/90">Firma Ekle</h2><p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Firmayı bu lokasyon ve operasyonel alan ile ilişkilendirin.</p></div><button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" @click="showCompanyModal = false"><X :size="18" /></button></div>
        <div class="grid gap-4 p-5 sm:grid-cols-2">
          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Firma</span><div class="relative"><select v-model="selectedCompany" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Firma seçiniz</option><option v-for="item in companyOptions" :key="item.name" :value="item.name">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Operasyonel Alan</span><div class="relative"><select v-model="selectedArea" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option v-for="item in areas" :key="item.id" :value="item.name">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">SGK Sicil No</span><input v-model="sgk" type="text" placeholder="SGK sicil numarası" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" /></label>
          <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">NACE Kodu</span><input v-model="nace" type="text" placeholder="Örn. 27.51.01" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" /></label>
          <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tehlike Sınıfı</span><div class="relative"><select v-model="dangerClass" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tehlike sınıfı seçiniz</option><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        </div>
        <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800"><button type="button" class="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="showCompanyModal = false">Vazgeç</button><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600" :class="(!selectedCompany || !selectedArea || !nace || !dangerClass || !sgk) && 'cursor-not-allowed opacity-50'" :disabled="!selectedCompany || !selectedArea || !nace || !dangerClass || !sgk" @click="addCompany"><Check :size="15" /> Kaydet</button></div>
      </div>
    </div>
  </div>
</template>
