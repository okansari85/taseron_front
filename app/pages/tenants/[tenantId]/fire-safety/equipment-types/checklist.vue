<script setup lang="ts">
import {
  ChevronRight,
  ClipboardList,
  Flame,
  Info,
  ListChecks,
  Pencil,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
} from "lucide-vue-next";
import { emergencyEquipmentTypeApi } from "~/api/emergency-equipment-type";
import type { EmergencyEquipmentChecklistItem, EmergencyEquipmentType, EmergencyEquipmentTypePayload } from "~/types/emergency-equipment";
import ConfirmationModal from "~/components/ConfirmationModal.vue";

const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme();
const themeColor = computed(() => workspaceColor.value || "#465fff");

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => Number(route.params.tenantId ?? 0));

const equipmentTypes = ref<EmergencyEquipmentType[]>([]);
const search = ref("");
const selectedId = ref<number | null>(null);
const items = ref<EmergencyEquipmentChecklistItem[]>([]);
const loadingItems = ref(false);
const errorMessage = ref<string | null>(null);

// Kategoriler isme göre sıralanır, her kategorinin hemen altına kendi alt
// kategorileri (kapasiteye göre sıralı) eklenir — index.vue'daki gruplama ile
// aynı mantık, tek tabloda hiyerarşiyi girintili göstermek için.
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

const filteredTypes = computed(() => {
  const term = search.value.trim().toLocaleLowerCase("tr-TR");
  if (!term) return orderedTypes.value;
  return orderedTypes.value.filter((t) => t.name.toLocaleLowerCase("tr-TR").includes(term));
});

const selectedType = computed(() => equipmentTypes.value.find((t) => t.id === selectedId.value) ?? null);
const isSubCategory = computed(() => Boolean(selectedType.value?.parent_id));
const parentOfSelected = computed(() => equipmentTypes.value.find((t) => t.id === selectedType.value?.parent_id) ?? null);

const loadItems = async () => {
  if (!selectedId.value) {
    items.value = [];
    return;
  }
  loadingItems.value = true;
  errorMessage.value = null;
  try {
    const response = await emergencyEquipmentTypeApi.checklistItems(selectedId.value);
    items.value = response.data;
  } catch (error) {
    errorMessage.value = "Checklist maddeleri yüklenirken bir hata oluştu.";
  } finally {
    loadingItems.value = false;
  }
};

watch(selectedId, loadItems);

const reloadTypes = async () => {
  const response = await emergencyEquipmentTypeApi.list();
  equipmentTypes.value = response.data;
};

onMounted(() => loadWorkspaceTheme(tenantId.value));
watch(tenantId, (id) => loadWorkspaceTheme(id));

onMounted(async () => {
  await reloadTypes();
  const query = route.query.type;
  const preselect = query ? Number(Array.isArray(query) ? query[0] : query) : null;
  selectedId.value = preselect && equipmentTypes.value.some((t) => t.id === preselect) ? preselect : (equipmentTypes.value[0]?.id ?? null);
});

const selectType = (id: number) => {
  selectedId.value = id;
};

// Madde ekle/düzenle modalı
const modalOpen = ref(false);
const editingItem = ref<EmergencyEquipmentChecklistItem | null>(null);
const saving = ref(false);
const form = reactive({ label: "", sort_order: 0 });

const openAdd = () => {
  editingItem.value = null;
  form.label = "";
  form.sort_order = items.value.length;
  modalOpen.value = true;
};

const openEditItem = (item: EmergencyEquipmentChecklistItem) => {
  editingItem.value = item;
  form.label = item.label;
  form.sort_order = item.sort_order;
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingItem.value = null;
};

const submit = async () => {
  if (!selectedId.value || !form.label.trim()) return;
  saving.value = true;
  try {
    if (editingItem.value) {
      await emergencyEquipmentTypeApi.updateChecklistItem(selectedId.value, editingItem.value.id, {
        label: form.label,
        sort_order: form.sort_order,
      });
    } else {
      await emergencyEquipmentTypeApi.addChecklistItem(selectedId.value, {
        label: form.label,
        sort_order: form.sort_order,
      });
    }
    closeModal();
    await loadItems();
    await reloadTypes();
  } catch (error) {
    errorMessage.value = "Checklist maddesi kaydedilirken bir hata oluştu.";
  } finally {
    saving.value = false;
  }
};

const togglingId = ref<number | null>(null);
const toggleExclusion = async (item: EmergencyEquipmentChecklistItem) => {
  if (!selectedId.value || togglingId.value) return;
  togglingId.value = item.id;
  errorMessage.value = null;
  try {
    if (item.is_excluded) {
      await emergencyEquipmentTypeApi.includeChecklistItem(selectedId.value, item.id);
    } else {
      await emergencyEquipmentTypeApi.excludeChecklistItem(selectedId.value, item.id);
    }
    await loadItems();
  } catch (error) {
    errorMessage.value = "Kapsam dışı durumu güncellenirken bir hata oluştu.";
  } finally {
    togglingId.value = null;
  }
};

