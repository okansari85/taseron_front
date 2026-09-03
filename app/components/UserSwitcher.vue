<script setup lang="ts">
import { Check, ChevronDown, LoaderCircle, UserRound } from '@lucide/vue'
import type { AuthorizedUser } from '~/api/user-authorization'
import { useUserPreview } from '~/composables/useUserPreview'

const auth = useAuth()
const router = useRouter()
const route = useRoute()
const { users, loading, activeUser, loadUsers, setPreviewUser, clearPreviewUser, activeWorkspace } = useUserPreview()
const open = ref(false)

const isSuperAdmin = computed(() => (auth.user.value?.roles ?? []).some(role => role.trim().toLocaleLowerCase('tr-TR').replace(/_/g, '-') === 'super-admin'))
const displayUser = computed(() => activeUser.value ?? auth.user.value)
const roleLabel = (user: AuthorizedUser) => user.roles?.map(role => role.name).join(', ') || 'Rol tanımlanmamış'
const initials = (user: AuthorizedUser | null) => user?.name?.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') || 'K'

const selectUser = async (user: AuthorizedUser) => {
  setPreviewUser(user)
  open.value = false
  if (activeWorkspace.value === 'contractor') await router.push('/contractor-portal/dashboard')
  else if (activeWorkspace.value === 'security') await router.push('/security')
  else if (route.path.startsWith('/contractor-portal') || route.path.startsWith('/security')) await router.push(`/tenants/${route.params.tenantId || 1}`)
}

const resetUser = async () => {
  clearPreviewUser()
  open.value = false
  if (route.path.startsWith('/contractor-portal') || route.path.startsWith('/security')) await router.push(`/tenants/${route.params.tenantId || 1}`)
}

watch(open, async value => { if (value) await loadUsers() })
</script>

<template>
  <div v-if="isSuperAdmin" class="relative hidden md:block">
    <button type="button" class="flex min-w-[220px] max-w-[300px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40" @click="open = !open">
      <span class="flex min-w-0 items-center gap-2.5">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400"><UserRound :size="15" /></span>
        <span class="min-w-0"><span class="block text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Kullanıcı görünümü</span><span class="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">{{ displayUser?.name || 'Kullanıcı' }}</span></span>
      </span>
      <ChevronDown :size="15" class="shrink-0 text-gray-400" :class="open ? 'rotate-180' : ''" />
    </button>

    <div v-if="open" class="absolute right-0 top-full z-[1000] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div class="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800"><p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Gerçek kullanıcılar</p><p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Backend'den gelen kullanıcıyla ekran deneyimini önizle.</p></div>
      <div class="max-h-80 overflow-y-auto p-1.5">
        <div v-if="loading" class="flex items-center justify-center py-8"><LoaderCircle :size="20" class="animate-spin text-brand-500" /></div>
        <template v-else>
          <button v-for="user in users" :key="user.id" type="button" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5" :class="displayUser?.id === user.id ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''" @click="selectUser(user)">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{{ initials(user) }}</span>
            <span class="min-w-0 flex-1"><span class="block truncate text-xs font-semibold text-gray-700 dark:text-gray-200">{{ user.name }}</span><span class="mt-0.5 block truncate text-[10px] text-gray-400">{{ roleLabel(user) }}</span></span>
            <Check v-if="displayUser?.id === user.id" :size="15" class="text-brand-500" />
          </button>
          <button v-if="activeUser" type="button" class="mt-1 w-full rounded-lg border border-gray-100 px-3 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/5" @click="resetUser">Kendi hesabıma dön</button>
          <p v-if="users.length === 0" class="px-3 py-5 text-center text-xs text-gray-400">Kullanıcı bulunamadı.</p>
        </template>
      </div>
    </div>
  </div>
</template>
