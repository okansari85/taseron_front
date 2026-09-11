<script setup lang="ts">
import { FileText, LoaderCircle } from '@lucide/vue'
import { fireSuppressionReportApi, activeFireSuppressionAnalysisId, type FireSuppressionAnalysisProgress } from '~/api/fire-suppression-report'

const props = defineProps<{
  file: File | null
  steps: { label: string; done: boolean }[]
}>()

const emit = defineEmits<{ cancel: []; completed: [FireSuppressionAnalysisProgress]; failed: [string] }>()

// Kullanıcı, sürekli (700ms'de bir) istek atan canlı aşama/ilerinleme
// ekranının rahatsız edici olduğunu belirtti — burada artık aşama aşama
// event listesi/ilerleme çubuğu YOK, tek bir "bekleyin" ekranı var. Analiz
// bitişini anlamak için hâlâ bir kontrol gerekiyor (aksi halde sihirbaz bir
// sonraki adıma hiç geçemez) ama çok daha seyrek (4 saniyede bir) ve sessiz.
const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let resolved = false

const poll = async () => {
  const id = activeFireSuppressionAnalysisId.value
  if (!id || resolved) return
  try {
    const response = await fireSuppressionReportApi.analysisProgress(id)

    if (response.data.status !== 'running') {
      resolved = true
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }

      if (response.data.status === 'completed' && response.data.result) {
        emit('completed', response.data)
      } else if (response.data.status === 'failed') {
        emit('failed', response.data.error || 'Analiz başarısız oldu.')
      }
    }
  } catch {
    // Analiz isteği hâlâ başlıyor olabilir; sonraki kontrolde devam edilir.
  }
}

onMounted(() => {
  timer = setInterval(() => { elapsedSeconds.value += 1 }, 1000)
  poll()
  pollTimer = setInterval(poll, 4000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (pollTimer) clearInterval(pollTimer)
})

const elapsedLabel = computed(() => {
  const m = Math.floor(elapsedSeconds.value / 60)
  const s = elapsedSeconds.value % 60
  return m > 0 ? `${m} dk ${s} sn` : `${s} sn`
})
</script>

<template>
  <div class="mx-auto max-w-md py-16 text-center">
    <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
      <LoaderCircle :size="24" class="animate-spin" />
    </div>
    <p class="text-sm font-bold text-[#172033] dark:text-white">Rapor analiz ediliyor</p>
    <p class="mt-1.5 text-xs text-gray-400">Bu işlem raporun boyutuna göre birkaç dakika sürebilir, bu sırada başka bir işlem yapabilirsiniz.</p>

    <div v-if="file" class="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-xl border border-[#e7e9ed] bg-white p-3 text-left dark:border-gray-800 dark:bg-gray-900">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="16" /></span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-xs font-semibold text-[#172033] dark:text-white">{{ file.name }}</p>
        <p class="text-[10px] text-gray-400">{{ (file.size / (1024 * 1024)).toFixed(1) }} MB</p>
      </div>
    </div>

    <p class="mt-4 text-xs text-gray-400">Geçen süre: {{ elapsedLabel }}</p>

    <button type="button" class="mt-6 w-full max-w-xs rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('cancel')">İptal</button>
  </div>
</template>
