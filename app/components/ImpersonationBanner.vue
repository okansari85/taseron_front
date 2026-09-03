<script setup lang="ts">
import { ArrowLeft, LoaderCircle, UserRound } from '@lucide/vue'

const router = useRouter()
const { loading, isImpersonating, stop } = useUserImpersonation()
const auth = useAuth()

const returnToSuperAdmin = async () => {
  if (loading.value) return
  try {
    const path = await stop()
    await router.push(path || '/tenants')
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <div v-if="isImpersonating" class="border-b border-amber-200 bg-amber-50 px-4 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/30">
    <div class="mx-auto flex max-w-[2000px] items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2.5">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"><UserRound :size="14" /></span>
        <p class="truncate text-xs text-amber-800 dark:text-amber-200"><span class="font-semibold">{{ auth.user.value?.name }}</span> hesabı ile giriş yaptınız.</p>
      </div>
      <button type="button" :disabled="loading" class="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-800 dark:bg-gray-900 dark:text-amber-200 dark:hover:bg-amber-900/30" @click="returnToSuperAdmin">
        <LoaderCircle v-if="loading" :size="13" class="animate-spin" /><ArrowLeft v-else :size="13" />
        {{ loading ? 'Dönülüyor...' : 'Super Admin hesabına dön' }}
      </button>
    </div>
  </div>
</template>
