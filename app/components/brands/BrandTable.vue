<script setup lang="ts">
import { EllipsisVertical, Eye, Pencil, Trash2 } from 'lucide-vue-next'
import type { Brand } from '~/types/brand'

defineProps<{ brands: Brand[]; loading: boolean; error: string | null }>()
const emit = defineEmits<{ view: [id: number]; edit: [id: number]; delete: [id: number] }>()

const openActionId = ref<number | null>(null)
const actionMenuStyle = ref<Record<string, string>>({})

const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')

const toggleActions = (id: number, event: MouseEvent) => {
  if (openActionId.value === id) {
    openActionId.value = null
    return
  }

  openActionId.value = id
  if (event.currentTarget instanceof HTMLElement) {
    const rect = event.currentTarget.getBoundingClientRect()
    const menuHeight = 42
    const gap = 4
    actionMenuStyle.value = {
      top: `${rect.bottom + gap + menuHeight > window.innerHeight ? rect.top - menuHeight - gap : rect.bottom + gap}px`,
      right: `${Math.max(8, window.innerWidth - rect.right)}px`,
    }
  }
}

const deleteBrand = (id: number) => {
  openActionId.value = null
  emit('delete', id)
}
</script>

<template>
  <div @click="openActionId = null">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1050px] text-left">
        <thead class="border-b border-gray-100 dark:border-gray-800">
          <tr>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Marka Adı</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Kısa Ad</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Bağlı Şirket Sayısı</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Grup</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Oluşturulma Tarihi</th>
            <th class="px-4 py-4 text-right text-xs font-medium text-gray-500">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-if="loading"><td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500">Markalar yükleniyor...</td></tr>
          <tr v-else-if="error"><td colspan="7" class="px-4 py-10 text-center text-sm text-error-500">{{ error }}</td></tr>
          <tr v-else-if="brands.length === 0"><td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500">Kayıt bulunamadı.</td></tr>
          <tr v-for="brand in brands" v-else :key="brand.id" class="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-4">
              <button type="button" class="flex items-center gap-3 text-left" @click="emit('view', brand.id)">
                <span class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-md bg-brand-500 text-[10px] font-bold text-white">
                  <img v-if="brand.logoUrl" :src="brand.logoUrl" :alt="`${brand.name} logosu`" class="h-full w-full object-contain" />
                  <template v-else>{{ initials(brand.name) }}</template>
                </span>
                <span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ brand.name }}</span>
              </button>
            </td>
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ brand.shortName }}</td>
            <td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ brand.companies.length }}</td>
            <td class="px-4 py-4"><span class="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500">{{ brand.group }}</span></td>
            <td class="px-4 py-4">
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="brand.status === 'active' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'">
                <span class="h-1.5 w-1.5 rounded-full" :class="brand.status === 'active' ? 'bg-success-500' : 'bg-gray-400'" />{{ brand.status === 'active' ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500">{{ brand.createdAt }}</td>
            <td class="px-4 py-4">
              <div class="flex items-center justify-end gap-2">
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" title="Görüntüle" aria-label="Görüntüle" @click.stop="emit('view', brand.id)"><Eye :size="17" /></button>
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" title="Düzenle" aria-label="Düzenle" @click.stop="emit('edit', brand.id)"><Pencil :size="17" /></button>
                <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700" aria-label="Diğer işlemler" :aria-expanded="openActionId === brand.id" @click.stop="toggleActions(brand.id, $event)"><EllipsisVertical :size="17" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="openActionId !== null" class="fixed z-[10050] w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900" :style="actionMenuStyle" @click.stop>
      <button type="button" class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-error-600 transition hover:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10" @click="deleteBrand(openActionId)"><Trash2 :size="15" />Sil</button>
    </div>
  </div>
</template>
