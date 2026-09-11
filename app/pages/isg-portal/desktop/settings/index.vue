<script setup lang="ts">
import { Flame, Settings } from '@lucide/vue'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'
import { useIsgSidebar } from '~/composables/useIsgSidebar'
import { useFireSuppressionCategorySettings } from '~/composables/useFireSuppressionCategorySettings'
import { fireSuppressionCategorySettingApi } from '~/api/fire-suppression-category-settings'
import { FIRE_SUPPRESSION_CATEGORIES, FIRE_SUPPRESSION_CATEGORY_LABELS, type FireSuppressionCategory } from '~/types/fire-suppression-inventory'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const context = useIsgDesktopContextStore()
const { isExpanded } = useIsgSidebar()
const categorySettings = useFireSuppressionCategorySettings()

onMounted(() => {
  if (!context.ready) {
    navigateTo('/isg-portal/desktop/select-location')
    return
  }
  categorySettings.load()
})

// --- Yangın Söndürme Sistemleri: kategori adları ---
// Taksonomi (yangin_dolabi, su_deposu, ...) sabit kalır — eşleştirme/AI/
// rapor mantığı buna dayanır — ama her satırın "Görünen Ad"ını bu tenant
// için özelleştirebilir, ve kullanılmayan kategorileri "Sistem Ekle"
// listesinden gizleyebilirsiniz (is_enabled). Değişiklik satır bazında,
// anında kaydedilir.
type RowState = { customLabel: string; isEnabled: boolean; saving: boolean }
const rows = ref<Record<string, RowState>>({})

watch(() => categorySettings.settings.value, (list) => {
  const next: Record<string, RowState> = {}
  for (const category of FIRE_SUPPRESSION_CATEGORIES) {
    const existing = list.find(s => s.category === category)
    next[category] = {
      customLabel: existing?.custom_label ?? '',
      isEnabled: existing?.is_enabled ?? true,
      saving: false,
    }
  }
  rows.value = next
}, { immediate: true })

const isDirty = (category: FireSuppressionCategory): boolean => {
  const saved = categorySettings.settings.value.find(s => s.category === category)
  const row = rows.value[category]
  if (!row) return false
  return (saved?.custom_label ?? '') !== row.customLabel || (saved?.is_enabled ?? true) !== row.isEnabled
}

const saveRow = async (category: FireSuppressionCategory) => {
  const row = rows.value[category]
  if (!row || row.saving) return
  row.saving = true
  try {
    const { data } = await fireSuppressionCategorySettingApi.update(category, {
      custom_label: row.customLabel.trim() || null,
      is_enabled: row.isEnabled,
    })
    categorySettings.applyUpdate(data)
    $toast.success('Kaydedildi.')
  } catch (e: any) {
    $toast.error(e?.data?.message || e?.message || 'Kaydedilemedi.')
  } finally {
    row.saving = false
  }
}
</script>

<template>
  <div v-if="context.ready" class="min-h-screen bg-[#f7f8fa] font-outfit text-gray-900 dark:bg-gray-950 dark:text-white">
    <IsgSidebar :desktop="true" />

    <div :class="['min-h-screen transition-[padding] duration-300', isExpanded ? 'lg:pl-[230px]' : 'lg:pl-[72px]']">
      <IsgWorkspaceHeader />

      <main class="px-5 pb-8 pt-7 sm:px-7 lg:px-8">
        <div class="mx-auto max-w-3xl">
          <div class="mb-5 flex items-center gap-3">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 dark:bg-white/5"><Settings :size="20" /></span>
            <div>
              <h1 class="text-xl font-bold text-[#172033] dark:text-white">Ayarlar</h1>
              <p class="text-xs text-gray-400">Tesisatınıza özel tercihleri buradan yönetin.</p>
            </div>
          </div>

          <section class="overflow-hidden rounded-xl border border-[#e7e9ed] bg-white dark:border-gray-800 dark:bg-gray-900">
            <div class="flex items-center gap-2.5 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#d71920] dark:bg-red-500/10"><Flame :size="15" /></span>
              <div>
                <p class="text-sm font-bold text-[#172033] dark:text-white">Yangın Söndürme Sistemleri — Sistem Adları</p>
                <p class="text-[11px] text-gray-400">Sistem türleri sabittir, ama bu tesisatta nasıl adlandırıldıklarını siz belirleyebilirsiniz. Boş bırakılan adlar varsayılan adıyla gösterilir. Kullanmadığınız sistemleri "Sistem Ekle" listesinden gizleyebilirsiniz.</p>
              </div>
            </div>

            <div v-if="categorySettings.loading.value" class="py-10 text-center text-xs text-gray-400">Yükleniyor...</div>
            <div v-else class="divide-y divide-[#f1f2f4] dark:divide-gray-800">
              <div v-for="category in FIRE_SUPPRESSION_CATEGORIES" :key="category" class="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0 sm:w-48 sm:shrink-0">
                  <p class="text-sm font-semibold text-[#172033] dark:text-white">{{ FIRE_SUPPRESSION_CATEGORY_LABELS[category] }}</p>
                  <p class="text-[11px] text-gray-400">Varsayılan ad</p>
                </div>
                <div class="flex flex-1 items-center gap-2">
                  <input
                    v-model="rows[category].customLabel"
                    type="text"
                    :placeholder="FIRE_SUPPRESSION_CATEGORY_LABELS[category]"
                    class="h-10 w-full rounded-lg border border-[#dfe3e8] bg-white px-3 text-sm outline-none focus:border-[#d71920] dark:border-gray-700 dark:bg-gray-800"
                  >
                  <label class="inline-flex shrink-0 cursor-pointer select-none items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                    <input v-model="rows[category].isEnabled" type="checkbox" class="h-3.5 w-3.5 rounded border-gray-300 text-[#d71920] focus:ring-[#d71920]">
                    Kullanılıyor
                  </label>
                  <button
                    type="button"
                    class="shrink-0 rounded-lg bg-[#d71920] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                    :disabled="!isDirty(category) || rows[category].saving"
                    @click="saveRow(category)"
                  >
                    {{ rows[category].saving ? 'Kaydediliyor...' : 'Kaydet' }}
                  </button>
                </div>
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
