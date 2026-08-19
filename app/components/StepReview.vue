<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div class="icon-badge">
        <v-icon icon="mdi-shield-check-outline" size="20" />
      </div>
      <div class="ml-3">
        <div class="text-subtitle-1 font-weight-bold">Bilgilerinizi Kontrol Edin</div>
        <div class="text-body-2 text-medium-emphasis">
          Oluşturulacak tenant ve organizasyon bilgilerinizi aşağıda inceleyebilirsiniz.
        </div>
      </div>
    </div>

    <div class="text-body-2 font-weight-semibold text-primary-strong mb-2">Tenant Bilgileri</div>
    <div class="review-block mb-5">
      <div class="review-row">
        <span class="text-medium-emphasis">Tenant Adı</span>
        <span class="font-weight-medium">{{ form.tenantName || '—' }}</span>
      </div>
      <v-divider />
      <div class="review-row">
        <span class="text-medium-emphasis">Slug (Kısa Ad)</span>
        <span class="font-weight-medium">{{ form.slug || '—' }}</span>
      </div>
      <v-divider />
      <div class="review-row">
        <span class="text-medium-emphasis">Durum</span>
        <v-chip size="small" color="success" variant="tonal">
          {{ form.status === 'active' ? 'Aktif' : 'Pasif' }}
        </v-chip>
      </div>
    </div>

    <div class="text-body-2 font-weight-semibold text-primary-strong mb-2">İlk Organizasyon Bilgileri</div>
    <div class="review-block mb-5">
      <div class="review-row">
        <span class="text-medium-emphasis">Organizasyon Adı</span>
        <span class="font-weight-medium">{{ form.orgName || '—' }}</span>
      </div>
      <v-divider />
      <div class="review-row">
        <span class="text-medium-emphasis">Kurumsal Yapı</span>
        <span class="font-weight-medium">{{ selectedType?.label || '—' }}</span>
      </div>
      <template v-if="isCompany">
        <v-divider />
        <div class="review-row">
          <span class="text-medium-emphasis">Şirket Türü</span>
          <span class="font-weight-medium">{{ form.companyKind === 'sahis' ? 'Şahıs Şirketi' : 'Tüzel Şirket' }}</span>
        </div>
      </template>
      <template v-if="isSahisSirketi">
        <v-divider />
        <div class="review-row">
          <span class="text-medium-emphasis">Merkez Lokasyon</span>
          <span class="font-weight-medium">Otomatik oluşturulacak</span>
        </div>
      </template>
    </div>

    <v-alert
      v-if="isSahisSirketi"
      type="info"
      variant="tonal"
      icon="mdi-information-outline"
      density="comfortable"
    >
      Lokasyonun adres, NACE, SGK ve diğer işyeri bilgileri daha sonra Lokasyon Yönetimi üzerinden
      tamamlanabilir.
    </v-alert>

    <v-alert
      v-if="submitted"
      type="success"
      variant="tonal"
      icon="mdi-check-circle-outline"
      density="comfortable"
      class="mt-4"
    >
      Tenant başarıyla oluşturuldu. Hazırlanan bilgiler tarayıcı konsoluna yazıldı.
    </v-alert>
  </div>
</template>

<script setup lang="ts">
const form = useTenantForm()
const isCompany = computed(() => form.value.onboardingType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
const selectedType = computed(() => ORG_TYPES.find((type) => type.value === form.value.onboardingType))

defineProps<{ submitted?: boolean }>()
</script>

<style scoped>
.icon-badge {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgb(var(--v-theme-primary) / 0.1);
  color: rgb(var(--v-theme-primary));
  display: flex;
  align-items: center;
  justify-content: center;
}
.review-block {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: 12px;
  overflow: hidden;
}
.review-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  font-size: 0.875rem;
}
</style>
