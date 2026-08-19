<template>
  <header class="sticky top-0 z-[999] flex w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
    <div class="flex w-full items-center justify-between px-4 py-3 lg:px-6 lg:py-4">
      <div class="flex items-center gap-3">
        <button class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-600 dark:border-gray-800 dark:text-gray-300 lg:h-11 lg:w-11" @click="handleSidebar">
          <span class="text-lg">☰</span>
        </button>
        <div class="hidden text-sm font-medium text-gray-500 sm:block dark:text-gray-400">Taseron Management</div>
      </div>

      <div class="flex items-center gap-2">
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Tema" @click="toggleTheme">
          <span class="text-lg">{{ isDark ? '☀' : '☾' }}</span>
        </button>
        <button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" title="Bildirimler">
          <span class="text-lg">♧</span>
        </button>
        <div class="hidden items-center gap-3 border-l border-gray-200 pl-3 sm:flex dark:border-gray-800">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">AY</div>
          <div>
            <p class="text-sm font-medium text-gray-800 dark:text-white/90">Ahmet Yılmaz</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Sistem Yöneticisi</p>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const { toggle, toggleMobile } = useTailAdminSidebar()
const { isDark, toggle: toggleTheme } = useTailAdminTheme()

const handleSidebar = () => {
  if (import.meta.client && window.innerWidth < 1024) toggleMobile()
  else toggle()
}
</script>
