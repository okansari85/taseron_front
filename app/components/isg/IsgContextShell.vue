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
  <div
    class="flex min-h-screen flex-col bg-gray-50 font-outfit dark:bg-gray-950"
    :class="props.variant === 'location' ? 'isg-context-shell--location' : ''"
  >
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
      <aside class="relative hidden w-[340px] shrink-0 overflow-hidden bg-gradient-to-b from-white via-white to-brand-50 lg:block xl:w-[380px]">
        <div class="flex h-full flex-col">
          <div class="p-8 pb-0">
            <span class="mb-5 inline-block h-px w-10 bg-brand-300" />
            <p class="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-500">DAHA GÜVENLİ YARINLAR İÇİN</p>
            <h1 class="text-3xl font-bold leading-[1.15] tracking-tight text-brand-950">{{ headline }}</h1>
            <p v-if="description" class="mt-4 text-sm leading-6 text-brand-900/70">{{ description }}</p>
            <div class="mt-8 space-y-4">
              <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600">
                  <component :is="feature.icon" :size="17" />
                </span>
                <div>
                  <p class="text-sm font-semibold text-brand-950">{{ feature.title }}</p>
                  <p v-if="feature.subtitle" class="mt-0.5 text-xs text-brand-700/70">{{ feature.subtitle }}</p>
                </div>
              </div>
            </div>
            <p class="mt-8 text-base font-semibold italic text-brand-950">{{ footerNote }}</p>
          </div>

          <div class="relative mt-6 min-h-[180px] flex-1">
            <img src="/images/taseron-login-workers.jpg" alt="" class="absolute inset-0 h-full w-full object-cover object-center" />
            <div class="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-white to-transparent" />
          </div>
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

<style scoped>
.isg-context-shell--location {
  --location-sidebar-width: 394px;
  background: #f7fbff;
}

.isg-context-shell--location > header {
  min-height: 60px;
  padding-top: 10px;
  padding-bottom: 10px;
}

.isg-context-shell--location > .flex > aside {
  width: var(--location-sidebar-width);
  background: linear-gradient(180deg, #eef6ff 0%, #f7fbff 72%, #ffffff 100%);
}

.isg-context-shell--location > .flex > aside > div > div:first-child {
  padding: 58px 48px 0;
}

.isg-context-shell--location > .flex > aside h1 {
  max-width: 290px;
  font-size: 34px;
  line-height: 1.08;
  color: #101d5c;
}

.isg-context-shell--location > .flex > aside > div > div:last-child {
  margin-top: 28px;
  min-height: 340px;
}

.isg-context-shell--location > .flex > aside > div > div:last-child img {
  content: url('/images/ChatGPT Image 8 Eyl 2026 19_20_54.png');
  object-position: center bottom;
}

.isg-context-shell--location > .flex > aside > div > div:last-child::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(247, 251, 255, 0.9) 0%, rgba(247, 251, 255, 0) 18%, rgba(8, 20, 70, 0.03) 100%);
  pointer-events: none;
}

@media (max-width: 1279px) {
  .isg-context-shell--location > .flex > aside {
    width: 360px;
  }
}
</style>
