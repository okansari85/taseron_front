<script setup lang="ts">
import { ref, computed } from 'vue'
import { UserRound, Truck, Wrench, FlaskConical, Check, X, FileText } from 'lucide-vue-next'

type Asset = {
  name: string
  detail: string
  documents: Record<string, boolean>
}

const activeType = ref<'personnel' | 'vehicles' | 'equipment' | 'chemicals'>('personnel')

const types = [
  { key: 'personnel' as const, label: 'Personeller', icon: UserRound },
  { key: 'vehicles' as const, label: 'Araçlar', icon: Truck },
  { key: 'equipment' as const, label: 'Ekipmanlar', icon: Wrench },
  { key: 'chemicals' as const, label: 'Kimyasallar', icon: FlaskConical },
]

const data: Record<string, Asset[]> = {
  personnel: [
    { name: 'Ahmet Yılmaz', detail: 'Teknik Personel', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': true, 'Sağlık Raporu': true } },
    { name: 'Mehmet Kaya', detail: 'Teknik Personel', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': false, 'Sağlık Raporu': true } },
    { name: 'Burak Demir', detail: 'Usta', documents: { 'Kimlik': true, 'SGK': true, 'İSG Eğitimi': true, 'Sağlık Raporu': false } },
  ],
  vehicles: [
    { name: '34 ABC 123', detail: 'Servis Aracı', documents: { 'Ruhsat': true, 'Sigorta': true, 'Muayene': true, 'Kasko': false } },
    { name: '34 XYZ 456', detail: 'Kamyonet', documents: { 'Ruhsat': true, 'Sigorta': true, 'Muayene': false, 'Kasko': true } },
  ],
  equipment: [
    { name: 'Akülü Matkap', detail: 'Bosch GSB 18V', documents: { 'CE Belgesi': true, 'Periyodik Kontrol': true, 'Kalibrasyon': false } },
    { name: 'Forklift', detail: 'Toyota 8FG25', documents: { 'CE Belgesi': true, 'Periyodik Kontrol': true, 'Kalibrasyon': true } },
    { name: 'Kaynak Makinesi', detail: 'MIG/MAG', documents: { 'CE Belgesi': false, 'Periyodik Kontrol': true, 'Kalibrasyon': true } },
  ],
  chemicals: [
    { name: 'Endüstriyel Temizleyici', detail: '5 L', documents: { 'GBF / SDS': true, 'Etiket': true, 'Risk Değerlendirmesi': true } },
    { name: 'Yağ Çözücü', detail: '20 L', documents: { 'GBF / SDS': true, 'Etiket': false, 'Risk Değerlendirmesi': true } },
  ],
}

const activeItems = computed(() => data[activeType.value])
const documentNames = computed(() => [...new Set(activeItems.value.flatMap(item => Object.keys(item.documents)))])
</script>

<template>
  <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs">
    <div class="flex min-h-[520px] flex-col md:flex-row">
      <aside class="w-full shrink-0 border-b border-gray-100 bg-gray-50/50 p-3 md:w-52 md:border-b-0 md:border-r">
        <div class="px-3 py-2">
          <p class="text-xs font-semibold text-gray-900">Evrak Durumu</p>
          <p class="mt-1 text-[11px] text-gray-500">Varlık ve personel belgeleri</p>
        </div>
        <nav class="mt-3 space-y-1">
          <button v-for="type in types" :key="type.key" type="button" class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium transition-colors" :class="activeType===type.key?'bg-brand-50 text-brand-600':'text-gray-600 hover:bg-white hover:text-gray-900'" @click="activeType=type.key">
            <component :is="type.icon" :size="16" />
            {{ type.label }}
          </button>
        </nav>
      </aside>

      <div class="min-w-0 flex-1 p-6">
        <div class="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">{{ types.find(type => type.key === activeType)?.label }}</h2>
            <p class="mt-1 text-xs text-gray-500">Kayıtlı varlıkların evrak durumlarını kontrol edin.</p>
          </div>
          <div class="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
            <FileText :size="14" /> {{ activeItems.length }} kayıt
          </div>
        </div>

        <div class="overflow-x-auto rounded-xl border border-gray-100">
          <table class="w-full min-w-[760px] text-left">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
                <th class="px-4 py-3 font-medium">Kayıt</th>
                <th v-for="document in documentNames" :key="document" class="px-4 py-3 text-center font-medium">{{ document }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in activeItems" :key="item.name" class="border-b border-gray-100 last:border-0">
                <td class="px-4 py-4">
                  <p class="text-sm font-medium text-gray-800">{{ item.name }}</p>
                  <p class="mt-1 text-[11px] text-gray-400">{{ item.detail }}</p>
                </td>
                <td v-for="document in documentNames" :key="document" class="px-4 py-4 text-center">
                  <span v-if="item.documents[document]" class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-success-600" title="Tamam">
                    <Check :size="15" />
                  </span>
                  <span v-else class="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-error-50 text-error-500" title="Eksik">
                    <X :size="15" />
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4 flex items-center gap-4 text-[11px] text-gray-400">
          <span class="flex items-center gap-1.5"><span class="flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success-600"><Check :size="12" /></span> Tam</span>
          <span class="flex items-center gap-1.5"><span class="flex h-5 w-5 items-center justify-center rounded-full bg-error-50 text-error-500"><X :size="12" /></span> Eksik</span>
        </div>
      </div>
    </div>
  </section>
</template>