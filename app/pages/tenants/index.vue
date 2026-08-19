<template>
  <div class="mx-auto max-w-[1400px]">
    <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-title-md font-semibold text-gray-800 dark:text-white/90">Tenantlar</h1>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Sistemde tanımlı tenant hesaplarını görüntüleyin ve yönetin.</p>
      </div>
      <button class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white shadow-theme-xs hover:bg-brand-600" @click="goToCreate">
        <span class="text-lg leading-none">+</span>
        Yeni Tenant
      </button>
    </div>

    <div class="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <input v-model="search" type="search" placeholder="Tenant ara..." class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 lg:col-span-4" />
        <select v-model="statusFilter" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 lg:col-span-2">
          <option value="">Durum</option><option value="active">Aktif</option><option value="passive">Pasif</option>
        </select>
        <select v-model="structureFilter" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 lg:col-span-2">
          <option value="">Kurumsal Yapı</option><option value="holding">Holding</option><option value="group">Grup</option><option value="company">Şirket</option><option value="brand">Marka</option>
        </select>
        <select v-model="dateFilter" class="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 lg:col-span-2">
          <option value="">Oluşturulma Tarihi</option><option value="7">Son 7 gün</option><option value="30">Son 30 gün</option>
        </select>
        <button class="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5 lg:col-span-2" :disabled="!hasFilters" @click="clearFilters">Filtreleri Temizle</button>
      </div>
    </div>

    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="max-w-full overflow-x-auto custom-scrollbar">
        <table class="min-w-full">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Tenant Adı</p></th>
              <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Slug</p></th>
              <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Kurumsal Yapı</p></th>
              <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Durum</p></th>
              <th class="px-5 py-3 text-left sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">Oluşturulma Tarihi</p></th>
              <th class="px-5 py-3 text-right sm:px-6"><p class="font-medium text-gray-500 text-theme-xs dark:text-gray-400">İşlemler</p></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="tenant in paginatedTenants" :key="tenant.id" class="border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
              <td class="px-5 py-4 sm:px-6">
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-sm font-semibold text-gray-600 dark:bg-gray-800 dark:text-gray-300">{{ getInitials(tenant.name) }}</div>
                  <div><button class="block text-left font-medium text-gray-800 text-theme-sm hover:text-brand-500 dark:text-white/90" @click="openTenant(tenant)">{{ tenant.name }}</button><span class="block text-gray-500 text-theme-xs dark:text-gray-400">#{{ tenant.id }}</span></div>
                </div>
              </td>
              <td class="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 sm:px-6">{{ tenant.slug }}</td>
              <td class="px-5 py-4 sm:px-6"><TailAdminBadge :tone="structureTone(tenant.onboarding_type)">{{ structureLabel(tenant.onboarding_type) }}</TailAdminBadge></td>
              <td class="px-5 py-4 sm:px-6"><TailAdminBadge :tone="tenant.status === 'active' ? 'success' : 'gray'" :dot="true">{{ tenant.status === 'active' ? 'Aktif' : 'Pasif' }}</TailAdminBadge></td>
              <td class="px-5 py-4 text-gray-500 text-theme-sm dark:text-gray-400 sm:px-6">{{ formatDate(tenant.created_at) }}</td>
              <td class="px-5 py-4 sm:px-6"><div class="flex justify-end gap-1"><button class="rounded-lg px-2.5 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="openTenant(tenant)">Görüntüle</button><button class="rounded-lg px-2.5 py-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5" @click="editTenant(tenant)">Düzenle</button></div></td>
            </tr>
            <tr v-if="paginatedTenants.length === 0"><td colspan="6" class="px-6 py-16 text-center"><p class="text-sm font-medium text-gray-800 dark:text-white/90">Tenant bulunamadı</p><p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Arama veya filtre kriterlerinizi değiştirmeyi deneyin.</p></td></tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
        <span class="text-theme-xs text-gray-500 dark:text-gray-400">Toplam {{ filteredTenants.length }} kayıt</span>
        <div class="flex items-center justify-center gap-1">
          <button class="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-800 dark:text-gray-400" :disabled="page === 1" @click="page--">‹</button>
          <button v-for="p in pageCount" :key="p" :class="['h-9 min-w-9 rounded-lg border px-2 text-theme-xs font-medium', p === page ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/5']" @click="page = p">{{ p }}</button>
          <button class="h-9 w-9 rounded-lg border border-gray-200 text-gray-500 disabled:opacity-40 dark:border-gray-800 dark:text-gray-400" :disabled="page === pageCount" @click="page++">›</button>
        </div>
        <select v-model="itemsPerPage" class="rounded-lg border border-gray-200 bg-white px-3 py-2 text-theme-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"><option :value="10">10 / sayfa</option><option :value="25">25 / sayfa</option><option :value="50">50 / sayfa</option></select>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tenant { id: number; name: string; slug: string; status: 'active' | 'passive'; onboarding_type: 'holding' | 'group' | 'company' | 'brand'; created_at: string }
