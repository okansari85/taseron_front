<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  Filter,
  MapPin,
  Pencil,
  Plus,
  Search,
  UserRound,
} from "lucide-vue-next";
import CompanyCreateModal from "./components/CompanyCreateModal.vue";
import ContractorCreateModal from "./components/ContractorCreateModal.vue";
import OperationalAreaCreateModal from "./components/OperationalAreaCreateModal.vue";

definePageMeta({ layout: "default" });

type DangerClass = "Çok Tehlikeli" | "Tehlikeli" | "Az Tehlikeli";
type Company = {
  id: number;
  name: string;
  logo: string;
  operationalArea: string;
  nace: string;
  dangerClass: DangerClass;
  sgk: string;
  status: "active" | "passive";
};
type Contractor = Company & {
  activity: string;
  subActivity: string;
  contractorType: "Daimi" | "Geçici";
};
type OperationalArea = {
  id: number;
  name: string;
  description: string;
  status: "active" | "passive";
};
type CompanyOption = { name: string; logo: string; group: string };
const route = useRoute();
const locationId = computed(() => Number(route.params.locationId ?? 1));
const { setScope } = useOrganizationScope();
const location = computed(() => ({
  id: locationId.value,
  name: "Beylikdüzü Kampüsü",
  city: "İstanbul",
  district: "Beylikdüzü",
  address: "Şifa Mahallesi 34950, Tudaş Caddesi No:2-6, Beylikdüzü / İstanbul",
  image:
    "https://static.daktilo.com/sites/302/uploads/2022/01/20/arcelik-fabrika.jpg",
  status: "active" as const,
}));
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
const showCompanyModal = ref(false),
  showContractorModal = ref(false),
  showAreaModal = ref(false);
