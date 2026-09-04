<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowLeft, Check, LoaderCircle, LogIn, ShieldCheck, Trash2, UserRound, X } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizedUser, type AuthorizationPermission, type AuthorizationRole, type AuthorizationScope } from '~/api/user-authorization'
import { organizationApi } from '~/api/organization'
import { locationApi } from '~/api/location'

const route = useRoute()
const router = useRouter()
const tenantId = Number(route.params.tenantId)
const userId = Number(route.params.userId)
const { $toast } = useNuxtApp()
const auth = useAuth()
const { loading: impersonationLoading, start: startImpersonation, workspaceForRoles } = useUserImpersonation()

type ScopeType = 'tenant' | 'organization' | 'location'
type ScopeOption = { id: number; name: string }
type ScopeChoice = { value: ScopeType; title: string; description: string }
type UserDetailTab = 'profile' | 'roles' | 'permissions' | 'scopes'

const scopeOptions: ScopeChoice[] = [
  { value: 'tenant', title: 'Tüm Tenant', description: 'Tenant içindeki tüm organizasyon ve lokasyonlar.' },
  { value: 'organization', title: 'Organizasyon', description: 'Seçilen organizasyonlara bağlı tüm lokasyonlar.' },
  { value: 'location', title: 'Lokasyon', description: 'Yalnızca seçilen lokasyonlar.' },
]

const user = ref<AuthorizedUser | null>(null)
const roles = ref<AuthorizationRole[]>([])
const permissions = ref<AuthorizationPermission[]>([])
const selectedPermissionNames = ref<string[]>([])
const selectedRole = ref('')
const firstName = ref('')
const lastName = ref('')
const email = ref('')
const scopes = ref<AuthorizationScope[]>([])
const scopeType = ref<ScopeType>('organization')
const selectedOrganizationIds = ref<number[]>([])
const selectedLocationIds = ref<number[]>([])
const organizations = ref<ScopeOption[]>([])
const locations = ref<ScopeOption[]>([])
const activeTab = ref<UserDetailTab>('roles')
const loading = ref(true)
const savingProfile = ref(false)
const savingRole = ref(false)
const savingPermissions = ref(false)
const savingScope = ref(false)
const deletingUser = ref(false)

const isSuperAdmin = computed(() => user.value?.roles?.some(role => role.name === 'super-admin') ?? false)
const currentUserIsSuperAdmin = computed(() => auth.user.value?.roles?.some(role => role === 'super-admin') ?? false)
const canImpersonate = computed(() => currentUserIsSuperAdmin.value && Boolean(user.value) && !isSuperAdmin.value && auth.user.value?.id !== user.value?.id)
const canDeleteUser = computed(() => Boolean(user.value) && !isSuperAdmin.value && auth.user.value?.id !== user.value?.id)
const initials = computed(() => user.value?.name?.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(x => x.charAt(0).toLocaleUpperCase('tr-TR')).join('') ?? '')
const selectedScopeCount = computed(() => scopeType.value === 'tenant' ? 1 : scopeType.value === 'organization' ? selectedOrganizationIds.value.length : selectedLocationIds.value.length)
const selectedScopeLabel = computed(() => scopeType.value === 'tenant' ? 'Tüm Tenant' : scopeType.value === 'organization' ? 'Organizasyon' : 'Lokasyon')
const selectedRoleDefinition = computed(() => roles.value.find(role => role.name === selectedRole.value))
const rolePermissionNames = computed(() => new Set(selectedRoleDefinition.value?.permissions?.map(permission => permission.name) ?? []))
const rolePermissions = computed(() => permissions.value.filter(permission => rolePermissionNames.value.has(permission.name)))
const extraPermissions = computed(() => permissions.value.filter(permission => !rolePermissionNames.value.has(permission.name)))
const permissionLabel = (name: string) => name.replace(/[._-]+/g, ' ').replace(/\b\w/g, value => value.toUpperCase())

const syncProfileState = (name: string, userEmail = user.value?.email ?? '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  lastName.value = parts.length > 1 ? parts.pop() ?? '' : ''
  firstName.value = parts.join(' ')
  email.value = userEmail
}

