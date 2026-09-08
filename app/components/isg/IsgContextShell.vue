<script setup lang="ts">
import { Bell, ChevronDown, Flame } from '@lucide/vue'

const props = withDefaults(defineProps<{
  headline: string
  description?: string
  features: { icon: any; title: string; subtitle?: string }[]
  footerNote: string
  variant?: 'default' | 'location'
}>(), {
  variant: 'default',
})

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
      <aside
        class="relative hidden shrink-0 overflow-hidden text-white lg:block"
        :class="props.variant === 'location' ? 'w-[340px] xl:w-[380px] bg-white text-brand-950' : 'w-[340px] bg-gradient-to-b from-brand-950 via-brand-900 to-brand-800 xl:w-[380px]'"
      >
        <template v-if="props.variant === 'location'">
          <div class="relative flex h-full min-h-[calc(100vh-118px)] flex-col overflow-hidden bg-gradient-to-b from-white via-white to-brand-50 p-8">
            <div class="relative z-10 max-w-[285px]">
              <span class="mb-5 inline-block h-px w-10 bg-brand-300" />
              <p class="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-500">DAHA GÜVENLİ YARINLAR İÇİN</p>
              <h1 class="text-4xl font-bold leading-[1.05] tracking-tight text-brand-950">{{ headline }}</h1>
              <p v-if="description" class="mt-5 text-[15px] leading-6 text-brand-900/80">{{ description }}</p>
              <div class="mt-9 space-y-5">
                <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
                  <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-white text-brand-900 shadow-sm">
                    <component :is="feature.icon" :size="18" />
                  </span>
                  <div>
                    <p class="text-sm font-semibold text-brand-950">{{ feature.title }}</p>
                    <p v-if="feature.subtitle" class="mt-0.5 text-xs text-brand-700/70">{{ feature.subtitle }}</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="pointer-events-none absolute inset-x-0 bottom-0 h-[46%]">
              <img src="/images/taseron-login-workers.jpg" alt="" class="h-full w-full object-cover object-center opacity-95" />
              <div class="absolute inset-0 bg-gradient-to-t from-brand-950/10 via-white/10 to-white" />
            </div>
            <div class="relative z-10 mt-auto pb-2 pt-24">
              <p class="text-lg font-semibold italic text-brand-950">{{ footerNote }}</p>
            </div>
          </div>
        </template>
        <template v-else>
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
        </template>
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
