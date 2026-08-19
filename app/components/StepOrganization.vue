<template>
  <section>
    <div class="mb-6 flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        <span class="text-lg">⌘</span>
      </div>
      <div>
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">İlk Organizasyon Bilgileri</h2>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Tenant içerisinde oluşturulacak ilk organizasyon düğümünü tanımlayın.</p>
      </div>
    </div>

    <div class="space-y-6">
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Organizasyon Adı *</label>
          <input
            v-model="form.orgName"
            type="text"
            placeholder="Örn. Koç Holding"
            class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            @input="form.orgNameTouched = true"
          />
          <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">Oluşturulacak ilk organizasyonun adı.</p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Kurumsal Yapı *</label>
          <select
            v-model="form.onboardingType"
            class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
          >
            <option :value="null">Seçiniz</option>
            <option v-for="type in ORG_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option>
          </select>
          <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">İşletmenizin sisteme hangi kurumsal yapıyla başlayacağını seçin.</p>
        </div>
      </div>

      <div v-if="isCompany">
        <div class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">Şirket Türü <span class="text-error-500">*</span></div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            :class="kindClasses('sahis')"
            @click="form.companyKind = 'sahis'"
          >
            <span :class="iconClasses('sahis')">○</span>
            <span>
              <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Şahıs Şirketi</span>
              <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">Gerçek kişi şirketi</span>
            </span>
          </button>

          <button
            type="button"
            :class="kindClasses('tuzel')"
            @click="form.companyKind = 'tuzel'"
          >
            <span :class="iconClasses('tuzel')">▣</span>
            <span>
              <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">Tüzel Şirket</span>
              <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">Anonim, Limited, vb.</span>
            </span>
          </button>
        </div>

        <div v-if="isSahisSirketi" class="mt-5 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 dark:border-warning-500/20 dark:bg-warning-500/10">
          <div class="flex gap-3">
            <span class="mt-0.5 text-warning-600">!</span>
            <div>
              <div class="text-sm font-semibold text-warning-800 dark:text-warning-400">Şahıs şirketi seçildi</div>
              <p class="mt-1 text-theme-xs text-warning-700 dark:text-warning-500">Merkez lokasyon (işyeri) otomatik olarak oluşturulacaktır.</p>
              <p class="mt-1 text-theme-xs text-warning-700 dark:text-warning-500">Lokasyonun adres, NACE, SGK ve diğer işyeri bilgileri daha sonra Lokasyon Yönetimi üzerinden tamamlanabilir.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const form = useTenantForm()
const isCompany = computed(() => form.value.onboardingType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')

const kindClasses = (kind: 'sahis' | 'tuzel') => [
  'flex w-full items-start gap-3 rounded-lg border p-4 text-left transition',
  form.value.companyKind === kind
    ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10'
    : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700',
]

const iconClasses = (kind: 'sahis' | 'tuzel') => [
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold',
  form.value.companyKind === kind
    ? 'bg-brand-500 text-white'
    : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400',
]
</script>
