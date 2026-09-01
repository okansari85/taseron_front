<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, Filter, Pencil, Plus, Search, Trash2, Users } from "lucide-vue-next";
import ContractorCreateDrawer from "~/components/ContractorCreateDrawer.vue";
import ConfirmationModal from "~/components/ConfirmationModal.vue";
import { useContractorStore, type Contractor } from "~/stores/contractor";

const props = defineProps<{ tenantId: string }>();
const contractorStore = useContractorStore();
const { contractors } = storeToRefs(contractorStore);
const search = ref("");
const typeFilter = ref("all");
const statusFilter = ref("all");
const drawerOpen = ref(false);
const createError = ref("");
const currentPage = ref(1);
const perPage = ref(10);
const editingContractor = ref<Contractor | null>(null);
const logoErrors = ref<Record<number, boolean>>({});
const deleteConfirmOpen = ref(false);
const deletingContractor = ref<Contractor | null>(null);

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

const logoUrl = (path: string | null | undefined) => {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path)) return path;
  const config = useRuntimeConfig();
  const baseUrl = String(config.public.apiBaseUrl).replace(/\/$/, "").replace(/\/api$/, "");
  return path.startsWith("/") ? `${baseUrl}${path}` : `${baseUrl}/storage/${path}`;
};
const onLogoError = (id: number) => { logoErrors.value[id] = true; };

watch([search, typeFilter, statusFilter, perPage], () => (currentPage.value = 1));
const resetFilters = () => { search.value = ""; typeFilter.value = "all"; statusFilter.value = "all"; };
const editContractor = (contractor: Contractor) => { editingContractor.value = contractor; drawerOpen.value = true; };

const saveContractor = async (payload: { id?: number; name: string; shortName: string; type: "Daimi" | "Geçici"; status: "active" | "passive"; logo: File | null; logoPreview: string }) => {
  createError.value = "";
  try {
    const apiPayload = {
      name: payload.name,
      shortName: payload.shortName,
      contractor_type: payload.type === "Daimi" ? "permanent" as const : "temporary" as const,
      status: payload.status,
      logo: payload.logo,
    };
    if (!payload.id) {
      await contractorStore.createContractor(apiPayload);
    } else {
      await contractorStore.updateContractor(payload.id, apiPayload);
    }
    editingContractor.value = null;
    drawerOpen.value = false;
  } catch (error) {
    createError.value = error instanceof Error ? error.message : (payload.id ? "Alt yüklenici güncellenemedi." : "Alt yüklenici oluşturulamadı.");
  }
};

const removeContractor = (contractor: Contractor) => {
  deletingContractor.value = contractor;
  deleteConfirmOpen.value = true;
};

const confirmRemoveContractor = async () => {
  if (!deletingContractor.value) return;
  createError.value = "";
  try {
    await contractorStore.deleteContractor(deletingContractor.value.id);
    deleteConfirmOpen.value = false;
    deletingContractor.value = null;
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value;
  } catch (error) {
    createError.value = error instanceof Error ? error.message : "Alt yüklenici silinemedi.";
  }
};

const goToPage = (page: number) => { currentPage.value = Math.min(Math.max(1, page), totalPages.value); };
onMounted(async () => {
  try {
    await contractorStore.fetchContractors();
  } catch (error) {
    createError.value = error instanceof Error ? error.message : "Alt yükleniciler alınamadı.";
  }
});
</script>

