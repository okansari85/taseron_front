<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { LoaderCircle, Search, ShieldCheck, UserRound, UsersRound, Wrench } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizedUser } from '~/api/user-authorization'
import UserCreateButton from './UserCreateButton.vue'

const route = useRoute()
const router = useRouter()
const users = ref<AuthorizedUser[]>([])
const loading = ref(true)
const search = ref('')
const activeTab = ref<'system' | 'experts' | 'contractors'>('system')
const { $toast } = useNuxtApp()

const roleName = (user: AuthorizedUser) => user.roles?.[0]?.name ?? '-'
const isExpert = (user: AuthorizedUser) => roleName(user) === 'isg-user'
const isContractor = (user: AuthorizedUser) => roleName(user) === 'contractor'
const statusLabel = (user: AuthorizedUser) => user.status === false || user.status === 0 || user.status === '0' || user.status === 'pasif' || user.status === 'Pasif' ? 'Pasif' : 'Aktif'
const scopeLabel = (user: AuthorizedUser) => {
  const scopes = user.scopes ?? []
  if (!scopes.length) return 'Tanımlanmamış'
  if (scopes.some(scope => scope.scope_type === 'tenant')) return 'Tüm tenant'
  return scopes.map(scope => `${scope.scope_type} #${scope.scope_id}`).join(', ')
}
const systemUsers = computed(() => users.value.filter(user => !isExpert(user) && !isContractor(user)))
const expertUsers = computed(() => users.value.filter(isExpert))
const contractorUsers = computed(() => users.value.filter(isContractor))
const activeUsers = computed(() => activeTab.value === 'system' ? systemUsers.value : activeTab.value === 'experts' ? expertUsers.value : contractorUsers.value)
const filteredUsers = computed(() => {
  const q = search.value.toLocaleLowerCase('tr-TR').trim()
  return activeUsers.value.filter(user => !q || `${user.name} ${user.email} ${roleName(user)} ${user.contractor?.short_name ?? ''}`.toLocaleLowerCase('tr-TR').includes(q))
})
const initials = (name: string) => name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(value => value[0]).join('').toLocaleUpperCase('tr-TR')
const contractorLabel = (user: AuthorizedUser) => user.contractor?.short_name || user.contractor?.business_entity?.name || 'Taşeron eşleştirilmemiş'
const openDetail = (user: AuthorizedUser) => router.push(`/tenants/${route.params.tenantId}/users/${user.id}`)

const load = async () => {
  loading.value = true
  try {
    users.value = await userAuthorizationApi.listUsers()
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcılar alınamadı.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">Kullanıcılar</h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Sistem kullanıcıları, uzmanlar ve alt yüklenici kullanıcılarını yönetin.</p>
      </div>
      <UserCreateButton />
    </div>

    <div class="flex gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-900">
      <button v-for="tab in [{ key: 'system', label: 'Sistem Kullanıcıları', icon: ShieldCheck }, { key: 'experts', label: 'Uzmanlar', icon: Wrench }, { key: 'contractors', label: 'Alt Yüklenici Kullanıcıları', icon: UsersRound }]" :key="tab.key" type="button" @click="activeTab = tab.key as typeof activeTab" class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium" :class="activeTab === tab.key ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'">
        <component :is="tab.icon" :size="15" />{{ tab.label }}
      </button>
    </div>

    <div v-if="loading" class="flex min-h-[360px] items-center justify-center rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900"><LoaderCircle :size="28" class="animate-spin text-brand-500" /></div>

    <template v-else>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p class="text-xs text-gray-500">Sistem Kullanıcıları</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ systemUsers.length }}</p></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p class="text-xs text-gray-500">Uzmanlar</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ expertUsers.length }}</p></div>
        <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><p class="text-xs text-gray-500">Alt Yüklenici Kullanıcıları</p><p class="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">{{ contractorUsers.length }}</p></div>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div class="border-b border-gray-100 p-4 dark:border-gray-800"><div class="relative max-w-md"><Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input v-model="search" class="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Kullanıcı ara..." /></div></div>
        <div class="overflow-x-auto">
          <table class="w-full min-w-[800px] text-left">
            <thead class="bg-gray-50/70 text-xs text-gray-500 dark:bg-gray-800/50 dark:text-gray-400"><tr><th class="px-5 py-3">Kullanıcı</th><th class="px-4 py-3">Rol</th><th class="px-4 py-3">{{ activeTab === 'contractors' ? 'Alt Yüklenici' : activeTab === 'experts' ? 'Kapsam' : 'Erişim Alanı' }}</th><th class="px-4 py-3">Durum</th></tr></thead>
            <tbody>
              <tr v-for="user in filteredUsers" :key="user.id" class="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/60" @click="openDetail(user)">
                <td class="px-5 py-4"><div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">{{ initials(user.name) }}</span><div><p class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ user.name }}</p><p class="text-[11px] text-gray-400">{{ user.email }}</p></div></div></td>
                <td class="px-4 py-4"><span class="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ roleName(user) }}</span></td>
                <td class="px-4 py-4 text-xs text-gray-600 dark:text-gray-300">{{ activeTab === 'contractors' ? contractorLabel(user) : scopeLabel(user) }}<span v-if="activeTab === 'experts'" class="ml-2 text-[10px] text-gray-400">İşletme ataması lokasyon detayından</span></td>
                <td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-[11px] font-medium" :class="statusLabel(user) === 'Aktif' ? 'bg-success-50 text-success-600' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'">{{ statusLabel(user) }}</span></td>
              </tr>
              <tr v-if="!filteredUsers.length"><td colspan="4" class="px-5 py-12 text-center text-xs text-gray-400">Bu kategoride kullanıcı bulunamadı.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </section>
</template>
