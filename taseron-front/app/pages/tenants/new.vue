<template>
  <v-container fluid class="py-8 page-container">
    <div class="mb-8">
      <h1 class="text-h5 font-weight-bold">Yeni Tenant Oluştur</h1>
      <p class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</p>
    </div>

    <TenantStepper :current="stepIndex" />

    <v-row>
      <v-col cols="12" lg="8">
        <v-card rounded="xl" elevation="0" class="pa-8 border-card">
          <StepTenantInfo v-if="stepIndex === 0" />
          <StepOrganization v-else-if="stepIndex === 1" />
          <StepReview v-else :submitted="submitted" />
        </v-card>

        <div class="d-flex justify-space-between mt-6">
          <v-btn
            v-if="stepIndex > 0"
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            @click="goBack"
          >
            Geri
          </v-btn>
          <v-btn v-else variant="outlined">İptal</v-btn>

          <div class="d-flex" style="gap: 12px">
            <v-btn v-if="stepIndex === STEPS_COUNT - 1" variant="outlined">İptal</v-btn>
            <v-btn
              v-if="stepIndex < STEPS_COUNT - 1"
              color="primary"
              append-icon="mdi-arrow-right"
              :disabled="!canGoNext"
              @click="goNext"
            >
              Devam Et
            </v-btn>
            <v-btn v-else color="primary" append-icon="mdi-check" @click="submit">
              Tenant'ı Oluştur
            </v-btn>
          </div>
        </div>
      </v-col>

      <v-col cols="12" lg="4">
        <div class="sticky-panel">
          <PanelTenantInfo v-if="stepIndex === 0" />
          <PanelOrgPreview v-else-if="stepIndex === 1" />
          <PanelOrgPreview v-else review-mode />
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const STEPS_COUNT = 3

const form = useTenantForm()
const stepIndex = useTenantStep()
const submitted = ref(false)

const subtitle = computed(() => {
  if (stepIndex.value === 0) return 'Yeni bir tenant oluşturmak için adımları takip edin.'
  if (stepIndex.value === 1) return 'İlk organizasyon düğümünü tanımlayın.'
  return 'Bilgilerinizi kontrol edin ve tenant oluşturun.'
})

const canGoNext = computed(() => {
  if (stepIndex.value === 0) return form.value.tenantName.trim().length > 0
  if (stepIndex.value === 1) return form.value.orgName.trim().length > 0
  return false
})

function goNext() {
  if (stepIndex.value < STEPS_COUNT - 1) stepIndex.value++
}
function goBack() {
  if (stepIndex.value > 0) stepIndex.value--
}

function submit() {
  const payload = {
    tenant: {
      name: form.value.tenantName,
      slug: form.value.slug,
      status: form.value.status,
    },
    organization: {
      name: form.value.orgName,
      type: form.value.orgType,
      parent_id: null,
      ...(form.value.orgType === 'company' ? { company_kind: form.value.companyKind } : {}),
    },
  }
  // TODO: kendi API endpoint'inize bağlayın
  // eslint-disable-next-line no-console
  console.log('Tenant payload', payload)
  submitted.value = true
}
</script>

<style scoped>
.page-container {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
