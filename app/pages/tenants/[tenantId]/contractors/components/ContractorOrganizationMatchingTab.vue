<script setup lang="ts">
import { ArrowRight, Building2, Check, Search } from "lucide-vue-next";
import { organizationApi } from "~/api/organization";
import { organizationBusinessEntityApi, type ContractorOrganizationMatch } from "~/api/organization-business-entity";

const props = defineProps<{ tenantId: string }>();

const contractorSearch = ref("");
const organizationSearch = ref("");
const selectedContractors = ref<number[]>([]);
const selectedOrganizations = ref<number[]>([]);
const contractors = ref<ContractorOrganizationMatch[]>([]);
const organizations = ref<Array<{ id: number; name: string; type: string; parent_id: number | null }>>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const filteredContractors = computed(() => {
  const t = contractorSearch.value.trim().toLocaleLowerCase("tr-TR");
  return contractors.value.filter((x) => {
    const shortName = x.contractor?.short_name ?? "";
    const type = x.contractor?.contractor_type === "permanent" ? "Daimi" : "Geçici";
    return !t || `${x.name} ${shortName} ${type}`.toLocaleLowerCase("tr-TR").includes(t);
  });
});

const filteredOrganizations = computed(() => {
  const t = organizationSearch.value.trim().toLocaleLowerCase("tr-TR");
  return organizations.value.filter((x) =>
    !t || `${x.name} ${x.type}`.toLocaleLowerCase("tr-TR").includes(t),
  );
});

const organizationName = (id: number) => organizations.value.find((x) => x.id === id)?.name ?? "";
const contractorType = (item: ContractorOrganizationMatch) => item.contractor?.contractor_type === "permanent" ? "Daimi" : "Geçici";
const contractorShortName = (item: ContractorOrganizationMatch) => item.contractor?.short_name || item.name.slice(0, 2).toUpperCase();

const toggleContractor = (id: number) => {
  selectedContractors.value = selectedContractors.value.includes(id)
    ? selectedContractors.value.filter((x) => x !== id)
    : [...selectedContractors.value, id];
};

const toggleOrganization = (id: number) => {
  selectedOrganizations.value = selectedOrganizations.value.includes(id)
    ? selectedOrganizations.value.filter((x) => x !== id)
    : [...selectedOrganizations.value, id];
};

const selectAllContractors = () => { selectedContractors.value = filteredContractors.value.map((x) => x.id); };
const clearContractors = () => { selectedContractors.value = []; };
const selectAllOrganizations = () => { selectedOrganizations.value = filteredOrganizations.value.map((x) => x.id); };
const clearOrganizations = () => { selectedOrganizations.value = []; };

const fetchData = async () => {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [contractorData, organizationData] = await Promise.all([
      organizationBusinessEntityApi.listContractors(),
      organizationApi.list(),
    ]);

    contractors.value = contractorData;
    organizations.value = organizationData
      .filter((x) => x.type === "holding" || x.type === "group")
      .map((x) => ({ id: x.id, name: x.name, type: x.type, parent_id: x.parent_id }));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Organizasyon eşleştirme verileri alınamadı.";
  } finally {
    loading.value = false;
  }
};

const applyMatching = async () => {
  if (!selectedContractors.value.length || !selectedOrganizations.value.length) return;

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const selected = contractors.value.filter((contractor) => selectedContractors.value.includes(contractor.id));
    const operations = selected.flatMap((contractor) =>
      selectedOrganizations.value.map((organizationId) =>
        organizationBusinessEntityApi.attach(organizationId, contractor.id),
      ),
    );

    await Promise.all(operations);
    successMessage.value = `${operations.length} organizasyon eşleştirmesi uygulandı.`;
    await fetchData();
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : "Organizasyon eşleştirmesi uygulanamadı.";
  } finally {
    saving.value = false;
  }
};

onMounted(fetchData);
</script>

