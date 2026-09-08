<script setup lang="ts">
import { Camera, ChevronLeft, ImagePlus, Info, LoaderCircle, Trash2, X } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { emergencyEquipmentTypeApi } from '~/api/emergency-equipment-type'
import { locationEmergencyEquipmentApi } from '~/api/location-emergency-equipment'
import type { EmergencyEquipmentChecklistItem } from '~/types/emergency-equipment'
import type { EmergencyEquipmentInspectionPhoto, LocationEmergencyEquipmentItem } from '~/types/location-emergency-equipment'

definePageMeta({ layout: 'fire-inspection' })

const route = useRoute()
const { $toast } = useNuxtApp()
const equipmentId = computed(() => Number(route.params.id))
const editingInspectionId = computed(() => (route.query.inspectionId ? Number(route.query.inspectionId) : null))
const fireInspection = useFireInspectionStore()

const step = ref<'checklist' | 'photos'>('checklist')
const equipment = ref<LocationEmergencyEquipmentItem | null>(null)
const checklistItems = ref<EmergencyEquipmentChecklistItem[]>([])
const flagged = ref<Record<number, boolean>>({})
const itemNotes = ref<Record<number, string>>({})
const itemPhotoFiles = ref<Record<number, File | null>>({})
const itemPhotoPreviews = ref<Record<number, string | null>>({})
const itemFileInputs = ref<Record<number, HTMLInputElement | null>>({})
// Düzenleme modunda mevcut denetim verisinden gelenler:
const itemDbId = ref<Record<number, number>>({})
const itemExistingPhoto = ref<Record<number, EmergencyEquipmentInspectionPhoto | null>>({})
const itemRemovePhotoFlag = ref<Record<number, boolean>>({})
const existingGeneralPhotos = ref<EmergencyEquipmentInspectionPhoto[]>([])
const removeGeneralPhotoIds = ref<number[]>([])
const notes = ref('')
const loading = ref(true)
const saving = ref(false)

const photoFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const cameraInput = ref<HTMLInputElement | null>(null)

onMounted(async () => {
  if (!fireInspection.ready) {
    await navigateTo(fireInspection.step2Path)
    return
  }
  loading.value = true
  try {
    const list = await locationEmergencyEquipmentApi.list(fireInspection.branchId!)
    equipment.value = list.data.find(e => e.id === equipmentId.value) ?? null
    if (equipment.value?.equipment_type?.id) {
      const res = await emergencyEquipmentTypeApi.checklistItems(equipment.value.equipment_type.id)
      checklistItems.value = res.data
      checklistItems.value.forEach((item) => { flagged.value[item.id] = false })
    }

    if (editingInspectionId.value) {
      const history = await locationEmergencyEquipmentApi.inspections(equipmentId.value)
      const inspection = history.data.find(i => i.id === editingInspectionId.value)
      if (!inspection) {
        $toast.error('Denetim kaydı bulunamadı.')
        await navigateTo(`/isg-portal/fire-inspection/equipment/${equipmentId.value}`)
        return
      }
      notes.value = inspection.notes ?? ''
      existingGeneralPhotos.value = (inspection.photos ?? []).filter(p => !p.inspection_item_id)
      inspection.items?.forEach((it) => {
        flagged.value[it.checklist_item_id] = true
        itemDbId.value[it.checklist_item_id] = it.id
        itemNotes.value[it.checklist_item_id] = it.note ?? ''
        itemExistingPhoto.value[it.checklist_item_id] = it.photos?.[0] ?? null
      })
    }
  } finally {
    loading.value = false
  }
})

const flaggedCount = computed(() => Object.values(flagged.value).filter(Boolean).length)

const toggleFlag = (itemId: number) => {
  flagged.value[itemId] = !flagged.value[itemId]
  if (!flagged.value[itemId]) {
    itemNotes.value[itemId] = ''
    if (itemPhotoPreviews.value[itemId]) URL.revokeObjectURL(itemPhotoPreviews.value[itemId]!)
    itemPhotoFiles.value[itemId] = null
    itemPhotoPreviews.value[itemId] = null
  }
}

