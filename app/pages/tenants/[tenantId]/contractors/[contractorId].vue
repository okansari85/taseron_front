<script setup lang="ts">
import { ArrowLeft, Building2, CheckCircle2, FileCheck2, History, MapPin } from "lucide-vue-next";
import { computed, onMounted, ref } from "vue";
import { contractorApi, type ContractorApiRecord, type ContractorLocationItem } from "~/api/contractor";
import { organizationContractorApi, type ContractorOrganizationMatch } from "~/api/organization-contractor";
import ContractorGeneralTab from "~/components/contractors/ContractorGeneralTab.vue";
import ContractorOrganizationsTab from "~/components/contractors/ContractorOrganizationsTab.vue";
import ContractorLocationsTab from "~/components/contractors/ContractorLocationsTab.vue";
import ContractorComingSoonTab from "~/components/contractors/ContractorComingSoonTab.vue";
import WorkRequestsPanel from "~/components/contractors/WorkRequestsPanel.vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const { $toast } = useNuxtApp();
const tenantId = computed(() => String(route.params.tenantId ?? "1"));
const contractorId = computed(() =>
  Number(Array.isArray(route.params.contractorId) ? route.params.contractorId[0] : (route.params.contractorId ?? 0)),
);

const loading = ref(true);
const loadError = ref("");
const record = ref<ContractorApiRecord | null>(null);
const match = ref<ContractorOrganizationMatch | null>(null);
const locations = ref<ContractorLocationItem[]>([]);
const removingOrgId = ref<number | null>(null);

const contractor = computed(() => ({
  name: record.value?.business_entity?.name ?? "",
  shortName: record.value?.short_name ?? "",
  type: record.value?.contractor_type === "temporary" ? "Geçici" : "Daimi",
  status: record.value?.status ?? "active",
}));
const isTemporary = computed(() => record.value?.contractor_type === "temporary");
const statusText = computed(() => (contractor.value.status === "active" ? "Aktif" : "Pasif"));

const organizations = computed(() => match.value?.organizations ?? []);
const mappedLocations = computed(() =>
  locations.value.map((item) => ({
    name: item.location?.name ?? "—",
    business: item.business_entity?.name ?? "—",
    status: item.location?.is_active === false ? "Pasif" : "Aktif",
    city: item.location?.city?.name ?? "",
    brands: (item.brands ?? []).map((b) => b.name),
  })),
);

const tabs = computed(() => [
  { key: "general", label: "Genel Bilgiler", icon: Building2 },
  { key: "organizations", label: "Organizasyon İlişkileri", icon: Building2 },
  ...(isTemporary.value
    ? [{ key: "visits", label: "Saha Ziyaretleri / İş Talepleri", icon: History }]
    : [
        { key: "locations", label: "Lokasyonlar", icon: MapPin },
        { key: "documents", label: "Evrak Durumu", icon: FileCheck2 },
      ]),
]);
const activeTab = ref("general");

const temporaryHistoryUrl = computed(
  () => `/tenants/${tenantId.value}/contractors/${contractorId.value}/temporary-history`,
);
const organizationMatchingUrl = computed(() => `/tenants/${tenantId.value}/contractors/organization-matching`);

const loadMatch = async () => {
  try {
    const all = await organizationContractorApi.listContractors();
    match.value = all.find((x) => x.id === contractorId.value) ?? null;
  } catch {
    match.value = null;
  }
};

const loadLocations = async () => {
  if (isTemporary.value) {
    locations.value = [];
    return;
  }
  try {
    locations.value = await contractorApi.locations(contractorId.value);
  } catch {
    locations.value = [];
  }
};

const load = async () => {
  loading.value = true;
  loadError.value = "";
  try {
    record.value = await contractorApi.get(contractorId.value);
    await Promise.all([loadMatch(), loadLocations()]);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : "Alt yüklenici bulunamadı.";
  } finally {
    loading.value = false;
  }
};

const detachOrganization = async (organizationId: number) => {
  removingOrgId.value = organizationId;
  try {
    await organizationContractorApi.detach(organizationId, contractorId.value);
    if (match.value) match.value.organizations = match.value.organizations.filter((x) => x.id !== organizationId);
    await loadLocations();
    $toast?.success?.("Organizasyon eşleştirmesi kaldırıldı.");
  } catch (error) {
    $toast?.error?.(error instanceof Error ? error.message : "Eşleştirme kaldırılamadı.");
  } finally {
    removingOrgId.value = null;
  }
};