const saveProfile = async () => {
  if (!user.value || savingProfile.value || isSuperAdmin.value) return
  const name = `${firstName.value.trim()} ${lastName.value.trim()}`.trim()
  const nextEmail = email.value.trim()
  if (!firstName.value.trim() || !lastName.value.trim()) {
    $toast.error('Ad ve soyad alanlarını doldurmalısınız.')
    return
  }
  if (!nextEmail) {
    $toast.error('E-posta alanını doldurmalısınız.')
    return
  }
  savingProfile.value = true
  try {
    user.value = await userAuthorizationApi.updateProfile(user.value.id, name, nextEmail)
    syncProfileState(user.value.name, user.value.email)
    $toast.success('Kullanıcı bilgileri kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı bilgileri kaydedilemedi.')
  } finally {
    savingProfile.value = false
  }
}

const syncPermissionState = (items: AuthorizationPermission[] = user.value?.permissions ?? []) => {
  selectedPermissionNames.value = items.map(permission => permission.name)
}

const togglePermission = (name: string) => {
  selectedPermissionNames.value = selectedPermissionNames.value.includes(name)
    ? selectedPermissionNames.value.filter(item => item !== name)
    : [...selectedPermissionNames.value, name]
}

const savePermissions = async () => {
  if (!user.value || savingPermissions.value || isSuperAdmin.value) return
  savingPermissions.value = true
  try {
    user.value = await userAuthorizationApi.syncPermissions(user.value.id, selectedPermissionNames.value)
    syncPermissionState(user.value.permissions)
    $toast.success('Kullanıcı yetkileri kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı yetkileri kaydedilemedi.')
  } finally {
    savingPermissions.value = false
  }
}

const syncScopeState = (items: AuthorizationScope[]) => {
  scopes.value = items
  if (items.some(item => item.scope_type === 'tenant')) scopeType.value = 'tenant'
  else if (items.some(item => item.scope_type === 'location')) scopeType.value = 'location'
  else scopeType.value = 'organization'
  selectedOrganizationIds.value = items.filter(item => item.scope_type === 'organization').map(item => item.scope_id)
  selectedLocationIds.value = items.filter(item => item.scope_type === 'location').map(item => item.scope_id)
}

const load = async () => {
  loading.value = true
  try {
    const [freshUser, roleList, permissionList, scopeList, organizationList, locationList] = await Promise.all([
      userAuthorizationApi.getUser(userId),
      userAuthorizationApi.listRoles(),
      userAuthorizationApi.listPermissions(),
      userAuthorizationApi.listScopes(userId),
      organizationApi.listForTenant(tenantId),
      locationApi.list(tenantId),
    ])
    user.value = freshUser
    roles.value = roleList
    permissions.value = permissionList
    selectedRole.value = freshUser.roles?.[0]?.name ?? ''
    syncProfileState(freshUser.name, freshUser.email)
    syncPermissionState(freshUser.permissions)
    syncScopeState(scopeList)
    organizations.value = organizationList.map(item => ({ id: item.id, name: item.name }))
    locations.value = locationList.map(item => ({ id: item.id, name: item.name }))
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı profili alınamadı.')
  } finally {
    loading.value = false
  }
}

const toggleOrganization = (id: number) => {
  selectedOrganizationIds.value = selectedOrganizationIds.value.includes(id) ? selectedOrganizationIds.value.filter(item => item !== id) : [...selectedOrganizationIds.value, id]
}

const toggleLocation = (id: number) => {
  selectedLocationIds.value = selectedLocationIds.value.includes(id) ? selectedLocationIds.value.filter(item => item !== id) : [...selectedLocationIds.value, id]
}

const saveRole = async () => {
  if (!user.value || savingRole.value || isSuperAdmin.value || !selectedRole.value) return
  if (selectedRole.value === user.value.roles?.[0]?.name) {
    $toast.success('Rolde değişiklik bulunmuyor.')
    return
  }
  savingRole.value = true
  try {
    user.value = await userAuthorizationApi.assignRole(user.value.id, selectedRole.value)
    selectedRole.value = user.value.roles?.[0]?.name ?? selectedRole.value
    syncPermissionState(user.value.permissions)
    $toast.success('Kullanıcı rolü kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı rolü kaydedilemedi.')
  } finally {
    savingRole.value = false
  }
}

