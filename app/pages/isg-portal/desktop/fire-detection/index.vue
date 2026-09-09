<script setup lang="ts">
import { Radio } from '@lucide/vue'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
  }
})
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="flex flex-col items-center justify-center px-5 py-24 text-center">
        <span class="flex h-14 w-14 items-center justify-center rounded-xl bg-red-50 text-[#d71920] dark:bg-red-500/10"><Radio :size="26" /></span>
        <h1 class="mt-5 text-lg font-bold text-[#172033] dark:text-white">Yangın Algılama Sistemleri</h1>
        <p class="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
          Yangın Söndürme Sistemleri ile aynı mimari (Envanter + Rapor + Eşleştirme) burada da kurulacak, henüz hazır değil.
        </p>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
