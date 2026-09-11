<script setup lang="ts">
import { ArrowLeft, Building2, Droplets, Flame, Gauge, LoaderCircle, Pencil, Trash2, Waves, X } from '@lucide/vue'
import { fireSuppressionInventoryApi } from '~/api/fire-suppression-inventory'
import {
  FIRE_SUPPRESSION_CATEGORIES,
  FIRE_SUPPRESSION_CATEGORY_LABELS,
  type FireSuppressionCategory,
  type FireSuppressionInventoryItem,
} from '~/types/fire-suppression-inventory'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const route = useRoute()
const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

const item = ref<FireSuppressionInventoryItem | null>(null)
const loading = ref(true)

// Ayrı bir GET /fire-suppression-inventory/{id} endpoint'i yok — mevcut liste
// endpoint'inden bulunuyor (backend'e yeni bir şey eklemeden).
const load = async () => {
  if (!context.branchId) return
  loading.value = true
  try {
    const { data } = await fireSuppressionInventoryApi.list(context.branchId)
    item.value = data.find(i => i.id === Number(route.params.id)) ?? null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  load()
})

const categoryIcons: Record<FireSuppressionCategory, any> = {
  yangin_dolabi: Building2,
  sprinkler: Droplets,
  hidrant: Waves,
  yangin_pompasi: Gauge,
  su_deposu: Waves,
  sabit_boru: Waves,
  gazli_sondurme: Flame,
  diger: Building2,
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value))
}

