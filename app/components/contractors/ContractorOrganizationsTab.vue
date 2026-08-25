<script setup lang="ts">
import { ChevronDown, ChevronRight, Download } from 'lucide-vue-next'
type Contract={year:string;start:string;end:string;status:string;contractNo:string}
type Organization={name:string;status:string;start:string;end:string;list:string;contracts?:Contract[]}
defineProps<{ organizations: Organization[] }>()
const expanded=ref<string[]>([])
const toggle=(name:string)=>{expanded.value=expanded.value.includes(name)?expanded.value.filter(x=>x!==name):[...expanded.value,name]}
const downloadContract=(contract:Contract)=>{console.info('Sözleşme indir:',contract.contractNo)}
</script>
<template>
<section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
  <div class="mb-5 flex items-center justify-between"><div><h2 class="text-sm font-semibold text-gray-900">Organizasyon İlişkileri</h2><p class="mt-1 text-xs text-gray-500">Bu firma için tenant içindeki organizasyon ilişkileri ve sözleşme geçmişi.</p></div><button class="h-9 rounded-lg bg-brand-500 px-3 text-xs font-semibold text-white">Organizasyon Ekle</button></div>
  <div class="overflow-x-auto"><table class="w-full min-w-[820px] text-left"><thead><tr class="border-b border-gray-100 text-xs text-gray-500"><th class="w-10 pb-3"></th><th class="pb-3 font-medium">Organizasyon</th><th class="pb-3 font-medium">Durum</th><th class="pb-3 font-medium">Sözleşme Dönemi</th><th class="pb-3 font-medium">Liste Durumu</th></tr></thead><tbody>
    <template v-for="item in organizations" :key="item.name">
      <tr class="border-b border-gray-100 last:border-0">
        <td class="py-4"><button type="button" class="flex h-7 w-7 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-700" :aria-label="expanded.includes(item.name)?'Sözleşme geçmişini kapat':'Sözleşme geçmişini aç'" @click="toggle(item.name)"><ChevronDown v-if="expanded.includes(item.name)" :size="16"/><ChevronRight v-else :size="16"/></button></td>
        <td class="py-4 text-sm font-medium text-gray-800">{{ item.name }}</td>
        <td class="py-4"><span class="rounded-full px-2 py-1 text-[11px] font-medium" :class="item.status==='Aktif'?'bg-success-50 text-success-600':'bg-gray-100 text-gray-500'">{{ item.status }}</span></td>
        <td class="py-4 text-xs text-gray-500">{{ item.start }} – {{ item.end }}</td>
        <td class="py-4"><span class="text-xs font-medium" :class="item.list==='Kara Liste'?'text-error-600':'text-gray-600'">{{ item.list }}</span></td>
      </tr>
      <tr v-if="expanded.includes(item.name)" class="border-b border-gray-100 bg-gray-50/60">
        <td></td><td colspan="4" class="px-4 py-4"><div class="rounded-lg border border-gray-200 bg-white p-4"><div class="mb-3 text-xs font-semibold text-gray-700">Sözleşme Geçmişi</div><div v-if="item.contracts?.length" class="space-y-2"><div v-for="contract in item.contracts" :key="contract.contractNo" class="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-gray-100 px-3 py-3"><span class="text-xs font-semibold text-gray-800">{{ contract.year }}</span><span class="text-xs text-gray-500">{{ contract.start }} – {{ contract.end }}</span><span class="text-xs text-gray-500">{{ contract.contractNo }}</span><span class="rounded-full px-2 py-1 text-[11px] font-medium" :class="contract.status==='Aktif'?'bg-success-50 text-success-600':'bg-gray-100 text-gray-500'">{{ contract.status }}</span><button type="button" class="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50" @click="downloadContract(contract)"><Download :size="13"/>Sözleşmeyi İndir</button></div></div><p v-else class="text-xs text-gray-500">Geçmiş sözleşme bulunmuyor.</p></div></td>
      </tr>
    </template>
  </tbody></table></div>
</section>
</template>