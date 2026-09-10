<script setup lang="ts">
// Belirsiz Eşleşme — Detay ve Karar ekranı. Matching Engine'in
// "candidate_multiple" döndürdüğü TEK bir ekipman satırı için tam genişlikte
// inceleme görünümü (üst bileşen bunu bir listede değil, "İncele" ile
// seçilen tek kayıt için gösterir). Hangi alanların gösterileceği
// `domain`'e göre değişir (Matching Profile mantığının frontend'e kadar
// taşınması için — YscMatchingProfile'da marka/model/seri yok,
// FireSuppressionMatchingProfile'da kategoriye göre var):
//   - ysc: Kod, Tip, Kapasite, Konum
//   - fire_suppression: Kod, Kategori, Marka, Model, Seri No (varsa), Konum
// Bu component hiçbir isteği kendi başlatmaz — sadece kullanıcının seçimini
// `resolve` event'iyle üst bileşene bildirir, envanter değişikliği üst
// bileşendeki (rapor kaydetme) akışta, kullanıcı "Raporu Kaydet"e basınca
// gerçekleşir.
type Domain = 'ysc' | 'fire_suppression'

type ReportSideEquipment = {
  code?: string | null
  categoryLabel?: string | null
  equipmentType?: string | null
  capacity?: string | null
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  locationNote?: string | null
  result?: string | null
  note?: string | null
}

type CandidateItem = {
  id: number
  code?: string | null
  categoryLabel?: string | null
  equipmentType?: string | null
  capacity?: string | null
  brand?: string | null
  model?: string | null
  serialNo?: string | null
  locationNote?: string | null
}

export type AmbiguousMatchResolution = { action: 'match' | 'none' | 'ambiguous'; candidateId: number | null }

const props = defineProps<{
  domain: Domain
  entryKey: string | number
  reportEquipment: ReportSideEquipment
  candidates: CandidateItem[]
  resolution?: AmbiguousMatchResolution | null
}>()

const emit = defineEmits<{ resolve: [AmbiguousMatchResolution]; back: [] }>()

const selectedId = ref<number | null>(props.resolution?.action === 'match' ? props.resolution.candidateId : (props.candidates[0]?.id ?? null))
const showAllFields = ref(false)

const resultLabel = (value?: string | null) => value === 'uygun' ? 'Uygun' : value === 'uygun_degil' ? 'Uygun Değil' : value || '—'

// "Rapor'dan Alınan Görsel/Metin" — PDF'den çıkarılan ham metnin kendisi
// saklanmıyor, bu yüzden şeffaflık için elimizdeki alanlardan kısa bir özet
// sentezleniyor (gerçek OCR/metin çıktısını göstermek için backend'in ham
// metni de döndürmesi gerekirdi — kapsam dışı, mevcut veriyle çözülüyor).
const rawSnippet = computed(() => {
  const parts: string[] = []
  if (props.reportEquipment.code) parts.push(props.reportEquipment.code)
  if (props.reportEquipment.locationNote) parts.push(props.reportEquipment.locationNote)
  const lines = [parts.join(' - ')]
  if (props.domain === 'ysc') {
    if (props.reportEquipment.equipmentType) lines.push(`Tip: ${props.reportEquipment.equipmentType}`)
    if (props.reportEquipment.capacity) lines.push(`Kapasite: ${props.reportEquipment.capacity}`)
  } else {
    if (props.reportEquipment.brand || props.reportEquipment.model) lines.push(`Marka/Model: ${[props.reportEquipment.brand, props.reportEquipment.model].filter(Boolean).join(' ')}`)
    if (props.reportEquipment.serialNo) lines.push(`Seri No: ${props.reportEquipment.serialNo}`)
  }
  if (props.reportEquipment.result) lines.push(`Genel Durum: ${resultLabel(props.reportEquipment.result)}`)
  if (props.reportEquipment.note) lines.push(props.reportEquipment.note)
  return lines.filter(Boolean).join('\n')
})
</script>

