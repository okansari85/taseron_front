<script setup lang="ts">
import { CalendarClock, ClipboardList, FileText, PlayCircle } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { workRequestApi } from '~/api/work-request'
import type { WorkRequestItem } from '~/types/work-request'

definePageMeta({ layout: 'contractor-portal' })

const auth = useAuth()

const loading = ref(true)
const requests = ref<WorkRequestItem[]>([])

onMounted(async () => {
  try {
    const response = await workRequestApi.myRequests()
    requests.value = response.data
  } catch {
    requests.value = []
  } finally {
    loading.value = false
  }
})

const pendingCount = computed(() => requests.value.filter((r) => r.status === 'pending').length)
const upcoming = computed(() =>
  requests.value
    .filter((r) => r.status !== 'completed' && r.status !== 'rejected')
    .slice(0, 3),
)

const statusLabel: Record<string, string> = {
  pending: 'Bekliyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı',
}

const contractorName = computed(() => auth.user.value?.contractor?.name ?? auth.user.value?.name ?? '')
const contractorTypeLabel = computed(() =>
  auth.user.value?.contractor?.contractor_type === 'temporary' ? 'Geçici Taşeron' : 'Daimi Taşeron',
)
</script>
<template>
  <div class="mx-auto w-full max-w-[1200px] space-y-6">
    <header>
      <p class="text-xs font-medium uppercase tracking-wide text-brand-500">Taşeron Portalı</p>
      <h1 class="mt-1 text-2xl font-semibold">{{ contractorName }}</h1>
      <p class="mt-1 text-sm text-gray-500">{{ contractorTypeLabel }}</p>
    </header>

    <div class="grid gap-4 md:grid-cols-3">
      <NuxtLink to="/contractor-portal/work-requests" class="rounded-2xl border border-gray-200 bg-white p-5 hover:border-brand-200">
        <ClipboardList class="text-brand-500" :size="21" />
        <h2 class="mt-4 font-semibold">İş Talepleri</h2>
        <p class="mt-1 text-sm text-gray-500">{{ loading ? 'Yükleniyor...' : `${pendingCount} talep onay bekliyor.` }}</p>
      </NuxtLink>
      <NuxtLink to="/contractor-portal/documents" class="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
        <FileText class="text-gray-400" :size="21" />
        <h2 class="mt-4 font-semibold text-gray-600">Evraklarım</h2>
        <p class="mt-1 text-sm text-gray-400">Evrak profili modülü henüz devreye alınmadı.</p>
      </NuxtLink>
      <NuxtLink to="/contractor-portal/training" class="rounded-2xl border border-dashed border-gray-200 bg-white p-5">
        <PlayCircle class="text-gray-400" :size="21" />
        <h2 class="mt-4 font-semibold text-gray-600">Zorunlu Eğitim</h2>
        <p class="mt-1 text-sm text-gray-400">Eğitim modülü henüz devreye alınmadı.</p>
      </NuxtLink>
    </div>

    <div class="rounded-2xl border border-gray-200 bg-white">
      <div class="border-b border-gray-100 p-5">
        <h2 class="font-semibold">Yaklaşan İşlerim</h2>
      </div>
      <div v-if="loading" class="p-10 text-center text-sm text-gray-400">Yükleniyor...</div>
      <div v-else-if="upcoming.length === 0" class="p-10 text-center text-sm text-gray-400">Şu anda açık bir iş talebiniz yok.</div>
      <div v-else class="divide-y divide-gray-100">
        <NuxtLink
          v-for="item in upcoming"
          :key="item.id"
          to="/contractor-portal/work-requests"
          class="flex items-center justify-between p-5 hover:bg-gray-50"
        >
          <div>
            <p class="font-medium">{{ item.title }}</p>
            <p class="mt-1 text-xs text-gray-400">
              {{ item.organization?.name ?? '—' }}
              <span v-if="item.proposed_date"> · Önerilen: {{ item.proposed_date }}</span>
              <span v-else-if="item.requested_date"> · {{ item.requested_date }}</span>
            </p>
          </div>
          <div class="flex items-center gap-3">
            <span class="rounded-full bg-warning-50 px-2.5 py-1 text-xs text-warning-700">{{ statusLabel[item.status] ?? item.status }}</span>
            <CalendarClock :size="18" class="text-gray-400" />
          </div>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
