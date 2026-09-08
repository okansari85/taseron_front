<script setup lang="ts">
import { Check, CheckCircle2, ChevronLeft, Flame, LoaderCircle, Pencil, XCircle } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import type { EmergencyEquipmentInspectionRecord, LocationEmergencyEquipmentItem } from '~/types/location-emergency-equipment'

definePageMeta({ layout: 'fire-inspection' })

const route = useRoute()
const { $toast } = useNuxtApp()
const equipmentId = computed(() => Number(route.params.id))
const fireInspection = useFireInspectionStore()

const equipment = ref<LocationEmergencyEquipmentItem | null>(null)
const inspections = ref<EmergencyEquipmentInspectionRecord[]>([])
const tab = ref<'info' | 'history'>('info')
const loading = ref(true)

const load = async () => {
  const [list, history] = await Promise.all([
    locationEmergencyEquipmentApi.list(fireInspection.branchId!),
    locationEmergencyEquipmentApi.inspections(equipmentId.value),
  ])
  equipment.value = list.data.find(e => e.id === equipmentId.value) ?? null
  inspections.value = history.data
}

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  loading.value = true
  try {
    await load()
  } finally {
    loading.value = false
  }
})

// --- Bakım Bilgileri (düzenle) ---
const editingMaintenance = ref(false)
const maintenanceForm = ref({ last_fill_date: '', last_annual_maintenance_date: '', next_annual_maintenance_date: '', service_company: '' })
const savingMaintenance = ref(false)

const startEditMaintenance = () => {
  if (!equipment.value) return
  maintenanceForm.value = {
    last_fill_date: equipment.value.last_fill_date ?? '',
    last_annual_maintenance_date: equipment.value.last_annual_maintenance_date ?? '',
    next_annual_maintenance_date: equipment.value.next_annual_maintenance_date ?? '',
    service_company: equipment.value.service_company ?? '',
  }
  editingMaintenance.value = true
}

const saveMaintenance = async () => {
  if (!equipment.value) return
  savingMaintenance.value = true
  try {
    await locationEmergencyEquipmentApi.update(equipment.value.id, {
      last_fill_date: maintenanceForm.value.last_fill_date || null,
      last_annual_maintenance_date: maintenanceForm.value.last_annual_maintenance_date || null,
      next_annual_maintenance_date: maintenanceForm.value.next_annual_maintenance_date || null,
      service_company: maintenanceForm.value.service_company || null,
    })
    $toast.success('Bakım bilgileri güncellendi.')
    editingMaintenance.value = false
    await load()
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Bakım bilgileri güncellenemedi.')
  } finally {
    savingMaintenance.value = false
  }
}

const maintenanceStatus = computed(() => {
  if (!equipment.value?.next_annual_maintenance_date) return null
  const days = (new Date(equipment.value.next_annual_maintenance_date).getTime() - Date.now()) / 86400000
  if (days < 0) return { label: 'Gecikti', cls: 'bg-error-50 text-error-600' }
  if (days <= 30) return { label: 'Yaklaşıyor', cls: 'bg-warning-50 text-warning-600' }
  return { label: 'Güncel', cls: 'bg-success-50 text-success-600' }
})

