<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div class="icon-badge">
        <v-icon icon="mdi-domain" size="20" />
      </div>
      <div class="ml-3">
        <div class="text-subtitle-1 font-weight-bold">İlk Organizasyon Bilgileri</div>
        <div class="text-body-2 text-medium-emphasis">
          Tenant içerisinde oluşturulacak ilk organizasyon düğümünü tanımlayın.
        </div>
      </div>
    </div>

    <v-row>
      <v-col cols="12" sm="6">
        <v-text-field
          v-model="form.orgName"
          label="Organizasyon Adı *"
          placeholder="Örn. Koç Holding"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
          @update:model-value="form.orgNameTouched = true"
        />
        <p class="text-caption text-medium-emphasis mt-1">Oluşturulacak ilk organizasyonun adı.</p>
      </v-col>

      <v-col cols="12" sm="6">
        <v-select
          v-model="form.orgType"
          :items="ORG_TYPES"
          item-title="label"
          item-value="value"
          label="Organizasyon Tipi *"
          variant="outlined"
          density="comfortable"
          hide-details="auto"
        >
          <template #selection="{ item }">
            <v-icon :icon="item.raw.icon" size="16" color="success" class="mr-2" />
            {{ item.raw.label }}
            <span class="text-medium-emphasis ml-1">({{ item.raw.suffix }})</span>
          </template>
          <template #item="{ item, props: itemProps }">
            <v-list-item v-bind="itemProps" :title="undefined">
              <template #prepend>
                <v-icon :icon="item.raw.icon" size="16" color="primary" class="mr-2" />
              </template>
              <v-list-item-title>
                {{ item.raw.label }}
                <span class="text-medium-emphasis">({{ item.raw.suffix }})</span>
              </v-list-item-title>
            </v-list-item>
          </template>
        </v-select>
        <p class="text-caption text-medium-emphasis mt-1">Organizasyonun türünü seçin.</p>
      </v-col>
    </v-row>

    <div v-if="isCompany" class="mt-6">
      <div class="text-body-2 font-weight-medium mb-3">Şirket Türü <span class="text-error">*</span></div>
      <v-row dense>
        <v-col cols="12" sm="6">
          <button
            type="button"
            class="kind-card"
            :class="{ 'kind-card--active': form.companyKind === 'sahis' }"
            @click="form.companyKind = 'sahis'"
          >
            <v-avatar :color="form.companyKind === 'sahis' ? 'primary' : 'surface-variant'" size="36" class="mr-3">
              <v-icon icon="mdi-account-outline" :color="form.companyKind === 'sahis' ? 'white' : undefined" size="18" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-semibold">Şahıs Şirketi</div>
              <div class="text-caption text-medium-emphasis">Gerçek kişi şirketi</div>
            </div>
          </button>
        </v-col>
        <v-col cols="12" sm="6">
          <button
            type="button"
            class="kind-card"
            :class="{ 'kind-card--active': form.companyKind === 'tuzel' }"
            @click="form.companyKind = 'tuzel'"
          >
            <v-avatar :color="form.companyKind === 'tuzel' ? 'primary' : 'surface-variant'" size="36" class="mr-3">
              <v-icon icon="mdi-domain" :color="form.companyKind === 'tuzel' ? 'white' : undefined" size="18" />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-semibold">Tüzel Şirket</div>
              <div class="text-caption text-medium-emphasis">Anonim, Limited, vb.</div>
            </div>
          </button>
        </v-col>
      </v-row>

      <v-alert
        v-if="isSahisSirketi"
        type="warning"
        variant="tonal"
        icon="mdi-information-outline"
        density="comfortable"
        class="mt-5"
      >
        <div class="text-body-2 font-weight-semibold">Şahıs şirketi seçildi</div>
        <p class="text-body-2 mt-1 mb-0">Merkez lokasyon (işyeri) otomatik olarak oluşturulacaktır.</p>
        <p class="text-body-2 mt-1 mb-0">
          Lokasyonun adres, NACE, SGK ve diğer işyeri bilgileri daha sonra Lokasyon Yönetimi üzerinden
          tamamlanabilir.
        </p>
      </v-alert>
    </div>
  </div>
</template>

<script setup lang="ts">
const form = useTenantForm()
const isCompany = computed(() => form.value.orgType === 'company')
const isSahisSirketi = computed(() => isCompany.value && form.value.companyKind === 'sahis')
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
.kind-card {
  width: 100%;
  display: flex;
  align-items: flex-start;
  text-align: left;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 14px 16px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.kind-card--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary) / 0.06);
}
</style>
