<script setup lang="ts">
import UserAuthorizationPanel from './UserAuthorizationPanel.vue'
import UserCreateButton from './UserCreateButton.vue'
</script>

<template>
  <div class="space-y-3">
    <div class="flex justify-end">
      <UserCreateButton />
    </div>
    <UserAuthorizationPanel />
  </div>
</template>
