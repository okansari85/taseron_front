<script setup lang="ts">
import { ChevronLeft, ChevronRight, EllipsisVertical, Eye, MapPin } from 'lucide-vue-next'

type LocationStatus = 'active' | 'passive'
type LocationBusinessEntity = { id: number; companyName: string; brandName?: string; logoUrl: string }
type Location = { id: number; name: string; city: string; district: string; address: string; businessEntities: LocationBusinessEntity[]; contractorCount: number; status: LocationStatus; image: string }

const props = defineProps<{
  locations: Location[]
  filteredCount: number
  currentPage: number
  totalPages: number
  visiblePages: number[]
  perPage: number
}>()

const emit = defineEmits<{
  view: [id: number]
  'update:currentPage': [page: number]
  'update:perPage': [value: number]
}>()
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
    <div class="overflow-x-auto">
      <table class="w-full min-w-[1180px] text-left">
        <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.03]">
          <tr>
            <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Lokasyon</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Adres</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Şirketler / Markalar</th>
            <th class="px-4 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Taşeron</th>
            <th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Durum</th>
            <th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
          <tr v-for="location in props.locations" :key="location.id" class="transition hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
            <td class="px-4 py-3.5">
              <button type="button" class="flex min-w-[255px] items-center gap-3 text-left" @click="emit('view', location.id)">
                <img :src="location.image" :alt="location.name" class="h-14 w-14 shrink-0 rounded-xl object-cover ring-1 ring-gray-200 dark:ring-gray-700" loading="lazy" />
                <span class="min-w-0">
                  <span class="block text-sm font-semibold text-gray-800 dark:text-white/90">{{ location.name }}</span>
                  <span class="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><MapPin :size="12" />{{ location.district }} / {{ location.city }}</span>
                </span>
              </button>
            </td>
            <td class="max-w-[360px] px-4 py-3.5 align-middle text-sm leading-5 text-gray-600 dark:text-gray-400"><span class="line-clamp-3">{{ location.address }}</span></td>
            <td class="px-4 py-3.5">
              <div class="flex items-center gap-1">
                <div v-for="(entity, index) in location.businessEntities.slice(0, 3)" :key="entity.id" class="relative -ml-2 first:ml-0" :style="{ zIndex: 10 - index }" :title="entity.companyName + (entity.brandName ? ' • ' + entity.brandName : '')">
                  <span class="flex h-13 w-13 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-white p-2.5 shadow-sm dark:border-gray-700 dark:bg-gray-950"><img :src="entity.logoUrl" :alt="entity.brandName || entity.companyName" class="max-h-9 max-w-11 object-contain" loading="lazy" /></span>
                </div>
                <span v-if="location.businessEntities.length > 3" class="relative -ml-2 flex h-13 w-13 items-center justify-center rounded-full border border-brand-100 bg-brand-50 text-xs font-semibold text-brand-500 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">+{{ location.businessEntities.length - 3 }}</span>
              </div>
            </td>
            <td class="px-4 py-3.5 text-center"><span class="inline-flex min-w-8 items-center justify-center rounded-lg bg-brand-50 px-2 py-1.5 text-xs font-semibold text-brand-500 dark:bg-brand-500/10 dark:text-brand-300">{{ location.contractorCount }}</span></td>
            <td class="px-4 py-3.5"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="location.status === 'active' ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-300'"><span class="h-1.5 w-1.5 rounded-full" :class="location.status === 'active' ? 'bg-success-500' : 'bg-error-500'" />{{ location.status === 'active' ? 'Aktif' : 'Pasif' }}</span></td>
            <td class="px-4 py-3.5"><div class="flex items-center justify-end gap-2"><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300" @click="emit('view', location.id)"><Eye :size="17" /></button><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300"><EllipsisVertical :size="17" /></button></div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
      <span class="text-sm text-gray-500 dark:text-gray-400">Toplam {{ props.filteredCount }} kayıt</span>
      <div class="flex items-center gap-1">
        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="props.currentPage === 1" @click="emit('update:currentPage', props.currentPage - 1)"><ChevronLeft :size="16" /></button>
        <button v-for="page in props.visiblePages" :key="page" type="button" class="h-9 min-w-9 rounded-lg px-2 text-sm font-medium" :class="page === props.currentPage ? 'bg-brand-500 text-white' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]'" @click="emit('update:currentPage', page)">{{ page }}</button>
        <button type="button" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:text-gray-400" :disabled="props.currentPage === props.totalPages" @click="emit('update:currentPage', props.currentPage + 1)"><ChevronRight :size="16" /></button>
      </div>
      <select :value="props.perPage" class="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300" @change="emit('update:perPage', Number(($event.target as HTMLSelectElement).value))"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select>
    </div>
  </section>
</template>
