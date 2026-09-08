<script setup lang="ts">
import { Bell, Building2, Check, ChevronDown, Flame, MapPin, Store } from '@lucide/vue'
import { locationApi, type LocationApiItem, type LocationBusinessEntity } from '~/api/location'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

const auth = useAuth()
const router = useRouter()
const context = useIsgDesktopContextStore()

const profileOpen = ref(false)
const locationMenuOpen = ref(false)
const branchMenuOpen = ref(false)

const locations = ref<LocationApiItem[]>([])
const locationsLoaded = ref(false)
const locationsLoading = ref(false)
const branches = ref<LocationBusinessEntity[]>([])
const branchesLoading = ref(false)

const initials = computed(() => {
  const name = auth.user.value?.name?.trim() || 'K'
  return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toLocaleUpperCase('tr-TR')
})

const loadLocations = async () => {
  if (locationsLoaded.value) return
  locationsLoading.value = true
  try {
    locations.value = await locationApi.list(auth.user.value?.tenant_id ?? '')
    locationsLoaded.value = true
  } finally {
    locationsLoading.value = false
  }
}

const loadBranches = async () => {
  if (!context.locationId) return
  branchesLoading.value = true
  try {
    const all = await locationApi.businessEntities(context.locationId)
    branches.value = all.filter(b => b.type === 'company')
  } finally {
    branchesLoading.value = false
  }
}

const openLocationMenu = async () => {
  branchMenuOpen.value = false
  locationMenuOpen.value = !locationMenuOpen.value
  if (locationMenuOpen.value) await loadLocations()
}

const openBranchMenu = async () => {
  locationMenuOpen.value = false
  branchMenuOpen.value = !branchMenuOpen.value
  if (branchMenuOpen.value) await loadBranches()
}

const branchLabel = (b: LocationBusinessEntity) => b.pivot?.brands?.[0]?.name || b.company?.name || b.name

const selectLocation = async (location: LocationApiItem) => {
  locationMenuOpen.value = false
  if (location.id === context.locationId) return

  context.setLocation({
    id: location.id,
    name: location.name,
    city: location.city?.name,
    district: location.district?.name,
    image: location.image,
    branchCount: location.branch_count ?? 0,
  })

  if (context.isStandaloneLocation) {
    const entities = await locationApi.businessEntities(location.id)
    const only = entities.find(e => e.type === 'company') ?? entities[0]
    if (only) {
      context.setBranch({
        id: only.pivot?.id ?? only.id,
        name: branchLabel(only),
        code: only.pivot?.code,
        logo: only.pivot?.brands?.[0]?.logo_url,
        isActive: only.pivot?.is_active,
      })
    }
    return
  }

  await navigateTo('/isg-portal/desktop/select-branch')
}

const selectBranch = (b: LocationBusinessEntity) => {
  branchMenuOpen.value = false
  const id = b.pivot?.id ?? b.id
  if (id === context.branchId) return
  context.setBranch({
    id,
    name: branchLabel(b),
    code: b.pivot?.code,
    logo: b.pivot?.brands?.[0]?.logo_url,
    isActive: b.pivot?.is_active,
  })
}

const handleLogout = async () => {
  profileOpen.value = false
  await auth.logout()
  await router.push('/isg-portal/login')
}
</script>

<template>
  <header class="flex items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
    <div class="flex shrink-0 items-center gap-2.5">
      <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-error-50 text-error-500 dark:bg-error-500/10"><Flame :size="18" /></span>
      <div class="hidden sm:block">
        <p class="text-sm font-semibold text-gray-900 dark:text-white/90">İSG / Yangın Güvenlik</p>
        <p class="text-[11px] text-gray-400">Denetim Uygulaması</p>
      </div>
    </div>

    <div class="flex min-w-0 flex-1 items-center justify-center gap-2.5">
      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-left dark:border-gray-700 dark:bg-gray-800"
          @click="openLocationMenu"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10"><MapPin :size="14" /></span>
          <span class="min-w-0">
            <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-400">Lokasyon</span>
            <span class="block max-w-[160px] truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ context.locationName || 'Seçilmedi' }}</span>
          </span>
          <ChevronDown :size="14" class="shrink-0 text-gray-400" />
        </button>
        <div v-if="locationMenuOpen" class="absolute left-0 top-full z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <p v-if="locationsLoading" class="px-3 py-2 text-xs text-gray-400">Yükleniyor...</p>
          <button
            v-for="location in locations"
            :key="location.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5"
            :class="location.id === context.locationId ? 'text-brand-600 font-semibold' : 'text-gray-700 dark:text-gray-300'"
            @click="selectLocation(location)"
          >
            <Check v-if="location.id === context.locationId" :size="14" class="shrink-0" />
            <Building2 v-else :size="14" class="shrink-0 text-gray-300" />
            <span class="min-w-0 flex-1 truncate">{{ location.name }}</span>
          </button>
          <p v-if="!locationsLoading && !locations.length" class="px-3 py-2 text-xs text-gray-400">Lokasyon bulunamadı.</p>
        </div>
      </div>

      <div class="relative">
        <button
          type="button"
          class="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-left disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
          :disabled="!context.locationId"
          @click="openBranchMenu"
        >
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-500/10"><Store :size="14" /></span>
          <span class="min-w-0">
            <span class="block text-[10px] font-medium uppercase tracking-wide text-gray-400">Marka</span>
            <span class="block max-w-[160px] truncate text-sm font-semibold text-gray-900 dark:text-white/90">{{ context.branchName || 'Seçilmedi' }}</span>
          </span>
          <ChevronDown :size="14" class="shrink-0 text-gray-400" />
        </button>
        <div v-if="branchMenuOpen" class="absolute left-0 top-full z-50 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <p v-if="branchesLoading" class="px-3 py-2 text-xs text-gray-400">Yükleniyor...</p>
          <button
            v-for="b in branches"
            :key="b.pivot?.id ?? b.id"
            type="button"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5"
            :class="(b.pivot?.id ?? b.id) === context.branchId ? 'text-brand-600 font-semibold' : 'text-gray-700 dark:text-gray-300'"
            @click="selectBranch(b)"
          >
            <Check v-if="(b.pivot?.id ?? b.id) === context.branchId" :size="14" class="shrink-0" />
            <Store v-else :size="14" class="shrink-0 text-gray-300" />
            <span class="min-w-0 flex-1 truncate">{{ branchLabel(b) }}</span>
          </button>
          <p v-if="!branchesLoading && !branches.length" class="px-3 py-2 text-xs text-gray-400">Şube bulunamadı.</p>
        </div>
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-3">
      <button type="button" class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5">
        <Bell :size="18" />
      </button>
      <div class="relative">
        <button type="button" class="flex items-center gap-2.5 border-l border-gray-200 pl-3 dark:border-gray-800" @click="profileOpen = !profileOpen">
          <span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/10">{{ initials }}</span>
          <span class="hidden text-left sm:block">
            <span class="block text-sm font-semibold text-gray-900 dark:text-white/90">{{ auth.user.value?.name || 'Kullanıcı' }}</span>
            <span class="block text-xs text-gray-400">İSG Uzmanı</span>
          </span>
          <ChevronDown :size="15" class="text-gray-400" />
        </button>
        <div v-if="profileOpen" class="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-1.5 shadow-lg dark:border-gray-800 dark:bg-gray-900">
          <button type="button" class="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/5" @click="handleLogout">Çıkış Yap</button>
        </div>
      </div>
    </div>
  </header>
</template>
