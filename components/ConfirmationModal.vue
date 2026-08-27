<script setup lang="ts">
import { AlertTriangle, X } from 'lucide-vue-next'

withDefaults(defineProps<{
  open: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}>(), {
  title: 'Emin misiniz?',
  message: 'Bu işlemi gerçekleştirmek istediğinize emin misiniz?',
  confirmText: 'Onayla',
  cancelText: 'Vazgeç',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: []
}>()

const close = () => emit('update:open', false)
const confirm = () => emit('confirm')
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[11000] flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-[2px]" @click.self="close">
        <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-start gap-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400">
              <AlertTriangle :size="21" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white/90">{{ title }}</h3>
              <p class="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ message }}</p>
            </div>
            <button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200" aria-label="Kapat" @click="close">
              <X :size="18" />
            </button>
          </div>
          <div class="mt-6 flex justify-end gap-3">
            <button type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]" @click="close">
              {{ cancelText }}
            </button>
            <button type="button" class="h-10 rounded-lg bg-error-600 px-4 text-sm font-semibold text-white transition hover:bg-error-700" @click="confirm">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity .15s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