const saveScope = async () => {
  if (!user.value || savingScope.value || isSuperAdmin.value) return
  const nextScopes = scopeType.value === 'tenant'
    ? [{ scope_type: 'tenant', scope_id: tenantId }]
    : scopeType.value === 'organization'
      ? selectedOrganizationIds.value.map(scope_id => ({ scope_type: 'organization', scope_id }))
      : selectedLocationIds.value.map(scope_id => ({ scope_type: 'location', scope_id }))
  if (scopeType.value !== 'tenant' && !nextScopes.length) {
    $toast.error(`${selectedScopeLabel.value} seçmeden kaydedemezsiniz.`)
    return
  }
  savingScope.value = true
  try {
    const savedScopes = await userAuthorizationApi.syncScopes(user.value.id, nextScopes)
    syncScopeState(savedScopes)
    $toast.success('Kullanıcı erişim alanı kaydedildi.')
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı erişim alanı kaydedilemedi.')
  } finally {
    savingScope.value = false
  }
}

const loginAsUser = async () => {
  if (!user.value || !canImpersonate.value || impersonationLoading.value) return
  if (!window.confirm(`${user.value.name} hesabı ile giriş yapmak istiyor musunuz?`)) return
  try {
    const response = await startImpersonation(user.value.id, route.fullPath)
    $toast.success(`${response.user.name} hesabı ile giriş yapıldı.`)
    const workspace = workspaceForRoles(response.user.roles)
    if (workspace === 'contractor') await router.push('/contractor-portal/dashboard')
    else if (workspace === 'security') await router.push('/security')
    else await router.push(`/tenants/${tenantId}`)
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı ile giriş yapılamadı.')
  }
}

