<script setup lang="ts">
import { LoaderCircle, UserRound, X } from 'lucide-vue-next'
import { userAuthorizationApi } from '~/api/user-authorization'

const props = defineProps<{ modelValue: boolean; entityId: number | null; entityLabel?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { $toast } = useNuxtApp()

const experts = ref<{ id: number; name: string }[]>([])
const assignedUserIds = ref<number[]>([])
const loading = ref(false)
const updatingId = ref<number | null>(null)
const error = ref('')

const close = () => emit('update:modelValue', false)

const load = async () => {
  if (props.entityId === null) return
  loading.value = true
  error.value = ''
  try {
    const [users, currentExperts] = await Promise.all([
      userAuthorizationApi.listUsers(),
      userAuthorizationApi.listExpertsForEntity(props.entityId),
    ])
    experts.value = users
      .filter(user => user.roles?.some(role => role.name === 'isg'))
      .map(user => ({ id: user.id, name: user.name }))
    assignedUserIds.value = currentExperts.map(item => item.user_id)
  } catch (e) {
    console.error(e)
    error.value = 'Uzman listesi alınamadı.'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, value => { if (value) load() })

const toggleExpert = async (expert: { id: number; name: string }) => {
  if (props.entityId === null || updatingId.value !== null) return
  const isAssigned = assignedUserIds.value.includes(expert.id)
  updatingId.value = expert.id
  try {
    if (isAssigned) {
      await userAuthorizationApi.detachLocationExpert(props.entityId, expert.id)
      assignedUserIds.value = assignedUserIds.value.filter(id => id !== expert.id)
      $toast.success(`${expert.name} ataması kaldırıldı.`)
    } else {
      await userAuthorizationApi.attachLocationExpert(props.entityId, expert.id)
      assignedUserIds.value = [...assignedUserIds.value, expert.id]
      $toast.success(`${expert.name} uzman olarak atandı.`)
    }
  } catch (e) {
    console.error(e)
    $toast.error('Atama güncellenemedi.')
  } finally {
    updatingId.value = null
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="modelValue" class="fixed inset-0 z-[11000] flex items-center justify-center bg-gray-900/50 px-4 backdrop-blur-[2px]" @click.self="close">
        <div class="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          <div class="flex items-start gap-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
              <UserRound :size="20" />
            </div>
            <div class="min-w-0 flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white/90">Uzman Ata</h3>
              <p class="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400">{{ entityLabel || 'Bu kayıt' }} için sorumlu İSG uzmanlarını seçin. Seçim anında kaydedilir.</p>
            </div>
            <button type="button" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200" aria-label="Kapat" @click="close">
              <X :size="18" />
            </button>
          </div>

          <div class="mt-5">
            <div v-if="loading" class="py-8 text-center text-sm text-gray-500">Yükleniyor...</div>
            <div v-else-if="error" class="rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ error }}</div>
            <div v-else class="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2">
              <label v-for="expert in experts" :key="expert.id" class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition" :class="updatingId===expert.id ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50'">
                <span class="flex items-center gap-3">
                  <input :checked="assignedUserIds.includes(expert.id)" type="checkbox" :disabled="updatingId!==null" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="toggleExpert(expert)" />
                  <span class="text-sm text-gray-700">{{ expert.name }}</span>
                </span>
                <LoaderCircle v-if="updatingId===expert.id" :size="14" class="animate-spin text-brand-500" />
              </label>
              <div v-if="!experts.length" class="px-3 py-8 text-center text-xs text-gray-400">Tenant içinde İSG rolüne sahip kullanıcı bulunamadı.</div>
            </div>
          </div>

          <div class="mt-6 flex justify-end">
            <button type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]" @click="close">
              Kapat
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
