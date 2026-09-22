<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FireSuppressionReport, FireSuppressionReportControlItem } from '~/types/fire-suppression-report'

type SystemGroup = {
  category: string
  items: FireSuppressionReportControlItem[]
}

const props = defineProps<{
  report: FireSuppressionReport | null
  controls: number
}>()

const selectedSystem = ref('')

const categoryLabels: Record<string, string> = {
  yangin_pompasi: 'Yangın Pompası',
  yangin_dolabi: 'Yangın Dolapları',
  hidrant: 'Hidrant Sistemi',
  sprinkler: 'Sprinkler Sistemi',
  su_deposu: 'Yangın Su Deposu',
  sabit_boru: 'Sabit Boru Tesisatı',
  su_alma_verme: 'İtfaiye Su Alma ve Verme Ağızları',
  gazli_sondurme: 'Gazlı Söndürme',
  yangin_algilama: 'Yangın Algılama ve Uyarı Sistemleri',
}

const systemGroups = computed<SystemGroup[]>(() => {
  const groups = new Map<string, FireSuppressionReportControlItem[]>()

  for (const item of props.report?.control_items ?? []) {
    const category = item.category ?? 'diger'
    if (!groups.has(category)) groups.set(category, [])
    groups.get(category)!.push(item)
  }

  return [...groups.entries()].map(([category, items]) => ({ category, items }))
})

watch(systemGroups, (groups) => {
  if (!groups.some(group => group.category === selectedSystem.value)) {
    selectedSystem.value = groups[0]?.category ?? ''
  }
}, { immediate: true })

const selectedGroup = computed(() =>
  systemGroups.value.find(group => group.category === selectedSystem.value) ?? systemGroups.value[0] ?? null,
)

const selectedItems = computed(() => {
  const seen = new Set<string>()
  return (selectedGroup.value?.items ?? []).filter((item) => {
    const key = item.code || String(item.id)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
})

const categoryLabel = (category: string) => categoryLabels[category] || category

const statusLabel = (status: string) => {
  if (status === 'uygun') return 'Uygun'
  if (status === 'uygun_degil') return 'Uygun Değil'
  if (status === 'uygulanamiyor') return 'Uygulanamaz'
  return 'Değerlendirilmedi'
}

const statusClass = (status: string) => {
  if (status === 'uygun') return 'bg-emerald-50 text-emerald-600'
  if (status === 'uygun_degil') return 'bg-red-50 text-red-500'
  return 'bg-slate-100 text-slate-500'
}

const groupNonconformCount = (items: FireSuppressionReportControlItem[]) =>
  items.filter(item => item.status === 'uygun_degil').length
</script>

<template>
  <section class="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div class="flex min-h-[620px]">
      <aside class="w-[280px] shrink-0 border-r border-slate-200 bg-slate-50/70 p-3 dark:border-gray-800 dark:bg-gray-950/40">
        <div class="px-2 pb-3 pt-2">
          <h3 class="text-sm font-bold text-[#14284f] dark:text-white">Kontrol Maddeleri</h3>
          <p class="mt-1 text-xs text-slate-400">Sistem bazında kontrol maddeleri</p>
        </div>

        <div class="space-y-1">
          <button
            v-for="group in systemGroups"
            :key="group.category"
            type="button"
            class="w-full rounded-lg px-3 py-3 text-left transition"
            :class="selectedSystem === group.category ? 'bg-white shadow-sm ring-1 ring-slate-200 dark:bg-gray-900 dark:ring-gray-800' : 'hover:bg-white/80 dark:hover:bg-gray-900/70'"
            @click="selectedSystem = group.category"
          >
            <div class="flex items-center justify-between gap-3">
              <span class="min-w-0 truncate text-xs font-semibold text-[#14284f] dark:text-white">
                {{ categoryLabel(group.category) }}
              </span>
              <span class="shrink-0 text-[10px] font-bold text-slate-400">
                {{ group.items.length }}
              </span>
            </div>
            <div class="mt-2 flex items-center gap-2">
              <span class="text-[10px] text-slate-400">
                {{ groupNonconformCount(group.items) }} uygunsuz
              </span>
              <span
                v-if="groupNonconformCount(group.items) > 0"
                class="h-1.5 w-1.5 rounded-full bg-red-400"
              />
              <span
                v-else
                class="h-1.5 w-1.5 rounded-full bg-emerald-400"
              />
            </div>
          </button>
        </div>

        <div v-if="!systemGroups.length" class="px-2 py-8 text-center text-xs text-slate-400">
          Kontrol maddesi bulunmuyor.
        </div>
      </aside>

      <div class="min-w-0 flex-1 p-5">
        <div v-if="selectedGroup" class="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-gray-800">
          <div>
            <h4 class="text-sm font-bold text-[#14284f] dark:text-white">
              {{ categoryLabel(selectedGroup.category) }}
            </h4>
            <p class="mt-1 text-xs text-slate-400">
              Bu sisteme ait tüm kontrol maddeleri
            </p>
          </div>
          <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-gray-800 dark:text-slate-300">
            {{ selectedItems.length }} madde
          </span>
        </div>

        <div v-if="selectedItems.length" class="mt-4 space-y-2">
          <div
            v-for="(item, index) in selectedItems"
            :key="item.id"
            class="flex items-start gap-3 rounded-lg border border-slate-100 p-4 dark:border-gray-800"
          >
            <span
              :class="[
                'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                statusClass(item.status),
              ]"
            >
              {{ item.status === 'uygun' ? '✓' : item.status === 'uygun_degil' ? '!' : '—' }}
            </span>

            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-xs font-semibold leading-5 text-[#14284f] dark:text-white">
                    {{ item.title }}
                  </p>
                  <p class="mt-1 text-[10px] text-slate-400">
                    {{ item.code || item.section || `Kontrol ${index + 1}` }}
                  </p>
                </div>
                <span :class="['shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold', statusClass(item.status)]">
                  {{ statusLabel(item.status) }}
                </span>
              </div>

              <p v-if="item.equipment_code" class="mt-2 text-[10px] text-slate-400">
                Ekipman: <span class="font-semibold text-slate-500 dark:text-slate-300">{{ item.equipment_code }}</span>
              </p>
            </div>
          </div>
        </div>

        <div v-else class="flex min-h-[400px] items-center justify-center text-center">
          <div>
            <p class="text-sm font-semibold text-slate-500">Bu sistem için kontrol maddesi bulunmuyor.</p>
            <p class="mt-1 text-xs text-slate-400">Rapor verisinde bu sisteme ait madde bulunamadı.</p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
