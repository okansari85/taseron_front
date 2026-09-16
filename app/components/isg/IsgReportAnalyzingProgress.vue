<script setup lang="ts">
import { CheckCircle2, CircleDashed, FileText, LoaderCircle } from '@lucide/vue'
import { fireSuppressionReportApi, activeFireSuppressionAnalysisId, type FireSuppressionAnalysisProgress } from '~/api/fire-suppression-report'

const props = defineProps<{
  file: File | null
}>()

const emit = defineEmits<{ cancel: []; completed: [FireSuppressionAnalysisProgress]; failed: [string] }>()

const elapsedSeconds = ref(0)
let timer: ReturnType<typeof setInterval> | null = null
let pollTimer: ReturnType<typeof setInterval> | null = null
let resolved = false
const completedState = ref<FireSuppressionAnalysisProgress | null>(null)
// Poll sırasında (henüz tamamlanmadan) gelen en güncel durum — canlı
// aşama/etiket göstermek için (bkz. STAGE_ORDER + stageStatus aşağıda).
const liveState = ref<FireSuppressionAnalysisProgress | null>(null)
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
    liveState.value = response.data

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
  pollTimer = setInterval(poll, 3000)
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

// Backend'in yayınladığı gerçek aşamalar (bkz. AnalyzeFireSuppressionReportJob
// / FireSuppressionAnalysisProgress) — sabit sırayla, aşama index'i
// current_stage'in index'iyle karşılaştırılarak done/running/pending
// belirlenir. "extracting" fixture-test modunda hiç yayınlanmaz (Gemini'ye
// hiç gidilmez) - bu index karşılaştırmalı yaklaşımda sorun yaratmaz, çünkü
// atlanan aşama otomatik "geçilmiş" sayılır.
const STAGE_ORDER = ['upload', 'extracting', 'ai', 'tables', 'matching', 'completed'] as const
const STAGE_LABELS: Record<(typeof STAGE_ORDER)[number], string> = {
  upload: 'PDF alındı',
  extracting: 'PDF metni çıkarılıyor',
  ai: 'Gemini ile rapor yapısı analiz ediliyor',
  tables: 'Tablo verileri çıkarılıyor (Camelot) — en uzun adım',
  matching: 'Ekipman envanterle eşleştiriliyor',
  completed: 'Tamamlandı',
}
const currentStageIndex = computed(() => {
  const stage = liveState.value?.current_stage
  const idx = STAGE_ORDER.indexOf((stage ?? 'upload') as (typeof STAGE_ORDER)[number])
  return idx === -1 ? 0 : idx
})
const stageStatus = (stage: (typeof STAGE_ORDER)[number]): 'done' | 'running' | 'pending' => {
  const idx = STAGE_ORDER.indexOf(stage)
  if (idx < currentStageIndex.value) return 'done'
  if (idx === currentStageIndex.value) return 'running'
  return 'pending'
}
// "tables" (Camelot) adımı tek bir arka uç çağrısı olduğu için ara
// checkpoint'i yok — raporun boyutuna göre onlarca saniye sürebiliyor.
// Gerçek yüzdelik ilerleme bilinmediğinden, geçen süreye göre asimptotik
// (hep ilerleyen ama asla %100'e ulaşmayan) bir bar gösteriyoruz; çubuk
// tamamlanınca (completedState dolunca) %100'e tamamlanır.
const softProgressPercent = computed(() => Math.min(92, (elapsedSeconds.value / (elapsedSeconds.value + 18)) * 100))
</script>

