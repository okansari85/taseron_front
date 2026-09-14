<script setup lang="ts">
import { CheckCircle2, FileText, LoaderCircle } from '@lucide/vue'
import { fireSuppressionReportApi, activeFireSuppressionAnalysisId, type FireSuppressionAnalysisProgress } from '~/api/fire-suppression-report'

const props = defineProps<{
  file: File | null
  steps: { label: string; done: boolean }[]
}>()

const emit = defineEmits<{ cancel: []; completed: [FireSuppressionAnalysisProgress]; failed: [string] }>()

const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let resolved = false
const completedState = ref<FireSuppressionAnalysisProgress | null>(null)
const showAiSemantic = ref(true)

const aiSemanticFrom = (state: FireSuppressionAnalysisProgress | null): unknown => {
  const event = [...(state?.events ?? [])].reverse().find(e => e.stage === 'ai_result' && e.ai_semantic !== undefined)
  return event?.ai_semantic ?? null
}

const continueToMatching = () => {
  if (!completedState.value) return
  emit('completed', completedState.value)
}

const poll = async () => {
  const id = activeFireSuppressionAnalysisId.value
  if (!id || resolved) return
  try {
    const response = await fireSuppressionReportApi.analysisProgress(id)

    if (response.data.status !== 'running') {
      resolved = true
      if (pollTimer) { clearInterval(pollTimer); pollTimer = null }

      if (response.data.status === 'completed' && response.data.result) {
        completedState.value = response.data
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

const aiSemantic = computed(() => aiSemanticFrom(completedState.value))
</script>

<template>
  <div class="mx-auto max-w-4xl py-8">
    <template v-if="!completedState">
      <div class="mx-auto max-w-md py-12 text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
          <LoaderCircle :size="24" class="animate-spin" />
        </div>
        <p class="text-sm font-bold text-[#172033] dark:text-white">Rapor analiz ediliyor</p>
        <p class="mt-1.5 text-xs text-gray-400">Bu işlem raporun boyutuna göre birkaç dakika sürebilir.</p>

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

    <template v-else>
      <div class="mb-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
        <CheckCircle2 :size="20" class="shrink-0 text-emerald-600" />
        <div>
          <p class="text-sm font-bold text-emerald-800 dark:text-emerald-300">AI analizi tamamlandı</p>
          <p class="text-[11px] text-emerald-700/80 dark:text-emerald-400/70">Eşleştirmeye geçmeden önce NVIDIA'nın semantic çıktısını kontrol edebilirsin.</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left"
          @click="showAiSemantic = !showAiSemantic"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-300">NVIDIA AI Çıktısı</p>
            <p class="mt-0.5 text-[11px] text-gray-400">V12 tablo analizine aktarılmadan önceki semantic sonuç</p>
          </div>
          <span class="text-xs font-semibold text-[#d71920]">{{ showAiSemantic ? 'Gizle' : 'Göster' }}</span>
        </button>

        <pre
          v-if="showAiSemantic"
          class="max-h-[620px] overflow-auto border-t border-[#e7e9ed] bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
        >{{ JSON.stringify(aiSemantic, null, 2) }}</pre>
      </div>

      <div v-if="!aiSemantic" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        NVIDIA semantic çıktısı bu analiz kaydında bulunamadı.
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('cancel')">İptal</button>
        <button type="button" class="rounded-lg bg-[#d71920] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b9151b]" @click="continueToMatching">Analize Devam Et</button>
      </div>
    </template>
  </div>
</template>
