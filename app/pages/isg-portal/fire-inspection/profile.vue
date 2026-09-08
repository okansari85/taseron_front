<script setup lang="ts">
import { ChevronLeft, LogOut, UserRound } from 'lucide-vue-next'

definePageMeta({ layout: 'fire-inspection' })

const auth = useAuth()
const router = useRouter()
const logout = async () => {
  await auth.logout()
  await router.push('/isg-portal/login')
}
</script>

<template>
  <div>
    <header class="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-800 dark:bg-gray-900">
      <NuxtLink to="/isg-portal/fire-inspection" class="text-gray-500"><ChevronLeft :size="20" /></NuxtLink>
      <p class="text-sm font-semibold text-gray-900 dark:text-white/90">Profil</p>
    </header>
    <div class="p-4">
      <div class="flex flex-col items-center gap-2 rounded-2xl border border-gray-200 bg-white p-6 text-center dark:border-gray-800 dark:bg-gray-900">
        <span class="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10"><UserRound :size="26" /></span>
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</p>
        <p class="text-xs text-gray-400">İSG Denetçisi</p>
      </div>
      <button type="button" class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-error-200 py-3 text-sm font-semibold text-error-600 dark:border-error-500/30" @click="logout"><LogOut :size="15" />Çıkış Yap</button>
    </div>
  </div>
</template>