<template>
  <div class="col-span-full block w-full min-w-0" style="display:block!important;width:100%!important;grid-column:1/-1!important;">
    <div v-if="createError" class="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ createError }}</div>
    <div class="mb-6 flex items-start justify-end"><button type="button" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs hover:bg-brand-600 disabled:opacity-60" :disabled="contractorStore.saving" @click="editingContractor=null; drawerOpen=true"><Plus :size="16"/> Yeni Alt Yüklenici</button></div>
    <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.35fr)_1fr_1fr_auto] md:items-center"><div class="relative"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input v-model="search" type="search" placeholder="Alt yüklenici ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"/></div><div class="relative"><select v-model="typeFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"><option value="all">Tüm Türler</option><option value="Daimi">Daimi</option><option value="Geçici">Geçici</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/></div><div class="relative"><select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"><option value="all">Tüm Durumlar</option><option value="active">Aktif</option><option value="passive">Pasif</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/></div><button class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900" @click="resetFilters"><Filter :size="15"/> Filtreleri Temizle</button></div></section>
    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><div class="overflow-x-auto"><table class="w-full min-w-[820px] text-left"><thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-gray-900/50"><tr><th class="px-4 py-4 text-xs font-medium text-gray-500">Alt Yüklenici</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Kısa Ad</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Tür</th><th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th><th class="px-4 py-4 text-right text-xs font-medium text-gray-500">İşlemler</th></tr></thead><tbody class="divide-y divide-gray-100 dark:divide-gray-800"><tr v-if="contractorStore.loading"><td colspan="5" class="px-4 py-12 text-center text-sm text-gray-500">Alt yükleniciler yükleniyor...</td></tr><tr v-else v-for="contractor in paginated" :key="contractor.id" class="cursor-pointer hover:bg-gray-50/70 dark:hover:bg-white/[0.02]" @click="$router.push(`/tenants/${props.tenantId}/contractors/${contractor.id}`)"><td class="px-4 py-4"><div class="flex items-center gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold" :class="contractor.avatarClass"><img v-if="contractor.logoPath && !logoErrors[contractor.id]" :src="logoUrl(contractor.logoPath)" :alt="`${contractor.name} logosu`" class="h-full w-full object-contain bg-white" @error="onLogoError(contractor.id)" /><template v-else><Users :size="16" v-if="!contractor.initials"/><span v-else>{{contractor.initials}}</span></template></div><span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{contractor.name }}</span></div></td><td class="px-4 py-4 text-sm font-medium text-gray-600 dark:text-gray-300">{{contractor.shortName}}</td><td class="px-4 py-4"><span class="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold" :class="contractor.type==='Daimi'?'bg-brand-50 text-brand-600':'bg-amber-50 text-amber-600'">{{contractor.type}}</span></td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="contractor.status==='active'?'bg-success-50 text-success-600':'bg-gray-100 text-gray-500'"><span class="h-1.5 w-1.5 rounded-full" :class="contractor.status==='active'?'bg-success-500':'bg-gray-400'"></span>{{contractor.status==='active'?'Aktif':'Pasif'}}</span></td><td class="px-4 py-4"><div class="flex items-center justify-end gap-2"><button type="button" title="Düzenle" aria-label="Düzenle" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" @click.stop="editContractor(contractor)"><Pencil :size="17"/></button><button type="button" title="Sil" aria-label="Sil" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" :disabled="contractorStore.deleting" @click.stop="removeContractor(contractor)"><Trash2 :size="17"/></button></div></td></tr><tr v-if="!contractorStore.loading&&!paginated.length"><td colspan="5" class="px-4 py-12 text-center text-sm text-gray-500">Kayıt bulunamadı.</td></tr></tbody></table></div><div class="relative flex items-center justify-center border-t border-gray-100 px-4 py-3"><p class="absolute left-4 text-xs text-gray-500">{{filtered.length}} alt yüklenici</p><div class="flex items-center gap-1"><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40" :disabled="currentPage===1" @click="goToPage(currentPage-1)"><ChevronLeft :size="15"/></button><button v-for="page in visiblePages" :key="page" type="button" class="h-8 min-w-8 rounded-md px-2 text-xs transition" :class="page===currentPage?'bg-brand-500 text-white':'text-gray-500 hover:bg-gray-100'" @click="goToPage(page)">{{page}}</button><button type="button" class="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40" :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)"><ChevronRight :size="15"/></button></div></div></section>
    <ContractorCreateDrawer v-model="drawerOpen" :edit-data="editingContractor" @save="saveContractor" />
    <ConfirmationModal
      v-model:open="deleteConfirmOpen"
      title="Alt Yükleniciyi Sil"
      :message="deletingContractor ? `“${deletingContractor.name}” alt yüklenicisi silinsin mi?` : 'Bu alt yükleniciyi silmek istediğinize emin misiniz?'"
      confirm-text="Sil"
      cancel-text="Vazgeç"
      :loading="contractorStore.deleting"
      @confirm="confirmRemoveContractor"
    />
  </div>
</template>
