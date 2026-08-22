<script setup lang="ts">
import { ChevronDown, ChevronLeft, Save, X } from 'lucide-vue-next'
import { slugify } from '~/utils/slugify'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))

const companyName = ref('')
const shortName = ref('')
const slug = ref('')
const slugManuallyEdited = ref(false)
const group = ref('')
const description = ref('')
const isActive = ref(true)
const createdBy = ref('Ahmet Yılmaz')
const createdAt = ref('19.05.2025 10:30')

const groups = [
  { id: '1', name: 'Dayanıklı Tüketim Grubu' },
  { id: '2', name: 'Otomotiv Grubu' },
  { id: '3', name: 'Enerji Grubu' },
]

watch(companyName, (value) => {
  if (!slugManuallyEdited.value) slug.value = slugify(value)
  if (!shortName.value || shortName.value === slug.value) shortName.value = slug.value
})

watch(slug, (value) => {
  if (!shortName.value || shortName.value === slugify(companyName.value)) shortName.value = value
})

const cancel = () => navigateTo(`/tenants/${tenantId.value}/organization/companies`)

const saveCompany = () => {
  const payload = {
    name: companyName.value,
    short_name: shortName.value,
    slug: slug.value,
    group_id: group.value || null,
    description: description.value,
    is_active: isActive.value,
  }
  console.log('Yeni şirket:', payload)
}
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-5 flex items-center gap-3">
        <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300" aria-label="Geri" @click="cancel">
          <ChevronLeft :size="18" />
        </button>
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Yeni Şirket</h1>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Yeni bir şirket kaydı oluşturun.</p>
        </div>
      </div>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="p-6 md:p-7">
          <div class="mb-6 border-b border-gray-100 pb-4 dark:border-gray-800">
            <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Genel Bilgiler</h2>
          </div>

          <div class="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Şirket Adı <span class="text-error-500">*</span></label>
              <input v-model="companyName" type="text" placeholder="Şirket adını giriniz" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Kısa Ad <span class="text-error-500">*</span></label>
              <input v-model="shortName" type="text" placeholder="Kısa adınızı giriniz (örn. arcelik)" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              <p class="mt-1.5 text-xs text-gray-400">Raporlarda ve sistemde kısa ad kullanılacaktır.</p>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Grup <span class="text-error-500">*</span></label>
              <div class="relative">
                <select v-model="group" class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-700 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="">Grup seçiniz</option>
                  <option v-for="item in groups" :key="item.id" :value="item.id">{{ item.name }}</option>
                </select>
                <ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Slug <span class="text-error-500">*</span></label>
              <input v-model="slug" type="text" placeholder="Şirket slug giriniz" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @input="slugManuallyEdited = true" />
              <p class="mt-1.5 text-xs text-gray-400">URL ve sistem içi kısa referans için kullanılır.</p>
            </div>

            <div class="md:col-span-2">
              <div class="mb-2 flex items-center justify-between">
                <label class="block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label>
                <span class="text-xs text-gray-400">{{ description.length }} / 500</span>
              </div>
              <textarea v-model="description" maxlength="500" rows="4" placeholder="Şirket ile ilgili açıklama giriniz (isteğe bağlı)" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>
          </div>

          <div class="my-7 border-t border-gray-100 dark:border-gray-800" />

          <div>
            <div class="mb-4 border-b border-gray-100 pb-4 dark:border-gray-800">
              <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Durum Bilgileri</h2>
            </div>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button type="button" class="flex min-h-[84px] items-center justify-between rounded-lg border p-4 text-left transition" :class="isActive ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gray-200 dark:border-gray-700'" @click="isActive = true">
                <span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Aktif</span><span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Şirket aktif olarak kullanılabilir.</span></span>
                <span class="flex h-9 w-9 items-center justify-center rounded-full" :class="isActive ? 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'"><span class="h-3 w-3 rounded-full border-2" :class="isActive ? 'border-brand-500 bg-brand-500' : 'border-gray-300'" /></span>
              </button>
              <button type="button" class="flex min-h-[84px] items-center justify-between rounded-lg border p-4 text-left transition" :class="!isActive ? 'border-brand-500 ring-1 ring-brand-500/20' : 'border-gray-200 dark:border-gray-700'" @click="isActive = false">
                <span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Pasif</span><span class="mt-1 block text-xs text-gray-500 dark:text-gray-400">Şirket pasif durumda olacak.</span></span>
                <span class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800"><span class="h-3 w-3 rounded-full border-2" :class="!isActive ? 'border-brand-500 bg-brand-500' : 'border-gray-300'" /></span>
              </button>
            </div>
          </div>

          <div class="my-7 border-t border-gray-100 dark:border-gray-800" />

          <div>
            <div class="mb-4 border-b border-gray-100 pb-4 dark:border-gray-800">
              <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Sistem Bilgileri</h2>
            </div>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Oluşturan</label>
                <input :value="createdBy" disabled type="text" class="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400" />
                <p class="mt-1.5 text-xs text-gray-400">Kayıt otomatik olarak size atanacaktır.</p>
              </div>
              <div>
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Oluşturulma Tarihi</label>
                <input :value="createdAt" disabled type="text" class="h-11 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 text-sm text-gray-500 outline-none dark:border-gray-800 dark:bg-gray-900/60 dark:text-gray-400" />
                <p class="mt-1.5 text-xs text-gray-400">Kayıt oluşturulduğunda tarih ve saat otomatik atanır.</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800 md:px-7">
          <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="cancel"><X :size="16" /> İptal</button>
          <button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="saveCompany"><Save :size="16" /> Kaydet</button>
        </div>
      </section>
    </div>
  </div>
</template>
