<script setup lang="ts">
import { ChevronLeft, ChevronRight, Eye, MapPin } from 'lucide-vue-next'
import type { LocationBusinessEntityItem } from '~/types/location-business-entity'

const props = defineProps<{
  items: LocationBusinessEntityItem[]
  filteredCount: number
  currentPage: number
  totalPages: number
  visiblePages: number[]
  perPage: number
}>()
const emit = defineEmits<{
  view: [locationId: number]
  'update:currentPage': [page: number]
  'update:perPage': [value: number]
}>()

const initials = (name: string) => (name || '').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
const coverPhoto = (item: LocationBusinessEntityItem) => item.photos[0]?.photo_url ?? null
const brandLabel = (item: LocationBusinessEntityItem) => item.brands.map(b => b.name).join(', ') || null
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1180px] text-left">
        <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.03]">
          <tr>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Firma / Marka</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Şube Fotoğrafı</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Şube Adresi</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Operasyonel Alan</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">NACE Kodu</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Tehlike Sınıfı</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">SGK Sicil No</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500">Durum</th>
            <th class="px-4 py-4 text-right text-xs font-medium text-gray-500">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="item in props.items" :key="item.id" class="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3.5">
              <button class="flex min-w-[220px] items-center gap-3 text-left" @click="emit('view', item.location_id)">
                <span class="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-50 text-xs font-semibold text-brand-500">{{ initials(item.business_entity?.company?.name || item.business_entity?.name || '?') }}</span>
                <span class="min-w-0">
                  <span class="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ brandLabel(item) || item.business_entity?.company?.name || item.business_entity?.name }}</span>
                  <span class="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500"><MapPin :size="12" class="shrink-0" />{{ item.location?.name }}</span>
                </span>
              </button>
            </td>
            <td class="px-4 py-3.5">
              <img v-if="coverPhoto(item)" :src="coverPhoto(item)!" :alt="item.location?.name" class="h-12 w-12 rounded-lg object-cover ring-1 ring-gray-200" />
              <span v-else class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 text-[10px] text-gray-400 dark:bg-white/5">Yok</span>
            </td>
            <td class="max-w-[280px] px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">
              <span class="line-clamp-2">{{ item.address || '—' }}</span>
            </td>
            <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">{{ item.operational_region?.name || '—' }}</td>
            <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">{{ item.nace_code || '—' }}</td>
            <td class="px-4 py-3.5">
              <span class="inline-flex items-center rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-600">{{ item.hazard_class }}</span>
            </td>
            <td class="px-4 py-3.5 text-sm text-gray-600 dark:text-gray-400">{{ item.sgk_workplace_number || '—' }}</td>
            <td class="px-4 py-3.5">
              <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="item.is_active ? 'bg-success-50 text-success-600' : 'bg-error-50 text-error-600'">
                <span class="h-1.5 w-1.5 rounded-full" :class="item.is_active ? 'bg-success-500' : 'bg-error-500'" />{{ item.is_active ? 'Aktif' : 'Pasif' }}
              </span>
            </td>
            <td class="px-4 py-3.5">
              <div class="flex items-center justify-end gap-2">
                <button class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand-500" @click="emit('view', item.location_id)"><Eye :size="17" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="!props.items.length">
            <td colspan="9" class="px-4 py-12 text-center text-sm text-gray-400">Kayıt bulunamadı.</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <span class="text-sm text-gray-500">Toplam {{ props.filteredCount }} kayıt</span>
      <div class="flex items-center gap-1">
        <button class="flex h-9 w-9 items-center justify-center rounded-lg border" :disabled="props.currentPage === 1" @click="emit('update:currentPage', props.currentPage - 1)"><ChevronLeft :size="16" /></button>
        <button v-for="page in props.visiblePages" :key="page" class="h-9 min-w-9 rounded-lg px-2 text-sm" :class="page === props.currentPage ? 'bg-brand-500 text-white' : 'text-gray-600'" @click="emit('update:currentPage', page)">{{ page }}</button>
        <button class="flex h-9 w-9 items-center justify-center rounded-lg border" :disabled="props.currentPage === props.totalPages" @click="emit('update:currentPage', props.currentPage + 1)"><ChevronRight :size="16" /></button>
      </div>
      <select :value="props.perPage" class="h-9 rounded-lg border px-3 text-sm" @change="emit('update:perPage', Number(($event.target as HTMLSelectElement).value))">
        <option :value="10">10 / sayfa</option>
        <option :value="25">25 / sayfa</option>
        <option :value="50">50 / sayfa</option>
      </select>
    </div>
  </section>
</template>