const router = useRouter()
const search = ref('')
const statusFilter = ref('')
const structureFilter = ref('')
const dateFilter = ref('')
const page = ref(1)
const itemsPerPage = ref(10)

const tenants = ref<Tenant[]>([
  { id: 1, name: 'Koç Holding', slug: 'koc-holding', status: 'active', onboarding_type: 'holding', created_at: '2025-05-18T14:32:00' },
  { id: 2, name: 'MADO', slug: 'mado', status: 'active', onboarding_type: 'company', created_at: '2025-05-17T11:20:00' },
  { id: 3, name: 'Arçelik A.Ş.', slug: 'arcelik', status: 'active', onboarding_type: 'company', created_at: '2025-05-16T09:15:00' },
  { id: 4, name: 'İpek Gıda', slug: 'ipek-gida', status: 'passive', onboarding_type: 'group', created_at: '2025-05-15T16:45:00' },
  { id: 5, name: 'Tepe Savunma', slug: 'tepe-savunma', status: 'active', onboarding_type: 'company', created_at: '2025-05-14T10:05:00' },
  { id: 6, name: 'Beko', slug: 'beko', status: 'active', onboarding_type: 'brand', created_at: '2025-05-13T13:30:00' },
  { id: 7, name: 'Setur', slug: 'setur', status: 'passive', onboarding_type: 'company', created_at: '2025-05-12T08:50:00' },
])

const hasFilters = computed(() => Boolean(search.value || statusFilter.value || structureFilter.value || dateFilter.value))
const filteredTenants = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('tr-TR')
  return tenants.value.filter((tenant) => {
    const searchOk = !query || tenant.name.toLocaleLowerCase('tr-TR').includes(query) || tenant.slug.toLocaleLowerCase('tr-TR').includes(query)
    const statusOk = !statusFilter.value || tenant.status === statusFilter.value
    const structureOk = !structureFilter.value || tenant.onboarding_type === structureFilter.value
    return searchOk && statusOk && structureOk
  })
})
const pageCount = computed(() => Math.max(1, Math.ceil(filteredTenants.value.length / itemsPerPage.value)))
const paginatedTenants = computed(() => filteredTenants.value.slice((page.value - 1) * itemsPerPage.value, page.value * itemsPerPage.value))
watch([search, statusFilter, structureFilter, dateFilter, itemsPerPage], () => { page.value = 1 })
watch(pageCount, (count) => { if (page.value > count) page.value = count })

const clearFilters = () => { search.value = ''; statusFilter.value = ''; structureFilter.value = ''; dateFilter.value = '' }
const goToCreate = () => router.push('/tenants/new')
const openTenant = (tenant: Tenant) => router.push(`/tenants/${tenant.id}`)
const editTenant = (tenant: Tenant) => router.push(`/tenants/${tenant.id}/edit`)
const getInitials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('tr-TR')
const structureLabel = (type: Tenant['onboarding_type']) => ({ holding: 'Holding', group: 'Grup', company: 'Şirket', brand: 'Marka' }[type])
const structureTone = (type: Tenant['onboarding_type']) => ({ holding: 'brand', group: 'warning', company: 'success', brand: 'brand' }[type] as 'brand' | 'warning' | 'success')
const formatDate = (value: string) => new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value))
</script>
