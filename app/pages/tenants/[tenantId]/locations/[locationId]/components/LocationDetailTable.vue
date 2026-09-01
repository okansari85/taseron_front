<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Filter, Search, UserRound } from "lucide-vue-next";
import type { Company, Contractor, OperationalArea } from "~/data/location-detail.mock";

type Tab = "companies" | "contractors" | "areas";
const props = defineProps<{
  activeTab: Tab;
  companies: Company[];
  contractors: Contractor[];
  areas: OperationalArea[];
}>();

const emit = defineEmits<{
  (e: "add-company"): void;
  (e: "add-contractor"): void;
  (e: "add-area"): void;
}>();

const search = ref("");
const statusFilter = ref<"all" | "active" | "passive">("all");
const currentPage = ref(1);
const perPage = ref(10);

const filteredItems = computed(() => {
  const t = search.value.trim().toLocaleLowerCase("tr-TR");
  const source = props.activeTab === "companies" ? props.companies : props.activeTab === "contractors" ? props.contractors : props.areas;
  return source.filter((x: any) => {
    const text = props.activeTab === "companies"
      ? `${x.name} ${x.operationalArea} ${x.nace} ${x.dangerClass} ${x.sgk}`
      : props.activeTab === "contractors"
        ? `${x.name} ${x.activity} ${x.subActivity} ${x.nace} ${x.dangerClass} ${x.sgk} ${x.contractorType}`
        : `${x.name} ${x.description}`;
    return (!t || text.toLocaleLowerCase("tr-TR").includes(t)) && (statusFilter.value === "all" || x.status === statusFilter.value);
  });
});
const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / perPage.value)));
const paginatedItems = computed(() => filteredItems.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value));
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, i) => Math.min(Math.max(1, currentPage.value - 2) + i, totalPages.value)).filter((p, i, a) => a.indexOf(p) === i));
watch([search, statusFilter, perPage, () => props.activeTab], () => currentPage.value = 1);
const resetFilters = () => { search.value = ""; statusFilter.value = "all"; };
</script>

<template>
  <div class="mb-4 flex items-center justify-end">
    <button v-if="activeTab === 'companies'" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="emit('add-company')"><Plus :size="16" /> Firma Ekle</button>
    <button v-else-if="activeTab === 'contractors'" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="emit('add-contractor')"><Plus :size="16" /> Alt Yüklenici Ekle</button>
    <button v-else class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="emit('add-area')"><Plus :size="16" /> Operasyonel Alan Ekle</button>
  </div>

  <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs">
    <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.2fr)_1fr_auto] md:items-center">
      <div class="relative"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="search" type="search" :placeholder="activeTab === 'companies' ? 'Firma ara...' : activeTab === 'contractors' ? 'Alt yüklenici ara...' : 'Operasyonel alan ara...'" class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none" /></div>
      <div class="relative"><select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm"><option value="all">Tümü</option><option value="active">Aktif</option><option value="passive">Pasif</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div>
      <button class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600" @click="resetFilters"><Filter :size="15" />Filtreleri Temizle</button>
    </div>
  </section>

  <section class="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
    <div class="overflow-x-auto">
      <table v-if="activeTab === 'companies'" class="w-full min-w-[980px] text-left">
        <thead class="border-b border-gray-100 bg-gray-50/70"><tr><th v-for="h in ['Firma','Operasyonel Alan','NACE Kodu','Tehlike Sınıfı','SGK Sicil No','Durum','İşlemler']" :key="h" class="px-4 py-4 text-xs font-medium text-gray-500">{{ h }}</th></tr></thead>
        <tbody class="divide-y divide-gray-100"><tr v-for="company in paginatedItems as Company[]" :key="company.id"><td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-1.5"><img :src="company.logo" :alt="company.name" class="h-full w-full object-contain" /></div><span class="text-sm font-semibold text-gray-800">{{ company.name }}</span></div></td><td class="px-4 py-4 text-sm text-gray-500">{{ company.operationalArea || "—" }}</td><td class="px-4 py-4 text-sm text-gray-500">{{ company.nace }}</td><td class="px-4 py-4"><DangerClassBadge :danger-class="company.dangerClass" /></td><td class="px-4 py-4 text-sm text-gray-500">{{ company.sgk }}</td><td class="px-4 py-4 text-sm text-success-600">Aktif</td><td class="px-4 py-4 text-right"><button class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"><UserRound :size="14" /> Uzman Ata</button></td></tr></tbody>
      </table>
      <table v-else-if="activeTab === 'contractors'" class="w-full min-w-[1080px] text-left">
        <thead class="border-b border-gray-100 bg-gray-50/70"><tr><th v-for="h in ['Firma','Faaliyet / Alt Faaliyet','NACE Kodu','Tehlike Sınıfı','SGK Sicil No','Taşeron Tipi','Durum','İşlemler']" :key="h" class="px-4 py-4 text-xs font-medium text-gray-500">{{ h }}</th></tr></thead>
        <tbody class="divide-y divide-gray-100"><tr v-for="company in paginatedItems as Contractor[]" :key="company.id"><td class="px-4 py-4 text-sm font-semibold text-gray-800">{{ company.name }}</td><td class="px-4 py-4 text-sm text-gray-500"><span class="font-medium text-gray-700">{{ company.activity }}</span> / {{ company.subActivity }}</td><td class="px-4 py-4 text-sm text-gray-500">{{ company.nace }}</td><td class="px-4 py-4"><DangerClassBadge :danger-class="company.dangerClass" /></td><td class="px-4 py-4 text-sm text-gray-500">{{ company.sgk }}</td><td class="px-4 py-4 text-sm text-gray-600">{{ company.contractorType }}</td><td class="px-4 py-4 text-sm text-success-600">Aktif</td><td class="px-4 py-4 text-right"><button class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"><UserRound :size="14" /> Uzman Ata</button></td></tr></tbody>
      </table>
      <table v-else class="w-full min-w-[760px] text-left">
        <thead class="border-b border-gray-100 bg-gray-50/70"><tr><th v-for="h in ['Operasyonel Alan','Açıklama','Durum','İşlemler']" :key="h" class="px-4 py-4 text-xs font-medium text-gray-500">{{ h }}</th></tr></thead>
        <tbody class="divide-y divide-gray-100"><tr v-for="item in paginatedItems as OperationalArea[]" :key="item.id"><td class="px-4 py-4 text-sm font-semibold text-gray-800">{{ item.name }}</td><td class="px-4 py-4 text-sm text-gray-500">{{ item.description }}</td><td class="px-4 py-4 text-sm text-success-600">Aktif</td><td class="px-4 py-4 text-right"><button class="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200"><EllipsisVertical :size="15" /></button></td></tr></tbody>
      </table>
      <div v-if="!filteredItems.length" class="px-4 py-12 text-center text-sm text-gray-500">Kayıt bulunamadı.</div>
    </div>
    <div class="flex w-full flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><span class="text-sm text-gray-500">Toplam {{ filteredItems.length }} kayıt</span><div class="flex items-center gap-1"><button class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40" :disabled="currentPage === 1" @click="currentPage--"><ChevronLeft :size="16" /></button><button v-for="page in visiblePages" :key="page" class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium" :class="page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-600'" @click="currentPage = page">{{ page }}</button><button class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40" :disabled="currentPage === totalPages" @click="currentPage++"><ChevronRight :size="16" /></button></div><select v-model.number="perPage" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select></div>
  </section>
</template>