const deleteTarget = ref<EmergencyEquipmentChecklistItem | null>(null);
const confirmationOpen = ref(false);
const requestDelete = (item: EmergencyEquipmentChecklistItem) => {
  deleteTarget.value = item;
  confirmationOpen.value = true;
};
const confirmDelete = async () => {
  if (!deleteTarget.value || !selectedId.value) return;
  const id = deleteTarget.value.id;
  confirmationOpen.value = false;
  deleteTarget.value = null;
  try {
    await emergencyEquipmentTypeApi.removeChecklistItem(selectedId.value, id);
    await loadItems();
    await reloadTypes();
  } catch (error) {
    errorMessage.value = "Checklist maddesi kaldırılırken bir hata oluştu.";
  }
};

// Yangın Tüpü için hazır/nihai checklist listesi — tek tıkla toplu ekleme
const STANDARD_FIRE_EXTINGUISHER_ITEMS = [
  "Askı Aparatı Kırık",
  "Boş",
  "Eksik (Serbest Çıkış, Klips, Etiket, Emniyet Pimi)",
  "Hasarlı Tüp (Ezik, Paslı)",
  "Manometre Basınç Düşük",
  "Manometre Basınç Yüksek",
  "Mühür Yok",
  "Tekerlek Hasarı",
  "Son Kullanma Tarihi Geçmiş",
  "Dolumda",
  "Vana, Tetik Arızası",
  "Kullanma Talimatı Eksik",
  "Yangın Söndürücü Hatalı Yerde",
  "Basınç Göstergesi (Kırık, Eksik)",
  "Kullanma Talimatı Okunaklı Değil",
  "Nozul Tıkalı",
  "Manometre Basıncı Okunamıyor",
  "Hidrostatik Test Tarihi Geçmiş",
];

const seedingStandard = ref(false);
const seedStandardChecklist = async () => {
  if (!selectedId.value) return;
  seedingStandard.value = true;
  errorMessage.value = null;
  try {
    const existingLabels = new Set(items.value.map((i) => i.label));
    let order = items.value.length;
    for (const label of STANDARD_FIRE_EXTINGUISHER_ITEMS) {
      if (existingLabels.has(label)) continue;
      await emergencyEquipmentTypeApi.addChecklistItem(selectedId.value, { label, sort_order: order });
      order += 1;
    }
    await loadItems();
    await reloadTypes();
  } catch (error) {
    errorMessage.value = "Standart checklist eklenirken bir hata oluştu.";
  } finally {
    seedingStandard.value = false;
  }
};

// Ekipman türü bilgilerini düzenle modalı
const typeModalOpen = ref(false);
const typeSaving = ref(false);
const typeForm = reactive<EmergencyEquipmentTypePayload>({ name: "", description: "", inspection_frequency_days: null, is_active: true });

const openTypeEdit = () => {
  if (!selectedType.value) return;
  typeForm.name = selectedType.value.name;
  typeForm.description = selectedType.value.description ?? "";
  typeForm.inspection_frequency_days = selectedType.value.inspection_frequency_days ?? null;
  typeForm.is_active = selectedType.value.is_active;
  typeModalOpen.value = true;
};

const closeTypeModal = () => {
  typeModalOpen.value = false;
};