<template>
  <div>
    <div class="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">
      ⚠️ Bu ekipman için birden fazla olası eşleşme bulundu. Lütfen doğru kaydı seçin — onaylamadan envanter güncellenmeyecektir.
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Rapor Bilgisi + ham metin -->
      <div class="space-y-4">
        <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="mb-3 text-[11px] font-bold uppercase tracking-wide text-gray-400">Rapor Bilgisi</p>
          <dl class="space-y-2 text-sm">
            <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">{{ domain === 'ysc' ? 'Ekipman Adı' : 'Ekipman Kodu' }}</dt><dd class="font-semibold text-[#172033] dark:text-white">{{ reportEquipment.code || '—' }}</dd></div>
            <template v-if="domain === 'ysc'">
              <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Tip</dt><dd>{{ reportEquipment.equipmentType || '—' }}</dd></div>
              <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Kapasite</dt><dd>{{ reportEquipment.capacity || '—' }}</dd></div>
            </template>
            <template v-else>
              <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Kategori</dt><dd>{{ reportEquipment.categoryLabel || '—' }}</dd></div>
              <div v-if="reportEquipment.brand || reportEquipment.model" class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Marka/Model</dt><dd>{{ [reportEquipment.brand, reportEquipment.model].filter(Boolean).join(' · ') }}</dd></div>
              <div v-if="reportEquipment.serialNo" class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Seri No</dt><dd>{{ reportEquipment.serialNo }}</dd></div>
            </template>
            <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Konum</dt><dd>{{ reportEquipment.locationNote || '—' }}</dd></div>
            <div class="flex items-baseline justify-between gap-2"><dt class="text-gray-400">Rapor Notu</dt><dd class="text-right">{{ reportEquipment.note || '—' }}</dd></div>
          </dl>
        </div>

        <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p class="mb-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">Rapor'dan Alınan Görsel/Metin</p>
          <pre class="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 font-outfit text-xs text-gray-600 dark:bg-white/5 dark:text-gray-300">{{ rawSnippet }}</pre>
        </div>
      </div>

      <!-- Olası Eşleşmeler -->
      <div class="rounded-xl border border-[#e7e9ed] bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-bold uppercase tracking-wide text-gray-400">Olası Eşleşmeler (Envanterde bulunan benzer kayıtlar)</p>
          <button v-if="domain === 'fire_suppression'" type="button" class="text-[11px] font-semibold text-[#d71920]" @click="showAllFields = !showAllFields">{{ showAllFields ? 'Alanları Daralt' : 'Tüm alanları göster' }}</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-[#f1f2f4] font-semibold uppercase tracking-wide text-gray-400 dark:border-gray-800">
                <th class="py-2 pr-2"></th>
                <th class="py-2 pr-2">Kod</th>
                <th class="py-2 pr-2">{{ domain === 'ysc' ? 'Tip / Kapasite' : 'Kategori' }}</th>
                <th class="py-2 pr-2">Konum</th>
                <th v-if="domain === 'fire_suppression' && showAllFields" class="py-2 pr-2">Marka / Model</th>
                <th v-if="domain === 'fire_suppression' && showAllFields" class="py-2 pr-2">Seri No</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="cand in candidates"
                :key="cand.id"
                class="cursor-pointer border-b border-[#f1f2f4] last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5"
                :class="selectedId === cand.id ? 'bg-red-50/60 dark:bg-red-500/5' : ''"
                @click="selectedId = cand.id"
              >
                <td class="py-2.5 pr-2"><input v-model="selectedId" type="radio" :name="`ambiguous-${entryKey}`" :value="cand.id" class="accent-[#d71920]"></td>
                <td class="py-2.5 pr-2 font-semibold text-[#172033] dark:text-white">{{ cand.code || '—' }}</td>
                <td class="py-2.5 pr-2 text-gray-600 dark:text-gray-300">{{ domain === 'ysc' ? [cand.capacity, cand.equipmentType].filter(Boolean).join(' · ') || '—' : (cand.categoryLabel || '—') }}</td>
                <td class="py-2.5 pr-2 text-gray-600 dark:text-gray-300">{{ cand.locationNote || '—' }}</td>
                <td v-if="domain === 'fire_suppression' && showAllFields" class="py-2.5 pr-2 text-gray-600 dark:text-gray-300">{{ [cand.brand, cand.model].filter(Boolean).join(' / ') || '—' }}</td>
                <td v-if="domain === 'fire_suppression' && showAllFields" class="py-2.5 pr-2 text-gray-600 dark:text-gray-300">{{ cand.serialNo || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <p v-if="!candidates.length" class="py-4 text-center text-xs text-gray-400">Aday kayıt bulunamadı.</p>
        </div>
      </div>
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <button type="button" class="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('back')">Geri</button>
      <button type="button" class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('resolve', { action: 'none', candidateId: null })">Hiçbiri Değil</button>
      <button type="button" class="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" @click="emit('resolve', { action: 'ambiguous', candidateId: null })">Belirsiz Bırak</button>
      <button
        type="button"
        class="ml-auto rounded-lg bg-[#d71920] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b9151b] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!selectedId"
        @click="emit('resolve', { action: 'match', candidateId: selectedId })"
      >
        Seçilen ile Eşleştir
      </button>
    </div>
  </div>
</template>
