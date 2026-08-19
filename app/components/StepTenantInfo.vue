<template>
  <div>
    <div class="d-flex align-center mb-6">
      <div class="icon-badge">
        <v-icon icon="mdi-bank-outline" size="20" />
      </div>
      <div class="ml-3">
        <div class="text-subtitle-1 font-weight-bold">Tenant Bilgileri</div>
        <div class="text-body-2 text-medium-emphasis">Tenant hesabınızın temel bilgilerini girin.</div>
      </div>
    </div>

    <v-text-field
      v-model="form.tenantName"
      label="Tenant Adı *"
      placeholder="Örn. Koç Holding"
      variant="outlined"
      density="comfortable"
      hide-details="auto"
      class="mb-1"
      @update:model-value="onTenantNameChange"
    />
    <p class="text-caption text-medium-emphasis mb-5">Tenant sistemde bu ad ile görüntülenecektir.</p>

    <v-text-field
      v-model="form.slug"
      label="Slug (Kısa Ad) *"
      placeholder="koc-holding"
      variant="outlined"
      density="comfortable"
      hide-details="auto"
      class="mb-1"
      @update:model-value="onSlugChange"
    />
    <p class="text-caption text-medium-emphasis mb-5">
      Sistemde benzersiz olmalıdır. Küçük harf, rakam ve tire (-) kullanılabilir.
    </p>

    <div class="text-body-2 font-weight-medium mb-2">Durum <span class="text-error">*</span></div>
    <v-row dense>
      <v-col cols="12" sm="6">
        <button
          type="button"
          class="status-card"
          :class="{ 'status-card--active': form.status === 'active' }"
          @click="form.status = 'active'"
        >
          <div class="d-flex align-center" style="gap: 8px">
            <span class="radio-dot" :class="{ 'radio-dot--active': form.status === 'active' }" />
            <span class="text-body-2 font-weight-medium">Aktif</span>
            <v-chip size="x-small" color="success" variant="flat">Önerilen</v-chip>
          </div>
          <p class="text-caption text-medium-emphasis mt-1 status-desc">
            Tenant hesabı aktif olarak kullanılabilir.
          </p>
        </button>
      </v-col>
      <v-col cols="12" sm="6">
        <button
          type="button"
          class="status-card"
          :class="{ 'status-card--active': form.status === 'passive' }"
          @click="form.status = 'passive'"
        >
          <div class="d-flex align-center" style="gap: 8px">
            <span class="radio-dot" :class="{ 'radio-dot--active': form.status === 'passive' }" />
            <span class="text-body-2 font-weight-medium">Pasif</span>
            <v-chip size="x-small" color="grey-lighten-1" variant="tonal">Devre dışı</v-chip>
          </div>
          <p class="text-caption text-medium-emphasis mt-1 status-desc">
            Tenant hesabı pasif durumda oluşturulur.
          </p>
        </button>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
const form = useTenantForm()

function onTenantNameChange(v: string) {
  if (!form.value.slugTouched) form.value.slug = slugify(v)
}

function onSlugChange() {
  form.value.slugTouched = true
  form.value.slug = slugify(form.value.slug)
}
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
.status-card {
  width: 100%;
  text-align: left;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  padding: 14px 16px;
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}
.status-card--active {
  border-color: rgb(var(--v-theme-primary));
  background: rgb(var(--v-theme-primary) / 0.06);
}
.status-desc {
  margin-left: 24px;
}
.radio-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(var(--v-border-color), 0.5);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.radio-dot--active {
  border-color: rgb(var(--v-theme-primary));
}
.radio-dot--active::after {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgb(var(--v-theme-primary));
}
</style>
