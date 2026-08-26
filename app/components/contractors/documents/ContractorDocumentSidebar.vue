<script setup lang="ts">
import { UserRound, Truck, Wrench, FlaskConical, Building2, MapPin } from 'lucide-vue-next'

type DocumentTab = 'personnel' | 'vehicles' | 'equipment' | 'chemicals' | 'companyDocuments' | 'locations'

defineProps<{ activeType: DocumentTab }>()
const emit = defineEmits<{ 'update:activeType': [value: DocumentTab] }>()

const tabs = [
  { key: 'personnel' as const, label: 'Personeller', icon: UserRound },
  { key: 'vehicles' as const, label: 'Araçlar', icon: Truck },
  { key: 'equipment' as const, label: 'Ekipmanlar', icon: Wrench },
  { key: 'chemicals' as const, label: 'Kimyasallar', icon: FlaskConical },
  { key: 'companyDocuments' as const, label: 'Şirket Evrakları', icon: Building2 },
  { key: 'locations' as const, label: 'Lokasyonlar', icon: MapPin },
]
</script>

<template>
  <aside class="w-full shrink-0 border-b border-gray-100 bg-gray-50/50 p-3 md:w-52 md:border-b-0 md:border-r">
    <div class="px-3 py-2">
      <p class="text-xs font-semibold text-gray-900">Evrak Durumu</p>
      <p class="mt-1 text-[11px] text-gray-500">Varlık ve şirket belgeleri</p>
    </div>
    <nav class="mt-3 space-y-1">
      <button v-for="tab in tabs" :key="tab.key" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeType === tab.key ? 'bg-brand-50 text-brand-600' : 'text-gray-600 hover:bg-white hover:text-gray-900'" @click="emit('update:activeType', tab.key)">
        <component :is="tab.icon" :size="16" />
        {{ tab.label }}
      </button>
    </nav>
  </aside>
</template>
