<script setup lang="ts">
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import { locationApi, type OperationalRegion } from "~/api/location";

const props = defineProps<{ locationId: number; search?: string; statusFilter?: "all" | "active" | "passive" }>();
const emit = defineEmits<{ created: []; updated: []; deleted: [] }>();
const showCreate = ref(false);
const loading = ref(false);
const error = ref("");
const areas = ref<OperationalRegion[]>([]);

const filteredAreas = computed(() => {
  const term = (props.search || "").trim().toLocaleLowerCase("tr-TR");
  return areas.value.filter(x => (!term || `${x.name} ${x.type}`.toLocaleLowerCase("tr-TR").includes(term)) && (props.statusFilter === "all" || !props.statusFilter || (x.is_active ? "active" : "passive") === props.statusFilter));
});

async function load() {
  loading.value = true; error.value = "";
  try { areas.value = await locationApi.operationalRegions(props.locationId); }
  catch (e: any) { error.value = e?.data?.message || e?.message || "Operasyonel alanlar yüklenemedi."; }
  finally { loading.value = false; }
}
async function createArea(payload: { name: string; type: string; is_active: boolean }) {
  await locationApi.createOperationalRegion(props.locationId, payload); showCreate.value = false; await load(); emit("created");
}
async function editArea(area: OperationalRegion) {
  const name = window.prompt("Operasyonel alan adı", area.name); if (!name?.trim()) return;
  try { await locationApi.updateOperationalRegion(props.locationId, area.id, { name: name.trim(), type: area.type, is_active: area.is_active }); await load(); emit("updated"); }
  catch (e: any) { error.value = e?.data?.message || e?.message || "Operasyonel alan güncellenemedi."; }
}
async function deleteArea(area: OperationalRegion) {
  if (!window.confirm(`"${area.name}" silinsin mi?`)) return;
  try { await locationApi.removeOperationalRegion(props.locationId, area.id); await load(); emit("deleted"); }
  catch (e: any) { error.value = e?.data?.message || e?.message || "Operasyonel alan silinemedi."; }
}
onMounted(load);
defineExpose({ load });
</script>
<template>
  <div>
    <div v-if="error" class="mb-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ error }}</div>
    <div v-if="loading" class="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
    <div v-else class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
      <div class="flex items-center justify-between border-b border-gray-100 px-4 py-3"><span class="text-sm font-semibold text-gray-800">Operasyonel Alanlar</span><button class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white" @click="showCreate=true"><Plus :size="15"/> Ekle</button></div>
      <table class="w-full text-left"><thead class="bg-gray-50"><tr><th class="px-4 py-3 text-xs text-gray-500">Alan</th><th class="px-4 py-3 text-xs text-gray-500">Tip</th><th class="px-4 py-3 text-xs text-gray-500">Durum</th><th class="px-4 py-3 text-right text-xs text-gray-500">İşlemler</th></tr></thead><tbody class="divide-y divide-gray-100"><tr v-for="area in filteredAreas" :key="area.id"><td class="px-4 py-4 text-sm font-semibold">{{ area.name }}</td><td class="px-4 py-4 text-sm text-gray-500">{{ area.type }}</td><td class="px-4 py-4 text-sm">{{ area.is_active ? "Aktif" : "Pasif" }}</td><td class="px-4 py-4"><div class="flex justify-end gap-2"><button class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200" @click="editArea(area)"><Pencil :size="15"/></button><button class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-error-600" @click="deleteArea(area)"><Trash2 :size="15"/></button></div></td></tr><tr v-if="!filteredAreas.length"><td colspan="4" class="px-4 py-10 text-center text-sm text-gray-500">Operasyonel alan bulunamadı.</td></tr></tbody></table>
    </div>
    <OperationalAreaCreateModal v-model="showCreate" @save="createArea" />
  </div>
</template>
