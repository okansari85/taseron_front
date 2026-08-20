<template>
  <section>
    <div class="mb-6 flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        <Network :size="20" />
      </div>
      <div>
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">İlk Organizasyon Bilgileri</h2>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Tenant içerisinde oluşturulacak ilk organizasyon düğümünü tanımlayın.</p>
      </div>
    </div>

    <div class="mb-6 flex items-center gap-3 rounded-lg border border-brand-100 bg-brand-50/50 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5">
      <Info :size="18" class="shrink-0 text-brand-500" />
      <p class="text-theme-xs font-medium text-brand-600 dark:text-brand-400">Şirketinizi temsil edecek logo yükleyin. Bu logo sistem genelinde kullanılacaktır.</p>
    </div>

    <div class="space-y-6">
      <div>
        <div class="mb-1 text-sm font-medium text-gray-800 dark:text-white/90">Logo</div>
        <p class="mb-3 text-theme-xs text-gray-500 dark:text-gray-400">JPG, PNG veya SVG formatında, maksimum 2MB.</p>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-[1.45fr_1fr]">
          <button
            type="button"
            class="group flex min-h-[208px] flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-5 py-8 transition hover:border-brand-400 hover:bg-brand-50/20 dark:border-gray-700 dark:bg-white/[0.02] dark:hover:border-brand-500 dark:hover:bg-brand-500/5"
            @click="openFilePicker"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <span class="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500 transition group-hover:bg-brand-100 dark:bg-brand-500/10 dark:text-brand-400">
              <UploadCloud :size="28" />
            </span>
            <span class="text-sm font-semibold text-gray-800 dark:text-white/90">Logo yüklemek için tıklayın</span>
            <span class="mt-1 text-theme-xs text-gray-500 dark:text-gray-400">veya sürükleyip bırakın</span>
            <span class="mt-4 inline-flex items-center gap-2 rounded-lg border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 transition group-hover:bg-brand-50 dark:border-brand-500/30 dark:text-brand-400">
              <FolderOpen :size="15" />
              Dosya Seç
            </span>
            <span class="mt-3 text-theme-xs text-gray-500 dark:text-gray-400">Önerilen boyut: 512x512px (1:1)</span>
          </button>

          <div class="flex min-h-[208px] flex-col rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.02]">
            <div class="mb-2 text-center text-sm font-semibold text-gray-800 dark:text-white/90">Logo Önizleme</div>

            <div class="flex min-h-0 flex-1 items-center justify-center">
              <div v-if="form.logoPreview" class="relative flex h-28 w-28 items-center justify-center rounded-full bg-gray-50 p-3 dark:bg-white/5">
                <img :src="form.logoPreview" alt="Logo önizleme" class="max-h-full max-w-full object-contain" />
                <button type="button" aria-label="Logoyu kaldır" class="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition hover:text-error-500 dark:border-gray-700 dark:bg-gray-900" @click="removeLogo">
                  <X :size="16" />
                </button>
              </div>
              <div v-else class="flex h-28 w-28 items-center justify-center rounded-full bg-gray-100 text-gray-300 dark:bg-white/5 dark:text-gray-600">
                <Building2 :size="48" />
              </div>
            </div>

            <button v-if="form.logoPreview" type="button" class="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-gray-200 text-xs font-semibold text-error-500 transition hover:bg-error-50 dark:border-gray-700 dark:hover:bg-error-500/10" @click="removeLogo">
              <Trash2 :size="15" />
              Logo'yu Kaldır
            </button>
          </div>
        </div>

        <p class="mt-2 flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400">
          <Lightbulb :size="14" class="shrink-0" />
          En iyi görünüm için kare ve şeffaf arka planlı logolar kullanmanızı öneririz.
        </p>
      </div>

      <div class="border-t border-gray-200 pt-5 dark:border-gray-800">
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Organizasyon Adı *</label>
            <input v-model="form.orgName" type="text" placeholder="Örn. Koç Holding" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" @input="form.orgNameTouched = true" />
            <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">Oluşturulacak ilk organizasyonun adı.</p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Kurumsal Yapı *</label>
            <select v-model="form.onboardingType" class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800">
              <option :value="null">Seçiniz</option>
              <option v-for="type in ORG_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
            </select>
            <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">İşletmenizin sisteme hangi kurumsal yapıyla başlayacağını seçin.</p>
          </div>
        </div>

        <div v-if="isCompany" class="mt-6">
          <div class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">Şirket Türü <span class="text-error-500">*</span></div>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button type="button" :class="kindClasses('sahis')" @click="form.companyKind = 'sahis'">
              <span :class="iconClasses('sahis')"><UserRound :size="18" /></span>
              <span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Şahıs Şirketi</span><span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">Gerçek kişi şirketi</span></span>
            </button>
            <button type="button" :class="kindClasses('tuzel')" @click="form.companyKind = 'tuzel'">
              <span :class="iconClasses('tuzel')"><Building2 :size="18" /></span>
              <span><span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Tüzel Şirket</span><span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">Anonim, Limited, vb.</span></span>
            </button>
          </div>

          <div v-if="isSahisSirketi" class="mt-5 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/20 dark:bg-warning-500/10">
            <div class="flex gap-3"><span class="mt-0.5 text-warning-600"><AlertTriangle :size="17" /></span><div><div class="text-sm font-semibold text-warning-800 dark:text-warning-400">Şahıs şirketi seçildi</div><p class="mt-1 text-theme-xs text-warning-700 dark:text-warning-500">Merkez lokasyon (işyeri) otomatik olarak oluşturulacaktır.</p><p class="mt-1 text-theme-xs text-warning-700 dark:text-warning-500">Lokasyonun adres, NACE, SGK ve diğer işyeri bilgileri daha sonra Lokasyon Yönetimi üzerinden tamamlanabilir.</p></div></div>
          </div>
        </div>
      </div>
    </div>

    <input ref="fileInput" type="file" class="hidden" accept="image/jpeg,image/png,image/svg+xml" @change="handleFileChange" />
  </section>
</template>

<script setup lang="ts">
import { AlertTriangle, Building2, FolderOpen, Info, Lightbulb, Network, Trash2, UploadCloud, UserRound, X } from '@lucide/vue'

const form = useTenantForm()
const fileInput = ref<HTMLInputElement | null>(null)
const isCompany = computed(() => form.value.onboardingType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')

const openFilePicker = () => fileInput.value?.click()

const setLogo = (file: File) => {
  if (!['image/jpeg', 'image/png', 'image/svg+xml'].includes(file.type)) return
  if (file.size > 2 * 1024 * 1024) return

  if (form.value.logoPreview) URL.revokeObjectURL(form.value.logoPreview)
  form.value.logoFile = file
  form.value.logoPreview = URL.createObjectURL(file)
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) setLogo(file)
  input.value = ''
}

const handleDrop = (event: DragEvent) => {
  const file = event.dataTransfer?.files?.[0]
  if (file) setLogo(file)
}

const removeLogo = () => {
  if (form.value.logoPreview) URL.revokeObjectURL(form.value.logoPreview)
  form.value.logoFile = null
  form.value.logoPreview = ''
}

const kindClasses = (kind: 'sahis' | 'tuzel') => [
  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition',
  form.value.companyKind === kind
    ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700',
]

const iconClasses = (kind: 'sahis' | 'tuzel') => [
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
  form.value.companyKind === kind
    ? 'bg-brand-500 text-white'
    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400',
]
</script>
