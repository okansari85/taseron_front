<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Search, ShieldCheck, UserRound, MoreHorizontal, LockKeyhole, LoaderCircle, Check } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizedUser, type AuthorizationPermission, type AuthorizationRole } from '~/api/user-authorization'
import UserCreateButton from './UserCreateButton.vue'

type UserStatus = 'Aktif' | 'Pasif'
type User = AuthorizedUser & { role: string; scope: string; status: UserStatus; initials: string }
type PermissionGroup = { name: string; items: Array<[string, string]> }

const users = ref<User[]>([])
const roles = ref<AuthorizationRole[]>([])
const permissions = ref<AuthorizationPermission[]>([])
const search = ref('')
const activeView = ref<'users' | 'roles' | 'permissions'>('users')
const selectedRole = ref('')
const selectedPermissions = ref<string[]>([])
const selectedUser = ref<User | null>(null)
const showUserForm = ref(false)
const userRole = ref('')
const userPermissions = ref<string[]>([])
const loading = ref(true)
const loadingUser = ref(false)
const savingRole = ref(false)
const savingPermissions = ref(false)
const { $toast } = useNuxtApp()
const router = useRouter()
const route = useRoute()

const roleMap = computed(() => new Map(roles.value.map(role => [role.name, role])))
const permissionGroups = computed<PermissionGroup[]>(() => {
  const groups: Record<string, PermissionGroup> = {
    'Kullanıcı Yönetimi': { name: 'Kullanıcı Yönetimi', items: [] },
    Organizasyon: { name: 'Organizasyon', items: [] },
    Lokasyon: { name: 'Lokasyon', items: [] },
    Taşeron: { name: 'Taşeron', items: [] },
    'Saha ve Evrak': { name: 'Saha ve Evrak', items: [] },
    Raporlama: { name: 'Raporlama', items: [] },
  }
  for (const permission of permissions.value) {
    const key = permission.name
    const item: [string, string] = [key, key]
    if (key.startsWith('users.') || key.startsWith('roles.')) groups['Kullanıcı Yönetimi'].items.push(item)
    else if (key.startsWith('organizations.')) groups.Organizasyon.items.push(item)
    else if (key.startsWith('locations.')) groups.Lokasyon.items.push(item)
    else if (key.startsWith('contractor') || key.startsWith('personnel.') || key.startsWith('assets.')) groups.Taşeron.items.push(item)
    else if (key.startsWith('visits.') || key.startsWith('documents.') || key.startsWith('findings.')) groups['Saha ve Evrak'].items.push(item)
    else if (key.startsWith('reports.')) groups.Raporlama.items.push(item)
  }
  return Object.values(groups).filter(group => group.items.length)
})

