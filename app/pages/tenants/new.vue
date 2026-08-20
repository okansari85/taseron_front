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

    <p v-if="tenantStore.error" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-300">
      {{ tenantStore.error }}
    </p>

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
          :disabled="tenantStore.saving"
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

        <TailAdminButton v-else :disabled="tenantStore.saving" @click="submit">
          {{ tenantStore.saving ? 'Oluşturuluyor...' : "Tenant'ı Oluştur ✓" }}
        </TailAdminButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TenantOnboardingPayload } from '~/types/tenant'

const STEPS_COUNT = 3

const form = useTenantForm()
const stepIndex = useTenantStep()
const submitted = ref(false)
const router = useRouter()
const tenantStore = useTenantStore()

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
  tenantStore.error = null
  if (stepIndex.value < STEPS_COUNT - 1 && canGoNext.value) stepIndex.value++
}

function goBack() {
  tenantStore.error = null
  if (stepIndex.value > 0) stepIndex.value--
}

function cancel() {
  router.push('/tenants')
}

async function submit() {
  if (tenantStore.saving || !form.value.onboardingType) return

  const payload: TenantOnboardingPayload = {
    onboarding_type: form.value.onboardingType,
    tenant: {
      name: form.value.tenantName.trim(),
      slug: form.value.slug.trim(),
      status: form.value.status,
    },
    organization: {
      name: form.value.orgName.trim(),
    },
  }

  if (form.value.onboardingType === 'company') {
    payload.company = {
      name: form.value.orgName.trim(),
      company_type: form.value.companyKind === 'sahis' ? 'individual' : 'corporate',
    }

    if (form.value.companyKind === 'sahis') {
      payload.location = { name: `${form.value.orgName.trim()} - Merkez` }
    }
  }

  try {
    await tenantStore.onboardTenant(payload)
    submitted.value = true
    await router.push('/tenants')
  } catch {
    // Store exposes the user-facing API error.
  }
}
</script>
