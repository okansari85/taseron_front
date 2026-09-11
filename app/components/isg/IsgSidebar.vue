<template>
  <div>
    <div v-if="isMobileOpen" class="fixed inset-0 z-[9998] bg-black/30 lg:hidden" @click="closeMobile"></div>
    <aside :class="['fixed left-0 top-0 z-[9999] flex h-screen flex-col border-r transition-all duration-300', desktop ? 'border-black bg-black text-white' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900', desktop ? (isExpanded ? 'w-[230px]' : 'w-[72px]') : (isExpanded ? 'w-[290px]' : 'w-[90px]'), isMobileOpen ? 'w-[290px] translate-x-0' : '-translate-x-full lg:translate-x-0']">
      <div :class="['flex', desktop ? 'px-5 py-5' : 'py-8', isExpanded ? 'justify-start' : 'justify-center']">
        <NuxtLink :to="desktop ? '/isg-portal/desktop' : '/isg-portal/documents'" class="flex items-center gap-3">
          <template v-if="desktop && context.branchLogo"><img :src="context.branchLogo" alt="Marka logosu" class="h-11 w-11 shrink-0 rounded-xl bg-white p-1 object-contain" /></template>
          <span v-else class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">İ</span>
          <span v-if="isExpanded" :class="['text-lg font-semibold', desktop ? 'text-white' : 'text-gray-800 dark:text-white/90']">İSG Portalı</span>
        </NuxtLink>
      </div>
      <nav class="no-scrollbar flex flex-1 flex-col overflow-y-auto pb-6">
        <template v-for="(section, sectionIndex) in menuSections" :key="sectionIndex">
          <p v-if="isExpanded && section.title" :class="['text-xs font-medium uppercase tracking-wide', desktop ? 'text-white/35' : 'text-gray-400', sectionIndex ? 'mb-3 mt-7' : 'mb-4']">{{ section.title }}</p>
          <div class="flex flex-col gap-2">
            <template v-for="item in section.items" :key="item.title">
              <button v-if="'children' in item && item.children" type="button" :class="['menu-item group w-full', desktop ? 'text-white/75 hover:bg-white/[0.06] hover:text-white' : 'menu-item-inactive', isExpanded ? 'justify-start' : 'justify-center']" @click="isExpanded ? toggleGroup(item.title) : navigateTo(item.path)">
                <component :is="item.icon" :size="18" />
                <span v-if="isExpanded" class="flex-1 truncate text-left">{{ item.title }}</span>
                <ChevronDown v-if="isExpanded" :size="14" class="shrink-0 transition-transform" :class="{ 'rotate-180': expandedGroups.has(item.title) }" />
              </button>
              <div v-if="'children' in item && item.children && isExpanded && expandedGroups.has(item.title)" class="ml-4 flex flex-col gap-1 border-l border-white/10 pl-3">
                <NuxtLink v-for="child in item.children" :key="child.path" :to="child.path" :class="['rounded-lg px-3 py-2 text-sm transition', isActive(child.path) ? (desktop ? 'bg-[#d71920] text-white' : 'menu-item-active') : (desktop ? 'text-white/60 hover:bg-white/[0.06] hover:text-white' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5')]" @click="closeMobile">{{ child.title }}</NuxtLink>
              </div>
              <NuxtLink v-else-if="!('children' in item)" :to="item.path" :class="['menu-item group', isActive(item.path) ? (desktop ? 'bg-[#d71920] text-white shadow-[0_8px_24px_rgba(215,25,32,0.22)]' : 'menu-item-active') : (desktop ? 'text-white/75 hover:bg-white/[0.06] hover:text-white' : 'menu-item-inactive'), isExpanded ? 'justify-start' : 'justify-center']" @click="closeMobile">
                <component :is="item.icon" :size="18" /><span v-if="isExpanded" class="truncate">{{ item.title }}</span>
              </NuxtLink>
            </template>
          </div>
        </template>
        <div :class="['mt-auto pt-4', desktop ? 'border-t border-white/10' : 'border-t border-gray-100 dark:border-gray-800']">
          <div :class="['flex items-center gap-3 rounded-lg px-2 py-3', isExpanded ? 'justify-start' : 'justify-center']">
            <div :class="['flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold', desktop ? 'bg-white/10 text-white' : 'bg-brand-50 text-brand-500 dark:bg-brand-500/10']">{{ initials }}</div>
            <div v-if="isExpanded" class="min-w-0"><p :class="['truncate text-sm font-medium', desktop ? 'text-white' : 'text-gray-800 dark:text-white/90']">{{ auth.user.value?.name || 'Kullanıcı' }}</p><p :class="['truncate text-xs', desktop ? 'text-white/45' : 'text-gray-500 dark:text-gray-400']">İSG Uzmanı</p></div>
          </div>
        </div>
      </nav>
    </aside>
  </div>
