<script setup lang="ts">
import { Check, ChevronDown, FileImage, LockKeyhole, Save, X } from 'lucide-vue-next'

export type BrandForm = {
  name: string
  shortName: string
  companyId: number | null
  description: string
  isActive: boolean
  logo: File | null
  logoPreview: string
}

const props = withDefaults(defineProps<{
  open: boolean
  form: BrandForm
  companies?: Array<{ id: number; name: string; group: string }>
  saving?: boolean
}>(), { companies: () => [], saving: false })

const emit = defineEmits<{ 'update:open': [value: boolean]; save: [payload: BrandForm] }>()

const selectedCompany = computed(() => props.companies.find(company => company.id === props.form.companyId))
const group = computed(() => selectedCompany.value?.group ?? '')
const close = () => emit('update:open', false)
const submit = () => emit('save', { ...props.form })

const onLogoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  props.form.logo = file
  props.form.logoPreview = URL.createObjectURL(file)
}
</script>

<template>
  <Transition name="drawer">
    <div v-if="open" class="fixed inset-0 z-[9999]">
      <button type="button" aria-label="Düzenleme panelini kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Marka Düzenle</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Marka bilgilerini güncelleyin.</p></div>
          <button type="button" class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5" aria-label="Kapat" @click="close"><X :size="21" /></button>
        </div>
        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
          <div class="flex-1 overflow-y-auto px-6 py-6">
            <div class="mb-6 border-b border-gray-100 pb-4 dark:border-gray-800"><h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Genel Bilgiler</h3></div>
            <div class="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
              <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Marka Adı <span class="text-error-500">*</span></span><input v-model="form.name" required type="text" placeholder="Marka adını giriniz" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><span class="mt-1.5 block text-xs text-gray-500">Markanın tam adını giriniz.</span></label>
              <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Kısa Ad <span class="text-error-500">*</span></span><input v-model="form.shortName" required type="text" placeholder="Kısa ad giriniz (örn. beko)" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><span class="mt-1.5 block text-xs text-gray-500">Raporlarda ve sistemde kısa ad kullanılacaktır.</span></label>
              <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket <span class="text-error-500">*</span></span><div class="relative"><select v-model="form.companyId" required class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option :value="null" disabled>Şirket seçiniz</option><option v-for="company in companies" :key="company.id" :value="company.id">{{ company.name }}</option></select><ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div><span class="mt-1.5 block text-xs text-gray-500">Markanın bağlı olduğu şirketi seçiniz.</span></label>
              <div><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Grup</span><div class="flex h-11 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/60"><span>{{ group || 'Grup bilgisi, seçilen şirketten otomatik alınır.' }}</span><LockKeyhole :size="16" /></div><span class="mt-1.5 block text-xs text-gray-500">Grup bilgisi otomatik olarak gelecektir.</span></div>
              <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</span><textarea v-model="form.description" maxlength="500" rows="4" placeholder="Marka ile ilgili açıklama giriniz (isteğe bağlı)" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><span class="mt-1 block text-right text-xs text-gray-400">{{ form.description.length }} / 500</span></label>
              <div><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo <span class="text-gray-400">(İsteğe Bağlı)</span></span><label class="flex h-[125px] cursor-pointer flex-col items-center justify-center rounded-lg border border-brand-200 bg-brand-50/20 text-center hover:bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/5"><img v-if="form.logoPreview" :src="form.logoPreview" alt="Logo önizleme" class="mb-2 h-12 w-12 rounded-lg object-contain" /><FileImage v-else :size="28" class="mb-2 text-brand-500" /><span class="text-xs text-gray-500">Logo yükleyin veya sürükleyin</span><span class="mt-1 text-[11px] text-gray-400">PNG, JPG, SVG (maks. 2MB)</span><input type="file" class="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="onLogoChange" /></label></div>
            </div>
            <div class="mt-6 border-b border-gray-100 pb-3 dark:border-gray-800"><h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Durum</h3></div>
            <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"><button type="button" class="flex items-center justify-between rounded-lg border p-4 text-left transition" :class="form.isActive ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-700'" @click="form.isActive = true"><span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Aktif</span><span class="mt-1 block text-xs text-gray-500">Marka aktif olarak kullanılabilir.</span></span><span class="flex h-9 w-9 items-center justify-center rounded-full bg-success-50 text-success-600"><Check :size="18" /></span></button><button type="button" class="flex items-center justify-between rounded-lg border p-4 text-left transition" :class="!form.isActive ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-700'" @click="form.isActive = false"><span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Pasif</span><span class="mt-1 block text-xs text-gray-500">Marka pasif durumda olacak.</span></span><span class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"><X :size="18" /></span></button></div>
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800"><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @click="close"><X :size="16" />İptal</button><button type="submit" :disabled="saving" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-6 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600 disabled:opacity-60"><Save :size="16" />{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button></div>
        </form>
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-from,
.drawer-leave-to { opacity: 0; }
</style>
