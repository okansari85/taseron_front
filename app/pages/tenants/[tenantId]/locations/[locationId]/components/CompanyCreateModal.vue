<script setup lang="ts">
import { Check, ChevronDown, X } from 'lucide-vue-next'

type CompanyOption = { id?: number; name: string; logo: string; group: string; businessEntityId?: number }
type OperationalArea = { id: number; name: string }

const props = defineProps<{
  modelValue: boolean
  groups: string[]
  companies: CompanyOption[]
  areas: OperationalArea[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: { group: string; company: string; companyId?: number; area: string; areaId?: number; nace: string; dangerClass: string; sgk: string }]
}>()

const selectedGroup = ref('')
const selectedCompany = ref('')
const selectedArea = ref('')
const nace = ref('')
const dangerClass = ref('')
const sgk = ref('')

const filteredCompanies = computed(() => selectedGroup.value ? props.companies.filter(item => item.group === selectedGroup.value) : [])
const selectedCompanyOption = computed(() => filteredCompanies.value.find(item => item.name === selectedCompany.value))
const selectedAreaOption = computed(() => props.areas.find(item => item.name === selectedArea.value))

const reset = () => {
  selectedGroup.value = ''
  selectedCompany.value = ''
  selectedArea.value = ''
  nace.value = ''
  dangerClass.value = ''
  sgk.value = ''
}

watch(() => props.modelValue, value => { if (value) reset() })
watch(selectedGroup, () => { selectedCompany.value = '' })

const close = () => emit('update:modelValue', false)
const save = () => {
  if (!selectedGroup.value || !selectedCompany.value || !nace.value || !dangerClass.value || !sgk.value) return
  emit('save', { group: selectedGroup.value, company: selectedCompany.value, companyId: selectedCompanyOption.value?.id, area: selectedArea.value, areaId: selectedAreaOption.value?.id, nace: nace.value, dangerClass: dangerClass.value, sgk: sgk.value })
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[2px]">
    <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800">
        <div><h2 class="text-base font-semibold text-gray-900 dark:text-white/90">Firma Ekle</h2><p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Firmayı bu lokasyon ve operasyonel alan ile ilişkilendirin.</p></div>
        <button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" @click="close"><X :size="18" /></button>
      </div>
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Grup</span><div class="relative"><select v-model="selectedGroup" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Grup seçiniz</option><option v-for="group in groups" :key="group" :value="group">{{ group }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Firma</span><div class="relative"><select v-model="selectedCompany" :disabled="!selectedGroup" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none disabled:cursor-not-allowed disabled:bg-gray-50 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Firma seçiniz</option><option v-for="item in filteredCompanies" :key="item.name" :value="item.name">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Operasyonel Alan <span class="font-normal text-gray-400">(opsiyonel)</span></span><div class="relative"><select v-model="selectedArea" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Operasyonel alan seçiniz</option><option value="Tüm Tesis">Tüm Tesis</option><option v-for="item in areas" :key="item.id" :value="item.name">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">SGK Sicil No</span><input v-model="sgk" type="text" placeholder="SGK sicil numarası" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" /></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">NACE Kodu</span><input v-model="nace" type="text" placeholder="Örn. 27.51.01" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" /></label>
        <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tehlike Sınıfı</span><div class="relative"><select v-model="dangerClass" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tehlike sınıfı seçiniz</option><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
      </div>
      <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800"><button type="button" class="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="close">Vazgeç</button><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600" :class="(!selectedGroup || !selectedCompany || !nace || !dangerClass || !sgk) && 'cursor-not-allowed opacity-50'" :disabled="!selectedGroup || !selectedCompany || !nace || !dangerClass || !sgk" @click="save"><Check :size="15" /> Kaydet</button></div>
    </div>
  </div>
</template>
