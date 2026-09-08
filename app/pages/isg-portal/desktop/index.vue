<script setup lang="ts">
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 font-outfit dark:bg-gray-950">
    <IsgWorkspaceHeader />

    <main class="flex flex-1 items-center justify-center p-8">
      <p v-if="!context.ready" class="text-sm text-gray-400">Yönlendiriliyor...</p>
      <p v-else class="text-sm text-gray-400">Dashboard ekranı yakında burada olacak.</p>
    </main>
  </div>
</template>