onMounted(load);
</script>
<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
      Alt yüklenici bilgileri yükleniyor...
    </div>
    <div v-else-if="loadError" class="rounded-xl border border-error-200 bg-error-50 p-10 text-center text-sm text-error-600">
      {{ loadError }}
    </div>
    <template v-else>
      <div class="mb-6 flex items-start gap-4">
        <NuxtLink
          :to="`/tenants/${tenantId}/contractors/`"
          class="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
          ><ArrowLeft :size="17"
        /></NuxtLink>
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-2xl font-semibold tracking-tight text-gray-900">{{ contractor.name }}</h1>
            <span class="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600">{{ contractor.shortName }}</span>
            <span
              class="rounded-full px-2.5 py-1 text-xs font-medium"
              :class="isTemporary ? 'bg-amber-50 text-amber-600' : 'bg-success-50 text-success-600'"
              >{{ contractor.type }}</span
            >
          </div>
          <p class="mt-1.5 text-sm text-gray-500">Alt yüklenici detayları, organizasyon ilişkileri ve saha geçmişi.</p>
        </div>
      </div>
      <div class="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
        <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs lg:col-span-3">
          <div class="flex items-center gap-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-600">
              {{ contractor.shortName.slice(0, 2).toUpperCase() }}
            </div>
            <div>
              <p class="text-xs text-gray-500">Organizasyon Eşleşmesi</p>
              <p class="mt-1 text-2xl font-semibold text-gray-900">{{ organizations.length }}</p>
            </div>
            <div class="ml-auto hidden text-right sm:block">
              <p class="text-xs text-gray-500">Bağlı Şube/Lokasyon</p>
              <p class="mt-1 text-sm font-medium text-gray-800">{{ mappedLocations.length }}</p>
            </div>
          </div>
        </section>
        <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs">
          <p class="text-xs text-gray-500">Durum</p>
          <div class="mt-2 flex items-center gap-2">
            <CheckCircle2 :size="18" class="text-success-500" /><span class="text-sm font-semibold">{{ statusText }}</span>
          </div>
          <p class="mt-3 text-xs text-gray-500">{{ organizations.length }} organizasyon eşleşmesi</p>
        </section>
      </div>
      <div
        v-if="isTemporary"
        class="mb-5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/60 px-5 py-4"
      >
        <div class="flex items-center gap-3">
          <History :size="18" class="text-amber-600" />
          <div>
            <p class="text-sm font-semibold text-amber-800">Geçici Alt Yüklenici</p>
            <p class="mt-1 text-xs text-amber-700/80">İş talepleri ve saha ziyaretleri bu firma için ayrıca takip edilir.</p>
          </div>
        </div>
        <NuxtLink :to="temporaryHistoryUrl" class="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white"
          >Saha Geçmişini Gör</NuxtLink
        >
      </div>
      <div class="mb-5 overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-theme-xs">
        <div class="flex min-w-max items-center px-2">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            type="button"
            class="group relative flex items-center gap-2 px-4 py-4 text-sm font-medium transition-colors"
            :class="activeTab === tab.key ? 'text-brand-600' : 'text-gray-500 hover:text-gray-800'"
            @click="activeTab = tab.key"
          >
            <component :is="tab.icon" :size="16" /><span>{{ tab.label }}</span
            ><span v-if="activeTab === tab.key" class="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-500"></span>
          </button>
        </div>
      </div>
      <ContractorGeneralTab
        v-if="activeTab === 'general'"
        :contractor="{ ...contractor, statusText }"
        :organization-count="organizations.length"
        :location-count="mappedLocations.length"
      />
      <ContractorOrganizationsTab
        v-else-if="activeTab === 'organizations'"
        :organizations="organizations"
        :matching-url="organizationMatchingUrl"
        :removing-id="removingOrgId"
        @detach="detachOrganization"
      />
      <ContractorLocationsTab v-else-if="activeTab === 'locations'" :locations="mappedLocations" />
      <ContractorComingSoonTab
        v-else-if="activeTab === 'documents'"
        title="Evrak Durumu"
        description="Personel, araç, ekipman ve kimyasal bazlı evrak takibi altyapısı henüz kurulmadı. Bu modül, resmi SGK meslek kodu / MYK yükümlülük listesi ve evrak profili tanımları netleştikten sonra devreye alınacak."
        :items="[
          'Personel bazlı evrak takibi — SGK işe giriş kodu / MYK referans listesi bekleniyor',
          'Araç, ekipman ve kimyasal evrak takibi — henüz modellenmedi',
          'Evrak Profili modülü — ayrı onay bekleyen bir iş kalemi',
        ]"
      />
      <WorkRequestsPanel v-else-if="activeTab === 'visits'" :fixed-contractor-id="contractorId" />
    </template>
  </div>
</template>
