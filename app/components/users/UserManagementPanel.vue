<script setup lang="ts">
import UserAuthorizationPanel from './UserAuthorizationPanel.vue'
</script>

<template>
  <div class="space-y-3 user-management-panel">
    <UserAuthorizationPanel />
  </div>
</template>

<style scoped>
.user-management-panel :deep(thead th:last-child),
.user-management-panel :deep(tbody td:last-child) {
  display: none;
}
</style>