const periodicStatusMeta = (status?: string | null) => ({
  kontrolu_gecerli: { label: 'Kontrolü Geçerli', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
  kontrol_yaklasiyor: { label: 'Kontrol Yaklaşıyor', cls: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
  kontrol_gecikmis: { label: 'Kontrol Gecikmiş', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' },
}[status ?? ''] ?? { label: 'Kontrol Yapılmadı', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' })

const complianceMeta = (status?: string | null) => status === 'uygun'
  ? { label: 'Uygun', cls: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' }
  : status === 'uygun_degil'
    ? { label: 'Uygun Değil', cls: 'bg-red-50 text-[#d71920] dark:bg-red-500/10 dark:text-red-400' }
    : { label: 'Belirsiz', cls: 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400' }

// --- Düzenle drawer (index.vue ile aynı desen) ---
const drawerOpen = ref(false)
const saving = ref(false)
const deleting = ref(false)
const form = ref({
  category: 'yangin_dolabi' as FireSuppressionCategory,
  code: '',
  brand: '',
  model: '',
  serial_no: '',
  location_note: '',
  last_control_date: '',
  next_control_date: '',
  compliance_status: '' as '' | 'uygun' | 'uygun_degil',
  open_nonconformity_count: 0,
  notes: '',
})

const openEdit = () => {
  if (!item.value) return
  form.value = {
    category: item.value.category,
    code: item.value.code ?? '',
    brand: item.value.brand ?? '',
    model: item.value.model ?? '',
    serial_no: item.value.serial_no ?? '',
    location_note: item.value.location_note ?? '',
    last_control_date: item.value.last_control_date ? item.value.last_control_date.slice(0, 10) : '',
    next_control_date: item.value.next_control_date ? item.value.next_control_date.slice(0, 10) : '',
    compliance_status: item.value.compliance_status ?? '',
    open_nonconformity_count: item.value.open_nonconformity_count,
    notes: item.value.notes ?? '',
  }
  drawerOpen.value = true
}

const submitForm = async () => {
  if (!item.value || saving.value) return
  saving.value = true
  try {
    const { data } = await fireSuppressionInventoryApi.update(item.value.id, {
      category: form.value.category,
      code: form.value.code || null,
      brand: form.value.brand || null,
      model: form.value.model || null,
      serial_no: form.value.serial_no || null,
      location_note: form.value.location_note || null,
      last_control_date: form.value.last_control_date || null,
      next_control_date: form.value.next_control_date || null,
      compliance_status: form.value.compliance_status || null,
      open_nonconformity_count: form.value.open_nonconformity_count,
      notes: form.value.notes || null,
    })
    item.value = data
    $toast.success('Sistem bileşeni güncellendi.')
    drawerOpen.value = false
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kayıt güncellenemedi.')
  } finally {
    saving.value = false
  }
}

const removeItem = async () => {
  if (!item.value) return
  if (!window.confirm(`${item.value.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.value.category]} kaydını silmek istediğinize emin misiniz?`)) return
  deleting.value = true
  try {
    await fireSuppressionInventoryApi.remove(item.value.id)
    $toast.success('Sistem bileşeni silindi.')
    await navigateTo('/isg-portal/desktop/fire-suppression/inventory')
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kayıt silinemedi.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-[1100px]">
          <NuxtLink to="/isg-portal/desktop/fire-suppression/inventory" class="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-[#64748b] hover:text-[#111827] dark:hover:text-white">
            <ArrowLeft :size="16" />
            Tesisat Durumuna Dön
          </NuxtLink>

          <div v-if="loading" class="py-16 text-center text-sm text-gray-400">Yükleniyor...</div>
          <div v-else-if="!item" class="py-16 text-center text-sm text-gray-400">Kayıt bulunamadı.</div>

          <template v-else>
            <section class="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div class="flex items-center gap-3">
                <span class="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><component :is="categoryIcons[item.category]" :size="22" /></span>
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="text-2xl font-bold text-[#172033] dark:text-white">{{ item.code || FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</h1>
                    <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="item.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10' : 'bg-gray-100 text-gray-500 dark:bg-white/5'">{{ item.is_active ? 'Aktif' : 'Pasif' }}</span>
                  </div>
                  <p class="text-sm text-gray-400">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}<span v-if="item.brand || item.model"> · {{ [item.brand, item.model].filter(Boolean).join(' ') }}</span></p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="openEdit"><Pencil :size="13" />Düzenle</button>
                <button type="button" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#dfe3e8] px-3 text-xs font-semibold text-gray-500 hover:border-[#d71920]/40 hover:text-[#d71920] disabled:opacity-60 dark:border-gray-700" :disabled="deleting" @click="removeItem">
                  <LoaderCircle v-if="deleting" :size="13" class="animate-spin" />
                  <Trash2 v-else :size="13" />Sil
                </button>
              </div>
            </section>

            <div class="rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Genel Bilgiler</p>
              <dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                <div><dt class="text-xs text-gray-400">Ekipman Kodu</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ item.code || '—' }}</dd></div>
                <div><dt class="text-xs text-gray-400">Kategori</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[item.category] }}</dd></div>
                <div><dt class="text-xs text-gray-400">Konum</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ item.location_note || '—' }}</dd></div>
                <div><dt class="text-xs text-gray-400">Marka</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ item.brand || '—' }}</dd></div>
                <div><dt class="text-xs text-gray-400">Model</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ item.model || '—' }}</dd></div>
                <div><dt class="text-xs text-gray-400">Seri No</dt><dd class="mt-0.5 font-medium text-[#172033] dark:text-white">{{ item.serial_no || '—' }}</dd></div>
              </dl>
              <div v-if="item.notes" class="mt-4 border-t border-[#f1f2f4] pt-3 dark:border-gray-800">
                <p class="text-xs text-gray-400">Açıklama</p>
                <p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{{ item.notes }}</p>
              </div>
            </div>

            <div class="mt-4 rounded-xl border border-[#e7e9ed] bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
              <p class="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">Kontrol Durumu</p>
              <div class="grid gap-4 sm:grid-cols-3">
                <div>
                  <p class="mb-2 text-xs text-gray-400">Periyodik Kontrol</p>
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="periodicStatusMeta(item.periodic_control_status).cls">{{ periodicStatusMeta(item.periodic_control_status).label }}</span>
                </div>
                <div>
                  <p class="mb-2 text-xs text-gray-400">Uygunluk</p>
                  <span class="rounded-full px-2.5 py-1 text-[11px] font-semibold" :class="complianceMeta(item.compliance_status).cls">{{ complianceMeta(item.compliance_status).label }}</span>
                  <span v-if="item.open_nonconformity_count > 0" class="ml-1.5 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-[#d71920] dark:bg-red-500/10">{{ item.open_nonconformity_count }} açık</span>
                </div>
                <div>
                  <p class="mb-2 text-xs text-gray-400">Son / Sonraki Kontrol</p>
                  <p class="text-sm font-medium text-[#172033] dark:text-white">{{ formatDate(item.last_control_date) }} → {{ formatDate(item.next_control_date) }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>
      </main>
    </div>

    <!-- Düzenle drawer -->
    <div v-if="drawerOpen" class="fixed inset-0 z-[10000] flex justify-end bg-black/30" @click.self="drawerOpen = false">
      <div class="flex h-full w-full max-w-md flex-col bg-white dark:bg-gray-900">
        <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
          <p class="text-sm font-bold text-[#172033] dark:text-white">Kaydı Düzenle</p>
          <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5" @click="drawerOpen = false"><X :size="16" /></button>
        </div>
        <div class="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Kategori</label>
            <select v-model="form.category" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option v-for="c in FIRE_SUPPRESSION_CATEGORIES" :key="c" :value="c">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[c] }}</option>
            </select>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Ekipman Kodu</label>
            <input v-model="form.code" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Marka</label>
              <input v-model="form.brand" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Model</label>
              <input v-model="form.model" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Seri No</label>
            <input v-model="form.serial_no" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Konum Notu</label>
            <input v-model="form.location_note" type="text" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Son Kontrol</label>
              <input v-model="form.last_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
            <div>
              <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Sonraki Kontrol</label>
              <input v-model="form.next_control_date" type="date" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Tesisat Uygunluğu</label>
            <select v-model="form.compliance_status" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
              <option value="">Belirsiz</option>
              <option value="uygun">Uygun</option>
              <option value="uygun_degil">Uygun Değil</option>
            </select>
          </div>
          <div v-if="form.compliance_status === 'uygun_degil'">
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Uygunsuzluk Sayısı</label>
            <input v-model.number="form.open_nonconformity_count" type="number" min="0" class="h-11 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800">
          </div>
          <div>
            <label class="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Notlar</label>
            <textarea v-model="form.notes" rows="3" class="w-full rounded-lg border border-[#dfe3e8] bg-white p-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800" />
          </div>
        </div>
        <div class="flex gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800">
          <button type="button" class="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 dark:border-gray-700 dark:text-gray-300" :disabled="saving" @click="drawerOpen = false">Vazgeç</button>
          <button type="button" class="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#d71920] py-2.5 text-sm font-semibold text-white disabled:opacity-60" :disabled="saving" @click="submitForm">
            <LoaderCircle v-if="saving" :size="15" class="animate-spin" />
            Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
