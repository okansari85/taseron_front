<template>
  <v-card rounded="xl" elevation="0" class="pa-6 border-card">
    <div class="d-flex align-center mb-4" style="gap: 8px">
      <v-icon icon="mdi-help-circle-outline" color="primary" />
      <span class="text-subtitle-1 font-weight-bold">Tenant Nedir?</span>
    </div>
    <p class="text-body-2 text-medium-emphasis">
      Tenant, sistemde bağımsız bir müşteri veya çalışma alanı oluşturur.
    </p>
    <p class="text-body-2 text-medium-emphasis mt-2">
      Her tenant kendi organizasyon yapısına, kullanıcılarına ve verilerine sahip olur.
    </p>

    <v-divider class="my-5" />

    <div class="text-body-2 font-weight-semibold mb-3">Oluşturma Adımları</div>
    <div v-for="(s, i) in steps" :key="s.title" class="d-flex mb-4" style="gap: 12px">
      <v-avatar :color="i === 0 ? 'primary' : 'surface-variant'" size="24">
        <span class="text-caption" :class="i === 0 ? 'text-white' : ''">{{ i + 1 }}</span>
      </v-avatar>
      <div>
        <div class="text-body-2 font-weight-medium">{{ s.title }}</div>
        <div class="text-caption text-medium-emphasis">{{ s.desc }}</div>
      </div>
    </div>

    <v-alert color="primary" variant="tonal" icon="mdi-lightbulb-outline" density="comfortable" class="mt-2">
      <div class="text-body-2 font-weight-semibold">İpucu</div>
      <div class="text-caption mt-1">
        Tenant oluşturulduktan sonra organizasyon yapınızı detaylandırabilirsiniz.
      </div>
    </v-alert>
  </v-card>
</template>

<script setup lang="ts">
const steps = [
  { title: 'Tenant Bilgileri', desc: 'Tenant hesabınızın temel bilgilerini girin.' },
  { title: 'İlk Organizasyon', desc: 'İlk organizasyon düğümünü tanımlayın.' },
  { title: 'Kontrol & Oluştur', desc: "Bilgilerinizi kontrol edin ve tenant'ı oluşturun." },
]
</script>
