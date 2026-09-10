<script setup lang="ts">
import { Upload } from '@lucide/vue'

// Rapor yükleme sihirbazının 1. adımı — tek PDF dosyası, sürükle-bırak veya
// "seçin". Dosya seçilir seçilmez üst bileşen analiz akışını başlatır (bu
// component hiçbir isteği kendi başlatmaz).
const props = withDefaults(defineProps<{ hint?: string }>(), {
  hint: 'Sadece PDF formatında rapor dosyası yüklenebilir.',
})

const emit = defineEmits<{ select: [File] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const isPdf = (file: File) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')

const handleFile = (file?: File | null) => {
  if (!file) return
  if (!isPdf(file)) return
  emit('select', file)
}

const onPicked = (e: Event) => {
  handleFile((e.target as HTMLInputElement).files?.[0])
  ;(e.target as HTMLInputElement).value = ''
}
const onDropped = (e: DragEvent) => {
  isDragging.value = false
  handleFile(e.dataTransfer?.files?.[0])
}
</script>

<template>
  <div class="mx-auto max-w-md py-6">
    <input ref="fileInput" type="file" accept="application/pdf" class="hidden" @change="onPicked">
    <div
      class="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-14 text-center transition"
      :class="isDragging ? 'border-[#d71920] bg-red-50/40 dark:bg-red-500/5' : 'border-[#dfe3e8] dark:border-gray-700'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="onDropped"
    >
      <span class="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10"><Upload :size="26" /></span>
      <p class="text-sm font-semibold text-[#172033] dark:text-white">Rapor dosyasını buraya sürükleyin veya <button type="button" class="text-[#d71920] underline" @click="fileInput?.click()">seçin</button></p>
      <p class="text-xs text-gray-400">Desteklenen format: PDF (Maks. 20 MB)</p>
    </div>
    <p class="mt-3 text-center text-xs text-gray-400">{{ hint }}</p>
  </div>
</template>
