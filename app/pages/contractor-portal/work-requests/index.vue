<script setup lang="ts">
import { CalendarClock, CheckCircle2, Clock3, XCircle } from '@lucide/vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import trLocale from '@fullcalendar/core/locales/tr'
import { computed, onMounted, ref } from 'vue'
import { workRequestApi } from '~/api/work-request'
import type { WorkRequestItem } from '~/types/work-request'

definePageMeta({ layout: 'contractor-portal' })

const { $toast } = useNuxtApp()

const loading = ref(true)
const loadError = ref('')
const requests = ref<WorkRequestItem[]>([])

const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const response = await workRequestApi.myRequests()
    requests.value = response.data
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'İş talepleri yüklenemedi.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

const pendingCount = computed(() => requests.value.filter((r) => r.status === 'pending').length)
const approvedCount = computed(() => requests.value.filter((r) => r.status === 'approved').length)
const completedCount = computed(() => requests.value.filter((r) => r.status === 'completed').length)

const statusMeta: Record<string, { label: string; classes: string; icon: any; color: string }> = {
  pending: { label: 'Bekliyor', classes: 'bg-warning-50 text-warning-700', icon: Clock3, color: '#f59e0b' },
  approved: { label: 'Onaylandı', classes: 'bg-success-50 text-success-700', icon: CheckCircle2, color: '#10b981' },
  rejected: { label: 'Reddedildi', classes: 'bg-error-50 text-error-700', icon: XCircle, color: '#ef4444' },
  completed: { label: 'Tamamlandı', classes: 'bg-gray-100 text-gray-600', icon: CheckCircle2, color: '#6b7280' },
}

const calendarEvents = computed(() =>
  requests.value
    .filter((r) => r.requested_date || r.proposed_date)
    .map((r) => ({
      id: String(r.id),
      title: r.title,
      start: r.proposed_date ?? r.requested_date ?? undefined,
      allDay: true,
      backgroundColor: statusMeta[r.status]?.color ?? '#64748b',
      borderColor: statusMeta[r.status]?.color ?? '#64748b',
      textColor: '#ffffff',
    })),
)

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin],
  initialView: 'dayGridMonth',
  locale: trLocale,
  firstDay: 1,
  height: 'auto',
  fixedWeekCount: false,
  dayMaxEvents: 2,
  eventDisplay: 'block',
  displayEventTime: false,
  headerToolbar: { left: 'prev,next today', center: 'title', right: '' },
  buttonText: { today: 'Bugün' },
  events: calendarEvents.value,
}))

const proposingId = ref<number | null>(null)
const proposedDateDraft = ref('')
const submittingId = ref<number | null>(null)

const startPropose = (item: WorkRequestItem) => {
  proposingId.value = item.id
  proposedDateDraft.value = item.proposed_date ?? item.requested_date ?? ''
}
const cancelPropose = () => {
  proposingId.value = null
  proposedDateDraft.value = ''
}
const submitPropose = async (item: WorkRequestItem) => {
  if (!proposedDateDraft.value) return
  submittingId.value = item.id
  try {
    const response = await workRequestApi.proposeDate(item.id, proposedDateDraft.value)
    const index = requests.value.findIndex((r) => r.id === item.id)
    if (index !== -1) requests.value[index] = response.data
    $toast?.success?.('Alternatif tarih önerildi.')
    cancelPropose()
  } catch (error) {
    $toast?.error?.(error instanceof Error ? error.message : 'Tarih önerisi gönderilemedi.')
  } finally {
    submittingId.value = null
  }
}

const canPropose = (item: WorkRequestItem) => ['pending', 'approved'].includes(item.status)
</script>

<template>
  <div class="mx-auto w-full max-w-[1200px] space-y-6">
    <div>
      <p class="text-xs font-medium uppercase tracking-wide text-brand-500">Taşeron Portalı</p>
      <h1 class="mt-1 text-2xl font-semibold">İş Talepleri</h1>
      <p class="mt-1 text-sm text-gray-500">Size açılan iş taleplerini görün, takvimde inceleyin ve uygun değilse alternatif tarih önerin.</p>
    </div>

    <div v-if="loading" class="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">Yükleniyor...</div>
    <div v-else-if="loadError" class="rounded-2xl border border-error-200 bg-error-50 p-10 text-center text-sm text-error-600">{{ loadError }}</div>
    <template v-else>
      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-xs text-gray-400">Bekleyen</p>
          <p class="mt-1 text-xl font-semibold">{{ pendingCount }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-xs text-gray-400">Onaylanan</p>
          <p class="mt-1 text-xl font-semibold">{{ approvedCount }}</p>
        </div>
        <div class="rounded-2xl border border-gray-200 bg-white p-5">
          <p class="text-xs text-gray-400">Tamamlanan</p>
          <p class="mt-1 text-xl font-semibold">{{ completedCount }}</p>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-100 bg-gray-50/40 p-5">
        <h3 class="mb-3 text-sm font-semibold text-gray-900">Takvim Görünümü</h3>
        <div class="overflow-hidden rounded-lg border border-gray-100 bg-white p-2">
          <ClientOnly>
            <FullCalendar :options="calendarOptions" />
            <template #fallback><div class="flex min-h-[380px] items-center justify-center text-xs text-gray-400">Takvim yükleniyor...</div></template>
          </ClientOnly>
        </div>
      </div>

      <div class="rounded-2xl border border-gray-200 bg-white">
        <div class="border-b border-gray-100 p-5">
          <h2 class="font-semibold">Tüm Talepler</h2>
        </div>
        <div v-if="requests.length === 0" class="p-10 text-center text-sm text-gray-400">Henüz size açılmış bir iş talebi yok.</div>
        <div v-else class="divide-y divide-gray-100">
          <div v-for="item in requests" :key="item.id" class="p-5">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <CalendarClock :size="18" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ item.title }}</p>
                  <p class="mt-1 text-xs text-gray-400">
                    {{ item.organization?.name ?? 'Organizasyon belirtilmemiş' }}
                    <span v-if="item.requested_date"> · Talep edilen: {{ item.requested_date }}</span>
                    <span v-if="item.proposed_date"> · Önerilen: {{ item.proposed_date }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs" :class="statusMeta[item.status]?.classes">
                  <component :is="statusMeta[item.status]?.icon" :size="13" />{{ statusMeta[item.status]?.label ?? item.status }}
                </span>
                <button
                  v-if="canPropose(item) && proposingId !== item.id"
                  type="button"
                  class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                  @click="startPropose(item)"
                >
                  Farklı Tarih Öner
                </button>
              </div>
            </div>
            <p v-if="item.description" class="mt-2 text-xs text-gray-500">{{ item.description }}</p>
            <div v-if="proposingId === item.id" class="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-gray-50 p-3">
              <input v-model="proposedDateDraft" type="date" class="h-9 rounded-lg border border-gray-200 px-2 text-sm" />
              <button
                type="button"
                :disabled="submittingId === item.id"
                class="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
                @click="submitPropose(item)"
              >
                {{ submittingId === item.id ? 'Gönderiliyor...' : 'Öneriyi Gönder' }}
              </button>
              <button type="button" class="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500" @click="cancelPropose">Vazgeç</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
