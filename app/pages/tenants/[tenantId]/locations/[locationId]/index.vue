<script setup lang="ts">
import { MapPin, Pencil, EllipsisVertical, Plus } from "lucide-vue-next";
import { locationApi, type LocationApiItem } from "~/api/location";
import CompanyCreateModal from "./components/CompanyCreateModal.vue";
import ContractorCreateModal from "./components/ContractorCreateModal.vue";
import OperationalAreaCreateModal from "./components/OperationalAreaCreateModal.vue";
import LocationCompaniesTab from "./components/LocationCompaniesTab.vue";
import LocationContractorsTab from "./components/LocationContractorsTab.vue";
import LocationOperationalAreasTab from "./components/LocationOperationalAreasTab.vue";
import {
  companies as mockCompanies,
  contractors as mockContractors,
  areas as mockAreas,
  groupOptions,
  companyOptions,
  permanentContractorOptions,
  type DangerClass,
  type Company,
  type Contractor,
  type OperationalArea,
} from "~/data/location-detail.mock";

definePageMeta({ layout: "default" });
const route = useRoute();
const locationId = computed(() => Number(route.params.locationId ?? 1));
const { setScope } = useOrganizationScope();
const location = ref<LocationApiItem | null>(null);
const locationLoading = ref(true);
const locationError = ref("");
const locationView = computed(() => ({
  id: locationId.value,
  name: location.value?.name ?? "",
  city: location.value?.city?.name ?? "",
  district: location.value?.district?.name ?? "",
  address: location.value?.address ?? "",
  image: location.value?.image ? new URL(`/storage${location.value.image.startsWith("/") ? "" : "/"}${location.value.image}`, useRuntimeConfig().public.apiBaseUrl).toString() : "",
  status: location.value?.is_active === false ? ("passive" as const) : ("active" as const),
}));
const loadLocation = async () => {
  locationLoading.value = true;
  locationError.value = "";
  try { location.value = await locationApi.get("", locationId.value); }
  catch (error) { locationError.value = error instanceof Error ? error.message : "Lokasyon bilgileri alınamadı."; }
  finally { locationLoading.value = false; }
};
const activeTab = ref<"companies" | "contractors" | "areas">("companies");
const locationTabs = [
  { label: "Firmalar", key: "companies" },
  { label: "Alt Yükleniciler", key: "contractors" },
  { label: "Operasyonel Alanlar", key: "areas" },
];
const search = ref("");
const statusFilter = ref<"all" | "active" | "passive">("all");
const currentPage = ref(1);
const perPage = ref(10);
const showCompanyModal = ref(false), showContractorModal = ref(false), showAreaModal = ref(false);
const companies = ref<Company[]>(mockCompanies);
const contractors = ref<Contractor[]>(mockContractors);
const areas = ref<OperationalArea[]>(mockAreas);
const filteredCompanies = computed(() => { const t=search.value.trim().toLocaleLowerCase("tr-TR"); return companies.value.filter(x=>(!t||`${x.name} ${x.operationalArea} ${x.nace} ${x.dangerClass} ${x.sgk}`.toLocaleLowerCase("tr-TR").includes(t))&&(statusFilter.value==="all"||x.status===statusFilter.value)); });
const filteredContractors = computed(() => { const t=search.value.trim().toLocaleLowerCase("tr-TR"); return contractors.value.filter(x=>(!t||`${x.name} ${x.activity} ${x.subActivity} ${x.nace} ${x.dangerClass} ${x.sgk} ${x.contractorType}`.toLocaleLowerCase("tr-TR").includes(t))&&(statusFilter.value==="all"||x.status===statusFilter.value)); });
const filteredAreas = computed(() => { const t=search.value.trim().toLocaleLowerCase("tr-TR"); return areas.value.filter(x=>(!t||`${x.name} ${x.description}`.toLocaleLowerCase("tr-TR").includes(t))&&(statusFilter.value==="all"||x.status===statusFilter.value)); });
const filteredItems = computed(() => activeTab.value === "companies" ? filteredCompanies.value : activeTab.value === "contractors" ? filteredContractors.value : filteredAreas.value);
const totalPages = computed(() => Math.max(1, Math.ceil(filteredItems.value.length / perPage.value)));
const paginatedCompanies = computed(() => filteredCompanies.value.slice((currentPage.value-1)*perPage.value,currentPage.value*perPage.value));
const paginatedContractors = computed(() => filteredContractors.value.slice((currentPage.value-1)*perPage.value,currentPage.value*perPage.value));
const paginatedAreas = computed(() => filteredAreas.value.slice((currentPage.value-1)*perPage.value,currentPage.value*perPage.value));
const visiblePages = computed(() => Array.from({length:Math.min(5,totalPages.value)},(_,i)=>Math.min(Math.max(1,currentPage.value-2)+i,totalPages.value)).filter((p,i,a)=>a.indexOf(p)===i));
watch([search,statusFilter,perPage,activeTab],()=>currentPage.value=1);
const resetFilters=()=>{search.value="";statusFilter.value="all";};
const addCompany=(p:{company:string;area:string;nace:string;dangerClass:DangerClass;sgk:string})=>{const c=companyOptions.find(x=>x.name===p.company);if(!c)return;companies.value.push({id:Date.now(),name:c.name,logo:c.logo,operationalArea:p.area,nace:p.nace,dangerClass:p.dangerClass,sgk:p.sgk,status:"active"});showCompanyModal.value=false;};
const addContractor=(p:{contractor:string;area:string;activity:string;subActivity:string;nace:string;dangerClass:DangerClass;sgk:string})=>{const c=permanentContractorOptions.find(x=>x.name===p.contractor);if(!c)return;contractors.value.push({id:Date.now(),name:c.name,logo:c.logo,operationalArea:p.area,activity:p.activity,subActivity:p.subActivity,nace:p.nace,dangerClass:p.dangerClass,sgk:p.sgk,status:"active",contractorType:"Daimi"});showContractorModal.value=false;};
const addArea=(name:string)=>{areas.value.push({id:Date.now(),name,description:"",status:"active"});showAreaModal.value=false;};
onMounted(async()=>{await loadLocation();if(location.value)setScope("location",{id:location.value.id,name:location.value.name,description:"Tesis",icon:undefined});});
</script>

