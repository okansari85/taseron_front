<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999]">
      <button aria-label="Alt yüklenici panelini kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="close"></button>
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800"><div class="flex items-start gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"><Users :size="20" /></div><div><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">{{ isEdit ? 'Alt Yükleniciyi Düzenle' : 'Yeni Alt Yüklenici' }}</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ isEdit ? 'Alt yüklenici bilgilerini güncelleyin.' : 'Tenant seviyesinde yeni bir alt yüklenici oluşturun.' }}</p></div></div><button type="button" class="rounded-lg p-2 text-gray-400 hover:bg-gray-100" @click="close"><X :size="22" /></button></div>
        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit"><div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Firma Logosu</label><label class="flex cursor-pointer items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800"><div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 text-xl font-semibold text-gray-400 dark:bg-gray-800"><img v-if="logoPreview" :src="logoPreview" alt="Firma logosu önizleme" class="h-full w-full object-contain" /><span v-else>{{ initials || 'AL' }}</span></div><div><p class="text-sm font-medium text-gray-800 dark:text-white/90">Logo</p><p class="mt-1 text-xs leading-5 text-gray-500">Logo yükleyin veya mevcut logoyu değiştirin.</p><p class="mt-1 text-[11px] text-gray-400">PNG, JPG, WEBP, SVG (maks. 5MB)</p><input type="file" class="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" @change="onLogoChange" /></div></label></div>
          <div><label for="contractor-name" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Firma Unvanı <span class="text-red-500">*</span></label><input id="contractor-name" v-model="form.name" required maxlength="255" placeholder="Örn. ISS Tesis Yönetim Hizmetleri A.Ş." class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900" /></div>
          <div><label for="contractor-short-name" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Kısa Ad <span class="text-red-500">*</span></label><input id="contractor-short-name" v-model="form.shortName" required maxlength="100" placeholder="Örn. ISS" class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900" /></div>
          <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Tür</label><div class="grid grid-cols-2 gap-3"><button v-for="type in ['Daimi','Geçici']" :key="type" type="button" class="rounded-lg border px-4 py-3 text-sm font-semibold" :class="form.type === type ? 'border-brand-500 bg-brand-50 text-brand-500' : 'border-gray-200 text-gray-600'" @click="form.type = type as ContractorType">{{ type }}</button></div></div>
          <div class="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800"><div><p class="text-sm font-semibold text-gray-800 dark:text-white/90">Durum</p><p class="mt-1 text-xs text-gray-500">Alt yüklenici aktif olarak oluşturulur.</p></div><button type="button" class="relative h-6 w-11 rounded-full" :class="form.status === 'active' ? 'bg-brand-500' : 'bg-gray-300'" @click="form.status = form.status === 'active' ? 'passive' : 'active'"><span class="absolute top-1 h-4 w-4 rounded-full bg-white transition" :class="form.status === 'active' ? 'left-6' : 'left-1'"></span></button></div>
        </div><div class="flex justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800"><button type="button" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold" @click="close">İptal</button><button type="submit" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white">{{ isEdit ? 'Değişiklikleri Kaydet' : 'Alt Yükleniciyi Oluştur' }}</button></div></form>
      </aside>
    </div>
  </Teleport>
</template>
<script setup lang="ts">
import { Users, X } from 'lucide-vue-next'
type ContractorType = 'Daimi' | 'Geçici'; type ContractorStatus = 'active' | 'passive'
interface ContractorForm { name: string; shortName: string; type: ContractorType; status: ContractorStatus; logo: File | null; logoPreview: string }
interface ContractorEditData extends ContractorForm { id: number }
const props = withDefaults(defineProps<{ modelValue: boolean; editData?: ContractorEditData | null }>(), { modelValue: false, editData: null })
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [payload: ContractorForm & { id?: number }] }>()
const form = reactive<ContractorForm>({ name: '', shortName: '', type: 'Daimi', status: 'active', logo: null, logoPreview: '' })
const isEdit = computed(() => props.editData !== null)
const initials = computed(() => form.shortName.trim().slice(0, 2).toLocaleUpperCase('tr-TR'))
const logoUrl = (path: string | null | undefined) => {
  if (!path) return ''
  const config = useRuntimeConfig()
  return `${String(config.public.apiBaseUrl).replace(/\/$/, '')}/storage/${path}`
}
const reset = () => Object.assign(form, { name: '', shortName: '', type: 'Daimi' as ContractorType, status: 'active' as ContractorStatus, logo: null, logoPreview: '' })
const close = () => emit('update:modelValue', false)
const onLogoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  form.logo = file
  form.logoPreview = URL.createObjectURL(file)
}
const submit = () => { emit('save', { ...form, ...(props.editData ? { id: props.editData.id } : {}) }); close(); reset() }
watch(() => props.modelValue, value => {
  if (value && props.editData) {
    Object.assign(form, props.editData, { logo: null, logoPreview: logoUrl(props.editData.logoPath) })
  } else if (!value) reset()
})
watch(() => props.editData, value => {
  if (props.modelValue && value) Object.assign(form, value, { logo: null, logoPreview: logoUrl(value.logoPath) })
})
</script>
