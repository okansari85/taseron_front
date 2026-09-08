<script setup lang="ts">
import {
  Building2,
  ChevronRight,
  ClipboardList,
  Info,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  User,
} from "lucide-vue-next";
import { activityApi } from "~/api/activity";
import type { Activity, ActivityDocumentType, ActivityPayload, DocumentTarget } from "~/types/activity";
import ConfirmationModal from "~/components/ConfirmationModal.vue";

const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme();
const themeColor = computed(() => workspaceColor.value || "#465fff");

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => Number(route.params.tenantId ?? 0));

const activities = ref<Activity[]>([]);
const search = ref("");
const selectedId = ref<number | null>(null);
const activeTab = ref<DocumentTarget>("company");
const items = ref<ActivityDocumentType[]>([]);
const loadingItems = ref(false);
const errorMessage = ref<string | null>(null);

const filteredActivities = computed(() => {
  const term = search.value.trim().toLocaleLowerCase("tr-TR");
  if (!term) return activities.value;
  return activities.value.filter((a) => a.name.toLocaleLowerCase("tr-TR").includes(term));
});

const selectedActivity = computed(() => activities.value.find((a) => a.id === selectedId.value) ?? null);

const loadItems = async () => {
  if (!selectedId.value) {
    items.value = [];
    return;
  }
  loadingItems.value = true;
  errorMessage.value = null;
  try {
    const response = await activityApi.documentTypes(selectedId.value, activeTab.value);
    items.value = response.data;
  } catch (error) {
    errorMessage.value = "Evraklar yüklenirken bir hata oluştu.";
  } finally {
    loadingItems.value = false;
  }
};

watch([selectedId, activeTab], loadItems);

const reloadActivities = async () => {
  const response = await activityApi.list();
  activities.value = response.data;
};

onMounted(() => loadWorkspaceTheme(tenantId.value));
watch(tenantId, (id) => loadWorkspaceTheme(id));

onMounted(async () => {
  await reloadActivities();
  const query = route.query.activity;
  const preselect = query ? Number(Array.isArray(query) ? query[0] : query) : null;
  selectedId.value = preselect && activities.value.some((a) => a.id === preselect) ? preselect : (activities.value[0]?.id ?? null);
});

const selectActivity = (id: number) => {
  selectedId.value = id;
};

// Evrak ekle/düzenle modalı
const modalOpen = ref(false);
const editingItem = ref<ActivityDocumentType | null>(null);
const saving = ref(false);
const noValidityLimit = ref(true);
const form = reactive({
  name: "",
  is_required: true,
  validity_days: null as number | null,
  description: "",
});

const openAdd = () => {
  editingItem.value = null;
  form.name = "";
  form.is_required = true;
  form.validity_days = null;
  form.description = "";
  noValidityLimit.value = true;
  modalOpen.value = true;
};

const openEditItem = (item: ActivityDocumentType) => {
  editingItem.value = item;
  form.name = item.document_type.name;
  form.is_required = item.is_required;
  form.validity_days = item.validity_days;
  form.description = item.description ?? "";
  noValidityLimit.value = item.validity_days === null;
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingItem.value = null;
};

const submit = async () => {
  if (!selectedId.value || !form.name.trim()) return;
  saving.value = true;
  try {
    const payload = {
      name: form.name,
      is_required: form.is_required,
      validity_days: noValidityLimit.value ? null : form.validity_days,
      description: form.description || null,
    };
    if (editingItem.value) {
      await activityApi.updateDocumentType(selectedId.value, editingItem.value.id, payload);
    } else {
      await activityApi.addDocumentType(selectedId.value, { ...payload, target: activeTab.value });
    }
    closeModal();
    await loadItems();
    await reloadActivities();
  } catch (error) {
    errorMessage.value = "Evrak kaydedilirken bir hata oluştu.";
  } finally {
    saving.value = false;
  }
};

