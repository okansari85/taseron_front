<script setup lang="ts">
import { Check, Clipboard, FileText, LoaderCircle } from '@lucide/vue'
import { fireSuppressionReportApi, activeFireSuppressionAnalysisId, type FireSuppressionAnalysisProgress } from '~/api/fire-suppression-report'

const props = defineProps<{
  file: File | null
  steps: { label: string; done: boolean }[]
}>()

const emit = defineEmits<{ cancel: []; completed: [FireSuppressionAnalysisProgress]; failed: [string] }>()

const elapsedSeconds = ref(0)
const progress = ref<FireSuppressionAnalysisProgress | null>(null)
const copied = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
// Job artık gerçekten arka planda (queue worker) çalıştığı için polling
// gerçek anlamda ilerliyor — status 'running' olmaktan çıkınca (tamamlandı
// ya da başarısız oldu) üst bileşene TEK SEFER haber veriyoruz, sonsuz
// döngü/istek yığılması olmasın diye.
let resolved = false

const poll = async () => {
  const id = activeFireSuppressionAnalysisId.value
  if (!id || resolved) return
  try {
    const response = await fireSuppressionReportApi.analysisProgress(id)
    progress.value = response.data

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
    // Analiz isteği hâlâ başlıyor olabilir; sonraki polling denemesi devam eder.
  }
}

onMounted(() => {
  timer = setInterval(() => { elapsedSeconds.value += 1 }, 1000)
  poll()
  pollTimer = setInterval(poll, 700)
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

const stageLabel = (stage: string) => ({
  extracting: 'Metin çıkarma',
  classifying: 'Sayfa sınıflandırma',
  ai: 'AI / NVIDIA NIM',
  matching: 'Envanter eşleştirme',
  completed: 'Tamamlandı',
  error: 'Hata',
}[stage] ?? stage)

const eventRows = computed(() => {
  const events = progress.value?.events ?? []
  const unique = new Map<string, typeof events[number]>()
  events.forEach((event) => unique.set(event.stage, event))
  return [...unique.values()]
})

const copyDetails = async () => {
  const payload = JSON.stringify(progress.value, null, 2)
  await navigator.clipboard.writeText(payload)
  copied.value = true
  window.setTimeout(() => { copied.value = false }, 1500)
}
</script>

<template>
  <div class="mx-auto max-w-2xl py-6">
    <div class="mb-4 flex items-center gap-3 rounded-xl border border-[#e7e9ed] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="18" /></span>
      <div class="min-w-0 flex-1">
        <p class="truncate text-sm font-semibold text-[#172033] dark:text-white">{{ file?.name }}</p>
        <p class="text-xs text-gray-400">{{ file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '' }}</p>
      </div>
      <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-[11px] font-semibold text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5" @click="copyDetails">
        <Clipboard :size="13" /> {{ copied ? 'Kopyalandı' : 'Detayları Kopyala' }}
      </button>
    </div>

    <div class="mb-4 rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <p class="text-sm font-bold text-[#172033] dark:text-white">Rapor Analizi</p>
          <p class="mt-0.5 text-xs text-gray-400">{{ progress?.current_label || 'Analiz başlatılıyor...' }}</p>
        </div>
        <span class="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10">
          {{ progress?.total_pages ? `${progress.total_pages} sayfa` : 'Hazırlanıyor' }}
        </span>
      </div>

      <div class="space-y-2">
        <div v-for="event in eventRows" :key="event.stage" class="flex items-center gap-2.5 rounded-lg border border-[#f0f1f3] px-3 py-2.5 dark:border-gray-800">
          <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" :class="event.status === 'done' ? 'bg-emerald-500 text-white' : event.status === 'error' ? 'bg-red-500 text-white' : 'bg-red-50 text-[#d71920] dark:bg-red-500/10'">
            <Check v-if="event.status === 'done'" :size="12" />
            <span v-else-if="event.status === 'error'" class="text-[10px] font-bold">!</span>
            <LoaderCircle v-else :size="12" class="animate-spin" />
          </span>
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">{{ stageLabel(event.stage) }}</p>
            <p class="truncate text-[11px] text-gray-400">{{ event.label }}</p>
          </div>
          <span v-if="event.page" class="text-[10px] font-semibold text-gray-400">Sayfa {{ event.page }}</span>
        </div>
      </div>

      <div v-if="progress?.status === 'failed'" class="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">
        {{ progress.error || 'Bilinmeyen analiz hatası.' }}
      </div>

      <div class="mt-4 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div class="ai-progress-bar h-1.5 w-1/3 rounded-full bg-[#d71920]" />
      </div>
      <p class="mt-2 text-center text-xs text-gray-400">
        Geçen süre: {{ elapsedLabel }}
        <span v-if="progress?.current_stage === 'ai'"> — NVIDIA NIM yanıtı bekleniyor</span>
      </p>
    </div>

    <details v-if="progress" class="mb-4 rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
      <summary class="cursor-pointer px-4 py-3 text-xs font-semibold text-gray-500">Ham analiz telemetrisi</summary>
      <pre class="max-h-72 overflow-auto border-t border-gray-100 p-4 text-[10px] leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">{{ JSON.stringify(progress, null, 2) }}</pre>
    </details>

    <button type="button" class="w-full rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('cancel')">İptal</button>
  </div>
</template>

<style scoped>
.ai-progress-bar { animation: ai-progress-slide 1.3s ease-in-out infinite; }
@keyframes ai-progress-slide {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(150%); }
  100% { transform: translateX(-100%); }
}
</style>
