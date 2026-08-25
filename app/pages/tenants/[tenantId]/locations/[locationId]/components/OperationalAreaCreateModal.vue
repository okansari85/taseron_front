<script setup lang="ts">
import { Check, X } from 'lucide-vue-next'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; save: [name: string] }>()
const name = ref('')
watch(() => props.modelValue, value => { if (value) name.value = '' })
const close = () => emit('update:modelValue', false)
const save = () => { const value = name.value.trim(); if (value) emit('save', value) }
</script>

<template>
  <div v-if="modelValue" class="fixed inset-0 z-[1000] flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-[2px]">
    <div class="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div class="flex items-center justify-between border-b border-gray-200 px-5 py-4 dark:border-gray-800"><div><h2 class="text-base font-semibold text-gray-900 dark:text-white/90">Operasyonel Alan Ekle</h2><p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Yeni operasyonel alanı tanımlayın.</p></div><button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5" @click="close"><X :size="18" /></button></div>
      <div class="p-5"><label><span class="mb-1.5 block text-xs font-semibold text-gray-700 dark:text-gray-300">Operasyonel Alan</span><input v-model="name" type="text" placeholder="Operasyonel alan adı" class="h-11 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-950 dark:text-white/90" /></label></div>
      <div class="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-800"><button type="button" class="h-10 rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300" @click="close">Vazgeç</button><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white hover:bg-brand-600" :class="!name.trim() && 'cursor-not-allowed opacity-50'" :disabled="!name.trim()" @click="save"><Check :size="15" /> Kaydet</button></div>
    </div>
  </div>
</template>