const roleName = (user: AuthorizedUser) => user.roles?.[0]?.name ?? '-'
const roleLabel = (user: AuthorizedUser) => roleMap.value.get(roleName(user))?.name ?? roleName(user)
const scopeLabel = (user: AuthorizedUser) => {
  const scopes = user.scopes ?? []
  if (!scopes.length) return 'Tanımlanmamış'
  if (scopes.some(scope => scope.scope_type === 'tenant')) return 'Tüm tenant'
  return scopes.map(scope => `${scope.scope_type} #${scope.scope_id}`).join(', ')
}
const mapUser = (user: AuthorizedUser): User => ({
  ...user,
  role: roleName(user),
  scope: scopeLabel(user),
  status: user.status === false || user.status === 0 || user.status === '0' || user.status === 'pasif' || user.status === 'Pasif' ? 'Pasif' : 'Aktif',
  initials: user.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(value => value.charAt(0).toLocaleUpperCase('tr-TR')).join(''),
})
const filteredUsers = computed(() => {
  const query = search.value.toLocaleLowerCase('tr-TR').trim()
  return users.value.filter(user => !query || `${user.name} ${user.email} ${user.role} ${user.scope}`.toLocaleLowerCase('tr-TR').includes(query))
})
const selectedRoleData = computed(() => roles.value.find(role => role.name === selectedRole.value) ?? roles.value[0])
const selectRole = (name: string) => {
  selectedRole.value = name
  selectedPermissions.value = [...(roles.value.find(role => role.name === name)?.permissions?.map(permission => permission.name) ?? [])]
}
const togglePermission = (key: string) => {
  selectedPermissions.value = selectedPermissions.value.includes(key) ? selectedPermissions.value.filter(permission => permission !== key) : [...selectedPermissions.value, key]
}
const openUserDetail = (user: User) => router.push(`/tenants/${route.params.tenantId}/users/${user.id}`)
const loadAuthorization = async () => {
  loading.value = true
  try {
    const [userList, roleList, permissionList] = await Promise.all([userAuthorizationApi.listUsers(), userAuthorizationApi.listRoles(), userAuthorizationApi.listPermissions()])
    users.value = userList.map(mapUser)
    roles.value = roleList
    permissions.value = permissionList
    if (roleList.length) selectRole(selectedRole.value && roleList.some(role => role.name === selectedRole.value) ? selectedRole.value : roleList[0].name)
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı ve yetki bilgileri alınamadı.')
  } finally {
    loading.value = false
  }
}
const saveRolePermissions = async () => {
  if (!selectedRole.value || savingPermissions.value) return
  savingPermissions.value = true
  try {
    const updated = await userAuthorizationApi.syncRolePermissions(selectedRole.value, selectedPermissions.value)
    const index = roles.value.findIndex(role => role.name === selectedRole.value)
    if (index >= 0) roles.value[index] = updated
    selectedPermissions.value = updated.permissions?.map(permission => permission.name) ?? selectedPermissions.value
    $toast.success('Rol yetkileri kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Rol yetkileri kaydedilemedi.')
  } finally {
    savingPermissions.value = false
  }
}
const openUserAuthorization = async (user: User) => {
  if (loadingUser.value || savingRole.value) return
  selectedUser.value = user
  userRole.value = user.roles?.[0]?.name ?? ''
  userPermissions.value = user.permissions?.map(permission => permission.name) ?? []
  showUserForm.value = true
  loadingUser.value = true
  try {
    const fresh = await userAuthorizationApi.getUser(user.id)
    selectedUser.value = mapUser(fresh)
    userRole.value = fresh.roles?.[0]?.name ?? ''
    userPermissions.value = fresh.permissions?.map(permission => permission.name) ?? []
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı yetkileri alınamadı.')
  } finally {
    loadingUser.value = false
  }
}
const saveUserAuthorization = async () => {
  if (!selectedUser.value || savingRole.value || loadingUser.value) return
  savingRole.value = true
  try {
    if (userRole.value) await userAuthorizationApi.assignRole(selectedUser.value.id, userRole.value)
    const updated = await userAuthorizationApi.syncPermissions(selectedUser.value.id, userPermissions.value)
    const index = users.value.findIndex(user => user.id === selectedUser.value?.id)
    if (index >= 0) users.value[index] = mapUser(updated)
    $toast.success('Kullanıcı yetkileri kaydedildi.')
    showUserForm.value = false
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı yetkileri kaydedilemedi.')
  } finally {
    savingRole.value = false
  }
}
const closeUserAuthorization = () => {
  if (!savingRole.value) {
    showUserForm.value = false
    selectedUser.value = null
  }
}
onMounted(loadAuthorization)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-900">Kullanıcılar</h1>
        <p class="mt-1 text-sm text-gray-500">Kullanıcı, rol ve erişim yetkilerini yönetin.</p>
      </div>
      <UserCreateButton />
    </div>

    <div class="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
      <button v-for="tab in [{ key: 'users', label: 'Kullanıcılar', icon: UserRound }, { key: 'roles', label: 'Roller', icon: ShieldCheck }, { key: 'permissions', label: 'Permissions', icon: LockKeyhole }]" :key="tab.key" type="button" @click="activeView = tab.key as any" class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium" :class="activeView === tab.key ? 'bg-brand-50 text-brand-600' : 'text-gray-500 hover:bg-gray-50'">
        <component :is="tab.icon" :size="15" />{{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white"><LoaderCircle :size="28" class="animate-spin text-brand-500" /></div>

    <template v-else-if="activeView === 'users'">
      <div class="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Toplam Kullanıcı</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{ users.length }}</p></div>
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Aktif</p><p class="mt-1 text-2xl font-semibold text-success-600">{{ users.filter(user => user.status === 'Aktif').length }}</p></div>
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Rol Sayısı</p><p class="mt-1 text-2xl font-semibold text-brand-600">{{ roles.length }}</p></div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div class="border-b border-gray-100 p-4"><div class="relative max-w-md"><Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="search" class="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none" placeholder="Kullanıcı ara..." /></div></div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-left">
            <thead class="bg-gray-50/70 text-xs text-gray-500"><tr><th class="px-5 py-3">Kullanıcı</th><th class="px-4 py-3">Rol</th><th class="px-4 py-3">Erişim Alanı</th><th class="px-4 py-3">Durum</th><th class="w-12"></th></tr></thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="cursor-pointer border-t border-gray-100 hover:bg-gray-50" @click="openUserDetail(user)">
                <td class="px-5 py-4"><div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">{{ user.initials }}</span><div><p class="text-sm font-medium text-gray-800">{{ user.name }}</p><p class="text-[11px] text-gray-400">{{ user.email }}</p></div></div></td>
                <td class="px-4 py-4"><span class="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">{{ roleLabel(user) }}</span></td>
                <td class="px-4 py-4 text-xs text-gray-600">{{ user.scope }}</td>
                <td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-[11px] font-medium" :class="user.status === 'Aktif' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500'">{{ user.status }}</span></td>
                <td class="px-4"><button type="button" class="text-gray-400 hover:text-gray-700" @click.stop="openUserAuthorization(user)"><MoreHorizontal :size="17" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <template v-else-if="activeView === 'roles'">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div v-for="role in roles" :key="role.id" class="rounded-xl border border-gray-200 bg-white p-5">
          <div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><ShieldCheck :size="17" class="text-brand-600" /><h3 class="text-sm font-semibold text-gray-900">{{ role.name }}</h3></div><p class="mt-2 text-xs leading-5 text-gray-500">{{ role.permissions?.length ?? 0 }} yetki tanımlı.</p></div><span class="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">{{ role.guard_name ?? 'web' }}</span></div>
          <div class="mt-4 flex flex-wrap gap-1.5"><span v-for="permission in role.permissions" :key="permission.id" class="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] text-gray-600">{{ permission.name }}</span></div>
          <button type="button" class="mt-4 text-xs font-medium text-brand-600 hover:underline" @click="selectRole(role.name); activeView = 'permissions'">Yetkileri düzenle →</button>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div class="rounded-xl border border-gray-200 bg-white p-3"><p class="px-2 py-2 text-xs font-semibold text-gray-700">Roller</p><button v-for="role in roles" :key="role.id" type="button" class="mb-1 w-full rounded-lg px-3 py-2.5 text-left" :class="selectedRole === role.name ? 'bg-brand-50' : 'hover:bg-gray-50'" @click="selectRole(role.name)"><p class="text-xs font-medium" :class="selectedRole === role.name ? 'text-brand-600' : 'text-gray-700'">{{ role.name }}</p><p class="mt-0.5 text-[10px] text-gray-400">{{ role.permissions?.length ?? 0 }} yetki</p></button></div>
        <div class="rounded-xl border border-gray-200 bg-white p-5">
          <div class="mb-5 flex items-center justify-between"><div><h2 class="text-sm font-semibold text-gray-900">{{ selectedRoleData?.name }} · Permissions</h2><p class="mt-1 text-xs text-gray-500">Bu rolün sahip olduğu yetkileri belirleyin.</p></div><span class="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">{{ selectedPermissions.length }} yetki</span></div>
          <div class="space-y-4"><div v-for="group in permissionGroups" :key="group.name"><h3 class="mb-2 text-xs font-semibold text-gray-700">{{ group.name }}</h3><div class="divide-y divide-gray-100 rounded-lg border border-gray-100"><label v-for="item in group.items" :key="item[0]" class="flex cursor-pointer items-center justify-between px-3 py-3 hover:bg-gray-50"><span><span class="block text-xs font-medium text-gray-700">{{ item[1] }}</span><span class="text-[10px] text-gray-400">{{ item[0] }}</span></span><input type="checkbox" :checked="selectedPermissions.includes(item[0])" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="togglePermission(item[0])" /></label></div></div></div>
          <div class="mt-5 flex justify-end"><button type="button" :disabled="savingPermissions || !selectedRole" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60" @click="saveRolePermissions"><LoaderCircle v-if="savingPermissions" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingPermissions ? 'Kaydediliyor...' : 'Yetkileri Kaydet' }}</button></div>
        </div>
      </div>
    </template>

    <div v-if="showUserForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="closeUserAuthorization">
      <div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between gap-3"><div><h2 class="text-base font-semibold text-gray-900">Kullanıcı Yetkileri</h2><p class="mt-1 text-xs text-gray-500">{{ selectedUser?.name }}</p></div><button type="button" class="text-gray-400 hover:text-gray-700" @click="closeUserAuthorization">×</button></div>
        <div v-if="loadingUser" class="flex min-h-[240px] items-center justify-center"><LoaderCircle :size="24" class="animate-spin text-brand-500" /></div>
        <template v-else>
          <div class="mt-5"><label class="mb-2 block text-xs font-medium text-gray-700">Rol</label><select v-model="userRole" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none"><option value="">Rol seçin</option><option v-for="role in roles.filter(role => role.name !== 'super-admin')" :key="role.id" :value="role.name">{{ role.name }}</option></select></div>
          <div class="mt-5 max-h-[280px] space-y-3 overflow-y-auto"><div v-for="group in permissionGroups" :key="group.name"><h3 class="mb-2 text-xs font-semibold text-gray-700">{{ group.name }}</h3><div class="divide-y divide-gray-100 rounded-lg border border-gray-100"><label v-for="item in group.items" :key="item[0]" class="flex cursor-pointer items-center justify-between px-3 py-3 hover:bg-gray-50"><span class="text-xs text-gray-700">{{ item[1] }}</span><input type="checkbox" :checked="userPermissions.includes(item[0])" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="userPermissions = userPermissions.includes(item[0]) ? userPermissions.filter(permission => permission !== item[0]) : [...userPermissions, item[0]]" /></label></div></div></div>
          <div class="mt-5 flex justify-end gap-2"><button type="button" class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50" @click="closeUserAuthorization">Vazgeç</button><button type="button" :disabled="savingRole" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60" @click="saveUserAuthorization"><LoaderCircle v-if="savingRole" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingRole ? 'Kaydediliyor...' : 'Kaydet' }}</button></div>
        </template>
      </div>
    </div>
  </section>
</template>
