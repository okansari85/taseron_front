<script setup lang="ts">
import { ArrowLeft, FileText, LoaderCircle, Sparkles, FlaskConical } from '@lucide/vue'
import { fireSuppressionReportApi, type GeminiFixtureSummary, type GeminiSemanticFixture } from '~/api/fire-suppression-report'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })
const context = useIsgDesktopContextStore()
const { $toast } = useNuxtApp()
const selectedFile = ref<File | null>(null)
const loading = ref(false)
const v12Loading = ref(false)
const fixturesLoading = ref(false)
const fixtureLoading = ref(false)
const fixtures = ref<GeminiFixtureSummary[]>([])
const selectedFixtureId = ref('')
const fixture = ref<GeminiSemanticFixture | null>(null)
const v12Result = ref<Record<string, unknown> | null>(null)
const showSemantic = ref(true)
const showV12 = ref(true)
const goBack = () => navigateTo('/isg-portal/desktop/fire-suppression/reports')
const onFileChange = (event: Event) => { const input = event.target as HTMLInputElement; selectedFile.value = input.files?.[0] ?? null }
const loadFixtures = async () => {
  if (!context.branchId) return
  fixturesLoading.value = true
  try {
    const response = await fireSuppressionReportApi.listGeminiFixtures(context.branchId)
    fixtures.value = response.data
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || 'Fixture listesi alınamadı.')
  } finally { fixturesLoading.value = false }
}
const selectFixture = async (id: string) => {
  selectedFixtureId.value = id
  v12Result.value = null
  if (!id) { fixture.value = null; return }
  fixtureLoading.value = true
  try {
    const response = await fireSuppressionReportApi.getGeminiFixture(context.branchId, id)
    fixture.value = response.data
    showSemantic.value = true
  } catch (error: any) {
    fixture.value = null
    $toast.error(error?.data?.message || error?.message || 'Fixture içeriği alınamadı.')
  } finally { fixtureLoading.value = false }
}
const runGemini = async () => {
  if (!context.branchId) return $toast.error('Önce çalışma alanı/şube seçmelisin.')
  if (!selectedFile.value) return $toast.error('Bir PDF seçmelisin.')
  loading.value = true; fixture.value = null; v12Result.value = null
  try {
    const response = await fireSuppressionReportApi.geminiFixture(context.branchId, selectedFile.value)
    fixture.value = response.data
    selectedFixtureId.value = response.data.fixture_id
    await loadFixtures()
    $toast.success('Gemini semantic çıktısı kaydedildi.')
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || 'Gemini analizi başarısız oldu.')
  } finally { loading.value = false }
}
const runV12 = async () => {
  if (!context.branchId) return $toast.error('Önce çalışma alanı/şube seçmelisin.')
  if (!selectedFixtureId.value) return $toast.error('Önce bir fixture seçmelisin.')
  v12Loading.value = true
  try {
    const response = await fireSuppressionReportApi.geminiFixtureV12(context.branchId, selectedFixtureId.value)
    v12Result.value = response.data
    showV12.value = true
    $toast.success('V12 analizi tamamlandı.')
  } catch (error: any) {
    $toast.error(error?.data?.message || error?.message || 'V12 analizi başarısız oldu.')
  } finally { v12Loading.value = false }
}
const semanticJson = computed(() => fixture.value?.semantic && Object.keys(fixture.value.semantic).length ? JSON.stringify(fixture.value.semantic, null, 2) : '')
const v12Json = computed(() => v12Result.value ? JSON.stringify(v12Result.value, null, 2) : '')
watch(() => context.branchId, () => { selectedFixtureId.value = ''; fixture.value = null; loadFixtures() }, { immediate: true })
</script>
<template>
  <div class="min-h-screen bg-slate-50 text-slate-900">
    <header class="border-b border-slate-200 bg-white"><div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5"><div class="flex items-center gap-4"><button class="rounded-xl p-2 text-slate-500 hover:bg-slate-100" @click="goBack"><ArrowLeft :size="20" /></button><div><div class="flex items-center gap-2"><Sparkles :size="20" class="text-violet-600" /><h1 class="text-xl font-semibold">Gemini / V12 Test</h1></div><p class="mt-1 text-sm text-slate-500">Gemini bir kez çalışır; kayıtlı fixture seçilerek semantic çıktı ve V12 tekrar tekrar test edilir.</p></div></div></div></header>
    <main class="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div class="mb-5"><h2 class="text-base font-semibold">1. Gemini Fixture</h2><p class="mt-1 text-sm text-slate-500">Daha önce kaydedilen Gemini çıktısını seç veya yeni PDF ile oluştur.</p></div>
        <div class="flex gap-3">
          <select v-model="selectedFixtureId" class="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500" :disabled="fixturesLoading || fixtureLoading" @change="selectFixture(selectedFixtureId)">
            <option value="">{{ fixturesLoading ? 'Fixturelar yükleniyor...' : 'Kayıtlı fixture seç...' }}</option>
            <option v-for="item in fixtures" :key="item.fixture_id" :value="item.fixture_id">{{ item.original_file_name }} — {{ item.created_at ? new Date(item.created_at).toLocaleString('tr-TR') : item.fixture_id }}</option>
          </select>
          <button class="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50" :disabled="fixturesLoading" @click="loadFixtures">Yenile</button>
        </div>
        <label class="mt-5 flex cursor-pointer items-center gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-4 hover:border-violet-400"><div class="rounded-xl bg-white p-3 shadow-sm"><FileText :size="22" class="text-violet-600" /></div><div class="min-w-0 flex-1"><p class="truncate text-sm font-medium">{{ selectedFile?.name || 'Yeni Gemini fixture için PDF seç' }}</p><p class="mt-1 text-xs text-slate-500">Maksimum 20 MB</p></div><input type="file" accept="application/pdf,.pdf" class="hidden" @change="onFileChange"></label>
        <button class="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50" :disabled="loading || !selectedFile" @click="runGemini"><LoaderCircle v-if="loading" :size="18" class="animate-spin" /><Sparkles v-else :size="18" />{{ loading ? 'Gemini analiz ediyor...' : 'Yeni Gemini Fixture Kaydet' }}</button>
      </section>
      <section v-if="selectedFixtureId" class="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5"><div><h2 class="text-base font-semibold">2. Seçili Fixture</h2><p class="mt-1 text-sm text-slate-500">{{ fixtureLoading ? 'Fixture yükleniyor...' : fixture?.original_file_name || selectedFixtureId }}</p></div><button class="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" :disabled="v12Loading || fixtureLoading" @click="runV12"><LoaderCircle v-if="v12Loading" :size="17" class="animate-spin" /><FlaskConical v-else :size="17" />{{ v12Loading ? 'V12 çalışıyor...' : 'V12’yi Çalıştır' }}</button></div>
        <div v-if="semanticJson" class="px-6 py-5"><button class="mb-3 text-sm font-medium text-violet-700" @click="showSemantic = !showSemantic">{{ showSemantic ? 'Gemini çıktısını gizle' : 'Gemini çıktısını göster' }}</button><pre v-if="showSemantic" class="max-h-[55vh] overflow-auto rounded-xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">{{ semanticJson }}</pre></div>
        <div v-else class="px-6 py-5 text-sm text-slate-500">Fixture seçildi. Gemini semantic JSON yükleniyor veya fixture boş.</div>
      </section>
      <section v-if="v12Result" class="rounded-2xl border border-slate-200 bg-white shadow-sm"><div class="flex items-center justify-between border-b border-slate-200 px-6 py-5"><div><h2 class="text-base font-semibold">3. V12 Final JSON</h2><p class="mt-1 text-sm text-slate-500">Gemini çağrısı yapılmadı. Kayıtlı fixture üzerinden çalıştı.</p></div><button class="text-sm font-medium text-violet-700" @click="showV12 = !showV12">{{ showV12 ? 'Gizle' : 'Göster' }}</button></div><div v-if="showV12" class="px-6 py-5"><pre class="max-h-[70vh] overflow-auto rounded-xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">{{ v12Json }}</pre></div></section>
    </main>
  </div>
</template>