const equipmentLabel = computed(() => {
  if (!equipment.value) return 'Ekipman'
  const parts = [equipment.value.equipment_type?.name, equipment.value.equipment_type?.capacity_kg ? `${equipment.value.equipment_type.capacity_kg} kg` : null].filter(Boolean)
  return parts.join(' - ')
})
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection/equipment" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Ekipman Detay</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>
    <div v-else-if="equipment" class="p-4">
      <div class="mb-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <span class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="22" /></span>
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ equipmentLabel }}</p>
          <p class="truncate text-xs text-gray-400">{{ equipment.code }}</p>
          <p class="truncate text-xs text-gray-400">{{ equipment.location_note }}</p>
        </div>
        <span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="equipment.is_active ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'">{{ equipment.is_active ? 'Aktif' : 'Pasif' }}</span>
      </div>

      <div class="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
        <button type="button" class="flex-1 rounded-lg py-2 text-xs font-semibold" :class="tab === 'info' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500'" @click="tab = 'info'">Bilgiler</button>
        <button type="button" class="flex-1 rounded-lg py-2 text-xs font-semibold" :class="tab === 'history' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500'" @click="tab = 'history'">Geçmiş</button>
      </div>

      <div v-if="tab === 'info'" class="space-y-4">
        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Ekipman Bilgileri</p>
          <dl class="space-y-2.5 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Ekipman Türü</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.equipment_type?.name }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Ekipman Kodu</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.code || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Bulunduğu Yer</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.location_note || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Durum</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.is_active ? 'Aktif' : 'Pasif' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Montaj Tarihi</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.install_date || '—' }}</dd></div>
          </dl>
        </div>

        <div class="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-3 flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-400">Bakım Bilgileri</p>
            <div class="flex items-center gap-2">
              <span v-if="maintenanceStatus && !editingMaintenance" class="rounded-full px-2.5 py-1 text-[10px] font-semibold" :class="maintenanceStatus.cls">{{ maintenanceStatus.label }}</span>
              <button v-if="!editingMaintenance" type="button" class="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-white/5" @click="startEditMaintenance">
                <Pencil :size="13" />
              </button>
            </div>
          </div>

          <dl v-if="!editingMaintenance" class="space-y-2.5 text-sm">
            <div class="flex justify-between"><dt class="text-gray-500">Son Dolum Tarihi</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.last_fill_date || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Son Yıllık Bakım</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.last_annual_maintenance_date || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Sonraki Yıllık Bakım</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.next_annual_maintenance_date || '—' }}</dd></div>
            <div class="flex justify-between"><dt class="text-gray-500">Servis Firması</dt><dd class="font-medium text-gray-800 dark:text-gray-200">{{ equipment.service_company || '—' }}</dd></div>
          </dl>

          <div v-else class="space-y-3">
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Son Dolum Tarihi</label>
              <input v-model="maintenanceForm.last_fill_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Son Yıllık Bakım</label>
              <input v-model="maintenanceForm.last_annual_maintenance_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Sonraki Yıllık Bakım</label>
              <input v-model="maintenanceForm.next_annual_maintenance_date" type="date" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-gray-500">Servis Firması</label>
              <input v-model="maintenanceForm.service_company" type="text" placeholder="Örn. ABC Yangın" class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            </div>
            <div class="flex gap-2 pt-1">
              <button type="button" class="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="savingMaintenance" @click="editingMaintenance = false">Vazgeç</button>
              <button type="button" class="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-error-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="savingMaintenance" @click="saveMaintenance">
                <LoaderCircle v-if="savingMaintenance" :size="15" class="animate-spin" />
                <Check v-else :size="15" />
                Kaydet
              </button>
            </div>
          </div>
        </div>

        <NuxtLink :to="`/isg-portal/fire-inspection/equipment/${equipment.id}/inspect`" class="block rounded-xl bg-error-500 px-4 py-3 text-center text-sm font-semibold text-white">Denetime Başla</NuxtLink>
      </div>

      <div v-else class="space-y-2.5">
        <NuxtLink
          v-for="inspection in inspections"
          :key="inspection.id"
          :to="`/isg-portal/fire-inspection/equipment/${equipment.id}/inspect?inspectionId=${inspection.id}`"
          class="block rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900"
        >
          <div class="flex items-center justify-between">
            <span class="flex items-center gap-1.5 text-sm font-medium" :class="inspection.overall_result === 'passed' ? 'text-success-600' : 'text-error-600'">
              <CheckCircle2 v-if="inspection.overall_result === 'passed'" :size="15" />
              <XCircle v-else :size="15" />
              {{ inspection.overall_result === 'passed' ? 'Uygun' : 'Uygunsuz' }}
            </span>
            <span class="flex items-center gap-2 text-xs text-gray-400">
              {{ new Date(inspection.inspected_at).toLocaleDateString('tr-TR') }}
              <Pencil :size="12" class="text-gray-300" />
            </span>
          </div>
          <p v-if="inspection.notes" class="mt-1.5 text-xs text-gray-500">{{ inspection.notes }}</p>
        </NuxtLink>
        <p v-if="!inspections.length" class="py-12 text-center text-sm text-gray-400">Denetim geçmişi yok.</p>
      </div>
    </div>
  </div>
</template>