</template>
<script setup lang="ts">
import { ChevronDown, FileCheck2, Flame, FlameKindling, HelpCircle, Home, Radio, SearchCheck, Settings, ShieldCheck } from '@lucide/vue'
import { useIsgSidebar } from '~/composables/useIsgSidebar'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

const props = withDefaults(defineProps<{ desktop?: boolean }>(), { desktop: false })
const route = useRoute()
const auth = useAuth()
const context = useIsgDesktopContextStore()
const { isExpanded, isMobileOpen, closeMobile } = useIsgSidebar()

const defaultSections = [
  { title: 'Portal', items: [
    { title: 'Evrak Onayı', path: '/isg-portal/documents', icon: FileCheck2 },
    { title: 'Yangın Denetimi', path: '/isg-portal/fire-inspection', icon: Flame },
  ] },
]

const desktopSections = [
  { title: '', items: [{ title: 'Şube Ana Sayfa', path: '/isg-portal/desktop', icon: Home }] },
  { title: 'Yangın Yönetimi', items: [
    { title: 'YSC', path: '/isg-portal/desktop/ysc', icon: ShieldCheck },
    { title: 'Saha Bulguları', path: '/isg-portal/desktop/field-findings', icon: SearchCheck },
    { title: 'Yangın Denetimi (Mobil)', path: '/isg-portal/fire-inspection', icon: Flame },
  ] },
  { title: 'Raporlar', items: [
    { title: 'Yangın Söndürme Sistemleri', path: '/isg-portal/desktop/fire-suppression/inventory', icon: FlameKindling, children: [
      { title: 'Tesisat Durumu', path: '/isg-portal/desktop/fire-suppression/inventory' },
      { title: 'Raporlar', path: '/isg-portal/desktop/fire-suppression/reports' },
    ] },
    { title: 'Yangın Algılama Sistemleri', path: '/isg-portal/desktop/fire-detection', icon: Radio },
  ] },
  { title: '', items: [
    { title: 'Ayarlar', path: '/isg-portal/desktop/settings', icon: Settings },
    { title: 'Destek', path: '/isg-portal/desktop/support', icon: HelpCircle },
  ] },
]

const menuSections = computed(() => props.desktop ? desktopSections : defaultSections)
const isActive = (path: string) => path === '/isg-portal/desktop' ? route.path === path : route.path === path || route.path.startsWith(`${path}/`)
const hasActiveChild = (item: { children?: { path: string }[] }) => item.children?.some(c => isActive(c.path)) ?? false

const expandedGroups = ref<Set<string>>(new Set())
watch(() => route.path, () => {
  for (const section of desktopSections) {
    for (const item of section.items) {
      if ('children' in item && hasActiveChild(item)) expandedGroups.value.add(item.title)
    }
  }
}, { immediate: true })
const toggleGroup = (title: string) => {
  if (expandedGroups.value.has(title)) expandedGroups.value.delete(title)
  else expandedGroups.value.add(title)
}
const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})
</script>
