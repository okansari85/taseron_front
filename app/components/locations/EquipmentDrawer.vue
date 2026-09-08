<script setup lang="ts">
import { CalendarClock, ChevronLeft, ClipboardCheck, Flame, LoaderCircle, Plus, ShieldAlert, ShieldCheck, Trash2, X } from 'lucide-vue-next'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import { emergencyEquipmentTypeApi } from '~/api/emergency-equipment-type'
import type { EmergencyEquipmentChecklistItem, EmergencyEquipmentType } from '~/types/emergency-equipment'
import type { LocationEmergencyEquipmentItem, LocationEmergencyEquipmentStatus } from '~/types/location-emergency-equipment'
import ConfirmationModal from '~/components/ConfirmationModal.vue'

const props = defineProps<{ modelValue: boolean; entityId: number | null; entityLabel?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { $toast } = useNuxtApp()

const close = () => emit('update:modelValue', false)

type View = 'list' | 'add' | 'inspect'
const view = ref<View>('list')

const equipment = ref<LocationEmergencyEquipmentItem[]>([])
const equipmentTypes = ref<EmergencyEquipmentType[]>([])
const loading = ref(false)
const error = ref('')

const STATUS_LABELS: Record<LocationEmergencyEquipmentStatus, string> = {
  active: 'Aktif',
  inactive: 'Pasif',
  needs_replacement: 'Değişim Gerekiyor',
}

const formatDate = (value?: string | null) => {
  if (!value) return null
  try {
    return new Date(value).toLocaleDateString('tr-TR')
  } catch {
    return value
  }
}

const load = async () => {
  if (props.entityId === null) return
  loading.value = true
  error.value = ''
  try {
    const [equipmentResponse, typesResponse] = await Promise.all([
      locationEmergencyEquipmentApi.list(props.entityId),
      equipmentTypes.value.length ? Promise.resolve(null) : emergencyEquipmentTypeApi.list(),
    ])
    equipment.value = equipmentResponse.data
    if (typesResponse) equipmentTypes.value = typesResponse.data.filter(t => t.is_active && !t.children_count)
  } catch (e) {
    console.error(e)
    error.value = 'Ekipman listesi alınamadı.'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, value => {
  if (value) {
    view.value = 'list'
    load()
  }
})

// --- Ekipman ekleme ---
const addForm = ref({ equipment_type_id: null as number | null, code: '', location_note: '', install_date: '', status: 'active' as LocationEmergencyEquipmentStatus })
const saving = ref(false)
const addError = ref('')

const openAdd = () => {
  addForm.value = { equipment_type_id: equipmentTypes.value[0]?.id ?? null, code: '', location_note: '', install_date: '', status: 'active' }
  addError.value = ''
  view.value = 'add'
}

const submitAdd = async () => {
  if (props.entityId === null || !addForm.value.equipment_type_id) {
    addError.value = 'Ekipman türü seçin.'
    return
  }
  saving.value = true
  addError.value = ''
  try {
    await locationEmergencyEquipmentApi.create(props.entityId, {
      equipment_type_id: addForm.value.equipment_type_id,
      code: addForm.value.code || null,
      location_note: addForm.value.location_note || null,
      install_date: addForm.value.install_date || null,
      status: addForm.value.status,
    })
    $toast.success('Ekipman eklendi.')
    view.value = 'list'
    await load()
  } catch (e: any) {
    addError.value = e?.data?.message || e?.message || 'Ekipman eklenemedi.'
  } finally {
    saving.value = false
  }
}

// --- Silme ---
const showDeleteConfirmation = ref(false)
const deletingItem = ref<LocationEmergencyEquipmentItem | null>(null)
const deleting = ref(false)

const askDelete = (item: LocationEmergencyEquipmentItem) => {
  deletingItem.value = item
  showDeleteConfirmation.value = true
}

const confirmDelete = async () => {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    await locationEmergencyEquipmentApi.remove(deletingItem.value.id)
    equipment.value = equipment.value.filter(x => x.id !== deletingItem.value?.id)
    showDeleteConfirmation.value = false
    deletingItem.value = null
    $toast.success('Ekipman silindi.')
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Ekipman silinemedi. Denetim geçmişi varsa pasife alın.')
  } finally {
    deleting.value = false
  }
}

// --- Denetim kaydı ---
const inspectingItem = ref<LocationEmergencyEquipmentItem | null>(null)
const checklistItems = ref<EmergencyEquipmentChecklistItem[]>([])
const checklistLoading = ref(false)
const selectedIssueIds = ref<number[]>([])
const inspectionNotes = ref('')
const inspectionDate = ref(new Date().toISOString().slice(0, 10))
const inspectionError = ref('')
const submittingInspection = ref(false)

const openInspect = async (item: LocationEmergencyEquipmentItem) => {
  inspectingItem.value = item
  selectedIssueIds.value = []
  inspectionNotes.value = ''
  inspectionDate.value = new Date().toISOString().slice(0, 10)
  inspectionError.value = ''
  view.value = 'inspect'
  checklistLoading.value = true
  try {
    const response = await emergencyEquipmentTypeApi.checklistItems(item.equipment_type_id)
    checklistItems.value = response.data.filter(x => x.is_active && !x.is_excluded).sort((a, b) => a.sort_order - b.sort_order)
  } catch (e) {
    console.error(e)
    inspectionError.value = 'Checklist maddeleri yüklenemedi.'
  } finally {
    checklistLoading.value = false
  }
}

const toggleIssue = (id: number) => {
  selectedIssueIds.value = selectedIssueIds.value.includes(id)
    ? selectedIssueIds.value.filter(x => x !== id)
    : [...selectedIssueIds.value, id]
}

const backToList = () => {
  view.value = 'list'
  inspectingItem.value = null
}

const submitInspection = async () => {
  if (!inspectingItem.value) return
  submittingInspection.value = true
  inspectionError.value = ''
  try {
    await locationEmergencyEquipmentApi.createInspection(inspectingItem.value.id, {
      checklist_item_ids: selectedIssueIds.value,
      notes: inspectionNotes.value || null,
      inspected_at: inspectionDate.value || null,
    })
    $toast.success(selectedIssueIds.value.length ? 'Denetim kaydedildi: uygunsuzluk tespit edildi.' : 'Denetim kaydedildi: ekipman uygun.')
    view.value = 'list'
    inspectingItem.value = null
    await load()
  } catch (e: any) {
    inspectionError.value = e?.data?.message || e?.message || 'Denetim kaydedilemedi.'
  } finally {
    submittingInspection.value = false
  }
}

const displayTypeName = (type: { name: string; capacity_kg?: string | null; tip?: string | null }) => {
  if (type.tip && type.capacity_kg) return `${type.tip} - ${Number(type.capacity_kg)} kg`
  if (type.tip) return type.tip
  if (type.capacity_kg) return `${type.name} - ${Number(type.capacity_kg)} kg`
  return type.name
}

const resultBadge = (item: LocationEmergencyEquipmentItem) => {
  const latest = item.latest_inspection
  if (!latest) return { label: 'Henüz denetlenmedi', cls: 'bg-gray-100 text-gray-500' }
  if (latest.overall_result === 'failed') return { label: 'Uygunsuzluk Var', cls: 'bg-error-50 text-error-600' }
  return { label: 'Uygun', cls: 'bg-success-50 text-success-600' }
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[11000]">
      <button class="absolute inset-0 h-full w-full bg-slate-950/35" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[520px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="flex items-start gap-3">
            <button v-if="view !== 'list'" type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5" @click="view = 'inspect' ? backToList() : (view = 'list')">
              <ChevronLeft :size="18" />
            </button>
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10">
              <Flame :size="20" />
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white/90">
                {{ view === 'add' ? 'Ekipman Ekle' : view === 'inspect' ? 'Denetim Kaydet' : 'Acil Durum Ekipmanları' }}
              </h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ entityLabel || 'Bu şube' }}</p>
            </div>
          </div>
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200" aria-label="Kapat" @click="close">
            <X :size="20" />
          </button>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto">
          <!-- LISTE -->
          <template v-if="view === 'list'">
            <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
              <button type="button" class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-500 text-sm font-medium text-white hover:bg-brand-600" @click="openAdd">
                <Plus :size="16" /> Ekipman Ekle
              </button>
            </div>
            <div v-if="loading" class="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
            <div v-else-if="error" class="mx-6 mt-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ error }}</div>
            <div v-else class="px-3 py-3">
              <div v-for="item in equipment" :key="item.id" class="mb-2 rounded-lg border border-gray-100 p-4 dark:border-gray-800">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ item.equipment_type ? displayTypeName(item.equipment_type) : 'Ekipman' }}{{ item.code ? ` — ${item.code}` : '' }}</p>
                    <p v-if="item.location_note" class="mt-0.5 truncate text-xs text-gray-500">{{ item.location_note }}</p>
                    <div class="mt-2 flex flex-wrap items-center gap-2">
                      <span class="rounded-full px-2.5 py-1 text-xs font-medium" :class="resultBadge(item).cls">{{ resultBadge(item).label }}</span>
                      <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-500 dark:bg-white/5">{{ STATUS_LABELS[item.status] }}</span>
                    </div>
                    <p v-if="item.latest_inspection" class="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <CalendarClock :size="12" /> Son denetim: {{ formatDate(item.latest_inspection.inspected_at) }}
                    </p>
                  </div>
                  <div class="flex shrink-0 items-center gap-1.5">
                    <button title="Denetim Kaydet" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-brand-600 dark:border-gray-700" @click="openInspect(item)">
                      <ClipboardCheck :size="15" />
                    </button>
                    <button title="Sil" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-error-600 dark:border-gray-700" @click="askDelete(item)">
                      <Trash2 :size="15" />
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="!equipment.length" class="px-3 py-12 text-center text-sm text-gray-400">Bu şubeye henüz ekipman eklenmedi.</div>
            </div>
          </template>

          <!-- EKİPMAN EKLE -->
          <template v-else-if="view === 'add'">
            <div class="space-y-4 px-6 py-5">
              <div v-if="addError" class="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ addError }}</div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ekipman Türü</label>
                <select v-model.number="addForm.equipment_type_id" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                  <option v-for="t in equipmentTypes" :key="t.id" :value="t.id">{{ displayTypeName(t) }}</option>
                </select>
                <p v-if="!equipmentTypes.length" class="mt-1.5 text-xs text-gray-400">Önce Yangın Modülü &gt; Ekipman Türleri sayfasından bir tür oluşturun.</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Ekipman Kodu / Etiketi</label>
                <input v-model="addForm.code" type="text" placeholder="Örn. İDARİ BİNA-KKT-3" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Konum Notu</label>
                <input v-model="addForm.location_note" type="text" placeholder="Örn. Mutfak girişi" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Kurulum Tarihi</label>
                  <input v-model="addForm.install_date" type="date" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                  <select v-model="addForm.status" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                    <option value="active">Aktif</option>
                    <option value="inactive">Pasif</option>
                    <option value="needs_replacement">Değişim Gerekiyor</option>
                  </select>
                </div>
              </div>
            </div>
          </template>

          <!-- DENETİM KAYDET -->
          <template v-else-if="view === 'inspect'">
            <div class="space-y-4 px-6 py-5">
              <div v-if="inspectionError" class="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ inspectionError }}</div>
              <div class="rounded-lg bg-gray-50 px-4 py-3 dark:bg-white/5">
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ inspectingItem?.equipment_type ? displayTypeName(inspectingItem.equipment_type) : '' }}{{ inspectingItem?.code ? ` — ${inspectingItem.code}` : '' }}</p>
                <p v-if="inspectingItem?.equipment_type?.inspection_frequency_days" class="mt-0.5 text-xs text-gray-500">Kontrol periyodu: {{ inspectingItem.equipment_type.inspection_frequency_days }} gün</p>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Kontrol Tarihi</label>
                <input v-model="inspectionDate" type="date" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900" />
              </div>
              <div>
                <p class="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tespit Edilen Sorunlar</p>
                <p class="mb-3 text-xs text-gray-400">İşaretlenen madde bu denetimde tespit edilen sorunu belirtir. Hiçbiri işaretlenmezse ekipman "uygun" kabul edilir.</p>
                <div v-if="checklistLoading" class="py-6 text-center text-sm text-gray-500">Yükleniyor...</div>
                <div v-else class="space-y-1">
                  <label v-for="ci in checklistItems" :key="ci.id" class="flex cursor-pointer items-start gap-3 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-white/5">
                    <input type="checkbox" :checked="selectedIssueIds.includes(ci.id)" class="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-error-600" @change="toggleIssue(ci.id)" />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ ci.label }}</span>
                  </label>
                  <p v-if="!checklistItems.length" class="px-3 py-6 text-center text-xs text-gray-400">Bu ekipman türü için checklist maddesi tanımlanmamış.</p>
                </div>
              </div>
              <div>
                <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Tespitler (opsiyonel)</label>
                <textarea v-model="inspectionNotes" rows="3" placeholder="Serbest metin..." class="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" />
              </div>
              <div class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm" :class="selectedIssueIds.length ? 'bg-error-50 text-error-600' : 'bg-success-50 text-success-600'">
                <ShieldAlert v-if="selectedIssueIds.length" :size="16" />
                <ShieldCheck v-else :size="16" />
                {{ selectedIssueIds.length ? `${selectedIssueIds.length} sorun işaretlendi — sonuç: Uygunsuzluk Var` : 'Sonuç: Uygun' }}
              </div>
            </div>
          </template>
        </div>

        <div class="flex justify-end gap-2 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button v-if="view === 'list'" type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="close">
            Kapat
          </button>
          <template v-else>
            <button type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="backToList" :disabled="saving || submittingInspection">
              Vazgeç
            </button>
            <button v-if="view === 'add'" type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60" :disabled="saving" @click="submitAdd">
              <LoaderCircle v-if="saving" :size="15" class="animate-spin" /> Kaydet
            </button>
            <button v-else type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60" :disabled="submittingInspection" @click="submitInspection">
              <LoaderCircle v-if="submittingInspection" :size="15" class="animate-spin" /> Denetimi Kaydet
            </button>
          </template>
        </div>
      </aside>
    </div>

    <ConfirmationModal v-model:open="showDeleteConfirmation" title="Ekipmanı sil" :message="`&quot;${deletingItem?.equipment_type ? displayTypeName(deletingItem.equipment_type) : 'Bu ekipman'}&quot; şubeden silinsin mi?`" confirm-text="Sil" cancel-text="Vazgeç" :loading="deleting" @confirm="confirmDelete" />
  </Teleport>
</template>
