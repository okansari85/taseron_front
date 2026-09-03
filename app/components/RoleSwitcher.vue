<script setup lang="ts">
import { Check, ChevronDown, ShieldCheck } from '@lucide/vue'
import { useRolePreview, type PreviewRole } from '~/composables/useRolePreview'

const auth = useAuth()
const { activeRole, roles, setRole } = useRolePreview()
const open = ref(false)

const isSuperAdmin = computed(() => {
  const userRoles = auth.user.value?.roles ?? []
  return userRoles.some((role) => role.trim().toLowerCase().replace(/_/g, '-') === 'super-admin')
})

const selectRole = (role: PreviewRole) => {
  setRole(role)
  open.value = false
}
</script>

<template>
  <div v-if="isSuperAdmin" class="relative hidden md:block">
    <button
      type="button"
      class="flex min-w-[205px] items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-brand-200 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/40"
      @click="open = !open"
    >
      <span class="flex min-w-0 items-center gap-2.5">
        <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
          <ShieldCheck :size="15" />
        </span>
        <span class="min-w-0">
          <span class="block text-[9px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">Rol görünümü</span>
          <span class="block truncate text-xs font-semibold text-gray-800 dark:text-white/90">{{ activeRole.label }}</span>
        </span>
      </span>
      <ChevronDown :size="15" class="shrink-0 text-gray-400" :class="open ? 'rotate-180' : ''" />
    </button>

    <div
      v-if="open"
      class="absolute right-0 top-full z-[1000] mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl dark:border-gray-800 dark:bg-gray-900"
    >
      <div class="border-b border-gray-100 px-3 py-2.5 dark:border-gray-800">
        <p class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Rol Önizleme</p>
        <p class="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">Super Admin olarak farklı kullanıcı deneyimlerini önizle.</p>
      </div>
      <div class="p-1.5">
        <button
          v-for="role in roles"
          :key="role.id"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-gray-50 dark:hover:bg-white/5"
          :class="activeRole.id === role.id ? 'bg-brand-50/70 dark:bg-brand-500/10' : ''"
          @click="selectRole(role.id)"
        >
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            <component :is="role.icon" :size="16" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-xs font-semibold text-gray-700 dark:text-gray-200">{{ role.label }}</span>
            <span class="mt-0.5 block text-[10px] text-gray-400">{{ role.description }}</span>
          </span>
          <Check v-if="activeRole.id === role.id" :size="15" class="text-brand-500" />
        </button>
      </div>
    </div>
  </div>
</template>
