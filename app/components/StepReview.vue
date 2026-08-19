<template>
  <section>
    <div class="mb-6 flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        <span class="text-lg">✓</span>
      </div>
      <div>
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Bilgilerinizi Kontrol Edin</h2>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Oluşturulacak tenant ve organizasyon bilgilerinizi aşağıda inceleyebilirsiniz.</p>
      </div>
    </div>

    <div class="space-y-6">
      <section>
        <h3 class="mb-2 text-sm font-semibold text-brand-500">Tenant Bilgileri</h3>
        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <div v-for="row in tenantRows" :key="row.label" class="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ row.label }}</span>
            <span class="font-medium text-gray-800 dark:text-white/90">{{ row.value }}</span>
          </div>
          <div class="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">Durum</span>
            <TailAdminBadge :tone="form.status === 'active' ? 'success' : 'gray'" dot>{{ form.status === 'active' ? 'Aktif' : 'Pasif' }}</TailAdminBadge>
          </div>
        </div>
      </section>

      <section>
        <h3 class="mb-2 text-sm font-semibold text-brand-500">İlk Organizasyon Bilgileri</h3>
        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
          <div v-for="row in organizationRows" :key="row.label" class="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm last:border-b-0 dark:border-gray-800">
            <span class="text-gray-500 dark:text-gray-400">{{ row.label }}</span>
            <span class="font-medium text-gray-800 dark:text-white/90">{{ row.value }}</span>
          </div>
        </div>
      </section>

      <div v-if="isSahisSirketi" class="rounded-lg border border-info-200 bg-info-50 px-4 py-3 dark:border-info-500/20 dark:bg-info-500/10">
        <div class="flex gap-3">
          <span class="mt-0.5 text-info-600">i</span>
          <p class="text-theme-xs text-info-700 dark:text-info-400">Lokasyonun adres, NACE, SGK ve diğer işyeri bilgileri daha sonra Lokasyon Yönetimi üzerinden tamamlanabilir.</p>
        </div>
      </div>

      <div v-if="submitted" class="rounded-lg border border-success-200 bg-success-50 px-4 py-3 dark:border-success-500/20 dark:bg-success-500/10">
        <div class="flex gap-3">
          <span class="mt-0.5 text-success-600">✓</span>
          <p class="text-theme-xs font-medium text-success-700 dark:text-success-400">Tenant başarıyla oluşturuldu. Hazırlanan bilgiler tarayıcı konsoluna yazıldı.</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ submitted?: boolean }>()
const form = useTenantForm()

const isCompany = computed(() => form.value.onboardingType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
const selectedType = computed(() => ORG_TYPES.find((type) => type.value === form.value.onboardingType))
const submitted = computed(() => props.submitted ?? false)

const tenantRows = computed(() => [
  { label: 'Tenant Adı', value: form.value.tenantName || '—' },
  { label: 'Slug (Kısa Ad)', value: form.value.slug || '—' },
])

const organizationRows = computed(() => {
  const rows = [
    { label: 'Organizasyon Adı', value: form.value.orgName || '—' },
    { label: 'Kurumsal Yapı', value: selectedType.value?.label || '—' },
  ]

  if (isCompany.value) {
    rows.push({
      label: 'Şirket Türü',
      value: form.value.companyKind === 'sahis' ? 'Şahıs Şirketi' : 'Tüzel Şirket',
    })
  }

  if (isSahisSirketi.value) {
    rows.push({ label: 'Merkez Lokasyon', value: 'Otomatik oluşturulacak' })
  }

  return rows
})
</script>
