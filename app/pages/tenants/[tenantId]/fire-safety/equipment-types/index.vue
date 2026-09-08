<script setup lang="ts">
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Copy,
  Flame,
  Layers,
  PauseCircle,
  Pencil,
  Plus,
  Search,
  Settings2,
  Trash2,
  MapPin,
  X,
} from "lucide-vue-next";
import { emergencyEquipmentTypeApi } from "~/api/emergency-equipment-type";
import type { EmergencyEquipmentType, EmergencyEquipmentTypePayload, EmergencyEquipmentTypeTipOption } from "~/types/emergency-equipment";
import ConfirmationModal from "~/components/ConfirmationModal.vue";

const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme();
const themeColor = computed(() => workspaceColor.value || "#465fff");

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => Number(route.params.tenantId ?? 0));

const equipmentTypes = ref<EmergencyEquipmentType[]>([]);
const loading = ref(false);
const saving = ref(false);
const errorMessage = ref<string | null>(null);

const search = ref("");
const statusFilter = ref<"all" | "active" | "passive">("all");
const checklistFilter = ref<"all" | "defined" | "missing">("all");

const hasFilters = computed(
  () => Boolean(search.value.trim()) || statusFilter.value !== "all" || checklistFilter.value !== "all",
);

const clearFilters = () => {
  search.value = "";
  statusFilter.value = "all";
  checklistFilter.value = "all";
};

