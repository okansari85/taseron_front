<template>
  <div class="mx-auto w-full max-w-[1400px] font-outfit">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold leading-8 text-gray-800 dark:text-white/90">Tenantlar</h1>
        <p class="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.</p>
      </div>
      <button class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600" @click="goToCreate">
        <Plus :size="16" />
        Yeni Tenant
      </button>
    </div>

    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <input v-model="search" type="search" placeholder="Tenant ara..." class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm leading-5 text-gray-800 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 lg:col-span-4" />

        <div class="relative lg:col-span-2">
          <select v-model="statusFilter" class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm leading-5 text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <option value="">Durum</option>
            <option value="active">Aktif</option>
            <option value="passive">Pasif</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" :size="16" />
        </div>

        <div class="relative lg:col-span-2">
          <select v-model="structureFilter" class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm leading-5 text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <option value="">Kurumsal Yapı</option>
            <option value="holding">Holding</option>
            <option value="group">Grup</option>
            <option value="company">Şirket</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" :size="16" />
        </div>

        <div class="relative lg:col-span-2">
          <select v-model="dateFilter" class="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm leading-5 text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <option value="">Oluşturulma Tarihi</option>
            <option value="7">Son 7 gün</option>
            <option value="30">Son 30 gün</option>
          </select>
          <ChevronDown class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" :size="16" />
        </div>

        <button class="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium leading-5 text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 lg:col-span-2" :disabled="!hasFilters" @click="clearFilters">
          Filtreleri Temizle
        </button>
      </div>
    </div>

    <div v-if="tenantStore.error" class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
      {{ tenantStore.error }}
    </div>

    <div class="tenant-table-shell flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="!w-full min-w-0 overflow-x-auto custom-scrollbar">
        <TenantDataTable
          :tenants="paginatedTenants"
          :loading="tenantStore.loading"
          @open="openTenant"
          @edit="editTenant"
        />
      </div>

      <div v-if="pageCount > 1" class="flex items-center justify-between border-t border-gray-200 px-5 py-3 dark:border-gray-800 sm:px-6">
        <div class="text-sm text-gray-500 dark:text-gray-400">{{ (page - 1) * itemsPerPage + 1 }}-{{ Math.min(page * itemsPerPage, filteredTenants.length) }} / {{ filteredTenants.length }}</div>
        <div class="flex items-center gap-1">
          <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" :disabled="page <= 1" @click="page--"><ChevronLeft :size="18" /></button>
          <span class="px-2 text-sm text-gray-600 dark:text-gray-300">{{ page }} / {{ pageCount }}</span>
          <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-400 dark:hover:bg-white/5" :disabled="page >= pageCount" @click="page++"><ChevronRight :size="18" /></button>
        </div>
      </div>
    </div>

    <div v-if="editOpen" class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-gray-900/50" @click="closeEdit"></div>
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-lg flex-col bg-white shadow-xl dark:bg-gray-950">
        <div class="flex items-center justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div><h2 class="text-lg font-semibold text-gray-800 dark:text-white/90">Tenant Düzenle</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenant bilgilerini güncelleyin.</p></div>
          <button class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" :disabled="tenantStore.saving" @click="closeEdit"><X :size="20" /></button>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="saveEdit">
          <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Logo</label>
              <div class="flex items-center gap-4">
                <div class="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-lg font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <img v-if="logoPreviewUrl || editTenantData?.logo_url" :src="logoPreviewUrl || editTenantData?.logo_url || ''" :alt="`${editForm.name} logosu`" class="block max-h-full max-w-full object-contain" />
                  <span v-else>{{ editForm.name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') }}</span>
                </div>
                <div>
                  <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="handleLogoChange" />
                  <button type="button" class="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="logoInput?.click()"><Pencil :size="15" /> Logo Değiştir</button>
                  <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">PNG, JPG veya WEBP · Maks. 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <label for="edit-tenant-name" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Tenant Adı <span class="text-red-500">*</span></label>
              <input id="edit-tenant-name" v-model="editForm.name" required maxlength="255" class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>

            <div>
              <label for="edit-tenant-slug" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Slug <span class="text-red-500">*</span></label>
              <input id="edit-tenant-slug" v-model="editForm.slug" required maxlength="255" class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @input="slugManuallyEdited = true" />
              <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Tenant adı değiştikçe otomatik güncellenir. İsterseniz elle değiştirebilirsiniz.</p>
            </div>

            <div>
              <label for="edit-tenant-status" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Durum <span class="text-red-500">*</span></label>
              <div class="relative">
                <select id="edit-tenant-status" v-model="editForm.status" class="h-12 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="active">Aktif</option>
                  <option value="passive">Pasif</option>
                </select>
                <ChevronDown class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" :size="18" />
              </div>
            </div>

            <div class="rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-4 dark:border-brand-500/20 dark:bg-brand-500/5">
              <div class="flex gap-3"><Info :size="18" class="mt-0.5 shrink-0 text-brand-500" /><p class="text-sm leading-6 text-gray-600 dark:text-gray-300">Tenant ile ilgili organizasyon, grup, şirket ve lokasyon yönetimi <span class="font-semibold text-brand-600 dark:text-brand-400">Organizasyon Yönetimi</span> sayfasından yapılmaktadır.</p></div>
            </div>
          </div>

          <div class="flex gap-3 border-t border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-950">
            <button type="button" class="h-12 flex-1 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" :disabled="tenantStore.saving" @click="closeEdit">İptal</button>
            <button type="submit" class="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60" :disabled="tenantStore.saving"><Loader2 v-if="tenantStore.saving" class="animate-spin" :size="18" /><Save v-else :size="18" />{{ tenantStore.saving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
          </div>
        </form>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight, Info, Loader2, Pencil, Plus, Save, X } from '@lucide/vue'
import { slugify } from '~/utils/slugify'
import type { Tenant } from '~/types/tenant'

const router = useRouter()
const tenantStore = useTenantStore()

const search = ref('')
const statusFilter = ref('')
const structureFilter = ref('')
const dateFilter = ref('')
const page = ref(1)
const itemsPerPage = ref(10)

const editOpen = ref(false)
const editTenantData = ref<Tenant | null>(null)
const editForm = reactive({ name: '', slug: '', status: 'active' as Tenant['status'] })
const logoInput = ref<HTMLInputElement | null>(null)
const logoFile = ref<File | null>(null)
const logoPreviewUrl = ref('')
const slugManuallyEdited = ref(false)

onMounted(async () => {
  if (!tenantStore.tenants.length) {
    try { await tenantStore.fetchTenants() } catch { /* Store exposes the user-facing error. */ }
  }
})

const hasFilters = computed(() => Boolean(search.value || statusFilter.value || structureFilter.value || dateFilter.value))

const filteredTenants = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('tr-TR')
  return tenantStore.tenants.filter((tenant) => {
    const searchOk = !query || tenant.name.toLocaleLowerCase('tr-TR').includes(query) || tenant.slug.toLocaleLowerCase('tr-TR').includes(query)
    const statusOk = !statusFilter.value || tenant.status === statusFilter.value
    const structureOk = !structureFilter.value || tenant.onboarding_type === structureFilter.value
    const dateOk = !dateFilter.value || (() => {
      const days = Number(dateFilter.value)
      return (Date.now() - new Date(tenant.created_at).getTime()) <= days * 24 * 60 * 60 * 1000
    })()
    return searchOk && statusOk && structureOk && dateOk
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredTenants.value.length / itemsPerPage.value)))
const paginatedTenants = computed(() => filteredTenants.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value))

watch([search, statusFilter, structureFilter, dateFilter, itemsPerPage], () => { page.value = 1 })
watch(pageCount, (count) => { if (page.value > count) page.value = count })
watch(() => editForm.name, (name) => { if (editOpen.value && !slugManuallyEdited.value) editForm.slug = slugify(name) })

const clearFilters = () => { search.value = ''; statusFilter.value = ''; structureFilter.value = ''; dateFilter.value = '' }
const goToCreate = () => router.push('/tenants/new')
const openTenant = (tenant: Tenant) => router.push(`/tenants/${tenant.id}`)

const editTenant = (tenant: Tenant) => {
  editTenantData.value = tenant
  editForm.name = tenant.name
  editForm.slug = tenant.slug
  editForm.status = tenant.status
  slugManuallyEdited.value = tenant.slug !== slugify(tenant.name)
  logoFile.value = null
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value)
  logoPreviewUrl.value = ''
  editOpen.value = true
}

const closeEdit = () => {
  if (tenantStore.saving) return
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value)
  logoPreviewUrl.value = ''
  logoFile.value = null
  editOpen.value = false
}

const handleLogoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) { tenantStore.error = 'Logo dosyası en fazla 2MB olabilir.'; input.value = ''; return }
  if (!file.type.startsWith('image/')) { tenantStore.error = 'Lütfen geçerli bir görsel dosyası seçin.'; input.value = ''; return }
  tenantStore.error = null
  if (logoPreviewUrl.value) URL.revokeObjectURL(logoPreviewUrl.value)
  logoFile.value = file
  logoPreviewUrl.value = URL.createObjectURL(file)
}

const saveEdit = async () => {
  if (!editTenantData.value) return
  try {
    const payload: Record<string, unknown> = { name: editForm.name.trim(), slug: editForm.slug.trim(), status: editForm.status === 'active' }
    if (logoFile.value) payload.logo = logoFile.value
    await tenantStore.updateTenant(editTenantData.value.id, payload)
    closeEdit()
  } catch { /* Store exposes the user-facing API error. */ }
}
</script>
