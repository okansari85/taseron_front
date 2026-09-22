<script setup lang="ts">
import { X } from '@lucide/vue'
import type { FireSuppressionCategory } from '~/types/fire-suppression-inventory'
const props = defineProps<{
  show: boolean
  adding: boolean
  newCategory: FireSuppressionCategory
  newName: string
  newCode: string
  enabledCategories: FireSuppressionCategory[]
  categoryLabel: (category: string) => string
  primaryColor: string
}>()
const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit'): void
  (e: 'update:newCategory', value: FireSuppressionCategory): void
  (e: 'update:newName', value: string): void
  (e: 'update:newCode', value: string): void
}>()
const newCategoryModel = computed({ get: () => props.newCategory, set: value => emit('update:newCategory', value) })
const newNameModel = computed({ get: () => props.newName, set: value => emit('update:newName', value) })
const newCodeModel = computed({ get: () => props.newCode, set: value => emit('update:newCode', value) })
</script>
<template>
  <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" @click.self="$emit('close')"><div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900"><div class="flex items-center justify-between"><div><h3 class="text-base font-bold text-[#14284f] dark:text-white">Sistem Ekle</h3><p class="mt-1 text-xs text-slate-400">Yangın tesisatı envanterine yeni bir bileşen ekleyin.</p></div><button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100" @click="$emit('close')"><X :size="18"/></button></div><div class="mt-5 space-y-4"><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Sistem</span><select v-model="newCategoryModel" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option v-for="category in enabledCategories" :key="category" :value="category">{{categoryLabel(category)}}</option></select></label><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Ad / Açıklama</span><input v-model="newNameModel" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Örn. Yangın Dolabı 01"/></label><label class="block"><span class="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-300">Kod</span><input v-model="newCodeModel" class="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Opsiyonel"/></label></div><div class="mt-6 flex justify-end gap-2"><button class="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600" @click="$emit('close')">Vazgeç</button><button class="rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50" :style="{backgroundColor:primaryColor}" :disabled="adding" @click="$emit('submit')">{{adding?'Ekleniyor...':'Sistemi Ekle'}}</button></div></div></div>
</template>
