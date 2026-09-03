<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, LoaderCircle, LockKeyhole } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizationPermission } from '~/api/user-authorization'

const props = defineProps<{ userId: number; disabled?: boolean }>()
const emit = defineEmits<{ saved: [permissions: string[]] }>()
const { $toast } = useNuxtApp()

const permissions = ref<AuthorizationPermission[]>([])
const selected = ref<string[]>([])
const loading = ref(true)
const saving = ref(false)

const permissionGroups = computed(() => {
  const groups: Record<string, AuthorizationPermission[]> = {
    'Kullanıcı Yönetimi': [],
    Organizasyon: [],
    Lokasyon: [],
    Taşeron: [],
    'Saha ve Evrak': [],
    Raporlama: [],
  }

  for (const permission of permissions.value) {
    const key = permission.name
    if (key.startsWith('users.') || key.startsWith('roles.')) groups['Kullanıcı Yönetimi'].push(permission)
    else if (key.startsWith('organizations.')) groups.Organizasyon.push(permission)
    else if (key.startsWith('locations.')) groups.Lokasyon.push(permission)
    else if (key.startsWith('contractor') || key.startsWith('personnel.') || key.startsWith('assets.')) groups.Taşeron.push(permission)
    else if (key.startsWith('visits.') || key.startsWith('documents.') || key.startsWith('findings.')) groups['Saha ve Evrak'].push(permission)
    else if (key.startsWith('reports.')) groups.Raporlama.push(permission)
  }

  return Object.entries(groups).filter(([, items]) => items.length)
})

const toggle = (name: string) => {
  selected.value = selected.value.includes(name)
    ? selected.value.filter(item => item !== name)
    : [...selected.value, name]
}

const load = async () => {
  loading.value = true
  try {
    const [permissionList, user] = await Promise.all([
      userAuthorizationApi.listPermissions(),
      userAuthorizationApi.getUser(props.userId),
    ])
    permissions.value = permissionList
    selected.value = user.permissions?.map(permission => permission.name) ?? []
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı yetkileri alınamadı.')
  } finally {
    loading.value = false
  }
}

const save = async () => {
  if (props.disabled || saving.value || loading.value) return

  saving.value = true
  try {
    const updated = await userAuthorizationApi.syncPermissions(props.userId, selected.value)
    selected.value = updated.permissions?.map(permission => permission.name) ?? selected.value
    emit('saved', selected.value)
    $toast.success('Kullanıcı yetkileri kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı yetkileri kaydedilemedi.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2">
        <LockKeyhole :size="16" class="text-brand-600" />
        <div>
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Kullanıcı Yetkileri</h2>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Bu kullanıcıya özel izinleri rolünden bağımsız olarak düzenleyin.</p>
        </div>
      </div>
      <span class="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{{ selected.length }} yetki</span>
    </div>

    <div v-if="loading" class="flex min-h-[300px] items-center justify-center">
      <LoaderCircle :size="26" class="animate-spin text-brand-500" />
    </div>

    <template v-else>
      <div class="mt-5 space-y-4">
        <div v-for="[group, items] in permissionGroups" :key="group">
          <h3 class="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">{{ group }}</h3>
          <div class="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800">
            <label v-for="permission in items" :key="permission.id" class="flex cursor-pointer items-center justify-between px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60">
              <div>
                <span class="block text-xs font-medium text-gray-700 dark:text-gray-200">{{ permission.name }}</span>
                <span class="text-[10px] text-gray-400">{{ permission.guard_name ?? 'web' }}</span>
              </div>
              <input :checked="selected.includes(permission.name)" :disabled="disabled" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="toggle(permission.name)" />
            </label>
          </div>
        </div>
      </div>

      <div class="mt-5 flex justify-end">
        <button type="button" :disabled="disabled || saving" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60" @click="save">
          <LoaderCircle v-if="saving" :size="14" class="animate-spin" />
          <Check v-else :size="14" />
          {{ saving ? 'Kaydediliyor...' : 'Yetkileri Kaydet' }}
        </button>
      </div>
    </template>
  </div>
</template>
