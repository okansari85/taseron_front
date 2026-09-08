<script setup lang="ts">
import { ArrowLeftRight, Building2, CheckCircle2 } from '@lucide/vue'
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
  <IsgContextShell
    headline="Güvenli İşletmeler Güçlü Gelecek"
    :features="[]"
    footer-note="Güvenlik Her Zaman Önceliğimiz"
  >
    <div v-if="context.ready" class="mx-auto max-w-2xl px-8 py-16 text-center">
      <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/10"><CheckCircle2 :size="26" /></span>
      <h2 class="mt-5 text-xl font-bold text-brand-950 dark:text-white/90">Bağlam seçildi</h2>
      <p class="mt-2 text-sm text-gray-500">
        <span class="font-semibold text-gray-700 dark:text-gray-300">{{ context.locationName }}</span>
        <span class="mx-1">/</span>
        <span class="font-semibold text-gray-700 dark:text-gray-300">{{ context.branchName }}</span>
        için denetim ekranları hazırlanıyor.
      </p>
      <NuxtLink to="/isg-portal/desktop/select-location" class="mt-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
        <ArrowLeftRight :size="15" />
        Lokasyon / Şube Değiştir
      </NuxtLink>
    </div>
    <div v-else class="flex h-full items-center justify-center py-24 text-sm text-gray-400">
      <Building2 :size="16" class="mr-2" />Yönlendiriliyor...
    </div>
  </IsgContextShell>
</template>
