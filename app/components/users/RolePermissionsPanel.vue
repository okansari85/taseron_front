<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Check, LoaderCircle, LockKeyhole, ShieldCheck } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizationPermission, type AuthorizationRole } from '~/api/user-authorization'

const roles = ref<AuthorizationRole[]>([])
const permissions = ref<AuthorizationPermission[]>([])
const selectedRole = ref('')
const selectedPermissions = ref<string[]>([])
const activeTab = ref<'roles' | 'permissions'>('roles')
const loading = ref(true)
const saving = ref(false)
const { $toast } = useNuxtApp()

const permissionGroups = computed(() => {
  const groups: Record<string, AuthorizationPermission[]> = { 'Kullanıcı Yönetimi': [], Organizasyon: [], Lokasyon: [], Taşeron: [], 'Saha ve Evrak': [], Raporlama: [] }
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
const selectedRoleData = computed(() => roles.value.find(role => role.name === selectedRole.value))
const selectRole = (name: string) => { selectedRole.value = name; selectedPermissions.value = roles.value.find(role => role.name === name)?.permissions?.map(permission => permission.name) ?? [] }
const togglePermission = (name: string) => { selectedPermissions.value = selectedPermissions.value.includes(name) ? selectedPermissions.value.filter(item => item !== name) : [...selectedPermissions.value, name] }
const save = async () => {
  if (!selectedRole.value || saving.value || selectedRole.value === 'super-admin') return
  saving.value = true
  try {
    const updated = await userAuthorizationApi.syncRolePermissions(selectedRole.value, selectedPermissions.value)
    const index = roles.value.findIndex(role => role.name === selectedRole.value)
    if (index >= 0) roles.value[index] = updated
    selectedPermissions.value = updated.permissions?.map(permission => permission.name) ?? selectedPermissions.value
    $toast.success('Rol yetkileri kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Rol yetkileri kaydedilemedi.')
  } finally { saving.value = false }
}
const load = async () => {
  loading.value = true
  try {
    const [roleList, permissionList] = await Promise.all([userAuthorizationApi.listRoles(), userAuthorizationApi.listPermissions()])
    roles.value = roleList.filter(role => role.name !== 'super-admin')
    permissions.value = permissionList
    if (roles.value.length) selectRole(roles.value[0].name)
  } catch (error) {
    console.error(error)
    $toast.error('Rol ve yetki bilgileri alınamadı.')
  } finally { loading.value = false }
}
onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <div><h1 class="text-xl font-semibold text-gray-900 dark:text-white">Roller ve Yetkiler</h1><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Rollerin sahip olduğu yetkileri yönetin.</p></div>
    <div class="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
      <button type="button" class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium" :class="activeTab === 'roles' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50'" @click="activeTab = 'roles'"><ShieldCheck :size="15" />Roller</button>
      <button type="button" class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium" :class="activeTab === 'permissions' ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50'" @click="activeTab = 'permissions'"><LockKeyhole :size="15" />Yetkiler</button>
    </div>
    <div v-if="loading" class="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><LoaderCircle :size="28" class="animate-spin text-brand-500" /></div>
    <template v-else-if="activeTab === 'roles'">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <button v-for="role in roles" :key="role.id" type="button" class="rounded-xl border p-5 text-left transition" :class="selectedRole === role.name ? 'border-brand-300 bg-brand-50/40 dark:border-brand-700 dark:bg-brand-500/5' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'" @click="selectRole(role.name)">
          <div class="flex items-start justify-between gap-3"><div><div class="flex items-center gap-2"><ShieldCheck :size="17" class="text-brand-600" /><h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ role.name }}</h3></div><p class="mt-2 text-xs text-gray-500 dark:text-gray-400">{{ role.permissions?.length ?? 0 }} yetki tanımlı.</p></div><span class="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-500 dark:bg-gray-800">{{ role.guard_name ?? 'web' }}</span></div>
        </button>
      </div>
      <div v-if="selectedRoleData" class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
        <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ selectedRoleData.name }} yetkileri</h2><p class="mt-1 text-xs text-gray-500">Bu rol için izinleri seçin.</p></div><button type="button" :disabled="saving" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60" @click="save"><LoaderCircle v-if="saving" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ saving ? 'Kaydediliyor...' : 'Kaydet' }}</button></div>
        <div class="mt-5 space-y-4"><div v-for="[group, items] in permissionGroups" :key="group"><h3 class="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">{{ group }}</h3><div class="divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-gray-800 dark:border-gray-800"><label v-for="permission in items" :key="permission.id" class="flex cursor-pointer items-center justify-between px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60"><span class="text-xs text-gray-700 dark:text-gray-200">{{ permission.name }}</span><input :checked="selectedPermissions.includes(permission.name)" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="togglePermission(permission.name)" /></label></div></div></div>
      </div>
    </template>
    <template v-else>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2"><div v-for="[group, items] in permissionGroups" :key="group" class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><div class="flex items-center justify-between"><h2 class="text-sm font-semibold text-gray-900 dark:text-white">{{ group }}</h2><span class="text-[10px] text-gray-400">{{ items.length }} yetki</span></div><div class="mt-4 space-y-2"><div v-for="permission in items" :key="permission.id" class="rounded-lg border border-gray-100 px-3 py-2.5 text-xs text-gray-600 dark:border-gray-800 dark:text-gray-300">{{ permission.name }}</div></div></div></div>
    </template>
  </section>
</template>
