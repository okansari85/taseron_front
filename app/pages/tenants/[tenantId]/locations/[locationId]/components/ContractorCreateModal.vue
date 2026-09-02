<script setup lang="ts">
import { Check, ChevronDown, X } from 'lucide-vue-next'

type ContractorOption = { businessEntityId: number; name: string; logo: string }
type OperationalArea = { id: number; name: string }
type ContractorFormValue = { businessEntityId: number; areaId: number|null; activity: string; subActivity: string; nace: string; dangerClass: string; sgk: string }

const props = defineProps<{
  modelValue: boolean
  contractors: ContractorOption[]
  areas: OperationalArea[]
  editValue?: ContractorFormValue | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: ContractorFormValue]
}>()

const selectedContractor = ref('')
const contractorArea = ref('')
const contractorActivity = ref('')
const contractorSubActivity = ref('')
const contractorNace = ref('')
const contractorDangerClass = ref('')
const contractorSgk = ref('')

const reset = () => {
  selectedContractor.value = ''
  contractorArea.value = ''
  contractorActivity.value = ''
  contractorSubActivity.value = ''
  contractorNace.value = ''
  contractorDangerClass.value = ''
  contractorSgk.value = ''
}

const fillEditValue = (value: ContractorFormValue | null | undefined) => {
  if (!value) {
    reset()
    return
  }
  selectedContractor.value = String(value.businessEntityId)
  contractorArea.value = value.areaId ? String(value.areaId) : ''
  contractorActivity.value = value.activity || ''
  contractorSubActivity.value = value.subActivity || ''
  contractorNace.value = value.nace || ''
  contractorDangerClass.value = value.dangerClass || ''
  contractorSgk.value = value.sgk || ''
}

watch(() => props.modelValue, value => {
  if (value) fillEditValue(props.editValue)
})
watch(() => props.editValue, value => {
  if (props.modelValue) fillEditValue(value)
})

const close = () => emit('update:modelValue', false)
const save = () => {
  const contractor = props.contractors.find(item => String(item.businessEntityId) === String(selectedContractor.value))
  const editContractor = props.editValue?.businessEntityId === Number(selectedContractor.value)
  if ((!contractor && !editContractor) || !contractorDangerClass.value) return
  emit('save', {
    businessEntityId: Number(selectedContractor.value),
    areaId: contractorArea.value ? Number(contractorArea.value) : null,
    activity: contractorActivity.value,
    subActivity: contractorSubActivity.value,
    nace: contractorNace.value,
    dangerClass: contractorDangerClass.value,
    sgk: contractorSgk.value,
  })
}
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[2px]">
    <div class="w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800"><div><h2 class="text-base font-semibold text-gray-900 dark:text-white/90">{{ editValue ? 'Alt Yüklenici Düzenle' : 'Alt Yüklenici Ekle' }}</h2><p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Daimi taşeron firmayı bu lokasyon ile ilişkilendirin.</p></div><button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" @click="close"><X :size="18" /></button></div>
      <div class="grid gap-4 p-5 sm:grid-cols-2">
        <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Daimi Taşeron Firma</span><div class="relative"><select v-model="selectedContractor" :disabled="!!editValue" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90 dark:disabled:bg-white/5"><option value="">Firma seçiniz</option><option v-if="editValue" :value="editValue.businessEntityId">{{ editValue.businessEntityId }}</option><option v-for="item in contractors" :key="item.businessEntityId" :value="item.businessEntityId">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Operasyonel Alan <span class="font-normal text-gray-400">(opsiyonel)</span></span><div class="relative"><select v-model="contractorArea" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Operasyonel alan seçiniz</option><option value="">Tüm Tesis</option><option v-for="item in areas" :key="item.id" :value="item.id">{{ item.name }}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Faaliyet <span class="font-normal text-gray-400">(opsiyonel)</span></span><input v-model="contractorActivity" type="text" placeholder="Faaliyet" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" /></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Alt Faaliyet <span class="font-normal text-gray-400">(opsiyonel)</span></span><input v-model="contractorSubActivity" type="text" placeholder="Alt faaliyet" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" /></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">SGK Sicil No <span class="font-normal text-gray-400">(opsiyonel)</span></span><input v-model="contractorSgk" type="text" placeholder="SGK sicil numarası" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" /></label>
        <label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">NACE Kodu <span class="font-normal text-gray-400">(opsiyonel)</span></span><input v-model="contractorNace" type="text" placeholder="Örn. 81.21.01" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:text-white/90" /></label>
        <label class="sm:col-span-2"><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Tehlike Sınıfı</span><div class="relative"><select v-model="contractorDangerClass" class="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 pr-9 text-sm text-gray-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90"><option value="">Tehlike sınıfı seçiniz</option><option>Az Tehlikeli</option><option>Tehlikeli</option><option>Çok Tehlikeli</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></label>
      </div>
      <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800"><button type="button" class="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="close">Vazgeç</button><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600" :class="(!selectedContractor || !contractorDangerClass) && 'cursor-not-allowed opacity-50'" :disabled="!selectedContractor || !contractorDangerClass" @click="save"><Check :size="15" /> Kaydet</button></div>
    </div>
  </div>
</template>