const companies = ref<Company[]>([
  {
    id: 1,
    name: "Arçelik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    operationalArea: "Üretim Alanı",
    nace: "27.51.01",
    dangerClass: "Çok Tehlikeli",
    sgk: "1234567890",
    status: "active",
  },
  {
    id: 2,
    name: "Arçelik Pazarlama A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    operationalArea: "İdari Alan",
    nace: "46.43.02",
    dangerClass: "Az Tehlikeli",
    sgk: "9876543210",
    status: "active",
  },
  {
    id: 3,
    name: "Beko Elektronik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg",
    operationalArea: "Üretim Alanı",
    nace: "27.51.02",
    dangerClass: "Çok Tehlikeli",
    sgk: "1122334455",
    status: "active",
  },
]);
const contractors = ref<Contractor[]>([
  {
    id: 1,
    name: "ISS Tesis Yönetim Hizmetleri A.Ş.",
    logo: "",
    operationalArea: "Temizlik Hizmetleri",
    activity: "Temizlik",
    subActivity: "Genel Temizlik",
    nace: "81.21.01",
    dangerClass: "Az Tehlikeli",
    sgk: "481210101103597601140113000",
    status: "active",
    contractorType: "Daimi",
  },
  {
    id: 2,
    name: "Tepe Savunma ve Güvenlik Sistemleri A.Ş.",
    logo: "",
    operationalArea: "Güvenlik Hizmetleri",
    activity: "Güvenlik",
    subActivity: "Özel Güvenlik",
    nace: "80.10.01",
    dangerClass: "Az Tehlikeli",
    sgk: "48001010110479600140166000",
    status: "active",
    contractorType: "Daimi",
  },
  {
    id: 3,
    name: "ABC Teknik Hizmetler Ltd. Şti.",
    logo: "",
    operationalArea: "Teknik Bakım",
    activity: "Teknik Hizmet",
    subActivity: "Bakım ve Onarım",
    nace: "33.12.01",
    dangerClass: "Çok Tehlikeli",
    sgk: "—",
    status: "active",
    contractorType: "Daimi",
  },
]);
const areas = ref<OperationalArea[]>([
  {
    id: 1,
    name: "Üretim Alanı",
    description: "Ana üretim faaliyetlerinin yürütüldüğü alan.",
    status: "active",
  },
  {
    id: 2,
    name: "Bakım Alanı",
    description: "Bakım ve teknik faaliyetlerin yürütüldüğü alan.",
    status: "active",
  },
  {
    id: 3,
    name: "İdari Alan",
    description: "Ofis ve idari faaliyetlerin yürütüldüğü alan.",
    status: "active",
  },
]);
const groupOptions = ["Arçelik Grubu", "Arçelik Pazarlama Grubu", "Beko Grubu"];
const companyOptions: CompanyOption[] = [
  {
    name: "Arçelik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    group: "Arçelik Grubu",
  },
  {
    name: "Arçelik Pazarlama A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Arcelik_Logo.svg",
    group: "Arçelik Pazarlama Grubu",
  },
  {
    name: "Beko Elektronik A.Ş.",
    logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Beko_logo.svg",
    group: "Beko Grubu",
  },
];
const permanentContractorOptions = [
  { name: "ISS Tesis Yönetim Hizmetleri A.Ş.", logo: "" },
  { name: "Tepe Savunma ve Güvenlik Sistemleri A.Ş.", logo: "" },
  { name: "ABC Teknik Hizmetler Ltd. Şti.", logo: "" },
];
const filteredCompanies = computed(() => {
  const t = search.value.trim().toLocaleLowerCase("tr-TR");
  return companies.value.filter(
    (x) =>
      (!t ||
        `${x.name} ${x.operationalArea} ${x.nace} ${x.dangerClass} ${x.sgk}`
          .toLocaleLowerCase("tr-TR")
          .includes(t)) &&
      (statusFilter.value === "all" || x.status === statusFilter.value),
  );
});
const filteredContractors = computed(() => {
  const t = search.value.trim().toLocaleLowerCase("tr-TR");
  return contractors.value.filter(
    (x) =>
      (!t ||
        `${x.name} ${x.activity} ${x.subActivity} ${x.nace} ${x.dangerClass} ${x.sgk} ${x.contractorType}`
          .toLocaleLowerCase("tr-TR")
          .includes(t)) &&
      (statusFilter.value === "all" || x.status === statusFilter.value),
  );
});
const filteredAreas = computed(() => {
  const t = search.value.trim().toLocaleLowerCase("tr-TR");
  return areas.value.filter(
    (x) =>
      (!t ||
        `${x.name} ${x.description}`.toLocaleLowerCase("tr-TR").includes(t)) &&
      (statusFilter.value === "all" || x.status === statusFilter.value),
  );
});
const filteredItems = computed(() =>
  activeTab.value === "companies"
    ? filteredCompanies.value
    : activeTab.value === "contractors"
      ? filteredContractors.value
      : filteredAreas.value,
);
const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / perPage.value)),
);
const paginatedCompanies = computed(() =>
  filteredCompanies.value.slice(
    (currentPage.value - 1) * perPage.value,
    currentPage.value * perPage.value,
  ),
);
const paginatedContractors = computed(() =>
  filteredContractors.value.slice(
    (currentPage.value - 1) * perPage.value,
    currentPage.value * perPage.value,
  ),
);
const paginatedAreas = computed(() =>
  filteredAreas.value.slice(
    (currentPage.value - 1) * perPage.value,
    currentPage.value * perPage.value,
  ),
);
const visiblePages = computed(() =>
  Array.from({ length: Math.min(5, totalPages.value) }, (_, i) =>
    Math.min(Math.max(1, currentPage.value - 2) + i, totalPages.value),
  ).filter((p, i, a) => a.indexOf(p) === i),
);
watch(
  [search, statusFilter, perPage, activeTab],
  () => (currentPage.value = 1),
);
const resetFilters = () => {
  search.value = "";
  statusFilter.value = "all";
};
const addCompany = (p: {
  company: string;
  area: string;
  nace: string;
  dangerClass: DangerClass;
  sgk: string;
}) => {
  const c = companyOptions.find((x) => x.name === p.company);
  if (!c) return;
  companies.value.push({
    id: Date.now(),
    name: c.name,
    logo: c.logo,
    operationalArea: p.area,
    nace: p.nace,
    dangerClass: p.dangerClass,
    sgk: p.sgk,
    status: "active",
  });
  showCompanyModal.value = false;
};
const addContractor = (p: {
  contractor: string;
  area: string;
  activity: string;
  subActivity: string;
  nace: string;
  dangerClass: DangerClass;
  sgk: string;
}) => {
  const c = permanentContractorOptions.find((x) => x.name === p.contractor);
  if (!c) return;
  contractors.value.push({
    id: Date.now(),
    name: c.name,
    logo: c.logo,
    operationalArea: p.area,
    activity: p.activity,
    subActivity: p.subActivity,
    nace: p.nace,
    dangerClass: p.dangerClass,
    sgk: p.sgk,
    status: "active",
    contractorType: "Daimi",
  });
  showContractorModal.value = false;
};
const addArea = (name: string) => {
  areas.value.push({ id: Date.now(), name, description: "", status: "active" });
  showAreaModal.value = false;
};
onMounted(() =>
  setScope("location", {
    id: location.value.id,
    name: location.value.name,
    description: "Tesis",
    icon: undefined,
  }),
);
</script>

