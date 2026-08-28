<template>
  <table class="!w-full min-w-full table-fixed font-outfit">
    <thead>
      <tr class="border-b border-gray-200 bg-gray-25 dark:border-gray-700 dark:bg-white/[0.02]">
        <th v-for="heading in headings" :key="heading" class="px-5 py-3 text-left sm:px-6">
          <p class="text-xs font-medium leading-5 text-gray-500 dark:text-gray-400">{{ heading }}</p>
        </th>
      </tr>
    </thead>

    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
      <tr v-if="loading">
        <td colspan="6" class="px-6 py-16 text-center text-sm text-gray-500 dark:text-gray-400">Tenantlar yükleniyor...</td>
      </tr>

      <tr v-for="tenant in tenants" v-else :key="tenant.id" class="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
        <td class="px-5 py-4 sm:px-6">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              <img v-if="tenant.logo_url" :src="tenant.logo_url" :alt="`${tenant.name} logosu`" class="block max-h-full max-w-full object-contain" @error="($event.currentTarget as HTMLImageElement).style.display = 'none'" />
              <span v-else>{{ getInitials(tenant.name) }}</span>
            </div>
            <div class="min-w-0">
              <button class="block text-left text-sm font-medium leading-5 text-gray-800 hover:text-brand-500 dark:text-white/90" @click="$emit('open', tenant)">{{ tenant.name }}</button>
              <span class="block text-xs leading-4 text-gray-500 dark:text-gray-400">#{{ tenant.id }}</span>
            </div>
          </div>
        </td>
        <td class="px-5 py-4 text-sm leading-5 text-gray-500 dark:text-gray-400 sm:px-6">{{ tenant.slug }}</td>
        <td class="px-5 py-4 sm:px-6">
          <TailAdminBadge :tone="structureTone(tenant.root_organization?.type)">{{ structureLabel(tenant.root_organization?.type) }}</TailAdminBadge>
        </td>
        <td class="px-5 py-4 sm:px-6">
          <TailAdminBadge :tone="tenant.status === 'active' ? 'success' : 'gray'" :dot="true">{{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}</TailAdminBadge>
        </td>
        <td class="px-5 py-4 text-sm leading-5 text-gray-500 dark:text-gray-400 sm:px-6">{{ formatDate(tenant.created_at) }}</td>
        <td class="px-5 py-4 sm:px-6">
          <div class="flex justify-start gap-1">
            <button class="rounded-lg px-2.5 py-2 text-sm font-medium leading-5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="$emit('open', tenant)">Görüntüle</button>
            <button class="rounded-lg px-2.5 py-2 text-sm font-medium leading-5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="$emit('edit', tenant)">Düzenle</button>
          </div>
        </td>
      </tr>

      <tr v-if="!loading && tenants.length === 0">
        <td colspan="6" class="px-6 py-16 text-center">
          <p class="text-sm font-medium text-gray-800 dark:text-white/90">Tenant bulunamadı</p>
          <p class="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</p>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { Tenant } from '~/types/tenant'
import { getInitials, structureLabel, structureTone, formatDate } from '~/utils/tenant'

type TenantRow = Tenant & {
  root_organization?: {
    type?: string | null
  }
}

defineProps<{
  tenants: TenantRow[]
  loading: boolean
}>()

defineEmits<{
  open: [tenant: Tenant]
  edit: [tenant: Tenant]
}>()

const headings = ['Tenant Adı', 'Slug', 'Kurumsal Yapı', 'Durum', 'Oluşturulma Tarihi', 'İşlemler']
</script>
