<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-950">
    <div class="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Ana İSG portalına dönüş için hamburger menü — fire-inspection akışı
           kendi tam ekran layout'unu kullandığı için IsgSidebar/IsgHeader
           burada hiç görünmüyor, bu şerit onun yerine geçiyor. -->
      <div class="sticky top-0 z-30 flex h-10 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900">
        <button type="button" class="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" @click="menuOpen = true"><Menu :size="17" /></button>
        <span class="text-[11px] font-medium text-gray-400">İSG Portalı</span>
        <span class="w-7" />
      </div>

      <main class="flex-1 overflow-y-auto pb-20">
        <slot />
      </main>

      <nav class="sticky bottom-0 z-20 flex items-center justify-around border-t border-gray-200 bg-white px-2 py-2 dark:border-gray-800 dark:bg-gray-900">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.path"
          :to="tab.path"
          class="flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium"
          :class="isActive(tab.path) ? 'text-brand-600' : 'text-gray-400'"
        >
          <component :is="tab.icon" :size="20" />
          {{ tab.label }}
        </NuxtLink>
      </nav>
    </div>

    <div v-if="menuOpen" class="fixed inset-0 z-40 bg-gray-900/40" @click="menuOpen = false" />
    <aside v-if="menuOpen" class="fixed left-0 top-0 z-50 h-full w-64 bg-white p-4 shadow-xl dark:bg-gray-900">
      <p class="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Menü</p>
      <NuxtLink to="/isg-portal/documents" class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="menuOpen = false"><FileCheck2 :size="17" />Evrak Onayı</NuxtLink>
      <NuxtLink to="/isg-portal/fire-inspection" class="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="menuOpen = false"><Flame :size="17" />Yangın Denetimi</NuxtLink>
      <div class="my-2 border-t border-gray-100 dark:border-gray-800" />
      <NuxtLink to="/isg-portal/fire-inspection/profile" class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="menuOpen = false"><UserRound :size="17" />Profil</NuxtLink>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { Bell, ClipboardList, FileCheck2, Flame, Home, Menu, ShieldAlert, UserRound } from 'lucide-vue-next'

const route = useRoute()
const menuOpen = ref(false)
const base = '/isg-portal/fire-inspection'
const tabs = [
  { path: `${base}`, label: 'Ana Sayfa', icon: Home },
  { path: `${base}/menu`, label: 'Denetimler', icon: ClipboardList },
  { path: `${base}/findings`, label: 'Bulgular', icon: ShieldAlert },
  { path: `${base}/notifications`, label: 'Bildirimler', icon: Bell },
  { path: `${base}/profile`, label: 'Profil', icon: UserRound },
]
const isActive = (path: string) => route.path === path || (path !== base && route.path.startsWith(`${path}/`))
</script>
