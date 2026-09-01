<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, EllipsisVertical, Filter, Plus, Search, Users } from "lucide-vue-next";
import ContractorCreateDrawer from "~/components/ContractorCreateDrawer.vue";
import { contractors as mockContractors, type Contractor, type ContractorStatus, type ContractorType } from "~/data/contractors.mock";

defineProps<{ tenantId: string }>();

const search = ref("");
const typeFilter = ref("all");
const statusFilter = ref("all");
const drawerOpen = ref(false);
const currentPage = ref(1);
const perPage = ref(10);
const contractors = ref<Contractor[]>(mockContractors);

const filtered = computed(() => {
  const t = search.value.trim().toLocaleLowerCase("tr-TR");
  return contractors.value.filter((x) =>
    (!t || `${x.name} ${x.shortName} ${x.type}`.toLocaleLowerCase("tr-TR").includes(t)) &&
    (typeFilter.value === "all" || x.type === typeFilter.value) &&
    (statusFilter.value === "all" || x.status === statusFilter.value),
  );
});
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / perPage.value)));
const paginated = computed(() => filtered.value.slice((currentPage.value - 1) * perPage.value, currentPage.value * perPage.value));
const visiblePages = computed(() => Array.from({ length: Math.min(5, totalPages.value) }, (_, i) => Math.min(Math.max(1, currentPage.value - 2) + i, totalPages.value)).filter((p, i, a) => a.indexOf(p) === i));
watch([search, typeFilter, statusFilter, perPage], () => (currentPage.value = 1));
const resetFilters = () => { search.value = ""; typeFilter.value = "all"; statusFilter.value = "all"; };
const addContractor = (payload: { name: string; shortName: string; type: ContractorType; status: ContractorStatus }) => {
  contractors.value.unshift({ id: Date.now(), ...payload, initials: payload.shortName.slice(0, 2).toLocaleUpperCase("tr-TR"), avatarClass: "bg-brand-50 text-brand-500" });
  drawerOpen.value = false;
};
const goToPage = (page: number) => { currentPage.value = Math.min(Math.max(1, page), totalPages.value); };
</script>

<template>
  <div>
    <div class="mb-6 flex items-start justify-end">
      <button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600" @click="drawerOpen = true">
        <Plus :size="16" /> Yeni Alt Yüklenici
      </button>
    </div>

    <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.35fr)_1fr_1fr_auto] md:items-center">
        <div class="relative">
          <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input v-model="search" type="search" placeholder="Alt yüklenici ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
        </div>
        <div class="relative">
          <select v-model="typeFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm outline-none dark:border-gray-700 dark:bg-gray-900">
            <option value="all">Tüm Türler</option><option value="Daimi">Daimi</option><option value="Geçici">Geçici</option>
          </select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <div class="relative">
          <select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm outline-none dark:border-gray-700 dark:bg-gray-900">
            <option value="all">Tüm Durumlar</option><option value="active">Aktif</option><option value="passive">Pasif</option>
          </select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
        <button class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900" @click="resetFilters"><Filter :size="15" /> Filtreleri Temizle</button>
      </div>
    </section>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px] text-left">
          <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/50"><tr>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Alt Yüklenici</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Kısa Ad</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Tür</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th><th class="px-4 py-4 text-right text-xs font-medium text-gray-500">İşlemler</th>
          </tr></thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
            <tr v-for="contractor in paginated" :key="contractor.id" class="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.02]" @click="$router.push(`/tenants/${tenantId}/contractors/${contractor.id}`)">
              <td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold" :class="contractor.avatarClass"><Users :size="16" v-if="!contractor.initials" /><span v-else>{{ contractor.initials }}</span></div><span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ contractor.name }}</span></div></td>
              <td class="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">{{ contractor.shortName }}</td>
              <td class="px-4 py-4"><span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="contractor.type === 'Daimi' ? 'bg-brand-50 text-brand-600' : 'bg-amber-50 text-amber-600'">{{ contractor.type }}</span></td>
              <td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="contractor.status === 'active' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'"><span class="h-1.5 w-1.5 rounded-full" :class="contractor.status === 'active' ? 'bg-success-500' : 'bg-gray-400'"></span>{{ contractor.status === "active" ? "Aktif" : "Pasif" }}</span></td>
              <td class="px-4 py-4 text-right"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700" @click.stop><EllipsisVertical :size="16" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="relative flex items-center justify-center border-t border-gray-100 px-4 py-3 dark:border-gray-800">
        <p class="absolute left-4 text-xs text-gray-500">{{ filtered.length }} alt yüklenici</p>
        <div class="flex items-center gap-1">
          <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5" :disabled="currentPage === 1" @click="goToPage(currentPage - 1)"><ChevronLeft :size="15" /></button>
          <button v-for="page in visiblePages" :key="page" type="button" class="h-8 min-w-8 rounded-md px-2 text-xs transition" :class="page === currentPage ? 'bg-brand-500 text-white' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'" @click="goToPage(page)">{{ page }}</button>
          <button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-white/5" :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)"><ChevronRight :size="15" /></button>
        </div>
      </div>
    </section>
    <ContractorCreateDrawer v-model="drawerOpen" @save="addContractor" />
  </div>
</template>
