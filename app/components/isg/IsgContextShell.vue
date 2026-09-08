<script setup lang="ts">
import { Bell, ChevronDown, Flame } from '@lucide/vue'

defineProps<{
  headline: string
  description?: string
  features: { icon: any; title: string; subtitle?: string }[]
  footerNote: string
}>()

const auth = useAuth()
const router = useRouter()
const profileOpen = ref(false)

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})

const handleLogout = async () => {
  profileOpen.value = false
  await auth.logout()
  await router.push('/isg-portal/login')
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="18" /></span>
        <div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white/90">İSG / Yangın Güvenlik</p>
          <p class="text-[11px] text-gray-400">Denetim Uygulaması</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5">
          <Bell :size="18" />
        </button>
        <div class="relative">
          <button type="button" class="flex items-center gap-2.5 border-l border-gray-200 pl-3 dark:border-gray-800" @click="profileOpen = !profileOpen">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">{{ initials }}</span>
            <span class="text-left">
              <span class="block text-sm font-semibold text-gray-900 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</span>
              <span class="block text-xs text-gray-400">İSG Uzmanı</span>
            </span>
            <ChevronDown :size="15" class="text-gray-400" />
          </button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
            <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button>
          </div>
        </div>
      </div>
    </header>

    <div class="flex min-h-0 flex-1">
      <aside class="relative hidden w-[340px] shrink-0 overflow-hidden bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 text-white lg:block xl:w-[380px]">
        <div class="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div class="pointer-events-none absolute bottom-24 -left-10 h-56 w-56 rounded-full bg-error-500/10 blur-3xl" />
        <div class="relative flex h-full flex-col justify-between p-8">
          <div>
            <span class="mb-5 inline-block h-px w-10 bg-white/40" />
            <h1 class="text-3xl font-bold leading-tight">{{ headline }}</h1>
            <p v-if="description" class="mt-4 text-sm leading-relaxed text-white/70">{{ description }}</p>
            <div class="mt-8 space-y-4">
              <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                  <component :is="feature.icon" :size="16" />
                </span>
                <div>
                  <p class="text-sm font-semibold text-white">{{ feature.title }}</p>
                  <p v-if="feature.subtitle" class="text-xs text-white/60">{{ feature.subtitle }}</p>
                </div>
              </div>
            </div>
          </div>
          <p class="text-sm italic text-white/70">{{ footerNote }}</p>
        </div>
      </aside>

      <main class="min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>

    <footer class="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2">
        <Flame :size="13" class="text-error-500" />
        <span>İSG / Yangın Güvenlik — Denetim Uygulaması</span>
      </div>
      <span>Daha güvenli yarınlar için.</span>
    </footer>
  </div>
</template>
