<script setup lang="ts">
import { MapPin, X } from 'lucide-vue-next'
import type { LocationApiItem } from '~/api/location'

const props = defineProps<{ modelValue: boolean; location: LocationApiItem | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [payload: { name: string; city_id: number | null; district_id: number | null; address: string; status: 'active' | 'passive'; file: File | null }] }>()

const form = reactive({ name: '', city_id: null as number | null, district_id: null as number | null, city_name: '', district_name: '', address: '', status: 'active' as 'active' | 'passive' })
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const imageInput = ref<HTMLInputElement | null>(null)

const fill = (location: LocationApiItem | null) => {
  if (!location) return
  form.name = location.name || ''
  form.city_id = location.city_id ?? location.city?.id ?? null
  form.district_id = location.district_id ?? location.district?.id ?? null
  form.city_name = location.city?.name || ''
  form.district_name = location.district?.name || ''
  form.address = location.address || ''
  form.status = location.is_active === false ? 'passive' : 'active'
  imageFile.value = null
  imagePreview.value = location.image || ''
}

watch(() => [props.modelValue, props.location], ([open]) => { if (open) fill(props.location) }, { immediate: true })
const close = () => emit('update:modelValue', false)
const handleImageChange = (event: Event) => { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; imageFile.value = file; imagePreview.value = URL.createObjectURL(file) }
const submit = () => { emit('save', { name: form.name, city_id: form.city_id, district_id: form.district_id, address: form.address, status: form.status, file: imageFile.value }); close() }
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999]">
      <button aria-label="Düzenleme panelini kapat" class="absolute inset-0 h-full w-full bg-slate-950/35" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div class="flex items-start gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500"><MapPin :size="20" /></div><div><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Lokasyon Düzenle</h2><p class="mt-1 text-sm text-gray-500">Lokasyon bilgilerini güncelleyin.</p></div></div>
          <button type="button" class="rounded-lg p-2 text-gray-400" @click="close"><X :size="22" /></button>
        </div>
        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
          <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div><label class="mb-2 block text-sm font-semibold">Lokasyon Resmi</label><div class="flex items-center gap-4 rounded-xl border p-4"><div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100"><img v-if="imagePreview" :src="imagePreview" class="h-full w-full object-cover" /><MapPin v-else :size="28" class="text-gray-400" /></div><div><p class="text-sm font-medium">Lokasyon görseli</p><p class="mt-1 text-xs text-gray-500">Yeni resim seçmezseniz mevcut resim korunur.</p><input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleImageChange" /><button type="button" class="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" @click="imageInput?.click()">{{ imageFile ? 'Resmi Değiştir' : 'Resim Seç' }}</button></div></div></div>
            <div><label class="mb-2 block text-sm font-semibold">Lokasyon Adı *</label><input v-model="form.name" required maxlength="255" class="h-12 w-full rounded-lg border px-4 text-sm" /></div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label class="mb-2 block text-sm font-semibold">İl</label><input :value="form.city_name" readonly class="h-12 w-full rounded-lg border bg-gray-50 px-4 text-sm text-gray-500" /></div><div><label class="mb-2 block text-sm font-semibold">İlçe</label><input :value="form.district_name" readonly class="h-12 w-full rounded-lg border bg-gray-50 px-4 text-sm text-gray-500" /></div></div>
            <div><label class="mb-2 block text-sm font-semibold">Açık Adres *</label><textarea v-model="form.address" required maxlength="1000" rows="4" class="w-full resize-none rounded-lg border px-4 py-3 text-sm" /></div>
            <div class="flex items-center justify-between rounded-xl border px-4 py-4"><div><p class="text-sm font-semibold">Durum</p><p class="mt-1 text-xs text-gray-500">Lokasyonun aktiflik durumunu değiştirin.</p></div><button type="button" role="switch" :aria-checked="form.status === 'active'" class="relative h-6 w-11 rounded-full" :class="form.status === 'active' ? 'bg-brand-500' : 'bg-gray-300'" @click="form.status = form.status === 'active' ? 'passive' : 'active'"><span class="absolute top-1 h-4 w-4 rounded-full bg-white transition" :class="form.status === 'active' ? 'left-6' : 'left-1'" /></button></div>
          </div>
          <div class="flex justify-end gap-3 border-t px-6 py-4"><button type="button" class="rounded-lg border px-4 py-2.5 text-sm font-semibold" @click="close">İptal</button><button type="submit" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">Değişiklikleri Kaydet</button></div>
        </form>
      </aside>
    </div>
  </Teleport>
</template>
