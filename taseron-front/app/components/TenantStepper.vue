<template>
  <div class="stepper d-flex justify-center align-center mb-8 flex-wrap">
    <template v-for="(label, i) in steps" :key="label">
      <div class="d-flex flex-column align-center step-col">
        <v-avatar
          :size="36"
          :color="i <= current ? 'primary' : undefined"
          :variant="i <= current ? 'flat' : 'outlined'"
        >
          <v-icon v-if="i < current" icon="mdi-check" size="16" color="white" />
          <span
            v-else
            class="text-body-2 font-weight-semibold"
            :class="i === current ? 'text-white' : 'text-medium-emphasis'"
          >{{ i + 1 }}</span>
        </v-avatar>
        <span
          class="text-caption mt-2 step-label"
          :class="i <= current ? 'font-weight-medium' : 'text-medium-emphasis'"
        >{{ label }}</span>
      </div>
      <div v-if="i < steps.length - 1" class="connector" :class="{ 'connector--active': i < current }" />
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{ current: number }>()
const steps = ['Tenant Bilgileri', 'İlk Organizasyon', 'Kontrol & Oluştur']
</script>

<style scoped>
.step-col {
  min-width: 110px;
}
.step-label {
  text-align: center;
}
.connector {
  height: 2px;
  width: 96px;
  background: rgba(var(--v-border-color), 0.35);
  margin: 0 12px 22px;
  border-radius: 999px;
  transition: background-color 0.2s ease;
}
.connector--active {
  background: rgb(var(--v-theme-primary));
}
@media (max-width: 700px) {
  .connector {
    width: 32px;
  }
}
</style>