const onItemPhotoChange = (itemId: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (itemPhotoPreviews.value[itemId]) URL.revokeObjectURL(itemPhotoPreviews.value[itemId]!)
  itemPhotoFiles.value[itemId] = file
  itemPhotoPreviews.value[itemId] = URL.createObjectURL(file)
  itemRemovePhotoFlag.value[itemId] = false
  ;(e.target as HTMLInputElement).value = ''
}

// Yeni seçilen bir yerel önizleme varsa o, yoksa (silinmediyse) mevcut kayıtlı fotoğraf gösterilir.
const itemPhotoUrl = (itemId: number) => {
  if (itemPhotoPreviews.value[itemId]) return itemPhotoPreviews.value[itemId]
  if (!itemRemovePhotoFlag.value[itemId] && itemExistingPhoto.value[itemId]) return itemExistingPhoto.value[itemId]!.photo_url
  return null
}

const removeItemPhoto = (itemId: number) => {
  if (itemPhotoPreviews.value[itemId]) {
    URL.revokeObjectURL(itemPhotoPreviews.value[itemId]!)
    itemPhotoFiles.value[itemId] = null
    itemPhotoPreviews.value[itemId] = null
  }
  if (itemExistingPhoto.value[itemId]) {
    itemRemovePhotoFlag.value[itemId] = true
  }
}

