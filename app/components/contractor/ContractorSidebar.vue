<template>
  <div>
    <div v-if="isMobileOpen" class="fixed inset-0 z-[9998] bg-black/30 lg:hidden" @click="closeMobile"></div>
    <aside :class="['fixed left-0 top-0 z-[9999] flex h-screen flex-col border-r border-gray-200 bg-white px-5 transition-all duration-300 dark:border-gray-800 dark:bg-gray-900', isExpanded ? 'w-[290px]' : 'w-[90px]', isMobileOpen ? 'w-[290px] translate-x-0' : '-translate-x-full lg:translate-x-0']">
      <div :class="['flex py-8', isExpanded ? 'justify-start' : 'justify-center']"><NuxtLink to="/contractor-portal/dashboard" class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">T</span><span v-if="isExpanded" class="text-lg font-semibold text-gray-800 dark:text-white/90">Taseron</span></NuxtLink></div>
      <nav class="no-scrollbar flex flex-1 flex-col overflow-y-auto pb-6"><p v-if="isExpanded" class="mb-4 text-xs font-medium uppercase tracking-wide text-gray-400">Portal</p><div class="flex flex-col gap-2"><NuxtLink v-for="item in items" :key="item.path" :to="item.path" :class="['menu-item group', isActive(item.path) ? 'menu-item-active' : 'menu-item-inactive', isExpanded ? 'justify-start' : 'justify-center']" @click="closeMobile"><component :is="item.icon" :size="18" /><span v-if="isExpanded" class="truncate">{{ item.title }}</span></NuxtLink></div><div class="mt-auto border-t border-gray-100 pt-4 dark:border-gray-800"><div :class="['flex items-center gap-3 rounded-lg px-2 py-3', isExpanded ? 'justify-start' : 'justify-center']"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500">{{ initials }}</div><div v-if="isExpanded" class="min-w-0"><p class="truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</p><p class="truncate text-xs text-gray-500 dark:text-gray-400">Alt Yüklenici</p></div></div></div></nav>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { FileText, Home, ClipboardCheck, GraduationCap } from '@lucide/vue'
const route = useRoute(); const auth = useAuth(); const { isExpanded, isMobileOpen, closeMobile } = useTailAdminSidebar()
const items = [{ title: 'Genel Durum', path: '/contractor-portal/dashboard', icon: Home }, { title: 'İş Talepleri', path: '/contractor-portal/work-requests', icon: ClipboardCheck }, { title: 'Belgeler', path: '/contractor-portal/documents', icon: FileText }, { title: 'Eğitimler', path: '/contractor-portal/training', icon: GraduationCap }]
const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)
const initials = computed(() => { const name = auth.user.value?.name?.trim() || 'K'; return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR') })
</script>
