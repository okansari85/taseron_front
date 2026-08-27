<script setup lang="ts">
import { Save, X } from 'lucide-vue-next'

type GroupForm = {
  name: string
  slug: string
  code: string
  description: string
  display_order: number
  is_active: boolean
  parent_id: number | null
  color: string
}

const props = withDefaults(defineProps<{
  open: boolean
  form: GroupForm
  parentGroups?: Array<{ id: number; name: string }>
  saving?: boolean
  rootOrganizationName?: string | null
}>(), {
  parentGroups: () => [],
  saving: false,
  rootOrganizationName: null,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: []
}>()

const colorOptions = [
  '#465FFF',
  '#12B76A',
  '#F79009',
  '#F04438',
  '#EE46BC',
  '#475467',
]

const close = () => emit('update:open', false)
</script>

<template>
  <Transition name="drawer">
    <div v-if="props.open" class="fixed inset-0 z-[9999]">
      <button type="button" aria-label="Düzenleme panelini kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Grup Düzenle</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Grup bilgilerini güncelleyin.</p></div>
          <button type="button" class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5" aria-label="Kapat" @click="close"><X :size="21" /></button>
        </div>
        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="emit('save')">
          <div class="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Grup Adı <span class="text-error-500">*</span></label><input v-model="props.form.name" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Slug <span class="text-error-500">*</span></label><input v-model="props.form.slug" required class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Grup Kodu</label><input v-model="props.form.code" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Ebeveyn Grup</label><select v-model="props.form.parent_id" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option :value="null">{{ props.rootOrganizationName || 'En üst seviye' }}</option><option v-for="parent in props.parentGroups" :key="parent.id" :value="parent.id">{{ parent.name }}</option></select></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label><textarea v-model="props.form.description" rows="3" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Sıra</label><input v-model.number="props.form.display_order" type="number" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /></div>
            <div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Görünüm</label><div class="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p class="text-sm font-medium text-gray-700 dark:text-gray-300">İkon Rengi</p><div class="mt-3 flex items-center gap-3"><button v-for="color in colorOptions" :key="color" type="button" class="flex h-7 w-7 items-center justify-center rounded-full transition" :class="props.form.color === color ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-950' : ''" :style="{ backgroundColor: color }" :aria-label="`İkon rengi ${color}`" @click="props.form.color = color"><span v-if="props.form.color === color" class="h-1.5 w-1.5 rounded-full bg-white" /></button></div><p class="mt-2 text-xs text-gray-400">Listelerde ve hiyerarşide kullanılacak vurgu rengi.</p></div></div>
            <label class="flex items-center gap-3"><input v-model="props.form.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" /><span class="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif</span></label>
          </div>
          <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800"><button type="button" class="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-200 px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="close">İptal</button><button type="submit" :disabled="props.saving" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"><Save :size="16" />{{ props.saving ? 'Kaydediliyor...' : 'Kaydet' }}</button></div>
        </form>
      </aside>
    </div>
  </Transition>
</template>
<style scoped>.drawer-enter-active,.drawer-leave-active{transition:opacity .2s ease}.drawer-enter-from,.drawer-leave-to{opacity:0}</style>