<template>
  <div class="mx-auto max-w-4xl py-8">
    <template v-if="!completedState">
      <div class="mx-auto max-w-md py-10 text-center">
        <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#d71920] dark:bg-red-500/10">
          <LoaderCircle :size="24" class="animate-spin" />
        </div>
        <p class="text-sm font-bold text-[#172033] dark:text-white">Rapor analiz ediliyor</p>
        <p class="mt-1.5 text-xs text-gray-400">Bu işlem raporun boyutuna göre birkaç dakika sürebilir.</p>

        <div v-if="props.file" class="mx-auto mt-5 flex max-w-xs items-center gap-3 rounded-xl border border-[#e7e9ed] bg-white p-3 text-left dark:border-gray-800 dark:bg-gray-900">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><FileText :size="16" /></span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-xs font-semibold text-[#172033] dark:text-white">{{ props.file.name }}</p>
            <p class="text-[10px] text-gray-400">{{ (props.file.size / (1024 * 1024)).toFixed(1) }} MB</p>
          </div>
        </div>

        <!-- Aşama listesi: canlı poll verisinden (bkz. liveState). Bu
             bileşen fire-suppression DIŞINDA da kullanılıyor (örn. YSC
             yıllık kontrol sihirbazı) - o akışlarda activeFireSuppressionAnalysisId
             hiç set edilmediğinden poll() hep no-op kalır ve liveState boş
             kalır, dolayısıyla bu (Gemini/Camelot'a özel) aşama listesi
             SADECE gerçekten bu polling'i kullanan çağıranlarda görünür. -->
        <div v-if="liveState" class="mx-auto mt-6 max-w-xs space-y-2 text-left">
          <div v-for="stage in STAGE_ORDER.slice(0, -1)" :key="stage" class="flex items-center gap-2.5">
            <CheckCircle2 v-if="stageStatus(stage) === 'done'" :size="16" class="shrink-0 text-emerald-500" />
            <LoaderCircle v-else-if="stageStatus(stage) === 'running'" :size="16" class="shrink-0 animate-spin text-[#d71920]" />
            <CircleDashed v-else :size="16" class="shrink-0 text-gray-300 dark:text-gray-700" />
            <span
              class="text-xs"
              :class="stageStatus(stage) === 'pending' ? 'text-gray-400' : stageStatus(stage) === 'running' ? 'font-semibold text-[#172033] dark:text-white' : 'text-gray-500 dark:text-gray-400'"
            >{{ STAGE_LABELS[stage] }}</span>
          </div>
        </div>

        <!-- Asimptotik ilerleme çubuğu — gerçek yüzde bilinmiyor ama görsel
             olarak "çalışıyor, ilerliyor" hissini veriyor. Domain'e özel
             olmadığı için her çağıranda gösterilir. -->
        <div class="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div class="h-full rounded-full bg-[#d71920] transition-[width] duration-700 ease-out" :style="{ width: `${softProgressPercent}%` }" />
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
          <p class="text-[11px] text-emerald-700/80 dark:text-emerald-400/70">Eşleştirmeye geçmeden önce Gemini'nin şablon çıktısını kontrol edebilirsin.</p>
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
        <button
          type="button"
          class="flex w-full items-center justify-between px-4 py-3 text-left"
          @click="showAiSemantic = !showAiSemantic"
        >
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-300">Gemini Template Discovery Çıktısı</p>
            <p class="mt-0.5 text-[11px] text-gray-400">Camelot tablo analizine aktarılmadan önceki semantic sonuç</p>
          </div>
          <span class="text-xs font-semibold text-[#d71920]">{{ showAiSemantic ? 'Gizle' : 'Göster' }}</span>
        </button>

        <pre
          v-if="showAiSemantic"
          class="max-h-[620px] overflow-auto border-t border-[#e7e9ed] bg-gray-50 p-4 text-[11px] leading-relaxed text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-300"
        >{{ JSON.stringify(aiSemantic, null, 2) }}</pre>
      </div>

      <div v-if="!aiSemantic" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
        Gemini semantic çıktısı bu analiz kaydında bulunamadı.
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button type="button" class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('cancel')">İptal</button>
        <button type="button" class="rounded-lg bg-[#d71920] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b9151b]" @click="continueToMatching">Analize Devam Et</button>
      </div>
    </template>
  </div>
</template>
