<template>
  <v-app-bar flat color="surface" :height="64" class="app-header" :class="{ 'app-header--dark': isDark }">
    <v-btn icon variant="text" class="ml-1" @click="$emit('toggle')">
      <v-icon icon="mdi-menu" />
    </v-btn>

    <div class="d-flex align-center text-body-2 ml-2">
      <span class="font-weight-medium">Tenantlar</span>
      <v-icon icon="mdi-chevron-right" size="16" class="mx-1 text-medium-emphasis" />
      <span class="text-medium-emphasis">Yeni Tenant</span>
    </div>

    <v-spacer />

    <v-btn icon variant="text" @click="toggle">
      <v-icon :icon="isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'" />
    </v-btn>

    <v-btn icon variant="text" class="position-relative">
      <v-icon icon="mdi-bell-outline" />
      <span class="notif-badge">3</span>
    </v-btn>

    <v-btn icon variant="text">
      <v-icon icon="mdi-help-circle-outline" />
    </v-btn>

    <v-avatar color="primary" size="36" class="mx-2">
      <span class="text-white text-caption font-weight-medium">AY</span>
    </v-avatar>
    <v-icon icon="mdi-chevron-down" size="16" class="text-medium-emphasis mr-4" />
  </v-app-bar>
</template>

<script setup lang="ts">
defineProps<{ rail: boolean }>()
defineEmits<{ toggle: [] }>()

const { isDark, toggle } = useAppTheme()
</script>

<style scoped>
.app-header {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.app-header--dark {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.notif-badge {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #6d5dfb;
  color: white;
  border-radius: 999px;
  font-size: 10px;
  line-height: 1;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
