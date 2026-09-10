<script setup lang="ts">
// Belirsiz Eşleşme onay kartı — Matching Engine'in "candidate_multiple"
// döndürdüğü her ekipman satırı için bir kart. Hangi alanların
// gösterileceği `domain`'e göre değişir (Matching Profile mantığının
// frontend'e kadar taşınması için — YscMatchingProfile'da marka/model/seri
// yok, FireSuppressionMatchingProfile'da kategoriye göre var):
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

const emit = defineEmits<{ resolve: [AmbiguousMatchResolution] }>()

const selectedId = ref<number | null>(props.resolution?.action === 'match' ? props.resolution.candidateId : null)

const resultLabel = (value?: string | null) => value === 'uygun' ? 'Uygun' : value === 'uygun_degil' ? 'Uygun Değil' : value || '—'

const resolvedCandidate = computed(() => props.candidates.find(c => c.id === props.resolution?.candidateId) ?? null)
</script>

<template>
  <div class="rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-500/25 dark:bg-amber-500/5">
    <p class="mb-3 text-xs font-bold text-amber-700 dark:text-amber-400">⚠️ Belirsiz Eşleşme</p>

    <div class="grid gap-3 sm:grid-cols-2">
      <!-- Rapor verisi -->
      <div class="rounded-lg border border-[#e7e9ed] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Rapor Verisi</p>
        <dl class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <div class="flex items-baseline justify-between gap-2">
            <dt class="text-gray-400">Ekipman Kodu</dt>
            <dd class="font-semibold text-[#172033] dark:text-white">{{ reportEquipment.code || '—' }}</dd>
          </div>
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
          <div v-if="reportEquipment.result" class="flex items-baseline justify-between gap-2">
            <dt class="text-gray-400">Rapor Bilgisi</dt>
            <dd :class="reportEquipment.result === 'uygun_degil' ? 'font-semibold text-[#d71920]' : ''">{{ resultLabel(reportEquipment.result) }}</dd>
          </div>
        </dl>
      </div>

      <!-- Aday envanter kayıtları -->
      <div class="rounded-lg border border-[#e7e9ed] bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
        <p class="mb-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">Aday Envanter Kayıtları</p>
        <div class="space-y-1.5">
          <label
            v-for="cand in candidates"
            :key="cand.id"
            class="flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-xs transition"
            :class="selectedId === cand.id ? 'border-[#d71920] bg-red-50 dark:bg-red-500/10' : 'border-[#e7e9ed] hover:border-gray-300 dark:border-gray-800'"
          >
            <input v-model="selectedId" type="radio" :name="`ambiguous-${entryKey}`" :value="cand.id" class="mt-0.5 accent-[#d71920]">
            <div class="min-w-0">
              <p class="font-semibold text-[#172033] dark:text-white">{{ cand.code || '—' }}</p>
              <p v-if="domain === 'ysc'" class="text-gray-500 dark:text-gray-400">{{ [cand.capacity, cand.equipmentType].filter(Boolean).join(' · ') || '—' }}</p>
              <template v-else>
                <p v-if="cand.brand || cand.model" class="text-gray-500 dark:text-gray-400">{{ [cand.brand, cand.model].filter(Boolean).join(' · ') }}</p>
                <p v-if="cand.serialNo" class="text-gray-500 dark:text-gray-400">Seri No: {{ cand.serialNo }}</p>
              </template>
              <p class="text-gray-400">{{ cand.locationNote || '—' }}</p>
            </div>
          </label>
          <p v-if="!candidates.length" class="text-[11px] text-gray-400">Aday kayıt bulunamadı.</p>
        </div>
      </div>
    </div>

    <div class="mt-3 flex gap-2">
      <button
        type="button"
        class="flex-1 rounded-lg bg-[#d71920] py-2 text-xs font-semibold text-white transition hover:bg-[#b9151b] disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!selectedId"
        @click="emit('resolve', { action: 'match', candidateId: selectedId })"
      >
        Eşleştir
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        @click="emit('resolve', { action: 'none', candidateId: null })"
      >
        Hiçbiri Değil
      </button>
      <button
        type="button"
        class="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
        @click="emit('resolve', { action: 'ambiguous', candidateId: null })"
      >
        Belirsiz Bırak
      </button>
    </div>

    <p v-if="resolution" class="mt-2 text-[11px] font-medium" :class="resolution.action === 'match' ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'">
      <template v-if="resolution.action === 'match'">Eşleştirildi: {{ resolvedCandidate?.code || '—' }}</template>
      <template v-else-if="resolution.action === 'none'">Yeni ekipman adayı olarak işaretlendi — Envanter'den elle eklenebilir.</template>
      <template v-else>Belirsiz olarak bırakıldı — envanterde değişiklik yapılmadı.</template>
    </p>
  </div>
</template>
