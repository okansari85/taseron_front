<script setup lang="ts">
import { Bell, ChevronDown, Flame } from '@lucide/vue'

const props = withDefaults(defineProps<{
  headline: string
  description?: string
  features: { icon: any; title: string; subtitle?: string }[]
  footerNote: string
  variant?: 'default' | 'location'
  imageSrc?: string
}>(), {
  variant: 'default',
  imageSrc: '/images/ChatGPT Image 8 Eyl 2026 19_20_54.png',
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
  <div class="flex min-h-screen flex-col bg-gray-50 font-outfit dark:bg-gray-950" :class="props.variant === 'location' ? 'isg-context-shell--location' : ''">
    <header class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3.5 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2.5">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="18" /></span>
        <div><p class="text-sm font-semibold text-gray-900 dark:text-white/90">İSG / Yangın Güvenlik</p><p class="text-[11px] text-gray-400">Denetim Uygulaması</p></div>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5"><Bell :size="18" /></button>
        <div class="relative">
          <button type="button" class="flex items-center gap-2.5 border-l border-gray-200 pl-3 dark:border-gray-800" @click="profileOpen = !profileOpen">
            <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">{{ initials }}</span>
            <span class="text-left"><span class="block text-sm font-semibold text-gray-900 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</span><span class="block text-xs text-gray-400">İSG Uzmanı</span></span>
            <ChevronDown :size="15" class="text-gray-400" />
          </button>
          <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900"><button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button></div>
        </div>
      </div>
    </header>
    <div class="flex min-h-0 flex-1">
      <aside class="relative hidden w-[340px] shrink-0 overflow-hidden bg-gradient-to-b from-white via-white to-brand-50 lg:block xl:w-[380px]">
        <div class="relative flex h-full flex-col">
          <div class="relative z-10 p-8 pb-0">
            <span class="mb-5 inline-block h-px w-10 bg-brand-300" />
            <p class="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-500">DAHA GÜVENLİ YARINLAR İÇİN</p>
            <h1 class="text-3xl font-bold leading-[1.15] tracking-tight text-brand-950">{{ headline }}</h1>
            <p v-if="description" class="mt-4 text-sm leading-6 text-brand-900/70">{{ description }}</p>
            <div class="mt-8 space-y-4">
              <div v-for="feature in features" :key="feature.title" class="flex items-start gap-3">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-brand-600"><component :is="feature.icon" :size="17" /></span>
                <div><p class="text-sm font-semibold text-brand-950">{{ feature.title }}</p><p v-if="feature.subtitle" class="mt-0.5 text-xs text-brand-700/70">{{ feature.subtitle }}</p></div>
              </div>
            </div>
            <p v-if="footerNote && props.variant !== 'location'" class="mt-8 text-base font-semibold italic text-brand-950">{{ footerNote }}</p>
          </div>
          <div class="absolute inset-0 z-0"><img :src="props.imageSrc" alt="" class="h-full w-full object-cover object-center" /><div class="absolute inset-0 bg-gradient-to-b from-white/80 via-white/10 to-transparent" /></div>
        </div>
      </aside>
      <main class="min-w-0 flex-1 overflow-y-auto"><slot /></main>
    </div>
    <footer class="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3 text-xs text-gray-400 dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center gap-2"><Flame :size="13" class="text-error-500" /><span>İSG / Yangın Güvenlik — Denetim Uygulaması</span></div>
      <span>Daha güvenli yarınlar için.</span>
    </footer>
  </div>
</template>

<style scoped>
.isg-context-shell--location { --location-sidebar-width: 340px; background: #f7fbff; }
.isg-context-shell--location > header { min-height: 60px; padding-top: 10px; padding-bottom: 10px; }
.isg-context-shell--location > .flex > aside { width: var(--location-sidebar-width); background-image: url('/images/abc.png') !important; background-repeat: no-repeat !important; background-size: auto 147% !important; background-position: left 17% !important; background-color: transparent !important; }
.isg-context-shell--location > .flex > aside > div > div:first-child { padding: 58px 48px 0; }
.isg-context-shell--location > .flex > aside h1 { max-width: 205px; margin-top: 0; font-size: 30px; line-height: 1.04; letter-spacing: -0.025em; color: #101d5c; }
.isg-context-shell--location > .flex > aside > div > div:first-child > span { display: none; }
.isg-context-shell--location > .flex > aside > div > div:first-child > p:first-of-type { margin-bottom: 14px; font-size: 9px; letter-spacing: 0.22em; }
.isg-context-shell--location > .flex > aside h1 + p { margin-top: 12px; font-size: 13px; line-height: 1.55; }
.isg-context-shell--location > .flex > aside > div > div:first-child > div { margin-top: 28px; gap: 14px; }
.isg-context-shell--location > .flex > aside > div > div:first-child > div > div { gap: 12px; }
.isg-context-shell--location > .flex > aside > div > div:first-child > div span { width: 38px; height: 38px; border-radius: 10px; }
.isg-context-shell--location > .flex > aside > div > div:first-child > div p:first-child { font-size: 12px; line-height: 1.25; }
.isg-context-shell--location > .flex > aside > div > div:first-child > div p:last-child { margin-top: 2px; font-size: 10px; line-height: 1.35; }
.isg-context-shell--location > .flex > aside > div > div:last-child { position: absolute; inset: 0; margin: 0; min-height: 0; height: 100%; background: transparent; }
.isg-context-shell--location > .flex > aside > div > div:last-child img { opacity: 0; }
.isg-context-shell--location > .flex > aside > div > div:last-child > div { display: none; }

/* Lokasyon ekranında footer, görsel panelin bittiği yerden başlar. */
.isg-context-shell--location > footer {
  margin-left: var(--location-sidebar-width);
  width: calc(100% - var(--location-sidebar-width));
  box-sizing: border-box;
  min-height: 43px;
  padding-top: 9px;
  padding-bottom: 9px;
}

.isg-context-shell--location > footer > div:first-child {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.isg-context-shell--location > footer > div:first-child > svg {
  width: 22px;
  height: 22px;
  padding: 4px;
  box-sizing: border-box;
  border-radius: 7px;
  background: #fff1f1;
  color: #ef4444;
}

.isg-context-shell--location > footer > span {
  color: #8a95ac;
  font-size: 10px;
}

@media (max-width: 1279px) {
  .isg-context-shell--location > .flex > aside,
  .isg-context-shell--location > footer { width: 320px; }
  .isg-context-shell--location > footer { margin-left: 320px; width: calc(100% - 320px); }
}
</style>