const deleteTarget = ref<ActivityDocumentType | null>(null);
const confirmationOpen = ref(false);
const requestDelete = (item: ActivityDocumentType) => {
  deleteTarget.value = item;
  confirmationOpen.value = true;
};
const confirmDelete = async () => {
  if (!deleteTarget.value || !selectedId.value) return;
  const id = deleteTarget.value.id;
  confirmationOpen.value = false;
  deleteTarget.value = null;
  try {
    await activityApi.removeDocumentType(selectedId.value, id);
    await loadItems();
    await reloadActivities();
  } catch (error) {
    errorMessage.value = "Evrak kaldırılırken bir hata oluştu.";
  }
};

// Faaliyet bilgilerini düzenle modalı
const activityModalOpen = ref(false);
const activitySaving = ref(false);
const activityForm = reactive<ActivityPayload>({ name: "", description: "", is_active: true });

const openActivityEdit = () => {
  if (!selectedActivity.value) return;
  activityForm.name = selectedActivity.value.name;
  activityForm.description = selectedActivity.value.description ?? "";
  activityForm.is_active = selectedActivity.value.is_active;
  activityModalOpen.value = true;
};

const closeActivityModal = () => {
  activityModalOpen.value = false;
};

const submitActivity = async () => {
  if (!selectedId.value || !activityForm.name.trim()) return;
  activitySaving.value = true;
  try {
    await activityApi.update(selectedId.value, activityForm);
    closeActivityModal();
    await reloadActivities();
  } catch (error) {
    errorMessage.value = "Faaliyet bilgileri kaydedilirken bir hata oluştu.";
  } finally {
    activitySaving.value = false;
  }
};

// Sayfalama (basit, istemci taraflı)
const pageSize = ref(10);
const currentPage = ref(1);
watch(items, () => { currentPage.value = 1; });
const totalPages = computed(() => Math.max(1, Math.ceil(items.value.length / pageSize.value)));
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return items.value.slice(start, start + pageSize.value);
});
const rangeLabel = computed(() => {
  if (items.value.length === 0) return "Kayıt bulunamadı";
  const start = (currentPage.value - 1) * pageSize.value + 1;
  const end = Math.min(items.value.length, currentPage.value * pageSize.value);
  return `${items.value.length} kayıttan ${start}-${end} arası gösteriliyor`;
});
</script>

