<script setup lang="ts">
import { LoaderCircle, Search, UserRound, X } from 'lucide-vue-next'
import { userAuthorizationApi } from '~/api/user-authorization'

const props = defineProps<{ modelValue: boolean; entityId: number | null; entityLabel?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { $toast } = useNuxtApp()

const experts = ref<{ id: number; name: string }[]>([])
const assignedUserIds = ref<number[]>([])
const loading = ref(false)
const updatingId = ref<number | null>(null)
const error = ref('')
const search = ref('')

const close = () => emit('update:modelValue', false)

const expertInitials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0).toLocaleUpperCase('tr-TR')).join('')

const filteredExperts = computed(() => {
  const t = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!t) return experts.value
  return experts.value.filter(expert => expert.name.toLocaleLowerCase('tr-TR').includes(t))
})

const load = async () => {
  if (props.entityId === null) return
  loading.value = true
  error.value = ''
  search.value = ''
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
    <div v-if="modelValue" class="fixed inset-0 z-[11000]">
      <button class="absolute inset-0 h-full w-full bg-slate-950/35" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
              <UserRound :size="20" />
            </div>
            <div class="min-w-0">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white/90">Uzman Ata</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ entityLabel || 'Bu kayıt' }} için sorumlu İSG uzmanlarını seçin.</p>
            </div>
          </div>
          <button type="button" class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-gray-200" aria-label="Kapat" @click="close">
            <X :size="20" />
          </button>
        </div>

        <div class="border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div class="relative">
            <Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input v-model="search" type="search" placeholder="Uzman ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none dark:border-gray-700 dark:bg-gray-900" />
          </div>
          <div class="mt-3 flex items-center justify-between text-xs text-gray-400">
            <span>{{ filteredExperts.length }} / {{ experts.length }} uzman</span>
            <span class="font-medium text-brand-600">{{ assignedUserIds.length }} atanmış</span>
          </div>
        </div>

        <div class="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          <div v-if="loading" class="py-12 text-center text-sm text-gray-500">Yükleniyor...</div>
          <div v-else-if="error" class="mx-3 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-600">{{ error }}</div>
          <template v-else>
            <label v-for="expert in filteredExperts" :key="expert.id" class="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 transition" :class="updatingId===expert.id ? 'opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5'">
              <span class="flex min-w-0 items-center gap-3">
                <input :checked="assignedUserIds.includes(expert.id)" type="checkbox" :disabled="updatingId!==null" class="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-600" @change="toggleExpert(expert)" />
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{{ expertInitials(expert.name) }}</span>
                <span class="truncate text-sm text-gray-700 dark:text-gray-300">{{ expert.name }}</span>
              </span>
              <LoaderCircle v-if="updatingId===expert.id" :size="14" class="animate-spin text-brand-500" />
            </label>
            <div v-if="!filteredExperts.length" class="px-3 py-12 text-center text-xs text-gray-400">
              {{ experts.length ? 'Aramayla eşleşen uzman bulunamadı.' : 'Tenant içinde İSG rolüne sahip kullanıcı bulunamadı.' }}
            </div>
          </template>
        </div>

        <div class="flex justify-end border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button type="button" class="h-10 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.05]" @click="close">
            Kapat
          </button>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
