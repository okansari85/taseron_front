<template>
  <v-app>
    <AppSidebar :rail="rail" />
    <AppHeader :rail="rail" @toggle="rail = !rail" />
    <v-main>
      <div class="page-wrap">
        <slot />
      </div>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const rail = ref(false)
</script>

<style scoped>
.page-wrap {
  min-height: 100vh;
}
</style>
