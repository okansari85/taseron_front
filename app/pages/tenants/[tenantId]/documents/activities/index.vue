<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Copy,
  FileText,
  PauseCircle,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  Users,
  X,
} from "lucide-vue-next";
import { activityApi } from "~/api/activity";
import type { Activity, ActivityPayload } from "~/types/activity";
import ConfirmationModal from "~/components/ConfirmationModal.vue";

const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme();
const themeColor = computed(() => workspaceColor.value || "#465fff");

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => Number(route.params.tenantId ?? 0));

const activities = ref<Activity[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const search = ref("");
const statusFilter = ref<"all" | "active" | "passive">("all");
const docFilter = ref<"all" | "defined" | "missing">("all");

const hasFilters = computed(
  () => Boolean(search.value.trim()) || statusFilter.value !== "all" || docFilter.value !== "all",
);

const clearFilters = () => {
  search.value = "";
  statusFilter.value = "all";
  docFilter.value = "all";
};

const load = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await activityApi.list();
    activities.value = response.data;
  } catch (error) {
    errorMessage.value = "Faaliyetler yüklenirken bir hata oluştu.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);
onMounted(() => loadWorkspaceTheme(tenantId.value));
watch(tenantId, (id) => loadWorkspaceTheme(id));

const requiredDocsTotal = (activity: Activity) =>
  (activity.required_company_documents_count ?? 0) + (activity.required_personnel_documents_count ?? 0);

const filtered = computed(() =>
  activities.value.filter((activity) => {
    const term = search.value.trim().toLocaleLowerCase("tr-TR");
    const matchesSearch =
      !term ||
      activity.name.toLocaleLowerCase("tr-TR").includes(term) ||
      (activity.description ?? "").toLocaleLowerCase("tr-TR").includes(term);
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" ? activity.is_active : !activity.is_active);
    const matchesDoc =
      docFilter.value === "all" ||
      (docFilter.value === "defined" ? requiredDocsTotal(activity) > 0 : requiredDocsTotal(activity) === 0);
    return matchesSearch && matchesStatus && matchesDoc;
  }),
);

const stats = computed(() => ({
  total: activities.value.length,
  active: activities.value.filter((a) => a.is_active).length,
  passive: activities.value.filter((a) => !a.is_active).length,
  companies: activities.value.reduce((sum, a) => sum + (a.location_business_entities_count ?? 0), 0),
}));

// Sayfalama
const pageSize = ref(8);
const pageSizeOptions = [8, 16, 24, 50];
const currentPage = ref(1);

watch([search, statusFilter, docFilter, pageSize], () => {
  currentPage.value = 1;
});

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));

watch(totalPages, (value) => {
  if (currentPage.value > value) currentPage.value = value;
});

const pageNumbers = computed(() => Array.from({ length: totalPages.value }, (_, i) => i + 1));

const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

const rangeLabel = computed(() => {
  if (filtered.value.length === 0) return "Kayıt bulunamadı";
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(filtered.value.length, currentPage.value * pageSize.value);
  return `${filtered.value.length} kayıttan ${start}-${end} arası gösteriliyor`;
});

// Düzenleme / oluşturma modalı
const modalOpen = ref(false);
const editingId = ref<number | null>(null);
const form = reactive<ActivityPayload>({
  name: "",
  description: "",
  is_active: true,
});

const openCreate = () => {
  editingId.value = null;
  form.name = "";
  form.description = "";
  form.is_active = true;
  modalOpen.value = true;
};

const openEdit = (activity: Activity) => {
  editingId.value = activity.id;
  form.name = activity.name;
  form.description = activity.description ?? "";
  form.is_active = activity.is_active;
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingId.value = null;
};

const submit = async () => {
  if (!form.name.trim()) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await activityApi.update(editingId.value, form);
    } else {
      await activityApi.create(form);
    }
    closeModal();
    await load();
  } catch (error) {
    errorMessage.value = "Faaliyet kaydedilirken bir hata oluştu.";
  } finally {
    saving.value = false;
  }
};