const deleteUser = async () => {
  if (!user.value || !canDeleteUser.value || deletingUser.value) return
  if (!window.confirm(`${user.value.name} kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return

  deletingUser.value = true
  try {
    await userAuthorizationApi.deleteUser(user.value.id)
    $toast.success('Kullanıcı silindi.')
    await router.push(`/tenants/${tenantId}/users`)
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı silinemedi.')
  } finally {
    deletingUser.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <button @click="router.push(`/tenants/${tenantId}/users`)" class="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"><ArrowLeft :size="17" /></button>
        <div><h1 class="text-xl font-semibold text-gray-900">Kullanıcı Profili</h1><p class="mt-1 text-sm text-gray-500">Kullanıcının rol, yetki ve erişim alanlarını yönetin.</p></div>
      </div>
      <button v-if="canImpersonate" type="button" :disabled="impersonationLoading" @click="loginAsUser" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"><LoaderCircle v-if="impersonationLoading" :size="14" class="animate-spin" /><LogIn v-else :size="14" />{{ impersonationLoading ? 'Giriş yapılıyor...' : 'Kullanıcı ile giriş yap' }}</button>
    </div>

    <div v-if="loading" class="flex min-h-[420px] items-center justify-center rounded-xl border border-gray-200 bg-white"><LoaderCircle :size="28" class="animate-spin text-brand-500" /></div>

    <template v-else-if="user">
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
        <div class="space-y-5">
          <div class="rounded-xl border border-gray-200 bg-white p-5">
            <div class="flex items-center gap-3"><span class="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600">{{ initials }}</span><div class="min-w-0"><p class="truncate text-sm font-semibold text-gray-900">{{ user.name }}</p><p class="truncate text-xs text-gray-400">{{ user.email }}</p></div></div>
            <div class="mt-5 border-t border-gray-100 pt-4"><p class="text-[11px] text-gray-400">Mevcut Rol</p><div class="mt-2 flex items-center gap-2"><ShieldCheck :size="16" class="text-brand-600" /><span class="text-sm font-medium text-gray-700">{{ user.roles?.[0]?.name ?? 'Rol atanmadı' }}</span></div></div>
          </div>

          <div class="rounded-xl border border-gray-200 bg-white p-2">
            <button @click="activeTab = 'profile'" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors" :class="activeTab === 'profile' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'"><UserRound :size="16" :class="activeTab === 'profile' ? 'text-brand-600' : 'text-gray-400'" /><div><p class="text-xs font-semibold">Profil</p><p class="mt-0.5 text-[10px] text-gray-400">Kullanıcı bilgileri</p></div></button>
            <button @click="activeTab = 'roles'" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors" :class="activeTab === 'roles' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'"><ShieldCheck :size="16" :class="activeTab === 'roles' ? 'text-brand-600' : 'text-gray-400'" /><div><p class="text-xs font-semibold">Roller</p><p class="mt-0.5 text-[10px] text-gray-400">Kullanıcı rolü</p></div></button>
            <button @click="activeTab = 'permissions'" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors" :class="activeTab === 'permissions' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'"><ShieldCheck :size="16" :class="activeTab === 'permissions' ? 'text-brand-600' : 'text-gray-400'" /><div><p class="text-xs font-semibold">Yetkiler</p><p class="mt-0.5 text-[10px] text-gray-400">Rol ve ek yetkiler</p></div></button>
            <button @click="activeTab = 'scopes'" class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors" :class="activeTab === 'scopes' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'"><ShieldCheck :size="16" :class="activeTab === 'scopes' ? 'text-brand-600' : 'text-gray-400'" /><div><p class="text-xs font-semibold">Kapsamlar</p><p class="mt-0.5 text-[10px] text-gray-400">Erişim alanları</p></div></button>
          </div>

          <button v-if="canDeleteUser" type="button" :disabled="deletingUser" @click="deleteUser" class="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"><LoaderCircle v-if="deletingUser" :size="14" class="animate-spin" /><Trash2 v-else :size="14" />{{ deletingUser ? 'Siliniyor...' : 'Kullanıcıyı Sil' }}</button>

          <div v-if="isSuperAdmin" class="rounded-xl border border-brand-100 bg-brand-50/50 p-5"><div class="flex items-center gap-2"><ShieldCheck :size="16" class="text-brand-600" /><h2 class="text-sm font-semibold text-gray-900">Tam Platform Erişimi</h2></div><p class="mt-3 text-xs leading-5 text-gray-600">Super Admin platform yöneticisidir. Tüm tenant, organizasyon ve lokasyonlara tam erişime sahiptir. Bu kullanıcı için ayrıca scope veya rol yetkisi seçilmez.</p></div>
        </div>

        <div class="space-y-5">
          <div v-if="activeTab === 'profile'" class="rounded-xl border border-gray-200 bg-white p-5"><div class="flex items-center gap-2"><UserRound :size="16" class="text-brand-600" /><h2 class="text-sm font-semibold text-gray-900">Kullanıcı Bilgileri</h2></div><div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><div><label class="text-[11px] font-medium text-gray-500">Ad</label><input v-model="firstName" type="text" autocomplete="given-name" class="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400" /></div><div><label class="text-[11px] font-medium text-gray-500">Soyad</label><input v-model="lastName" type="text" autocomplete="family-name" class="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400" /></div><div class="md:col-span-2"><label class="text-[11px] font-medium text-gray-500">E-posta</label><input v-model="email" type="email" autocomplete="email" class="mt-1 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-brand-400" /></div><div class="rounded-lg border border-gray-100 p-4"><p class="text-[11px] text-gray-400">Rol</p><p class="mt-1 text-sm font-medium text-gray-800">{{ user.roles?.[0]?.name ?? 'Rol atanmadı' }}</p></div><div class="rounded-lg border border-gray-100 p-4"><p class="text-[11px] text-gray-400">Durum</p><p class="mt-1 text-sm font-medium text-gray-800">{{ user.status ?? '—' }}</p></div></div><div v-if="!isSuperAdmin" class="mt-5 flex justify-end"><button :disabled="savingProfile" @click="saveProfile" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"><LoaderCircle v-if="savingProfile" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingProfile ? 'Kaydediliyor...' : 'Bilgileri Kaydet' }}</button></div></div>

          <div v-else-if="activeTab === 'roles'">
            <div v-if="isSuperAdmin" class="rounded-xl border border-brand-100 bg-brand-50/50 p-5"><div class="flex items-center gap-2"><ShieldCheck :size="16" class="text-brand-600" /><h2 class="text-sm font-semibold text-gray-900">Rol Yönetimi</h2></div><p class="mt-3 text-xs leading-5 text-gray-600">Super Admin için ayrıca rol ataması yapılmaz.</p></div>
            <div v-else class="rounded-xl border border-gray-200 bg-white p-5"><div><h2 class="text-sm font-semibold text-gray-900">Rol</h2><p class="mt-1 text-xs text-gray-500">Kullanıcının platform içindeki yetki seviyesini belirleyin.</p></div><select v-model="selectedRole" class="mt-5 h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none"><option value="">Rol seçin</option><option v-for="role in roles" :key="role.id" :value="role.name">{{ role.name }}</option></select><div class="mt-5 flex justify-end gap-2"><button @click="router.push(`/tenants/${tenantId}/users`)" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"><X :size="14" /> Vazgeç</button><button :disabled="savingRole" @click="saveRole" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"><LoaderCircle v-if="savingRole" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingRole ? 'Kaydediliyor...' : 'Rolü Kaydet' }}</button></div></div>
          </div>

          <div v-else-if="activeTab === 'permissions'">
            <div v-if="isSuperAdmin" class="rounded-xl border border-brand-100 bg-brand-50/50 p-5"><div class="flex items-center gap-2"><ShieldCheck :size="16" class="text-brand-600" /><h2 class="text-sm font-semibold text-gray-900">Yetki Yönetimi</h2></div><p class="mt-3 text-xs leading-5 text-gray-600">Super Admin için ayrıca yetki seçimi yapılmaz.</p></div>
            <div v-else class="space-y-5">
              <div class="rounded-xl border border-gray-200 bg-white p-5"><div class="flex items-center justify-between gap-3"><div><h2 class="text-sm font-semibold text-gray-900">Rol Yetkileri</h2><p class="mt-1 text-xs text-gray-500">Rolün getirdiği yetkileri gerektiğinde kullanıcı özelinde kapatabilirsiniz.</p></div><span class="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">{{ rolePermissions.filter(permission => selectedPermissionNames.includes(permission.name)).length }} / {{ rolePermissions.length }}</span></div><div class="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2"><label v-for="permission in rolePermissions" :key="permission.id" class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-3 hover:bg-gray-50"><span class="text-xs font-medium text-gray-700">{{ permissionLabel(permission.name) }}</span><input :checked="selectedPermissionNames.includes(permission.name)" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="togglePermission(permission.name)" /></label><div v-if="!rolePermissions.length" class="col-span-full rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">Bu rol için tanımlı yetki bulunmuyor.</div></div></div>
              <div class="rounded-xl border border-gray-200 bg-white p-5"><div class="flex items-center justify-between gap-3"><div><h2 class="text-sm font-semibold text-gray-900">Ek Yetkiler</h2><p class="mt-1 text-xs text-gray-500">Bu kullanıcıya rolünden bağımsız olarak ek yetki verebilirsiniz.</p></div><span class="rounded-md bg-gray-50 px-2.5 py-1 text-[11px] font-medium text-gray-500">{{ extraPermissions.filter(permission => selectedPermissionNames.includes(permission.name)).length }} seçili</span></div><div class="mt-5 grid grid-cols-1 gap-2 md:grid-cols-2"><label v-for="permission in extraPermissions" :key="permission.id" class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-3 hover:bg-gray-50"><span class="text-xs font-medium text-gray-700">{{ permissionLabel(permission.name) }}</span><input :checked="selectedPermissionNames.includes(permission.name)" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="togglePermission(permission.name)" /></label><div v-if="!extraPermissions.length" class="col-span-full rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-xs text-gray-400">Eklenebilecek başka yetki bulunmuyor.</div></div><div class="mt-5 flex justify-end gap-2"><button @click="syncPermissionState(user.permissions)" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"><X :size="14" /> Vazgeç</button><button :disabled="savingPermissions" @click="savePermissions" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"><LoaderCircle v-if="savingPermissions" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingPermissions ? 'Kaydediliyor...' : 'Yetkileri Kaydet' }}</button></div></div>
            </div>
          </div>

          <div v-else>
            <div v-if="isSuperAdmin" class="rounded-xl border border-brand-100 bg-brand-50/50 p-5"><div class="flex items-center gap-2"><ShieldCheck :size="16" class="text-brand-600" /><h2 class="text-sm font-semibold text-gray-900">Erişim Alanı</h2></div><p class="mt-3 text-xs leading-5 text-gray-600">Super Admin için scope seçimi yapılmaz. Platform genelinde tüm tenant, organizasyon ve lokasyonlara tam erişim kabul edilir.</p></div>
            <div v-else class="rounded-xl border border-gray-200 bg-white p-5">
              <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 class="text-sm font-semibold text-gray-900">Erişim Alanı</h2><p class="mt-1 text-xs text-gray-500">Scope, kullanıcının nerelerde işlem yapabileceğini belirler. Lokasyon seçimi erişimi en dar seviyeye indirir.</p></div><span class="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">{{ selectedScopeCount }} seçili</span></div>
              <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"><label v-for="option in scopeOptions" :key="option.value" class="cursor-pointer rounded-lg border px-4 py-3" :class="scopeType===option.value?'border-brand-300 bg-brand-50/50':'border-gray-100 hover:bg-gray-50'"><div class="flex items-start gap-3"><input v-model="scopeType" :value="option.value" type="radio" class="mt-0.5 h-4 w-4 border-gray-300 text-brand-600" /><div><p class="text-xs font-semibold text-gray-800">{{ option.title }}</p><p class="mt-1 text-[10px] leading-4 text-gray-500">{{ option.description }}</p></div></div></label></div>
              <div v-if="scopeType==='organization'" class="mt-5"><div class="mb-2 flex items-center justify-between"><h3 class="text-xs font-semibold text-gray-700">Organizasyon Seçimi</h3><span class="text-[10px] text-gray-400">{{ selectedOrganizationIds.length }} seçili</span></div><div class="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2"><label v-for="item in organizations" :key="item.id" class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50"><input :checked="selectedOrganizationIds.includes(item.id)" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="toggleOrganization(item.id)" /><span class="text-xs text-gray-700">{{ item.name }}</span></label><div v-if="!organizations.length" class="px-3 py-5 text-center text-xs text-gray-400">Organizasyon bulunamadı.</div></div><p class="mt-2 text-[10px] text-gray-400">Birden fazla organizasyon seçebilirsiniz. Seçilen her organizasyonun tüm lokasyonları kapsama dahil olur.</p></div>
              <div v-else-if="scopeType==='location'" class="mt-5"><div class="mb-2 flex items-center justify-between"><h3 class="text-xs font-semibold text-gray-700">Lokasyon Seçimi</h3><span class="text-[10px] text-gray-400">{{ selectedLocationIds.length }} seçili</span></div><div class="max-h-[320px] space-y-1 overflow-y-auto rounded-lg border border-gray-100 p-2"><label v-for="item in locations" :key="item.id" class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50"><input :checked="selectedLocationIds.includes(item.id)" type="checkbox" class="h-4 w-4 rounded border-gray-300 text-brand-600" @change="toggleLocation(item.id)" /><span class="text-xs text-gray-700">{{ item.name }}</span></label><div v-if="!locations.length" class="px-3 py-5 text-center text-xs text-gray-400">Lokasyon bulunamadı.</div></div><div class="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5"><p class="text-[10px] leading-4 text-amber-700"><strong>Erişim daraltıldı:</strong> Yalnızca seçtiğiniz lokasyonlarda işlem yapılabilir. Lokasyonun bağlı olduğu organizasyon otomatik olarak çalışma bağlamına dahil edilir; ayrıca organizasyon seçmeniz gerekmez.</p></div></div>
              <div class="mt-5 flex justify-end gap-2"><button @click="router.push(`/tenants/${tenantId}/users`)" class="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"><X :size="14" /> Vazgeç</button><button :disabled="savingScope" @click="saveScope" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"><LoaderCircle v-if="savingScope" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ savingScope ? 'Kaydediliyor...' : 'Kapsamı Kaydet' }}</button></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>