const load = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    const response = await emergencyEquipmentTypeApi.list();
    equipmentTypes.value = response.data;
  } catch (error) {
    errorMessage.value = "Ekipman türleri yüklenirken bir hata oluştu.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);
onMounted(() => loadWorkspaceTheme(tenantId.value));
watch(tenantId, (id) => loadWorkspaceTheme(id));

const checklistCount = (type: EmergencyEquipmentType) => type.checklist_items_count ?? 0;

// Kategoriler (parent_id yok) isme göre sıralanır, her kategorinin hemen
// altına kendi alt kategorileri (kapasiteye göre sıralı) eklenir — böylece
// tabloda ayrı bir sayfa açmadan girintili/gruplu bir hiyerarşi gösterilir.
const orderedTypes = computed(() => {
  const all = equipmentTypes.value;
  const roots = all.filter((t) => t.parent_id === null).sort((a, b) => a.name.localeCompare(b.name, "tr"));
  const result: EmergencyEquipmentType[] = [];
  for (const root of roots) {
    result.push(root);
    const children = all
      .filter((t) => t.parent_id === root.id)
      .sort((a, b) => Number(a.capacity_kg ?? 0) - Number(b.capacity_kg ?? 0));
    result.push(...children);
  }
  return result;
});

const displayName = (type: EmergencyEquipmentType) => {
  if (type.tip && type.capacity_kg) return `${type.tip} - ${Number(type.capacity_kg)} kg`;
  if (type.tip) return type.tip;
  if (type.capacity_kg) return `${type.name} - ${Number(type.capacity_kg)} kg`;
  return type.name;
};

const filtered = computed(() =>
  orderedTypes.value.filter((type) => {
    const term = search.value.trim().toLocaleLowerCase("tr-TR");
    const matchesSearch =
      !term ||
      type.name.toLocaleLowerCase("tr-TR").includes(term) ||
      (type.description ?? "").toLocaleLowerCase("tr-TR").includes(term);
    const matchesStatus =
      statusFilter.value === "all" ||
      (statusFilter.value === "active" ? type.is_active : !type.is_active);
    const matchesChecklist =
      checklistFilter.value === "all" ||
      (checklistFilter.value === "defined" ? checklistCount(type) > 0 : checklistCount(type) === 0);
    return matchesSearch && matchesStatus && matchesChecklist;
  }),
);

const stats = computed(() => ({
  total: equipmentTypes.value.length,
  active: equipmentTypes.value.filter((t) => t.is_active).length,
  passive: equipmentTypes.value.filter((t) => !t.is_active).length,
  locations: equipmentTypes.value.reduce((sum, t) => sum + (t.location_equipment_count ?? 0), 0),
}));

// Sayfalama
const pageSize = ref(8);
const pageSizeOptions = [8, 16, 24, 50];
const currentPage = ref(1);

watch([search, statusFilter, checklistFilter, pageSize], () => {
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
const form = reactive<EmergencyEquipmentTypePayload>({
  name: "",
  description: "",
  parent_id: null,
  capacity_kg: null,
  tip: null,
  inspection_frequency_days: 30,
  is_active: true,
});

const parentName = computed(() => equipmentTypes.value.find((t) => t.id === form.parent_id)?.name ?? "");

// Tip seçenekleri her zaman ANA KATEGORİ üzerinden yönetilir: kategori
// düzenlenirken kendi tip listesi (ekleme/kaldırma), alt kategori
// oluşturulurken/düzenlenirken üst kategorinin tip listesi (sadece seçim
// için) gösterilir.
const tipOptions = ref<EmergencyEquipmentTypeTipOption[]>([]);
const newTipLabel = ref("");
const tipOptionSaving = ref(false);

const loadTipOptions = async (equipmentTypeId: number) => {
  try {
    const response = await emergencyEquipmentTypeApi.tipOptions(equipmentTypeId);
    tipOptions.value = response.data;
  } catch (error) {
    tipOptions.value = [];
  }
};

const addTipOption = async () => {
  if (!editingId.value || !newTipLabel.value.trim() || tipOptionSaving.value) return;
  tipOptionSaving.value = true;
  try {
    await emergencyEquipmentTypeApi.addTipOption(editingId.value, { label: newTipLabel.value.trim(), sort_order: tipOptions.value.length });
    newTipLabel.value = "";
    await loadTipOptions(editingId.value);
  } catch (error) {
    errorMessage.value = "Tip seçeneği eklenirken bir hata oluştu.";
  } finally {
    tipOptionSaving.value = false;
  }
};

const removeTipOption = async (option: EmergencyEquipmentTypeTipOption) => {
  if (!editingId.value) return;
  try {
    await emergencyEquipmentTypeApi.removeTipOption(editingId.value, option.id);
    tipOptions.value = tipOptions.value.filter((t) => t.id !== option.id);
  } catch (error) {
    errorMessage.value = "Tip seçeneği kaldırılırken bir hata oluştu.";
  }
};

const openCreate = () => {
  editingId.value = null;
  form.name = "";
  form.description = "";
  form.parent_id = null;
  form.capacity_kg = null;
  form.tip = null;
  form.inspection_frequency_days = 30;
  form.is_active = true;
  tipOptions.value = [];
  modalOpen.value = true;
};

const openCreateChild = async (parent: EmergencyEquipmentType) => {
  editingId.value = null;
  form.name = parent.name;
  form.description = "";
  form.parent_id = parent.id;
  form.capacity_kg = null;
  form.tip = null;
  form.inspection_frequency_days = null;
  form.is_active = true;
  tipOptions.value = [];
  modalOpen.value = true;
  await loadTipOptions(parent.id);
};

const openEdit = async (type: EmergencyEquipmentType) => {
  editingId.value = type.id;
  form.name = type.name;
  form.description = type.description ?? "";
  form.parent_id = type.parent_id;
  form.capacity_kg = type.capacity_kg ? Number(type.capacity_kg) : null;
  form.tip = type.tip ?? null;
  form.inspection_frequency_days = type.inspection_frequency_days ?? null;
  form.is_active = type.is_active;
  tipOptions.value = [];
  modalOpen.value = true;
  // Alt kategori için üst kategorinin (seçim için), kategori için kendi
  // (yönetim için) tip listesi çekilir.
  await loadTipOptions(type.parent_id ?? type.id);
};

const closeModal = () => {
  modalOpen.value = false;
  editingId.value = null;
  newTipLabel.value = "";
};

const submit = async () => {
  if (!form.name.trim()) return;
  if (form.parent_id && !form.capacity_kg) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await emergencyEquipmentTypeApi.update(editingId.value, form);
    } else {
      await emergencyEquipmentTypeApi.create(form);
    }
    closeModal();
    await load();
  } catch (error) {
    errorMessage.value = "Ekipman türü kaydedilirken bir hata oluştu.";
  } finally {
    saving.value = false;
  }
};

const duplicating = ref<number | null>(null);
const duplicateType = async (type: EmergencyEquipmentType) => {
  duplicating.value = type.id;
  try {
    await emergencyEquipmentTypeApi.create({
      name: `${type.name} (Kopya)`,
      description: type.description,
      inspection_frequency_days: type.inspection_frequency_days,
      is_active: type.is_active,
    });
    await load();
  } catch (error) {
    errorMessage.value = "Ekipman türü kopyalanırken bir hata oluştu.";
  } finally {
    duplicating.value = null;
  }
};

const deleteTarget = ref<EmergencyEquipmentType | null>(null);
const confirmationOpen = ref(false);
const requestDelete = (type: EmergencyEquipmentType) => {
  deleteTarget.value = type;
  confirmationOpen.value = true;
};
const confirmDelete = async () => {
  if (!deleteTarget.value) return;
  const id = deleteTarget.value.id;
  confirmationOpen.value = false;
  deleteTarget.value = null;
  try {
    await emergencyEquipmentTypeApi.remove(id);
    await load();
  } catch (error) {
    errorMessage.value = "Ekipman türü silinirken bir hata oluştu (kullanan şubeler olabilir).";
  }
};

const goToChecklist = (type: EmergencyEquipmentType) => {
  navigateTo(`/tenants/${tenantId.value}/fire-safety/equipment-types/checklist?type=${type.id}`);
};

const frequencyLabel = (days: number | null) => {
  if (!days) return "—";
  if (days === 30) return "Aylık";
  if (days === 90) return "3 Aylık";
  if (days === 180) return "6 Aylık";
  if (days === 365) return "Yıllık";
  return `${days} günde bir`;
};
</script>

<template>
  <div class="font-outfit" :style="{ '--wc': themeColor }">
    <div class="mx-auto w-full max-w-[1400px]">
      <nav class="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>Yangın Modülü</span>
        <ChevronRight :size="12" />
        <span class="font-medium text-gray-500 dark:text-gray-400">Ekipman Türleri</span>
      </nav>

      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Acil Durum Ekipmanı Türleri</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Şubelerde takip edilecek acil durum ekipmanı türlerini ve her tür için denetimde kontrol edilecek checklist maddelerini yönetin.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg bg-[var(--wc)] px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:brightness-90"
          @click="openCreate"
        >
          <Plus :size="16" />Yeni Ekipman Türü Ekle
        </button>
      </div>

      <div class="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10"><Flame :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.total }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Toplam Ekipman Türü</p></div>
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
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10"><MapPin :size="19" /></span>
          <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.locations }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Kullanan Şube</p></div>
        </div>
      </div>

      <section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.4fr)_1fr_1fr_auto]">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" placeholder="Ekipman türü adı veya açıklama ile ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
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
            <select v-model="checklistFilter" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
              <option value="all">Tüm Checklist Durumları</option>
              <option value="defined">Checklist Tanımlı</option>
              <option value="missing">Checklist Tanımlanmadı</option>
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
                <th class="w-12 px-4 py-3 font-medium">#</th>
                <th class="px-4 py-3 font-medium">Ekipman Türü</th>
                <th class="px-4 py-3 font-medium">Açıklama</th>
                <th class="px-4 py-3 text-center font-medium">Denetim Sıklığı</th>
                <th class="px-4 py-3 text-center font-medium">Checklist Madde Sayısı</th>
                <th class="px-4 py-3 font-medium">Kullanan Şube</th>
                <th class="px-4 py-3 font-medium">Durum</th>
                <th class="px-4 py-3 text-right font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr v-for="(type, index) in paged" :key="type.id" class="text-sm">
                <td class="px-4 py-3 text-gray-400">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2.5" :class="type.parent_id ? 'pl-6' : ''">
                    <span v-if="type.parent_id" class="text-gray-300 dark:text-gray-600">└</span>
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300"><Flame :size="15" /></span>
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ displayName(type) }}</span>
                    <span v-if="!type.parent_id && (type.children_count ?? 0) > 0" class="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">{{ type.children_count }} alt kategori</span>
                  </div>
                </td>
                <td class="max-w-[240px] truncate px-4 py-3 text-gray-500 dark:text-gray-400">{{ type.description || "—" }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ frequencyLabel(type.inspection_frequency_days) }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ type.parent_id ? "—" : checklistCount(type) }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ type.location_equipment_count ?? 0 }}</td>
                <td class="px-4 py-3">
                  <span :class="['inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', type.is_active ? 'bg-success-50 text-success-600 dark:bg-success-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5']">
                    <span :class="['h-1.5 w-1.5 rounded-full', type.is_active ? 'bg-success-500' : 'bg-gray-400']" />{{ type.is_active ? "Aktif" : "Pasif" }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <button v-if="!type.parent_id" type="button" title="Alt Kategori Ekle" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="openCreateChild(type)"><Layers :size="15" /></button>
                    <button type="button" title="Checklist Ata" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="goToChecklist(type)"><ClipboardList :size="15" /></button>
                    <button type="button" title="Düzenle" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="openEdit(type)"><Pencil :size="15" /></button>
                    <button v-if="!type.parent_id" type="button" title="Kopyala" :disabled="duplicating === type.id" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/5" @click="duplicateType(type)"><Copy :size="15" /></button>
                    <button type="button" title="Sil" class="flex h-8 w-8 items-center justify-center rounded-lg text-error-500 transition hover:bg-error-50 dark:hover:bg-error-500/10" @click="requestDelete(type)"><Trash2 :size="15" /></button>
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
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-brand-500 shadow-theme-xs dark:bg-white/10"><Flame :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ekipman Türü Nedir?</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Şubelerde bulunan acil durum ekipmanlarının (örn. yangın tüpü) türünü ifade eder. Her tür için denetim sıklığı ve kontrol edilecek checklist maddeleri tanımlanır.</p>
            </div>
          </div>
        </div>
        <button type="button" class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 text-left transition hover:bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06] dark:hover:bg-indigo-500/10" @click="paged[0] && goToChecklist(paged[0])">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-theme-xs dark:bg-white/10"><Settings2 :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Checklist Maddeleri</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Denetçi sahada bu ekipmanı kontrol ederken karşılaştığı sorunları (ör. "Manometre Basınç Düşük") bu listeden işaretler.</p>
              <span class="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">Nasıl Tanımlanır? <ChevronRight :size="13" /></span>
            </div>
          </div>
        </button>
        <div class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-500/20 dark:bg-indigo-500/[0.06]">
          <div class="flex items-start gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-theme-xs dark:bg-white/10"><MapPin :size="17" /></span>
            <div>
              <h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Nerede Kullanılır?</h3>
              <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Bir şubeye eklenen her ekipman, buradaki türe bağlanır. Denetim yapıldığında checklist bu türe göre gösterilir ve raporlara yansır.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ editingId ? "Ekipman Türünü Düzenle" : form.parent_id ? "Yeni Alt Kategori" : "Yeni Ekipman Türü" }}</h2>
          <p v-if="form.parent_id && !editingId" class="mt-1 text-xs text-gray-500 dark:text-gray-400">Üst Kategori: <span class="font-medium text-gray-700 dark:text-gray-300">{{ parentName }}</span></p>
          <form class="mt-4 space-y-4" @submit.prevent="submit">
            <div v-if="!form.parent_id">
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Ekipman Türü Adı <span class="text-error-500">*</span></label>
              <input v-model="form.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" placeholder="Örn. Yangın Tüpü" />
            </div>
            <template v-if="form.parent_id">
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Tip</label>
                <select v-model="form.tip" class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option :value="null">Tip seçiniz</option>
                  <option v-for="opt in tipOptions" :key="opt.id" :value="opt.label">{{ opt.label }}</option>
                </select>
                <p v-if="!tipOptions.length" class="mt-1.5 text-xs text-gray-400">Bu kategori için tanımlı tip seçeneği yok — ana kategoriyi düzenleyerek ekleyebilirsiniz.</p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Kapasite (kg) <span class="text-error-500">*</span></label>
                <input v-model.number="form.capacity_kg" required type="number" min="0" step="0.5" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" placeholder="Örn. 6" />
              </div>
            </template>
            <div v-if="editingId && !form.parent_id">
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Tip Seçenekleri <span class="font-normal text-gray-400">(alt kategoriler için)</span></label>
              <div class="flex flex-wrap gap-2">
                <span v-for="opt in tipOptions" :key="opt.id" class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
                  {{ opt.label }}
                  <button type="button" class="text-gray-400 hover:text-error-500" @click="removeTipOption(opt)"><X :size="12" /></button>
                </span>
                <span v-if="!tipOptions.length" class="text-xs text-gray-400">Henüz tip seçeneği eklenmedi.</span>
              </div>
              <div class="mt-2 flex gap-2">
                <input v-model="newTipLabel" type="text" placeholder="Örn. CO2" class="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @keydown.enter.prevent="addTipOption" />
                <button type="button" :disabled="!newTipLabel.trim() || tipOptionSaving" class="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="addTipOption">
                  <Plus :size="14" />Ekle
                </button>
              </div>
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
              <textarea v-model="form.description" rows="2" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Denetim Sıklığı (gün)</label>
              <input v-model.number="form.inspection_frequency_days" type="number" min="1" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" placeholder="Örn. 30 (Aylık)" />
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
      title="Ekipman Türünü Sil"
      :message="`'${deleteTarget?.name ?? ''}' ekipman türünü silmek istediğinize emin misiniz?`"
      @confirm="confirmDelete"
      @update:open="confirmationOpen = $event"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