<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <LocationDetailCard :location="locationView" />
    <div v-if="locationError" class="mt-3 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ locationError }}</div>
    <OrganizationTabs v-model="activeTab" :tabs="locationTabs" />
    <div class="mb-4 flex items-center justify-end">
      <button v-if="activeTab==='companies'" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="showCompanyModal=true"><Plus :size="16" /> Firma Ekle</button>
      <button v-else-if="activeTab==='contractors'" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="showContractorModal=true"><Plus :size="16" /> Alt Yüklenici Ekle</button>
      <button v-else class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="showAreaModal=true"><Plus :size="16" /> Operasyonel Alan Ekle</button>
    </div>
    <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.2fr)_1fr_auto] md:items-center">
        <div class="relative"><input v-model="search" type="search" :placeholder="activeTab==='companies'?'Firma ara...':activeTab==='contractors'?'Alt yüklenici ara...':'Operasyonel alan ara...'" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none" /></div>
        <div class="relative"><select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm"><option value="all">Tümü</option><option value="active">Aktif</option><option value="passive">Pasif</option></select></div>
        <button class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600" @click="resetFilters">Filtreleri Temizle</button>
      </div>
    </section>
    <section class="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
      <div class="overflow-x-auto">
        <LocationCompaniesTab v-if="activeTab==='companies'" :companies="paginatedCompanies" />
        <LocationContractorsTab v-else-if="activeTab==='contractors'" :contractors="paginatedContractors" />
        <LocationOperationalAreasTab v-else :location-id="locationId" :search="search" :status-filter="statusFilter" />
        <div v-if="activeTab!=='areas' && !filteredItems.length" class="px-4 py-12 text-center text-sm text-gray-500">Kayıt bulunamadı.</div>
      </div>
      <div v-if="activeTab!=='areas'" class="flex w-full flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><span class="text-sm text-gray-500">Toplam {{ filteredItems.length }} kayıt</span><div class="flex items-center gap-1"><button class="h-9 w-9 rounded-lg border disabled:opacity-40" :disabled="currentPage===1" @click="currentPage--">‹</button><button v-for="page in visiblePages" :key="page" class="h-9 min-w-9 rounded-lg px-2 text-sm" :class="page===currentPage?'bg-brand-500 text-white':'text-gray-600'" @click="currentPage=page">{{page}}</button><button class="h-9 w-9 rounded-lg border disabled:opacity-40" :disabled="currentPage===totalPages" @click="currentPage++">›</button></div><select v-model.number="perPage" class="h-9 rounded-lg border border-gray-200 px-3 text-sm"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select></div>
    </section>
    <CompanyCreateModal v-model="showCompanyModal" :groups="groupOptions" :companies="companyOptions" :areas="areas" @save="addCompany" />
    <ContractorCreateModal v-model="showContractorModal" :contractors="permanentContractorOptions" :areas="areas" @save="addContractor" />
    <OperationalAreaCreateModal v-model="showAreaModal" @save="addArea" />
  </div>
</template>
