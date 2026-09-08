<script setup lang="ts">
import { CalendarClock, ClipboardList, Plus, X } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { contractorApi, type ContractorApiRecord } from '~/api/contractor'
import { organizationApi } from '~/api/organization'
import { workRequestApi } from '~/api/work-request'
import type { WorkRequestItem, WorkRequestStatus } from '~/types/work-request'

const props = defineProps<{ fixedContractorId?: number }>()

const requests = ref<WorkRequestItem[]>([])
const loading = ref(false)
const errorMessage = ref('')
const changingId = ref<number | null>(null)

const contractors = ref<ContractorApiRecord[]>([])
const organizations = ref<Array<{ id: number; name: string; type: string }>>([])

const modalOpen = ref(false)
const saving = ref(false)
const form = ref({
  contractor_id: (props.fixedContractorId ?? null) as number | null,
  organization_id: null as number | null,
  title: '',
  description: '',
  requested_date: '',
})

const statusLabel: Record<WorkRequestStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  completed: 'Tamamlandı',
}
const statusClasses: Record<WorkRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-600',
  approved: 'bg-brand-50 text-brand-600',
  rejected: 'bg-error-50 text-error-600',
  completed: 'bg-success-50 text-success-600',
}

const contractorLabel = (item: WorkRequestItem) => item.contractor?.business_entity?.name ?? item.contractor?.short_name ?? '—'

const load = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await workRequestApi.list(props.fixedContractorId)
    requests.value = response.data
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'İş talepleri alınamadı.'
  } finally {
    loading.value = false
  }
}

const loadFormOptions = async () => {
  try {
    const [organizationList] = await Promise.all([organizationApi.list()])
    organizations.value = organizationList
      .filter((x) => x.type === 'holding' || x.type === 'group')
      .map((x) => ({ id: x.id, name: x.name, type: x.type }))
    if (!props.fixedContractorId) {
      const contractorList = await contractorApi.list()
      contractors.value = contractorList.filter((x) => x.contractor_type === 'temporary')
    }
  } catch {
    // Form seçenekleri alınamazsa kullanıcı yine de zorunlu alanları doldurup deneyebilir.
  }
}

const openModal = () => {
  form.value = { contractor_id: props.fixedContractorId ?? null, organization_id: null, title: '', description: '', requested_date: '' }
  modalOpen.value = true
}
const closeModal = () => {
  modalOpen.value = false
}

const canSubmit = computed(() => !!form.value.contractor_id && form.value.title.trim().length > 0)

const submit = async () => {
  if (!canSubmit.value || !form.value.contractor_id) return
  saving.value = true
  errorMessage.value = ''
  try {
    await workRequestApi.create({
      contractor_id: form.value.contractor_id,
      organization_id: form.value.organization_id,
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      requested_date: form.value.requested_date || null,
    })
    closeModal()
    await load()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'İş talebi oluşturulamadı.'
  } finally {
    saving.value = false
  }
}

const changeStatus = async (item: WorkRequestItem, status: WorkRequestStatus) => {
  changingId.value = item.id
  try {
    await workRequestApi.updateStatus(item.id, status)
    await load()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Durum güncellenemedi.'
  } finally {
    changingId.value = null
  }
}

onMounted(() => {
  load()
  loadFormOptions()
})
</script>

<template>
  <div>
    <div v-if="errorMessage" class="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ errorMessage }}</div>
    <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-100 p-5 dark:border-gray-800">
        <h2 class="font-semibold">İş Talepleri</h2>
        <button type="button" class="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white" @click="openModal">
          <Plus :size="16" /> Yeni İş Talebi
        </button>
      </div>
      <div v-if="loading" class="p-10 text-center text-sm text-gray-500">Yükleniyor...</div>
      <div v-else-if="!requests.length" class="p-10 text-center text-sm text-gray-500">Henüz iş talebi oluşturulmamış.</div>
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="item in requests" :key="item.id" class="flex flex-wrap items-center justify-between gap-3 p-5">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5">
              <ClipboardList :size="18" />
            </div>
            <div>
              <p class="font-medium">{{ item.title }}</p>
              <p class="mt-1 text-xs text-gray-400">
                <template v-if="!props.fixedContractorId">{{ contractorLabel(item) }} · </template>
                <template v-if="item.organization">{{ item.organization.name }} · </template>
                <span v-if="item.requested_date" class="inline-flex items-center gap-1"><CalendarClock :size="12" />{{ item.requested_date }}</span>
                <span v-else>Tarih belirtilmedi</span>
              </p>
              <p v-if="item.description" class="mt-1 text-xs text-gray-500">{{ item.description }}</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium" :class="statusClasses[item.status]">{{ statusLabel[item.status] }}</span>
            <select
              v-if="item.status === 'pending' || item.status === 'approved'"
              class="h-8 rounded-lg border border-gray-200 bg-white px-2 text-xs outline-none dark:border-gray-700 dark:bg-gray-900"
              :disabled="changingId === item.id"
              :value="item.status"
              @change="changeStatus(item, ($event.target as HTMLSelectElement).value as WorkRequestStatus)"
            >
              <option value="pending">Beklemede</option>
              <option value="approved">Onayla</option>
              <option value="rejected">Reddet</option>
              <option value="completed">Tamamla</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <button aria-label="Kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="closeModal"></button>
        <div class="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
          <div class="mb-5 flex items-start justify-between">
            <div>
              <h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Yeni İş Talebi</h2>
              <p class="mt-1 text-xs text-gray-500">Geçici alt yükleniciye yönelik bir iş talebi oluşturun.</p>
            </div>
            <button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-gray-100" @click="closeModal"><X :size="20" /></button>
          </div>
          <form class="space-y-4" @submit.prevent="submit">
            <div v-if="!props.fixedContractorId">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Taşeron <span class="text-red-500">*</span></label>
              <select v-model.number="form.contractor_id" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900">
                <option :value="null" disabled>Seçiniz</option>
                <option v-for="c in contractors" :key="c.id" :value="c.id">{{ c.business_entity?.name ?? c.short_name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık <span class="text-red-500">*</span></label>
              <input v-model="form.title" required maxlength="255" placeholder="Örn. Forklift bakım ve teknik servis" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Organizasyon</label>
              <select v-model.number="form.organization_id" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900">
                <option :value="null">Belirtilmedi</option>
                <option v-for="o in organizations" :key="o.id" :value="o.id">{{ o.name }}</option>
              </select>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Planlanan Tarih</label>
              <input v-model="form.requested_date" type="date" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
              <textarea v-model="form.description" rows="3" class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none dark:border-gray-700 dark:bg-gray-900"></textarea>
            </div>
            <div class="flex justify-end gap-3 pt-2">
              <button type="button" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold" @click="closeModal">İptal</button>
              <button type="submit" :disabled="!canSubmit || saving" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{{ saving ? 'Kaydediliyor...' : 'İş Talebini Oluştur' }}</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
