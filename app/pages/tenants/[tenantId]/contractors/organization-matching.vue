<script setup lang="ts">
import { Building2, Search, ArrowRight } from 'lucide-vue-next'
import OrganizationTabs from '~/components/organization/OrganizationTabs.vue'

definePageMeta({ layout: 'default' })

const contractorTabs = [
  { label: 'Alt Yüklenici Havuzu', path: '', exact: true },
  { label: 'Alt Yüklenici Organizasyon Eşleştirmesi', path: 'organization-matching' },
]

const contractorSearch = ref('')
const organizationSearch = ref('')
const selectedContractors = ref<number[]>([])
const selectedOrganization = ref(2)

const contractors = [
  { id: 1, name: 'ISS Tesis Yönetim Hizmetleri A.Ş.', shortName: 'ISS', type: 'Daimi', assigned: true },
  { id: 2, name: 'Tepe Savunma ve Güvenlik Sistemleri A.Ş.', shortName: 'Tepe', type: 'Daimi', assigned: true },
  { id: 3, name: 'Sofra Yemek Üretim ve Hizmet A.Ş.', shortName: 'Sofra', type: 'Daimi', assigned: false },
  { id: 4, name: 'Bantaş Temizlik Hizmetleri Ltd. Şti.', shortName: 'Bantaş', type: 'Geçici', assigned: false },
  { id: 5, name: 'ABC Teknik Bakım Hizmetleri Ltd. Şti.', shortName: 'ABC Teknik', type: 'Geçici', assigned: true },
  { id: 6, name: 'Protek Güvenlik Hizmetleri A.Ş.', shortName: 'Protek', type: 'Daimi', assigned: false },
  { id: 7, name: 'CleanPro Endüstriyel Temizlik A.Ş.', shortName: 'CleanPro', type: 'Geçici', assigned: false },
  { id: 8, name: 'Güven Plus Özel Güvenlik Ltd. Şti.', shortName: 'Güven Plus', type: 'Daimi', assigned: true },
  { id: 9, name: 'Lezzet Catering Hizmetleri A.Ş.', shortName: 'Lezzet', type: 'Geçici', assigned: false },
  { id: 10, name: 'TeknikServis Bakım ve Onarım A.Ş.', shortName: 'TeknikServis', type: 'Daimi', assigned: false },
]

const organizations = [
  { id: 1, name: 'Koç Holding', type: 'Holding', parent: '' },
  { id: 2, name: 'Dayanıklı Tüketim Grubu', type: 'Grup', parent: 'Koç Holding' },
  { id: 3, name: 'Otomotiv Grubu', type: 'Grup', parent: 'Koç Holding' },
  { id: 4, name: 'Enerji Grubu', type: 'Grup', parent: 'Koç Holding' },
  { id: 5, name: 'Turizm Grubu', type: 'Grup', parent: 'Koç Holding' },
]

const filteredContractors = computed(() => {
  const term = contractorSearch.value.trim().toLocaleLowerCase('tr-TR')
  return contractors.filter(item => !term || `${item.name} ${item.shortName} ${item.type}`.toLocaleLowerCase('tr-TR').includes(term))
})
const filteredOrganizations = computed(() => {
  const term = organizationSearch.value.trim().toLocaleLowerCase('tr-TR')
  return organizations.filter(item => !term || `${item.name} ${item.type}`.toLocaleLowerCase('tr-TR').includes(term))
})
const toggleContractor = (id:number) => {
  selectedContractors.value = selectedContractors.value.includes(id) ? selectedContractors.value.filter(item => item !== id) : [...selectedContractors.value, id]
}
const selectAll = () => { selectedContractors.value = filteredContractors.value.map(item => item.id) }
const clearSelection = () => { selectedContractors.value = [] }
</script>

<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <div class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Alt Yüklenici Organizasyon Eşleştirmesi</h1>
      <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Alt yüklenicileri organizasyon düğümleriyle merkezi olarak eşleştirin.</p>
    </div>

    <OrganizationTabs :tabs="contractorTabs" base-path="contractors" />

    <section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        <div class="border-b border-gray-200 p-5 dark:border-gray-800 lg:border-b-0 lg:border-r">
          <div class="mb-4 flex items-center justify-between gap-3"><div><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Alt Yükleniciler</h2><p class="mt-1 text-xs text-gray-500">{{ selectedContractors.length }} kayıt seçildi</p></div><div class="flex gap-2"><button type="button" class="text-xs font-medium text-brand-500" @click="selectAll">Tümünü seç</button><button type="button" class="text-xs font-medium text-gray-500" @click="clearSelection">Temizle</button></div></div>
          <div class="relative mb-3"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="contractorSearch" type="search" placeholder="Alt yüklenici ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900" /></div>
          <div class="max-h-[520px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800"><button v-for="item in filteredContractors" :key="item.id" type="button" class="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]" @click="toggleContractor(item.id)"><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs" :class="selectedContractors.includes(item.id) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-transparent dark:border-gray-600'">✓</span><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10">{{ item.shortName.slice(0,2).toUpperCase() }}</span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.name }}</span><span class="mt-0.5 block text-xs text-gray-500">{{ item.shortName }} · {{ item.type }}</span></span><span v-if="item.assigned" class="rounded-full bg-success-50 px-2 py-1 text-[10px] font-semibold text-success-600">Eşleşmiş</span></button></div>
        </div>
        <div class="p-5"><div class="mb-4"><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Organizasyon</h2><p class="mt-1 text-xs text-gray-500">Seçilen alt yüklenicilerin atanacağı düğümü seçin.</p></div><div class="relative mb-3"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="organizationSearch" type="search" placeholder="Organizasyon ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900" /></div><div class="space-y-2"><button v-for="item in filteredOrganizations" :key="item.id" type="button" class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition" :class="selectedOrganization === item.id ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'" @click="selectedOrganization = item.id"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800"><Building2 :size="16" /></span><span class="min-w-0 flex-1"><span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ item.name }}</span><span class="mt-0.5 block text-xs text-gray-500">{{ item.parent ? `${item.parent} · ` : '' }}{{ item.type }}</span></span><span v-if="selectedOrganization === item.id" class="h-2 w-2 rounded-full bg-brand-500" /></button></div><div class="mt-5 rounded-lg bg-gray-50 p-4 dark:bg-white/[0.03]"><div class="flex items-center justify-between text-xs text-gray-500"><span>{{ selectedContractors.length }} alt yüklenici</span><ArrowRight :size="15" /><span class="font-medium text-gray-700 dark:text-gray-300">{{ organizations.find(item => item.id === selectedOrganization)?.name }}</span></div></div><button type="button" class="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600" :disabled="selectedContractors.length === 0"><ArrowRight :size="16" /> Seçilenleri Eşleştir</button></div>
      </div>
    </section>
  </div>
</template>