const duplicating = ref<number | null>(null);
const duplicateActivity = async (activity: Activity) => {
  duplicating.value = activity.id;
  try {
    await activityApi.create({
      name: `${activity.name} (Kopya)`,
      description: activity.description,
      is_active: activity.is_active,
    });
    await load();
  } catch (error) {
    errorMessage.value = "Faaliyet kopyalanırken bir hata oluştu.";
  } finally {
    duplicating.value = null;
  }
};

const deleteTarget = ref<Activity | null>(null);
const confirmationOpen = ref(false);
const requestDelete = (activity: Activity) => {
  deleteTarget.value = activity;
  confirmationOpen.value = true;
};
const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value.id;
  confirmationOpen.value = false;
  deleteTarget.value = null;
  try {
    await activityApi.remove(id);
    await load();
  } catch (error) {
    errorMessage.value = "Faaliyet silinirken bir hata oluştu (kullanan firmalar olabilir).";
  }
};

const goToChecklist = (activity: Activity) => {
  navigateTo(`/tenants/${tenantId.value}/documents/activities/checklist?activity=${activity.id}`);
};
</script>

<template>
  <div class="font-outfit" :style="{ '--wc': themeColor }">
    <div class="mx-auto w-full max-w-[1400px]">
      <nav class="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>Evrak Yönetimi</span>
        <ChevronRight :size="12" />
        <span class="font-medium text-gray-500 dark:text-gray-400">Faaliyetler</span>
      </nav>

      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Faaliyetler</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Taşeron firmaların yürütebileceği faaliyetleri yönetin. Her faaliyet için gerekli evrak ve kriterleri tanımlayın.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--wc)] px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:brightness-90"
          @click="openCreate"
        >
          <Plus :size="16" />Yeni Faaliyet Ekle
        </button>
      </div>

      <div class="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10"><FileText :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.total }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Toplam Faaliyet</p></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10"><CheckCircle2 :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.active }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Aktif</p></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-500 dark:bg-warning-500/10"><PauseCircle :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.passive }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Pasif</p></div>
        </div>
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"><Users :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.companies }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Kullanan Firma</p></div>
        </div>
      </div>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto]">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" placeholder="Faaliyet adı veya açıklama ile ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
          </div>
          <div class="relative">
            <select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <div class="relative">
            <select v-model="docFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm Evrak Durumları</option>
              <option value="defined">Evrak Tanımlı</option>
              <option value="missing">Evrak Tanımlanmadı</option>
            </select>
            <ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
          <button
            type="button"
            :disabled="!hasFilters"
            class="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 px-3.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
            @click="clearFilters"
          >
            <X :size="15" />Filtreleri Temizle
          </button>
        </div>
      </section>

      <p v-if="errorMessage" class="mb-3 text-sm text-error-500">{{ errorMessage }}</p>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead class="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
              <tr>
                <th rowspan="2" class="w-12 px-4 py-3 font-medium align-bottom">#</th>
                <th rowspan="2" class="px-4 py-3 font-medium align-bottom">Faaliyet Adı</th>
                <th rowspan="2" class="px-4 py-3 font-medium align-bottom">Açıklama</th>
                <th colspan="2" class="border-b border-gray-100 px-4 py-2 text-center font-medium dark:border-gray-800">Zorunlu Evrak Sayısı</th>
                <th rowspan="2" class="px-4 py-3 font-medium align-bottom">Kullanan Firma</th>
                <th rowspan="2" class="px-4 py-3 font-medium align-bottom">Durum</th>
                <th rowspan="2" class="px-4 py-3 text-right font-medium align-bottom">İşlemler</th>
              </tr>
              <tr>
                <th class="px-4 py-2 text-center font-medium">Şirket</th>
                <th class="px-4 py-2 text-center font-medium">Personel</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(activity, index) in paged" :key="activity.id" class="text-sm">
                <td class="px-4 py-3 text-gray-400">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300"><ClipboardList :size="15" /></span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ activity.name }}</span>
                  </div>
                </td>
                <td class="max-w-[240px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{{ activity.description || "—" }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ activity.required_company_documents_count ?? 0 }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ activity.required_personnel_documents_count ?? 0 }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ activity.location_business_entities_count ?? 0 }}</td>
                <td class="px-4 py-3">
                  <span :class="['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', activity.is_active ? 'bg-success-50 text-success-600 dark:bg-success-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5']">
                    <span :class="['h-1.5 w-1.5 rounded-full', activity.is_active ? 'bg-success-500' : 'bg-gray-400']" />{{ activity.is_active ? "Aktif" : "Pasif" }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button type="button" title="Checklist Ata" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="goToChecklist(activity)"><ClipboardList :size="15" /></button>
                    <button type="button" title="Düzenle" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="openEdit(activity)"><Pencil :size="15" /></button>
                    <button type="button" title="Kopyala" :disabled="duplicating === activity.id" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5" @click="duplicateActivity(activity)"><Copy :size="15" /></button>
                    <button type="button" title="Sil" class="flex h-8 w-8 items-center justify-center rounded-lg text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10" @click="requestDelete(activity)"><Trash2 :size="15" /></button>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && paged.length === 0">
                <td colspan="8" class="px-4 py-10 text-center text-sm text-gray-400">Kayıt bulunamadı.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:flex-row">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabel }}</p>
          <div class="flex items-center gap-1">
            <button type="button" :disabled="currentPage === 1" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" @click="currentPage = Math.max(1, currentPage - 1)"><ChevronLeft :size="16" /></button>
            <button
              v-for="p in pageNumbers"
              :key="p"
              type="button"
              :class="['flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition', p === currentPage ? 'text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/5']"
              :style="p === currentPage ? { backgroundColor: themeColor } : undefined"
              @click="currentPage = p"
            >{{ p }}</button>
            <button type="button" :disabled="currentPage === totalPages" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" @click="currentPage = Math.min(totalPages, currentPage + 1)"><ChevronRight :size="16" /></button>
          </div>
          <div class="relative">
            <select v-model.number="pageSize" class="h-9 appearance-none rounded-lg border border-gray-200 bg-white pl-3 pr-8 text-xs text-gray-600 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
              <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }} / sayfa</option>
            </select>
            <ChevronDown :size="13" class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div class="rounded-xl border border-brand-100 bg-brand-50/60 p-4 dark:border-brand-500/20 dark:bg-brand-500/[0.06]">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-theme-xs dark:bg-white/10"><FileText :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Faaliyet Nedir?</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Taşeron firmaların yürütebileceği iş kollarını ifade eder. Her faaliyet için gerekli evraklar, ekipmanlar ve diğer kriterler tanımlanır.</p>
            </div>
          </div>
        </div>
        <button type="button" class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-left transition hover:bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06] dark:hover:bg-indigo-500/10" @click="paged[0] && goToChecklist(paged[0])">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-theme-xs dark:bg-white/10"><Settings2 :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Evrak Gereksinimleri</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Her faaliyet için şirket ve personel bazında zorunlu evraklar tanımlanır. Bu gereksinimler firma checklist'ine otomatik olarak yansır.</p>
              <span class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Nasıl Tanımlanır? <ChevronRight :size="13" /></span>
            </div>
          </div>
        </button>
        <div class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06]">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-theme-xs dark:bg-white/10"><Users :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Nerede Kullanılır?</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Faaliyetler; firma tanımlama, evrak kontrol süreçleri ve raporlarda kullanılır. Bir firmaya atanan faaliyetler, gerekli evrak listesinin oluşmasını sağlar.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ editingId ? "Faaliyet Düzenle" : "Yeni Faaliyet" }}</h2>
          <form class="mt-4 space-y-4" @submit.prevent="submit">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Faaliyet Adı <span class="text-error-500">*</span></label>
              <input v-model="form.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
              <textarea v-model="form.description" rows="2" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <label class="flex items-center gap-3"><input v-model="form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" /><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</span></label>
            <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="closeModal">İptal</button>
              <button type="submit" :disabled="saving" class="inline-flex h-10 items-center gap-2 rounded-lg bg-[var(--wc)] px-4 text-sm font-semibold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60">{{ saving ? "Kaydediliyor..." : "Kaydet" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmationModal
      :open="confirmationOpen"
      title="Faaliyeti Sil"
      :message="`'${deleteTarget?.name ?? ''}' faaliyetini silmek istediğinize emin misiniz?`"
      @confirm="confirmDelete"
      @update:open="confirmationOpen = $event"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
