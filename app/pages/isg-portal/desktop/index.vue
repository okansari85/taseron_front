<script setup lang="ts">
import { ArrowRight, ClipboardCheck, Flame, HardHat, SearchCheck, ShieldCheck, Users } from '@lucide/vue'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
  }
})

const modules = [
  {
    title: 'Ekipman Denetimi',
    description: 'İşletmedeki ekipmanları ve denetimlerini yönetin.',
    eyebrow: 'GÜVENLİK',
    icon: ShieldCheck,
  },
  {
    title: 'Saha Bulguları',
    description: 'Sahadaki bulguları, aksiyonları ve takip süreçlerini yönetin.',
    eyebrow: 'SAHA',
    icon: SearchCheck,
  },
  {
    title: 'Yangın Yönetimi',
    description: 'Yangın güvenliği, ekipman ve denetim süreçlerine erişin.',
    eyebrow: 'YANGIN',
    icon: Flame,
    to: '/isg-portal/fire-inspection',
  },
  {
    title: 'Taşeron Listesi',
    description: 'Lokasyondaki taşeronları ve ilgili çalışma kayıtlarını yönetin.',
    eyebrow: 'TAŞERON',
    icon: Users,
  },
]
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-gray-50 font-outfit dark:bg-gray-950">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[290px]' : 'lg:pl-[90px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 py-7 sm:px-8 lg:px-10">
        <div class="mx-auto max-w-[1500px]">
          <section class="mb-8">
            <div class="flex flex-col gap-2">
              <p class="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">İSG Yönetim Paneli</p>
              <h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                Güvenli İşletmeler Güçlü Gelecek
              </h1>
              <p class="max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
                İş sağlığı ve güvenliği süreçlerinizi bu çalışma alanından yönetin.
              </p>
            </div>
          </section>

          <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <NuxtLink
              v-for="module in modules"
              :key="module.title"
              :to="module.to || '/isg-portal/desktop'"
              class="group flex min-h-[190px] flex-col rounded-2xl border border-gray-200 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-500/30"
            >
              <div class="flex items-start justify-between gap-4">
                <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-50 text-brand-500 dark:bg-gray-800 dark:text-brand-400">
                  <component :is="module.icon" :size="21" />
                </span>
                <ArrowRight :size="17" class="mt-1 text-gray-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand-500" />
              </div>
              <div class="mt-auto pt-7">
                <p class="text-[10px] font-bold tracking-[0.14em] text-gray-400">{{ module.eyebrow }}</p>
                <h2 class="mt-1 text-base font-bold text-gray-900 dark:text-white">{{ module.title }}</h2>
                <p class="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{{ module.description }}</p>
              </div>
            </NuxtLink>
          </section>

          <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,1fr)]">
            <div class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-center justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
                <div>
                  <h2 class="text-sm font-bold text-gray-900 dark:text-white">Hızlı Erişim</h2>
                  <p class="mt-1 text-xs text-gray-400">Sık kullanılan İSG işlemleri</p>
                </div>
                <ClipboardCheck :size="19" class="text-gray-300" />
              </div>
              <div class="grid gap-3 p-5 sm:grid-cols-2">
                <NuxtLink
                  to="/isg-portal/documents"
                  class="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                >
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Evrak Onayı</p>
                    <p class="mt-1 text-xs text-gray-400">Bekleyen evrakları incele</p>
                  </div>
                  <ArrowRight :size="16" class="text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
                </NuxtLink>
                <NuxtLink
                  to="/isg-portal/fire-inspection"
                  class="group flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 transition-colors hover:border-brand-200 hover:bg-brand-50/40 dark:border-gray-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/5"
                >
                  <div>
                    <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Yangın Denetimi</p>
                    <p class="mt-1 text-xs text-gray-400">Yangın süreçlerine devam et</p>
                  </div>
                  <ArrowRight :size="16" class="text-gray-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-500" />
                </NuxtLink>
              </div>
            </div>

            <div class="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
              <div class="flex items-start gap-4">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
                  <HardHat :size="19" />
                </span>
                <div class="min-w-0">
                  <h2 class="text-sm font-bold text-gray-900 dark:text-white">Aktif Çalışma Alanı</h2>
                  <p class="mt-1 text-xs leading-5 text-gray-400">İşlemleriniz şu çalışma alanı için yürütülüyor.</p>
                </div>
              </div>
              <div class="mt-6 border-t border-gray-100 pt-5 dark:border-gray-800">
                <p class="text-xs font-medium text-gray-400">Lokasyon</p>
                <p class="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ context.locationName }}</p>
                <template v-if="context.branchName">
                  <p class="mt-4 text-xs font-medium text-gray-400">Şube / Marka</p>
                  <p class="mt-1 truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ context.branchName }}</p>
                </template>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>

  <div v-else class="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-400 dark:bg-gray-950">
    Yönlendiriliyor...
  </div>
</template>
