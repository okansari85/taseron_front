<script setup lang="ts">
import { Building2, X } from 'lucide-vue-next'

type OrganizationRef = { id: number; name: string; type: string; parent_id: number | null }
const props = defineProps<{ organizations: OrganizationRef[]; matchingUrl: string; removingId?: number | null }>()
const emit = defineEmits<{ detach: [organizationId: number] }>()

const typeLabel = (type: string) => (type === 'holding' ? 'Holding' : type === 'group' ? 'Grup' : type)
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5 flex items-center justify-between">
    <div><h2 class="text-sm font-semibold text-gray-900">Organizasyon İlişkileri</h2><p class="mt-1 text-xs text-gray-500">Bu firmanın tenant içindeki holding/grup eşleştirmeleri.</p></div>
    <NuxtLink :to="matchingUrl" class="h-9 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white leading-9">Organizasyon Eşleştir</NuxtLink>
  </div>
  <div v-if="!organizations.length" class="rounded-xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
    Bu firma henüz hiçbir organizasyona eşleştirilmemiş. "Organizasyon Eşleştir" ile bağlantı kurabilirsiniz.
  </div>
  <div v-else class="overflow-x-auto">
    <table class="w-full min-w-[600px] text-left">
      <thead><tr class="border-b border-gray-100 text-xs text-gray-500"><th class="pb-3 font-medium">Organizasyon</th><th class="pb-3 font-medium">Tür</th><th class="w-28 pb-3 font-medium">İşlem</th></tr></thead>
      <tbody>
        <tr v-for="item in organizations" :key="item.id" class="border-b border-gray-100 last:border-0">
          <td class="py-4"><div class="flex items-center gap-2 text-sm font-medium text-gray-800"><Building2 :size="15" class="text-gray-400"/>{{ item.name }}</div></td>
          <td class="py-4"><span class="rounded-full bg-brand-50 px-2 py-1 text-[11px] font-medium text-brand-600">{{ typeLabel(item.type) }}</span></td>
          <td class="py-4">
            <button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50" :disabled="removingId === item.id" @click="emit('detach', item.id)">
              <X :size="13"/>{{ removingId === item.id ? 'Kaldırılıyor...' : 'Kaldır' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>
</template>
