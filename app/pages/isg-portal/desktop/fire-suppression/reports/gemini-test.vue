<script setup lang="ts">
import { ArrowLeft, FileText, LoaderCircle, Sparkles } from '@lucide/vue'
import { fireSuppressionReportApi, type GeminiSemanticFixture } from '~/api/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { $toast } = useNuxtApp()

const selectedFile = ref<File | null>(null)
const loading = ref(false)
const fixture = ref<GeminiSemanticFixture | null>(null)
const showSemantic = ref(true)

const goBack = () => navigateTo('/isg-portal/desktop/fire-suppression/reports')

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
}

const runGemini = async () => {
  if (!context.branchId) {
    $toast.error('Önce çalışma alanı/şube seçmelisin.')
    return
  }
  if (!selectedFile.value) {
    $toast.error('Bir PDF seçmelisin.')
    return
  }

  loading.value = true
  fixture.value = null

  try {
    const response = await fireSuppressionReportApi.geminiFixture(context.branchId, selectedFile.value)
    fixture.value = response.data
    $toast.success('Gemini semantic çıktısı kaydedildi.')
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || 'Gemini analizi başarısız oldu.')
  } finally {
    loading.value = false
  }
}

const semanticJson = computed(() => fixture.value ? JSON.stringify(fixture.value.semantic, null, 2) : '')
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div class="flex items-center gap-4">
          <button class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="goBack">
            <ArrowLeft :size="20" />
          </button>
          <div>
            <div class="flex items-center gap-2">
              <Sparkles :size="20" class="text-violet-600" />
              <h1 class="text-xl font-semibold">Gemini Semantic Test</h1>
            </div>
            <p class="mt-1 text-sm text-slate-500">V12 çalışmadan yalnızca Gemini çıktısını al ve fixture olarak kaydet.</p>
          </div>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5">
          <h2 class="text-base font-semibold">1. PDF Seç</h2>
          <p class="mt-1 text-sm text-slate-500">Bu ekran Job, V12 ve eşleştirme çalıştırmaz.</p>
        </div>

        <label class="flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 hover:border-violet-400">
          <div class="rounded-xl bg-white p-3 shadow-sm">
            <FileText :size="22" class="text-violet-600" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ selectedFile?.name || 'Yangın raporu PDF seç' }}</p>
            <p class="mt-1 text-xs text-slate-500">Maksimum 50 MB</p>
          </div>
          <input type="file" accept="application/pdf,.pdf" class="hidden" @change="onFileChange">
        </label>

        <button
          class="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || !selectedFile"
          @click="runGemini"
        >
          <LoaderCircle v-if="loading" :size="18" class="animate-spin" />
          <Sparkles v-else :size="18" />
          {{ loading ? 'Gemini analiz ediyor...' : 'Gemini'yi Çalıştır' }}
        </button>
      </section>

      <section v-if="fixture" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 class="text-base font-semibold">2. Gemini Çıktısı</h2>
            <p class="mt-1 text-sm text-slate-500">Bu JSON fixture olarak sunucuda kaydedildi.</p>
          </div>
          <div class="flex items-center gap-3 text-xs text-slate-500">
            <span class="rounded-lg bg-slate-100 px-3 py-2">{{ fixture.model }}</span>
            <span class="rounded-lg bg-violet-50 px-3 py-2 text-violet-700">{{ fixture.fixture_id }}</span>
          </div>
        </div>

        <div class="px-6 py-5">
          <button class="mb-3 text-sm font-medium text-violet-700" @click="showSemantic = !showSemantic">
            {{ showSemantic ? 'Gizle' : 'Göster' }}
          </button>
          <pre v-if="showSemantic" class="max-h-[70vh] overflow-auto rounded-xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">{{ semanticJson }}</pre>
        </div>
      </section>
    </main>
  </div>
</template>