<template>
  <div class="font-outfit" :style="{ '--wc': themeColor }">
    <div class="mx-auto w-full max-w-[1400px]">
      <nav class="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>Evrak Yönetimi</span>
        <ChevronRight :size="12" />
        <NuxtLink :to="`/tenants/${tenantId}/documents/activities`" class="hover:text-gray-600 dark:hover:text-gray-300">Faaliyetler</NuxtLink>
        <ChevronRight :size="12" />
        <span class="font-medium text-gray-500 dark:text-gray-400">Checklist Atama</span>
      </nav>

      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Faaliyetlere Checklist Atama</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Seçilen faaliyette görev alan firmalar ve personeller için gerekli evrakları tanımlayın. Bu evraklar firma veya personel checklist'ine otomatik olarak eklenir.</p>
        </div>
        <NuxtLink :to="`/tenants/${tenantId}/documents/activities`" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
          <Pencil :size="15" />Faaliyetleri Yönet
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <!-- Sol: faaliyet listesi -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 p-3 dark:border-gray-800">
            <div class="relative">
              <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="search" type="search" placeholder="Faaliyet adı ile ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>
          <div class="max-h-[640px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            <button
              v-for="activity in filteredActivities"
              :key="activity.id"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition"
              :class="activity.id === selectedId ? 'dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'"
              :style="activity.id === selectedId ? { backgroundColor: themeColor + '14' } : undefined"
              @click="selectActivity(activity.id)"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="activity.id === selectedId ? 'text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300'" :style="activity.id === selectedId ? { backgroundColor: themeColor } : undefined"><ClipboardList :size="16" /></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium" :class="activity.id !== selectedId && 'text-gray-700 dark:text-gray-200'" :style="activity.id === selectedId ? { color: themeColor } : undefined">{{ activity.name }}</span>
                <span class="block truncate text-xs text-gray-400">{{ activity.description || "Açıklama yok" }}</span>
              </span>
              <span class="shrink-0 text-xs text-gray-400">{{ (activity.required_company_documents_count ?? 0) + (activity.required_personnel_documents_count ?? 0) }} evrak</span>
              <ChevronRight :size="15" class="shrink-0 text-gray-300" />
            </button>
            <p v-if="filteredActivities.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">Faaliyet bulunamadı.</p>
          </div>
        </div>

        <!-- Sağ: seçili faaliyetin evrakları -->
        <div v-if="selectedActivity" class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
            <div class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg dark:bg-white/10" :style="{ backgroundColor: themeColor + '14', color: themeColor }"><ClipboardList :size="18" /></span>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ selectedActivity.name }}</h2>
                  <span :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', selectedActivity.is_active ? 'bg-success-50 text-success-600 dark:bg-success-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5']">
                    <span :class="['h-1.5 w-1.5 rounded-full', selectedActivity.is_active ? 'bg-success-500' : 'bg-gray-400']" />{{ selectedActivity.is_active ? "Aktif" : "Pasif" }}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-gray-400">{{ selectedActivity.description || "Açıklama yok" }}</p>
              </div>
            </div>
            <button type="button" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="openActivityEdit">
              <Pencil :size="14" />Faaliyet Bilgilerini Düzenle
            </button>
          </div>

          <div class="flex items-center gap-1 border-b border-gray-100 p-3 dark:border-gray-800">
            <div class="inline-flex rounded-lg bg-gray-100 p-1 dark:bg-white/5">
              <button type="button" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition" :class="activeTab === 'company' ? 'bg-white shadow-theme-xs dark:bg-gray-900' : 'text-gray-500 dark:text-gray-400'" :style="activeTab === 'company' ? { color: themeColor } : undefined" @click="activeTab = 'company'">
                <Building2 :size="14" />Firma Evrakları ({{ selectedActivity.required_company_documents_count ?? 0 }})
              </button>
              <button type="button" class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition" :class="activeTab === 'personnel' ? 'bg-white shadow-theme-xs dark:bg-gray-900' : 'text-gray-500 dark:text-gray-400'" :style="activeTab === 'personnel' ? { color: themeColor } : undefined" @click="activeTab = 'personnel'">
                <User :size="14" />Personel Evrakları ({{ selectedActivity.required_personnel_documents_count ?? 0 }})
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-3 border-b border-gray-100 bg-info-50/60 px-4 py-3 dark:border-gray-800 dark:bg-info-500/10 sm:flex-row sm:items-center sm:justify-between">
            <p class="flex items-start gap-2 text-xs leading-5 text-info-700 dark:text-info-400">
              <Info :size="15" class="mt-0.5 shrink-0" />
              Bu faaliyette yer alan {{ activeTab === "company" ? "firmalar" : "personeller" }} için gerekli evrakları tanımlayın. Atanan evraklar, ilgili {{ activeTab === "company" ? "firmaların" : "personellerin" }} checklist'ine otomatik olarak eklenir.
            </p>
            <button type="button" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white transition hover:brightness-90" :style="{ backgroundColor: themeColor }" @click="openAdd">
              <Plus :size="15" />Evrak Ekle
            </button>
          </div>

          <p v-if="errorMessage" class="px-4 pt-3 text-sm text-error-500">{{ errorMessage }}</p>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <th class="w-10 px-4 py-3 font-medium">#</th>
                  <th class="px-4 py-3 font-medium">Evrak Adı</th>
                  <th class="px-4 py-3 font-medium">Zorunluluk</th>
                  <th class="px-4 py-3 font-medium">Geçerlilik Süresi</th>
                  <th class="px-4 py-3 font-medium">Açıklama</th>
                  <th class="px-4 py-3 text-right font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(item, index) in pagedItems" :key="item.id" class="text-sm">
                  <td class="px-4 py-3 text-gray-400">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="px-4 py-3 font-medium text-gray-800 dark:text-white/90">{{ item.document_type.name }}</td>
                  <td class="px-4 py-3">
                    <span :class="['inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', item.is_required ? 'bg-error-50 text-error-600 dark:bg-error-500/10' : 'bg-warning-50 text-warning-600 dark:bg-warning-500/10']">{{ item.is_required ? "Zorunlu" : "İsteğe Bağlı" }}</span>
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.validity_days ? `${item.validity_days} gün` : "Süresiz" }}</td>
                  <td class="max-w-[260px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{{ item.description || "—" }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" title="Düzenle" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5" @click="openEditItem(item)"><Pencil :size="14" /></button>
                      <button type="button" title="Kaldır" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-error-500 transition hover:bg-error-50 dark:border-gray-700 dark:hover:bg-error-500/10" @click="requestDelete(item)"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loadingItems && pagedItems.length === 0">
                  <td colspan="6" class="px-4 py-10 text-center text-sm text-gray-400">Bu {{ activeTab === "company" ? "firma" : "personel" }} kategorisinde henüz evrak tanımlanmadı.</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ rangeLabel }}</p>
            <div class="flex items-center gap-1">
              <button type="button" :disabled="currentPage === 1" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" @click="currentPage = Math.max(1, currentPage - 1)">‹</button>
              <span class="px-2 text-sm font-medium text-gray-600 dark:text-gray-300">{{ currentPage }} / {{ totalPages }}</span>
              <button type="button" :disabled="currentPage === totalPages" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" @click="currentPage = Math.min(totalPages, currentPage + 1)">›</button>
            </div>
          </div>

          <div class="p-4">
            <div class="rounded-xl border border-success-100 bg-success-50/60 p-4 dark:border-success-500/20 dark:bg-success-500/[0.06]">
              <div class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-success-600 shadow-theme-xs dark:bg-white/10"><Settings2 :size="17" /></span>
                <div>
                  <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Nasıl Çalışır?</h3>
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Bu faaliyete atanan evraklar, faaliyeti seçen firmaların veya personellerin checklist'ine otomatik olarak eklenir. Evrakta değişiklik yapıldığında, ilişkili kayıtlar için yeni gereksinim oluşur.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
          Soldan bir faaliyet seçin.
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ editingItem ? "Evrak Düzenle" : "Evrak Ekle" }}</h2>
          <p class="mt-1 text-xs text-gray-400">{{ activeTab === "company" ? "Firma Evrakları" : "Personel Evrakları" }}</p>
          <form class="mt-4 space-y-4" @submit.prevent="submit">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Evrak Adı <span class="text-error-500">*</span></label>
              <input v-model="form.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Zorunluluk</label>
                <select v-model="form.is_required" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option :value="true">Zorunlu</option>
                  <option :value="false">İsteğe Bağlı</option>
                </select>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Geçerlilik Süresi</label>
                <div class="flex items-center gap-2">
                  <input v-model.number="form.validity_days" type="number" min="1" :disabled="noValidityLimit" placeholder="gün" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:bg-gray-50 disabled:text-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
                </div>
                <label class="mt-2 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"><input v-model="noValidityLimit" type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />Süresiz</label>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
              <textarea v-model="form.description" rows="2" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="closeModal">İptal</button>
              <button type="submit" :disabled="saving" class="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60" :style="{ backgroundColor: themeColor }">{{ saving ? "Kaydediliyor..." : "Kaydet" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <Transition name="fade">
      <div v-if="activityModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeActivityModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Faaliyet Bilgilerini Düzenle</h2>
          <form class="mt-4 space-y-4" @submit.prevent="submitActivity">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Faaliyet Adı <span class="text-error-500">*</span></label>
              <input v-model="activityForm.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
              <textarea v-model="activityForm.description" rows="2" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <label class="flex items-center gap-3"><input v-model="activityForm.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" /><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</span></label>
            <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="closeActivityModal">İptal</button>
              <button type="submit" :disabled="activitySaving" class="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60" :style="{ backgroundColor: themeColor }">{{ activitySaving ? "Kaydediliyor..." : "Kaydet" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmationModal
      :open="confirmationOpen"
      title="Evrakı Kaldır"
      :message="`'${deleteTarget?.document_type.name ?? ''}' evrakını bu faaliyetten kaldırmak istediğinize emin misiniz?`"
      @confirm="confirmDelete"
      @update:open="confirmationOpen = $event"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
