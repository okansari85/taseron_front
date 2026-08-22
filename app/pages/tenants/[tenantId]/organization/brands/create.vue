<script setup lang="ts">
import { ArrowLeft, Check, FileImage, LockKeyhole, X } from 'lucide-vue-next'

definePageMeta({ layout: 'default' })

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))
const brandName = ref('')
const shortName = ref('')
const company = ref('')
const description = ref('')
const status = ref<'active' | 'passive'>('active')
const logoFile = ref<File | null>(null)
const logoPreview = ref('')
const companyGroups: Record<string, string> = {
  'Arçelik A.Ş.': 'Dayanıklı Tüketim Grubu',
  'Beko Elektronik A.Ş.': 'Dayanıklı Tüketim Grubu',
  'Tofaş Türk Otomobil Fabrikası A.Ş.': 'Otomotiv Grubu',
  'Otokar A.Ş.': 'Otomotiv Grubu',
}
const group = computed(() => companyGroups[company.value] ?? '')

const onLogoChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  logoFile.value = file
  logoPreview.value = URL.createObjectURL(file)
}
const goBack = () => navigateTo(`/tenants/${tenantId.value}/organization/brands`)
const save = () => navigateTo(`/tenants/${tenantId.value}/organization/brands`)
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-6 flex items-start gap-4"><button type="button" class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400" @click="goBack"><ArrowLeft :size="18" /></button><div><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Yeni Marka</h1><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Yeni bir marka kaydı oluşturun.</p></div></div>

      <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><div class="p-5 sm:p-6">
        <div class="mb-5 border-b border-gray-100 pb-3 dark:border-gray-800"><h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Genel Bilgiler</h2></div>
        <div class="grid grid-cols-1 gap-x-4 gap-y-5 md:grid-cols-2">
          <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Marka Adı <span class="text-error-500">*</span></span><input v-model="brandName" type="text" placeholder="Marka adını giriniz" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><span class="mt-1.5 block text-xs text-gray-500">Markanın tam adını giriniz.</span></label>
          <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Kısa Ad <span class="text-error-500">*</span></span><input v-model="shortName" type="text" placeholder="Kısa ad giriniz (örn. beko)" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><span class="mt-1.5 block text-xs text-gray-500">Raporlarda ve sistemde kısa ad kullanılacaktır.</span></label>
          <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Şirket <span class="text-error-500">*</span></span><select v-model="company" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Şirket seçiniz</option><option v-for="name in Object.keys(companyGroups)" :key="name" :value="name">{{ name }}</option></select><span class="mt-1.5 block text-xs text-gray-500">Markanın bağlı olduğu şirketi seçiniz.</span></label>
          <div><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Grup</span><div class="flex h-11 items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800/60"><span>{{ group || 'Grup bilgisi, seçilen şirketten otomatik alınır.' }}</span><LockKeyhole :size="16" /></div><span class="mt-1.5 block text-xs text-gray-500">Grup bilgisi otomatik olarak gelecektir.</span></div>
          <label class="block"><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</span><textarea v-model="description" maxlength="500" rows="4" placeholder="Marka ile ilgili açıklama giriniz (isteğe bağlı)" class="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><div class="mt-1 text-right text-xs text-gray-400">{{ description.length }} / 500</div></label>
          <div><span class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo <span class="text-gray-400">(İsteğe Bağlı)</span></span><label class="flex h-[125px] cursor-pointer flex-col items-center justify-center rounded-lg border border-brand-200 bg-brand-50/20 text-center hover:bg-brand-50 dark:border-brand-500/30 dark:bg-brand-500/5"><template v-if="logoPreview"><img :src="logoPreview" alt="Logo önizleme" class="mb-2 h-12 w-12 rounded-lg object-contain" /></template><template v-else><FileImage :size="28" class="mb-2 text-brand-500" /></template><span class="text-xs text-gray-500">Logo yükleyin veya sürükleyin</span><span class="mt-1 text-[11px] text-gray-400">PNG, JPG, SVG (maks. 2MB)</span><input type="file" class="hidden" accept="image/png,image/jpeg,image/svg+xml" @change="onLogoChange" /></label></div>
        </div>

        <div class="mt-6 border-b border-gray-100 pb-3 dark:border-gray-800"><h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Durum</h2></div>
        <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2"><button type="button" class="flex items-center justify-between rounded-lg border p-4 text-left transition" :class="status === 'active' ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-700'" @click="status = 'active'"><span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Aktif</span><span class="mt-1 block text-xs text-gray-500">Marka aktif olarak kullanılabilir.</span></span><span class="flex h-9 w-9 items-center justify-center rounded-full bg-success-50 text-success-600"><Check :size="18" /></span></button><button type="button" class="flex items-center justify-between rounded-lg border p-4 text-left transition" :class="status === 'passive' ? 'border-brand-500 ring-1 ring-brand-500' : 'border-gray-200 dark:border-gray-700'" @click="status = 'passive'"><span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Pasif</span><span class="mt-1 block text-xs text-gray-500">Marka pasif durumda olacak.</span></span><span class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500"><X :size="18" /></span></button></div>
      </div><div class="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4 dark:border-gray-800"><button type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400" @click="goBack">İptal</button><button type="button" class="h-10 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600" @click="save">Kaydet</button></div></section>
    </div>
  </div>
</template>