<template>
  <section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <div v-if="errorMessage" class="border-b border-error-100 bg-error-50 px-5 py-3 text-sm text-error-600">{{ errorMessage }}</div>
    <div v-if="successMessage" class="border-b border-success-100 bg-success-50 px-5 py-3 text-sm text-success-600">{{ successMessage }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.75fr)_minmax(260px,0.65fr)]">
      <div class="border-b border-gray-200 p-5 dark:border-gray-800 lg:border-b-0 lg:border-r">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Alt Yükleniciler</h2><p class="mt-1 text-xs text-gray-500">{{ selectedContractors.length }} alt yüklenici seçildi</p></div>
          <div class="flex gap-2"><button type="button" class="text-xs font-medium text-brand-500" :disabled="loading" @click="selectAllContractors">Tümünü seç</button><button type="button" class="text-xs font-medium text-gray-500" @click="clearContractors">Temizle</button></div>
        </div>
        <div class="relative mb-3"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="contractorSearch" type="search" placeholder="Alt yüklenici ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900" /></div>
        <div class="max-h-[500px] overflow-y-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <div v-if="loading" class="px-3 py-10 text-center text-sm text-gray-500">Alt yükleniciler yükleniyor...</div>
          <button v-for="item in filteredContractors" :key="item.id" type="button" class="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-3 text-left last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]" @click="toggleContractor(item.id)">
            <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs" :class="selectedContractors.includes(item.id) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-transparent dark:border-gray-600'"><Check :size="13" /></span>
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/10">{{ contractorShortName(item).slice(0, 2).toUpperCase() }}</span>
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.name }}</span>
              <span class="mt-0.5 flex min-w-0 flex-wrap items-center gap-1.5 text-xs text-gray-500">
                <span>{{ contractorShortName(item) }} · {{ contractorType(item) }}</span>
                <template v-if="item.organizations?.length">
                  <span v-for="organization in item.organizations.slice(0, 3)" :key="organization.id" class="rounded-full bg-brand-50 px-2 py-0.5 font-medium text-brand-600 dark:bg-brand-500/10">{{ organization.name }}</span>
                  <span v-if="item.organizations.length > 3" class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-500 dark:bg-gray-800">+{{ item.organizations.length - 3 }}</span>
                </template>
                <span v-else class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-500 dark:bg-gray-800">Eşleşmemiş</span>
              </span>
            </span>
          </button>
          <div v-if="!loading && !filteredContractors.length" class="px-3 py-10 text-center text-sm text-gray-500">Alt yüklenici bulunamadı.</div>
        </div>
      </div>

      <div class="p-5">
        <div class="mb-4 flex items-center justify-between gap-2"><div><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Organizasyonlar</h2><p class="mt-1 text-xs text-gray-500">Birden fazla seçebilirsiniz.</p></div><div class="flex shrink-0 gap-2"><button type="button" class="text-xs font-medium text-brand-500" @click="selectAllOrganizations">Tümü</button><button type="button" class="text-xs font-medium text-gray-500" @click="clearOrganizations">Temizle</button></div></div>
        <div class="relative mb-3"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="organizationSearch" type="search" placeholder="Organizasyon ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900" /></div>
        <div class="space-y-2">
          <div v-if="loading" class="rounded-lg border border-gray-100 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-800">Organizasyonlar yükleniyor...</div>
          <button v-for="item in filteredOrganizations" :key="item.id" type="button" class="flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition" :class="selectedOrganizations.includes(item.id) ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'" @click="toggleOrganization(item.id)"><span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800"><Building2 :size="15" /></span><span class="min-w-0 flex-1"><span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ item.name }}</span><span class="mt-0.5 block truncate text-[11px] text-gray-500">{{ item.parent_id ? `${organizationName(item.parent_id)} · ` : "" }}{{ item.type === "holding" ? "Holding" : "Grup" }}</span></span><span class="flex h-5 w-5 shrink-0 items-center justify-center rounded border" :class="selectedOrganizations.includes(item.id) ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-transparent dark:border-gray-600'"><Check :size="12" /></span></button>
          <div v-if="!loading && !filteredOrganizations.length" class="rounded-lg border border-gray-100 px-3 py-6 text-center text-sm text-gray-500 dark:border-gray-800">Organizasyon bulunamadı.</div>
        </div>
        <div class="mt-4 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.03]"><div class="flex items-center justify-between text-xs text-gray-500"><span class="font-medium text-gray-700 dark:text-gray-300">{{ selectedContractors.length }} alt yüklenici</span><ArrowRight :size="14" /><span class="font-medium text-gray-700 dark:text-gray-300">{{ selectedOrganizations.length }} organizasyon</span></div></div>
        <button type="button" class="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 px-3 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50" :disabled="saving || loading || !selectedContractors.length || !selectedOrganizations.length" @click="applyMatching"><ArrowRight :size="16" />{{ saving ? "Eşleştiriliyor..." : selectedContractors.length && selectedOrganizations.length ? `${selectedContractors.length} × ${selectedOrganizations.length} Eşleştir` : "Eşleştirmeyi Uygula" }}</button>
      </div>
    </div>
  </section>
</template>
