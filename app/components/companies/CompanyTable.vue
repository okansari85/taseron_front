<script setup lang="ts">
import { EllipsisVertical, Eye } from 'lucide-vue-next'

type CompanyStatus = 'active' | 'passive'
type Company = { id: number; name: string; shortName: string; group: string; brandCount: number; status: CompanyStatus; createdAt: string }

defineProps<{ companies: Company[]; loading: boolean; error: string | null }>()
const emit = defineEmits<{ view: [id: number] }>()
const companyInitials = (name: string) => name.replace(/[^A-Za-zÇĞİÖŞÜçğıöşü ]/g, '').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0)).join('').toLocaleUpperCase('tr-TR')
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[980px] text-left">
      <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.03]"><tr><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Şirket</th><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Kısa Ad</th><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Grup</th><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Marka Sayısı</th><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Durum</th><th class="px-4 py-4 text-xs font-medium text-gray-500 dark:text-gray-400">Oluşturulma Tarihi</th><th class="px-4 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400">İşlemler</th></tr></thead>
      <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
        <tr v-if="loading"><td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Şirketler yükleniyor...</td></tr>
        <tr v-else-if="error"><td colspan="7" class="px-4 py-10 text-center text-sm text-error-500">{{ error }}</td></tr>
        <tr v-else-if="companies.length === 0"><td colspan="7" class="px-4 py-10 text-center text-sm text-gray-500 dark:text-gray-400">Kayıt bulunamadı.</td></tr>
        <tr v-for="company in companies" v-else :key="company.id" class="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]"><td class="px-4 py-4"><button type="button" class="flex min-w-[220px] items-center gap-3 text-left" @click="emit('view', company.id)"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-xs font-semibold text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">{{ companyInitials(company.name) }}</span><span class="text-sm font-semibold text-gray-800 dark:text-white/90">{{ company.name }}</span></button></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ company.shortName }}</td><td class="px-4 py-4"><span class="inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-500 dark:bg-brand-500/15 dark:text-brand-300">{{ company.group }}</span></td><td class="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">{{ company.brandCount }}</td><td class="px-4 py-4"><span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="company.status === 'active' ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700/60 dark:text-gray-300'"><span class="h-1.5 w-1.5 rounded-full" :class="company.status === 'active' ? 'bg-success-500' : 'bg-gray-400'" />{{ company.status === 'active' ? 'Aktif' : 'Pasif' }}</span></td><td class="whitespace-nowrap px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{{ company.createdAt }}</td><td class="px-4 py-4"><div class="flex items-center justify-end gap-2"><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300" @click="emit('view', company.id)"><Eye :size="17" /></button><button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-500/40 dark:hover:text-brand-300" aria-label="Şirket işlemleri"><EllipsisVertical :size="17" /></button></div></td></tr>
      </tbody>
    </table>
  </div>
</template>