<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <section
      class="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div
        class="grid min-h-[207px] items-stretch lg:grid-cols-[252px_minmax(0,1fr)]"
      >
        <div class="p-3.5 lg:p-4">
          <div
            class="h-[178px] overflow-hidden rounded-[8px] bg-gray-100 dark:bg-gray-900"
          >
            <img
              :src="location.image"
              :alt="location.name"
              class="h-full w-full object-cover"
            />
          </div>
        </div>
        <div class="relative min-w-0 px-4 py-3.5 lg:px-5">
          <div class="absolute right-4 top-3.5 z-10 flex items-center gap-2">
            <button
              class="inline-flex h-9 items-center gap-2 rounded-[7px] bg-brand-500 px-4 text-[11px] font-semibold text-white"
            >
              <Pencil :size="13" /> Düzenle</button
            ><button
              class="flex h-9 w-9 items-center justify-center rounded-[7px] border border-gray-200 text-gray-500"
            >
              <EllipsisVertical :size="15" />
            </button>
          </div>
          <div class="grid h-full grid-cols-[minmax(0,1fr)_288px]">
            <div class="min-w-0 pt-5 pr-6">
              <div class="flex items-center gap-2">
                <h1
                  class="text-[19px] font-semibold leading-6 tracking-tight text-gray-900 dark:text-white/90"
                >
                  {{ location.name }}
                </h1>
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[10px] font-semibold text-success-600"
                  ><span
                    class="h-1.5 w-1.5 rounded-full bg-success-500"
                  />Aktif</span
                >
              </div>
              <div class="mt-7 space-y-5 text-[11px] text-gray-600">
                <div class="flex items-center gap-3">
                  <MapPin :size="15" /><span
                    >{{ location.district }} / {{ location.city }}</span
                  >
                </div>
                <div class="flex items-start gap-3">
                  <MapPin :size="15" class="mt-0.5 shrink-0" /><span
                    class="leading-4 text-gray-500"
                    >{{ location.address }}</span
                  >
                </div>
              </div>
            </div>
            <div class="pt-7">
              <div
                class="h-[96px] overflow-hidden rounded-[7px] border border-gray-200 bg-[#edf2f7]"
              >
                <div
                  class="relative h-full w-full bg-[linear-gradient(135deg,#edf2f7,#f8fafc)]"
                >
                  <div
                    class="absolute left-[52%] top-[48%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500/15"
                  >
                    <MapPin :size="25" class="text-brand-500" />
                  </div>
                </div>
              </div>
              <button
                class="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-[7px] border border-gray-200 bg-white text-[10px] font-semibold text-brand-500"
              >
                <MapPin :size="13" /> Haritada Görüntüle
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    <OrganizationTabs v-model="activeTab" :tabs="locationTabs" />
    <div class="mb-4 flex items-center justify-end">
      <button
        v-if="activeTab === 'companies'"
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white"
        @click="showCompanyModal = true"
      >
        <Plus :size="16" /> Firma Ekle</button
      ><button
        v-else-if="activeTab === 'contractors'"
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white"
        @click="showContractorModal = true"
      >
        <Plus :size="16" /> Alt Yüklenici Ekle</button
      ><button
        v-else
        class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white"
        @click="showAreaModal = true"
      >
        <Plus :size="16" /> Operasyonel Alan Ekle
      </button>
    </div>
    <section
      class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs"
    >
      <div
        class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.2fr)_1fr_auto] md:items-center"
      >
        <div class="relative">
          <Search
            :size="16"
            class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          /><input
            v-model="search"
            type="search"
            :placeholder="
              activeTab === 'companies'
                ? 'Firma ara...'
                : activeTab === 'contractors'
                  ? 'Alt yüklenici ara...'
                  : 'Operasyonel alan ara...'
            "
            class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none"
          />
        </div>
        <div class="relative">
          <select
            v-model="statusFilter"
            class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm"
          >
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option></select
          ><ChevronDown
            :size="15"
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
        </div>
        <button
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600"
          @click="resetFilters"
        >
          <Filter :size="15" />Filtreleri Temizle
        </button>
      </div>
    </section>
    <section
      class="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs"
    >
      <div class="overflow-x-auto">
        <table
          v-if="activeTab === 'companies'"
          class="w-full min-w-[980px] text-left"
        >
          <thead class="border-b border-gray-100 bg-gray-50/70">
            <tr>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">Firma</th>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">
                Operasyonel Alan
              </th>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">
                NACE Kodu
              </th>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">
                Tehlike Sınıfı
              </th>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">
                SGK Sicil No
              </th>
              <th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th>
              <th
                class="px-4 py-4 text-right text-xs font-medium text-gray-500"
              >
                İşlemler
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="company in paginatedCompanies" :key="company.id">
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-1.5"
                  >
                    <img
                      :src="company.logo"
                      :alt="company.name"
                      class="h-full w-full object-contain"
                    />
                  </div>
                  <span class="text-sm font-semibold text-gray-800">{{
                    company.name
                  }}</span>
                </div>
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ company.operationalArea || "—" }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ company.nace }}
              </td>
              <td class="px-4 py-4">
                <DangerClassBadge :danger-class="company.dangerClass" />
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">{{ company.sgk }}</td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-600"
                  ><span
                    class="h-1.5 w-1.5 rounded-full bg-success-500"
                  />Aktif</span
                >
              </td>
              <td class="px-4 py-4 text-right">
                <button
                  class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"
                >
                  <UserRound :size="14" /> Uzman Ata
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <table
          v-else-if="activeTab === 'contractors'"
          class="w-full min-w-[1080px] text-left"
        >
          <thead class="border-b border-gray-100 bg-gray-50/70">
            <tr>
              <th
                v-for="h in [
                  'Firma',
                  'Faaliyet / Alt Faaliyet',
                  'NACE Kodu',
                  'Tehlike Sınıfı',
                  'SGK Sicil No',
                  'Taşeron Tipi',
                  'Durum',
                  'İşlemler',
                ]"
                :key="h"
                class="px-4 py-4 text-xs font-medium text-gray-500"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="company in paginatedContractors" :key="company.id">
              <td class="px-4 py-4 text-sm font-semibold text-gray-800">
                {{ company.name }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                <span class="font-medium text-gray-700">{{
                  company.activity
                }}</span>
                / {{ company.subActivity }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ company.nace }}
              </td>
              <td class="px-4 py-4">
                <DangerClassBadge :danger-class="company.dangerClass" />
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">{{ company.sgk }}</td>
              <td class="px-4 py-4 text-sm text-gray-600">
                {{ company.contractorType }}
              </td>
              <td class="px-4 py-4 text-sm text-success-600">Aktif</td>
              <td class="px-4 py-4 text-right">
                <button
                  class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"
                >
                  <UserRound :size="14" /> Uzman Ata
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <table v-else class="w-full min-w-[760px] text-left">
          <thead class="border-b border-gray-100 bg-gray-50/70">
            <tr>
              <th
                v-for="h in [
                  'Operasyonel Alan',
                  'Açıklama',
                  'Durum',
                  'İşlemler',
                ]"
                :key="h"
                class="px-4 py-4 text-xs font-medium text-gray-500"
              >
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="item in paginatedAreas" :key="item.id">
              <td class="px-4 py-4 text-sm font-semibold text-gray-800">
                {{ item.name }}
              </td>
              <td class="px-4 py-4 text-sm text-gray-500">
                {{ item.description }}
              </td>
              <td class="px-4 py-4 text-sm text-success-600">Aktif</td>
              <td class="px-4 py-4 text-right">
                <button
                  class="flex h-9 w-9 ml-auto items-center justify-center rounded-lg border border-gray-200"
                >
                  <EllipsisVertical :size="15" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div
          v-if="!filteredItems.length"
          class="px-4 py-12 text-center text-sm text-gray-500"
        >
          Kayıt bulunamadı.
        </div>
      </div>
      <div
        class="flex w-full flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <span class="text-sm text-gray-500"
          >Toplam {{ filteredItems.length }} kayıt</span
        >
        <div class="flex items-center gap-1">
          <button
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
            :disabled="currentPage === 1"
            @click="currentPage--"
          >
            <ChevronLeft :size="16" /></button
          ><button
            v-for="page in visiblePages"
            :key="page"
            class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium"
            :class="
              page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-600'
            "
            @click="currentPage = page"
          >
            {{ page }}</button
          ><button
            class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
            :disabled="currentPage === totalPages"
            @click="currentPage++"
          >
            <ChevronRight :size="16" />
          </button>
        </div>
        <select
          v-model.number="perPage"
          class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600"
        >
          <option :value="10">10 / sayfa</option>
          <option :value="25">25 / sayfa</option>
          <option :value="50">50 / sayfa</option>
        </select>
      </div>
    </section>
    <CompanyCreateModal
      v-model="showCompanyModal"
      :groups="groupOptions"
      :companies="companyOptions"
      :areas="areas"
      @save="addCompany"
    />
    <ContractorCreateModal
      v-model="showContractorModal"
      :contractors="permanentContractorOptions"
      :areas="areas"
      @save="addContractor"
    />
    <OperationalAreaCreateModal v-model="showAreaModal" @save="addArea" />
  </div>
</template>
