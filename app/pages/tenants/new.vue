<template>
  <div class="mx-auto w-full max-w-[1400px]">
    <div class="mb-8">
      <h1 class="text-title-sm font-semibold text-gray-800 dark:text-white/90">Yeni Tenant Oluştur</h1>
      <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
    </div>

    <TenantStepper :current="stepIndex" />

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03] lg:col-span-8 md:p-8">
        <StepTenantInfo v-if="stepIndex === 0" />
        <StepOrganization v-else-if="stepIndex === 1" />
        <StepReview v-else :submitted="submitted" />
      </section>

      <aside class="lg:sticky lg:top-24 lg:col-span-4 lg:self-start">
        <PanelTenantInfo v-if="stepIndex === 0" />
        <PanelOrgPreview v-else-if="stepIndex === 1" />
        <PanelOrgPreview v-else review-mode />
      </aside>
    </div>

    <div class="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <button
        type="button"
        class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
        @click="stepIndex > 0 ? goBack() : cancel()"
      >
        {{ stepIndex > 0 ? '← Geri' : 'İptal' }}
      </button>

      <div class="flex flex-wrap items-center justify-end gap-3">
        <button
          v-if="stepIndex === STEPS_COUNT - 1"
          type="button"
          class="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-300 transition hover:bg-gray-50 dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.03]"
          @click="cancel"
        >
          İptal
        </button>

        <TailAdminButton
          v-if="stepIndex < STEPS_COUNT - 1"
          :disabled="!canGoNext"
          @click="goNext"
        >
          Devam Et →
        </TailAdminButton>

        <TailAdminButton v-else @click="submit">
          Tenant'ı Oluştur ✓
        </TailAdminButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const STEPS_COUNT = 3

const form = useTenantForm()
const stepIndex = useTenantStep()
const submitted = ref(false)
const router = useRouter()

const subtitle = computed(() => {
  if (stepIndex.value === 0) return 'Yeni bir tenant oluşturmak için adımları takip edin.'
  if (stepIndex.value === 1) return 'İlk organizasyon düğümünü tanımlayın.'
  return 'Bilgilerinizi kontrol edin ve tenant oluşturun.'
})

const canGoNext = computed(() => {
  if (stepIndex.value === 0) return form.value.tenantName.trim().length > 0 && form.value.slug.trim().length > 0
  if (stepIndex.value === 1) return form.value.orgName.trim().length > 0 && Boolean(form.value.onboardingType)
  return false
})

function goNext() {
  if (stepIndex.value < STEPS_COUNT - 1 && canGoNext.value) stepIndex.value++
}

function goBack() {
  if (stepIndex.value > 0) stepIndex.value--
}

function cancel() {
  router.push('/tenants')
}

function submit() {
  const payload = {
    onboarding_type: form.value.onboardingType,
    tenant: {
      name: form.value.tenantName,
      slug: form.value.slug,
      status: form.value.status,
    },
    organization: {
      name: form.value.orgName,
    },
    ...(form.value.onboardingType === 'company'
      ? {
          company: {
            name: form.value.orgName,
            company_type: form.value.companyKind === 'sahis' ? 'individual' : 'corporate',
          },
          location: form.value.companyKind === 'sahis' ? { name: `${form.value.orgName} - Merkez` } : null,
        }
      : {}),
    ...(form.value.onboardingType === 'brand'
      ? {
          brand: {
            name: form.value.orgName,
          },
        }
      : {}),
  }

  // TODO: mevcut tenant-onboarding API bağlantısına bu payload gönderilecek.
  // eslint-disable-next-line no-console
  console.log('Tenant payload', payload)
  submitted.value = true
}
</script>