const onPhotoChange = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  files.forEach((file) => {
    photoFiles.value.push(file)
    photoPreviews.value.push(URL.createObjectURL(file))
  })
  if (fileInput.value) fileInput.value.value = ''
  if (cameraInput.value) cameraInput.value.value = ''
}
const removePhoto = (index: number) => {
  URL.revokeObjectURL(photoPreviews.value[index])
  photoFiles.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const removeExistingGeneralPhoto = (photoId: number) => {
  removeGeneralPhotoIds.value.push(photoId)
  existingGeneralPhotos.value = existingGeneralPhotos.value.filter(p => p.id !== photoId)
}

const save = async () => {
  saving.value = true
  try {
    const items = Object.entries(flagged.value)
      .filter(([, isFlagged]) => isFlagged)
      .map(([id]) => {
        const itemId = Number(id)
        return {
          id: itemDbId.value[itemId] ?? null,
          checklist_item_id: itemId,
          note: itemNotes.value[itemId] || null,
          photo: itemPhotoFiles.value[itemId] ?? null,
          remove_photo: itemRemovePhotoFlag.value[itemId] && !itemPhotoFiles.value[itemId],
        }
      })

    if (editingInspectionId.value) {
      await locationEmergencyEquipmentApi.updateInspection(editingInspectionId.value, {
        items,
        notes: notes.value || null,
        remove_photo_ids: removeGeneralPhotoIds.value,
        photos: photoFiles.value,
      })
      $toast.success('Denetim güncellendi.')
    } else {
      await locationEmergencyEquipmentApi.createInspection(equipmentId.value, {
        items,
        notes: notes.value || null,
        photos: photoFiles.value,
      })
      $toast.success('Denetim kaydedildi.')
    }
    await navigateTo(`/isg-portal/fire-inspection/equipment/${equipmentId.value}`)
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Denetim kaydedilemedi.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink :to="`/isg-portal/fire-inspection/equipment/${equipmentId}`" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">{{ step === 'checklist' ? (editingInspectionId ? 'Denetimi Düzenle' : 'Denetim') : 'Fotoğraf Ekle' }}</p>
    </header>

    <div v-if="loading" class="py-12 text-center text-sm text-gray-400">Yükleniyor...</div>

    <div v-else-if="step === 'checklist'" class="p-4">
      <div class="mb-4 rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">{{ equipment?.equipment_type?.name }} <span v-if="equipment?.code" class="text-gray-400">({{ equipment.code }})</span></p>
        <p class="text-xs text-gray-400">{{ equipment?.location_note }}</p>
      </div>

      <div class="mb-4 flex items-center justify-between">
        <div class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-500 dark:bg-white/5">Checklist ({{ checklistItems.length }})</div>
        <p v-if="flaggedCount" class="text-xs font-semibold text-error-500">{{ flaggedCount }} sorun işaretlendi</p>
      </div>

      <div class="space-y-3">
        <div
          v-for="(item, index) in checklistItems"
          :key="item.id"
          class="rounded-2xl border p-3.5 transition-colors"
          :class="flagged[item.id] ? 'border-error-200 bg-error-50/60 dark:border-error-500/30 dark:bg-error-500/5' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'"
        >
          <label class="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              class="mt-0.5 h-4.5 w-4.5 shrink-0 rounded border-gray-300 text-error-500 focus:ring-error-500"
              :checked="!!flagged[item.id]"
              @change="toggleFlag(item.id)"
            >
            <span class="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{{ index + 1 }}. {{ item.label }}</span>
            <Info :size="15" class="mt-0.5 shrink-0 text-gray-300" />
          </label>

          <div v-if="flagged[item.id]" class="mt-3 space-y-3 pl-7">
            <div class="flex items-center gap-3">
              <div v-if="itemPhotoUrl(item.id)" class="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                <img :src="itemPhotoUrl(item.id)!" alt="Fotoğraf" class="h-full w-full object-cover" />
                <button type="button" class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white" @click="removeItemPhoto(item.id)"><X :size="11" /></button>
              </div>
              <button
                v-else
                type="button"
                class="flex h-16 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-gray-300 text-xs font-medium text-gray-400 dark:border-gray-700"
                @click="itemFileInputs[item.id]?.click()"
              >
                <Camera :size="16" />
                Fotoğraf Ekle (Opsiyonel)
              </button>
              <input
                :ref="(el) => { itemFileInputs[item.id] = el as HTMLInputElement | null }"
                type="file"
                accept="image/*"
                class="hidden"
                @change="onItemPhotoChange(item.id, $event)"
              >
            </div>

            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Açıklama (Opsiyonel)</label>
              <textarea
                v-model="itemNotes[item.id]"
                rows="3"
                maxlength="500"
                class="w-full rounded-xl border border-gray-200 bg-white p-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"
                placeholder="Notunuzu buraya yazın..."
              />
              <p class="mt-1 text-right text-[11px] text-gray-300">{{ (itemNotes[item.id] || '').length }}/500</p>
            </div>
          </div>
        </div>

        <label class="block"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Genel Notlar</span><textarea v-model="notes" rows="3" class="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" placeholder="Denetim notu (opsiyonel)" /></label>
      </div>

      <div class="mt-6 flex gap-2">
        <button type="button" class="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="step = 'photos'">Sonraki</button>
      </div>
    </div>

    <div v-else class="p-4">
      <div class="mb-4 rounded-2xl border border-gray-200 bg-white p-3.5 dark:border-gray-800 dark:bg-gray-900">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">{{ equipment?.equipment_type?.name }} <span v-if="equipment?.code" class="text-gray-400">({{ equipment.code }})</span></p>
        <p class="text-xs text-gray-400">{{ equipment?.location_note }}</p>
      </div>

      <div class="mb-4 flex flex-wrap gap-3">
        <div v-for="p in existingGeneralPhotos" :key="`existing-${p.id}`" class="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <img :src="p.photo_url" alt="Denetim fotoğrafı" class="h-full w-full object-cover" />
          <button type="button" class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white" @click="removeExistingGeneralPhoto(p.id)"><Trash2 :size="11" /></button>
        </div>
        <div v-for="(preview, index) in photoPreviews" :key="index" class="relative h-20 w-20 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          <img :src="preview" alt="Denetim fotoğrafı" class="h-full w-full object-cover" />
          <button type="button" class="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white" @click="removePhoto(index)"><Trash2 :size="11" /></button>
        </div>
      </div>

      <input ref="cameraInput" type="file" accept="image/*" capture="environment" class="hidden" @change="onPhotoChange" />
      <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onPhotoChange" />

      <div class="space-y-2.5">
        <button type="button" class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" @click="cameraInput?.click()"><Camera :size="17" class="text-brand-500" />Kameradan Çek</button>
        <button type="button" class="flex w-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 text-left text-sm font-medium text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" @click="fileInput?.click()"><ImagePlus :size="17" class="text-brand-500" />Galeriden Seç</button>
      </div>

      <div class="mt-6 flex gap-2">
        <button type="button" class="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="step = 'checklist'">Önceki</button>
        <button type="button" :disabled="saving" class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error-500 py-3 text-sm font-semibold text-white disabled:opacity-50" @click="save">
          <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
          Kaydet
        </button>
      </div>
    </div>
  </div>
</template>
