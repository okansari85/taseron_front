<script setup lang="ts">
import { DoorClosed, Flame, ImagePlus, LoaderCircle, LogOut, MoreHorizontal, Trash2, X } from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'
import { fieldFindingApi } from '~/api/field-finding'
import type { FieldFindingCategory, FieldFindingSeverity } from '~/types/field-finding'

definePageMeta({ layout: 'fire-inspection' })

const fireInspection = useFireInspectionStore()
const { $toast } = useNuxtApp()

const categories: { value: FieldFindingCategory; label: string; icon: any }[] = [
  { value: 'yangin_guvenligi', label: 'Yangın Güvenliği', icon: Flame },
  { value: 'acil_cikis', label: 'Acil Çıkış', icon: LogOut },
  { value: 'yangin_kapisi', label: 'Yangın Kapısı', icon: DoorClosed },
  { value: 'kacis_yolu', label: 'Kaçış Yolu', icon: LogOut },
  { value: 'diger', label: 'Diğer', icon: MoreHorizontal },
]
const severities: { value: FieldFindingSeverity; label: string }[] = [
  { value: 'dusuk', label: 'Düşük' },
  { value: 'orta', label: 'Orta' },
  { value: 'yuksek', label: 'Yüksek' },
  { value: 'kritik', label: 'Kritik' },
]

const category = ref<FieldFindingCategory | null>(null)
const locationNote = ref('')
const description = ref('')
const severity = ref<FieldFindingSeverity | null>(null)
const photoFiles = ref<File[]>([])
const photoPreviews = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)

const onPhotoChange = (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  files.forEach((file) => {
    photoFiles.value.push(file)
    photoPreviews.value.push(URL.createObjectURL(file))
  })
  if (fileInput.value) fileInput.value.value = ''
}
const removePhoto = (index: number) => {
  URL.revokeObjectURL(photoPreviews.value[index])
  photoFiles.value.splice(index, 1)
  photoPreviews.value.splice(index, 1)
}

const canSave = computed(() => !!category.value && !!severity.value && !saving.value)

const save = async () => {
  if (!canSave.value || !fireInspection.branchId) return
  saving.value = true
  try {
    await fieldFindingApi.create(fireInspection.branchId, {
      category: category.value!,
      severity: severity.value!,
      location_note: locationNote.value || null,
      description: description.value || null,
      photos: photoFiles.value,
    })
    $toast.success('Saha bulgusu eklendi.')
    await navigateTo('/isg-portal/fire-inspection/findings')
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Bulgu kaydedilemedi.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Saha Bulgusu Ekle</p>
      <NuxtLink to="/isg-portal/fire-inspection/findings" class="text-gray-500"><X :size="20" /></NuxtLink>
    </header>

    <div class="space-y-5 p-4">
      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Bulgu Türü</p>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="c in categories" :key="c.value" type="button" class="flex items-center gap-2 rounded-xl border p-3 text-left text-xs font-medium" :class="category === c.value ? 'border-error-500 bg-error-50 text-error-600 dark:bg-error-500/10' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="category = c.value">
            <component :is="c.icon" :size="15" />{{ c.label }}
          </button>
        </div>
      </div>

      <label class="block"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Konum</span><input v-model="locationNote" type="text" placeholder="Örn. Zemin Kat - Mutfak önü" class="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" /></label>

      <label class="block"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Açıklama</span><textarea v-model="description" rows="3" placeholder="Bulguyu açıklayın" class="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" /></label>

      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Önem Derecesi</p>
        <div class="grid grid-cols-4 gap-2">
          <button v-for="s in severities" :key="s.value" type="button" class="rounded-xl border py-2.5 text-xs font-semibold" :class="severity === s.value ? 'border-error-500 bg-error-500 text-white' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'" @click="severity = s.value">{{ s.label }}</button>
        </div>
      </div>

      <div>
        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Fotoğraflar</p>
        <div class="flex flex-wrap gap-3">
          <div v-for="(preview, index) in photoPreviews" :key="index" class="relative h-16 w-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
            <img :src="preview" alt="Bulgu fotoğrafı" class="h-full w-full object-cover" />
            <button type="button" class="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/70 text-white" @click="removePhoto(index)"><Trash2 :size="11" /></button>
          </div>
          <input ref="fileInput" type="file" accept="image/*" multiple class="hidden" @change="onPhotoChange" />
          <button type="button" class="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 text-gray-400 dark:border-gray-700" @click="fileInput?.click()"><ImagePlus :size="17" /><span class="text-[10px]">Ekle</span></button>
        </div>
      </div>

      <div class="flex gap-2 pt-2">
        <NuxtLink to="/isg-portal/fire-inspection/findings" class="flex-1 rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300">İptal</NuxtLink>
        <button type="button" :disabled="!canSave" class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-error-500 py-3 text-sm font-semibold text-white disabled:opacity-50" @click="save">
          <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
          Kaydet
        </button>
      </div>
    </div>
  </div>
</template>
