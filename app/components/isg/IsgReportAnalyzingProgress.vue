<script setup lang="ts">
import { Check, FileText, LoaderCircle } from '@lucide/vue'

// Rapor yükleme sihirbazının 2. adımı — NVIDIA NIM'in ücretsiz katmanında
// yanıt süresi öngörülemediği (birkaç saniyeden birkaç dakikaya) için gerçek
// bir yüzde yok — hangi aşamada olduğumuzu ve geçen süreyi göstererek
// "donmuş" hissi vermemeye çalışıyoruz. Adımların done durumunu üst bileşen
// kontrol eder (gerçek API çağrısının ne zaman bittiğini o bilir); geçen
// süre sayacı ve ilerleme çubuğu burada, component'e özel.
defineProps<{
  file: File | null
  steps: { label: string; done: boolean }[]
}>()

const emit = defineEmits<{ cancel: [] }>()

const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => { timer = setInterval(() => { elapsedSeconds.value += 1 }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const elapsedLabel = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return m > 0 ? `${m} dk ${s} sn` : `${s} sn`
})
</script>

<template>
  <div class="mx-auto max-w-md py-6">
    <div class="mb-4 flex items-center gap-3 rounded-xl border border-[#e7e9ed] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="18" /></span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ file?.name }}</p>
        <p class="text-xs text-gray-400">{{ file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '' }}</p>
      </div>
    </div>

    <div class="space-y-2.5 rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div v-for="step in steps" :key="step.label" class="flex items-center gap-2.5 text-sm">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="step.done ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10'">
          <Check v-if="step.done" :size="12" />
          <LoaderCircle v-else :size="12" class="animate-spin text-gray-400" />
        </span>
        <span :class="step.done ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'">{{ step.label }}</span>
      </div>
    </div>

    <div class="mt-4 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
      <div class="ai-progress-bar h-1.5 w-1/3 rounded-full bg-[#d71920]" />
    </div>
    <p class="mt-2 text-center text-xs text-gray-400">
      İşleniyor... {{ elapsedLabel }}
      <span v-if="elapsedSeconds > 30"> — büyük raporlarda bu birkaç dakika sürebilir, sayfayı kapatmayın.</span>
    </p>

    <button type="button" class="mt-4 w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('cancel')">İptal</button>
  </div>
</template>

<style scoped>
.ai-progress-bar {
  animation: ai-progress-slide 1.3s ease-in-out infinite;
}

@keyframes ai-progress-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(-100%); }
}
</style>