const submitType = async () => {
  if (!selectedId.value || !typeForm.name.trim()) return;
  typeSaving.value = true;
  try {
    await emergencyEquipmentTypeApi.update(selectedId.value, typeForm);
    closeTypeModal();
    await reloadTypes();
  } catch (error) {
    errorMessage.value = "Ekipman türü bilgileri kaydedilirken bir hata oluştu.";
  } finally {
    typeSaving.value = false;
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
        <span>Yangın Modülü</span>
        <ChevronRight :size="12" />
        <NuxtLink :to="`/tenants/${tenantId}/fire-safety/equipment-types`" class="hover:text-gray-600 dark:hover:text-gray-300">Ekipman Türleri</NuxtLink>
        <ChevronRight :size="12" />
        <span class="font-medium text-gray-500 dark:text-gray-400">Checklist Atama</span>
      </nav>

      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Ekipman Türlerine Checklist Atama</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Seçilen ekipman türü için, sahada denetim yapılırken kontrol edilecek checklist maddelerini tanımlayın. İşaretlenen madde, o denetimde tespit edilen sorunu ifade eder.</p>
        </div>
        <NuxtLink :to="`/tenants/${tenantId}/fire-safety/equipment-types`" class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5">
          <Pencil :size="15" />Ekipman Türlerini Yönet
        </NuxtLink>
      </div>

      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[320px_1fr]">
        <!-- Sol: ekipman türü listesi -->
        <div class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="border-b border-gray-100 p-3 dark:border-gray-800">
            <div class="relative">
              <Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input v-model="search" type="search" placeholder="Ekipman türü ile ara..." class="h-10 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>
          <div class="max-h-[640px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
            <button
              v-for="type in filteredTypes"
              :key="type.id"
              type="button"
              class="flex w-full items-center gap-3 px-4 py-3 text-left transition"
              :class="type.id === selectedId ? 'dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'"
              :style="type.id === selectedId ? { backgroundColor: themeColor + '14' } : undefined"
              @click="selectType(type.id)"
            >
              <span v-if="type.parent_id" class="shrink-0 pl-3 text-gray-300 dark:text-gray-600">└</span>
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" :class="type.id === selectedId ? 'text-white' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300'" :style="type.id === selectedId ? { backgroundColor: themeColor } : undefined"><Flame :size="16" /></span>
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium" :class="type.id !== selectedId && 'text-gray-700 dark:text-gray-200'" :style="type.id === selectedId ? { color: themeColor } : undefined">{{ displayName(type) }}</span>
                <span class="block truncate text-xs text-gray-400">{{ type.description || "Açıklama yok" }}</span>
              </span>
              <span v-if="!type.parent_id" class="shrink-0 text-xs text-gray-400">{{ type.checklist_items_count ?? 0 }} madde</span>
              <ChevronRight :size="15" class="shrink-0 text-gray-300" />
            </button>
            <p v-if="filteredTypes.length === 0" class="px-4 py-8 text-center text-sm text-gray-400">Ekipman türü bulunamadı.</p>
          </div>
        </div>

        <!-- Sağ: seçili türün checklist maddeleri -->
        <div v-if="selectedType" class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 p-4 dark:border-gray-800">
            <div class="flex items-start gap-3">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg dark:bg-white/10" :style="{ backgroundColor: themeColor + '14', color: themeColor }"><Flame :size="18" /></span>
              <div>
                <div class="flex items-center gap-2">
                  <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ displayName(selectedType) }}</h2>
                  <span :class="['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', selectedType.is_active ? 'bg-success-50 text-success-600 dark:bg-success-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5']">
                    <span :class="['h-1.5 w-1.5 rounded-full', selectedType.is_active ? 'bg-success-500' : 'bg-gray-400']" />{{ selectedType.is_active ? "Aktif" : "Pasif" }}
                  </span>
                </div>
                <p class="mt-0.5 text-xs text-gray-400">{{ selectedType.description || "Açıklama yok" }}</p>
              </div>
            </div>
            <button type="button" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="openTypeEdit">
              <Pencil :size="14" />Ekipman Türü Bilgilerini Düzenle
            </button>
          </div>

          <div v-if="!isSubCategory" class="flex flex-col gap-3 border-b border-gray-100 bg-info-50/60 px-4 py-3 dark:border-gray-800 dark:bg-info-500/10 sm:flex-row sm:items-center sm:justify-between">
            <p class="flex items-start gap-2 text-xs leading-5 text-info-700 dark:text-info-400">
              <Info :size="15" class="mt-0.5 shrink-0" />
              Bu ekipman türü için checklist maddelerini tanımlayın. Denetçi sahada bu ekipmanı kontrol ederken, tespit ettiği sorunları bu listeden işaretler.
            </p>
            <div class="flex shrink-0 items-center gap-2">
              <button
                v-if="selectedType.name.toLocaleLowerCase('tr-TR').includes('tüp')"
                type="button"
                :disabled="seedingStandard"
                class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="seedStandardChecklist"
              >
                <Sparkles :size="15" />{{ seedingStandard ? "Ekleniyor..." : "18 Standart Maddeyi Ekle" }}
              </button>
              <button type="button" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold text-white transition hover:brightness-90" :style="{ backgroundColor: themeColor }" @click="openAdd">
                <Plus :size="15" />Madde Ekle
              </button>
            </div>
          </div>
          <div v-else class="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-info-50/60 px-4 py-3 dark:border-gray-800 dark:bg-info-500/10">
            <p class="flex items-start gap-2 text-xs leading-5 text-info-700 dark:text-info-400">
              <Info :size="15" class="mt-0.5 shrink-0" />
              Bu bir alt kategoridir. Maddeler <span class="font-semibold">"{{ parentOfSelected?.name }}"</span> kategorisinden miras alınır; burada yalnızca bu alt kategori için kapsam dışı bırakabilirsiniz.
            </p>
            <button v-if="parentOfSelected" type="button" class="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-gray-200 px-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="selectType(parentOfSelected.id)">
              Ana Kategoriye Git
            </button>
          </div>

          <p v-if="errorMessage" class="px-4 pt-3 text-sm text-error-500">{{ errorMessage }}</p>

          <div class="overflow-x-auto">
            <table class="w-full text-left">
              <thead class="border-b border-gray-100 bg-gray-50/60 text-xs uppercase tracking-wide text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <th class="w-10 px-4 py-3 font-medium">#</th>
                  <th class="px-4 py-3 font-medium">Checklist Maddesi</th>
                  <th class="px-4 py-3 font-medium">Sıra</th>
                  <th class="px-4 py-3 text-right font-medium">{{ isSubCategory ? "Kapsam Durumu" : "İşlemler" }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="(item, index) in pagedItems" :key="item.id" class="text-sm" :class="{ 'opacity-50': item.is_excluded }">
                  <td class="px-4 py-3 text-gray-400">{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2.5">
                      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-300"><ListChecks :size="13" /></span>
                      <span class="font-medium text-gray-800 dark:text-white/90" :class="{ 'line-through': item.is_excluded }">{{ item.label }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-600 dark:text-gray-300">{{ item.sort_order }}</td>
                  <td v-if="isSubCategory" class="px-4 py-3">
                    <div class="flex items-center justify-end gap-2">
                      <span class="text-xs" :class="item.is_excluded ? 'text-gray-400' : 'text-success-600'">{{ item.is_excluded ? "Kapsam Dışı" : "Kapsamda" }}</span>
                      <button
                        type="button"
                        role="switch"
                        :aria-checked="!item.is_excluded"
                        :disabled="togglingId === item.id"
                        class="relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60"
                        :class="item.is_excluded ? 'bg-gray-200 dark:bg-white/10' : 'bg-success-500'"
                        @click="toggleExclusion(item)"
                      >
                        <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition" :class="item.is_excluded ? 'left-0.5' : 'left-5.5'" />
                      </button>
                    </div>
                  </td>
                  <td v-else class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1.5">
                      <button type="button" title="Düzenle" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/5" @click="openEditItem(item)"><Pencil :size="14" /></button>
                      <button type="button" title="Kaldır" class="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-error-500 transition hover:bg-error-50 dark:border-gray-700 dark:hover:bg-error-500/10" @click="requestDelete(item)"><Trash2 :size="14" /></button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!loadingItems && pagedItems.length === 0">
                  <td colspan="4" class="px-4 py-10 text-center text-sm text-gray-400">Bu ekipman türü için henüz checklist maddesi tanımlanmadı.</td>
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
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">Denetçi sahada bu ekipman türüne ait bir kaydı kontrol ederken, karşılaştığı sorunları bu listeden işaretler. Hiçbir madde işaretlenmezse denetim "Geçti" olarak kaydedilir.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white p-10 text-sm text-gray-400 dark:border-gray-800 dark:bg-white/[0.02]">
          Soldan bir ekipman türü seçin.
        </div>
      </div>
    </div>

    <Transition name="fade">
      <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ editingItem ? "Checklist Maddesini Düzenle" : "Checklist Maddesi Ekle" }}</h2>
          <form class="mt-4 space-y-4" @submit.prevent="submit">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Madde <span class="text-error-500">*</span></label>
              <input v-model="form.label" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" placeholder="Örn. Manometre Basınç Düşük" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Sıra</label>
              <input v-model.number="form.sort_order" type="number" min="0" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
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
      <div v-if="typeModalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button type="button" aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeTypeModal" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Ekipman Türü Bilgilerini Düzenle</h2>
          <form class="mt-4 space-y-4" @submit.prevent="submitType">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Ekipman Türü Adı <span class="text-error-500">*</span></label>
              <input v-model="typeForm.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
              <textarea v-model="typeForm.description" rows="2" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Denetim Sıklığı (gün)</label>
              <input v-model.number="typeForm.inspection_frequency_days" type="number" min="1" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
            <label class="flex items-center gap-3"><input v-model="typeForm.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" /><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</span></label>
            <div class="flex items-center justify-end gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
              <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="closeTypeModal">İptal</button>
              <button type="submit" :disabled="typeSaving" class="inline-flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-60" :style="{ backgroundColor: themeColor }">{{ typeSaving ? "Kaydediliyor..." : "Kaydet" }}</button>
            </div>
          </form>
        </div>
      </div>
    </Transition>

    <ConfirmationModal
      :open="confirmationOpen"
      title="Checklist Maddesini Kaldır"
      :message="`'${deleteTarget?.label ?? ''}' maddesini bu ekipman türünden kaldırmak istediğinize emin misiniz?`"
      @confirm="confirmDelete"
      @update:open="confirmationOpen = $event"
    />
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity .15s ease }
.fade-enter-from, .fade-leave-to { opacity: 0 }
</style>
