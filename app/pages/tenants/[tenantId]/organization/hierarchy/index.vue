<script setup lang="ts">
import { Building2, ChevronDown, ChevronRight, Factory, Layers3, Network } from '@lucide/vue'

definePageMeta({
  layout: 'default',
})

type Brand = {
  name: string
  shortName: string
  tone: string
}

type Company = {
  name: string
  shortName: string
  brands: Brand[]
}

type Group = {
  name: string
  companies: Company[]
}

const route = useRoute()
const tenantId = computed(() => String(route.params.tenantId ?? ''))

const groups = ref<Group[]>([
  {
    name: 'Dayanıklı Tüketim Grubu',
    companies: [
      {
        name: 'Arçelik A.Ş.',
        shortName: 'arcelik',
        brands: [
          { name: 'Arçelik', shortName: 'arcelik', tone: 'red' },
          { name: 'Beko', shortName: 'beko', tone: 'blue' },
          { name: 'Altus', shortName: 'altus', tone: 'slate' },
          { name: 'Grundig', shortName: 'grundig', tone: 'orange' },
        ],
      },
      {
        name: 'Arçelik Pazarlama A.Ş.',
        shortName: 'arcelik-pazarlama',
        brands: [],
      },
    ],
  },
  {
    name: 'Otomotiv Grubu',
    companies: [
      {
        name: 'Tofaş Türk Otomobil Fabrikası A.Ş.',
        shortName: 'tofas',
        brands: [{ name: 'Tofaş', shortName: 'tofas', tone: 'green' }],
      },
      {
        name: 'Otokar A.Ş.',
        shortName: 'otokar',
        brands: [{ name: 'Otokar', shortName: 'otokar', tone: 'yellow' }],
      },
    ],
  },
  {
    name: 'Enerji Grubu',
    companies: [
      {
        name: 'Tüpraş - Türkiye Petrol Rafinerileri A.Ş.',
        shortName: 'tupras',
        brands: [],
      },
    ],
  },
])

const expandedGroups = ref<Record<string, boolean>>(
  Object.fromEntries(groups.value.map((group) => [group.name, true])),
)

const expandedCompanies = ref<Record<string, boolean>>({
  'Arçelik A.Ş.': true,
  'Arçelik Pazarlama A.Ş.': true,
  'Tofaş Türk Otomobil Fabrikası A.Ş.': true,
  'Otokar A.Ş.': true,
  'Tüpraş - Türkiye Petrol Rafinerileri A.Ş.': true,
})

const totalCompanies = computed(() => groups.value.reduce((total, group) => total + group.companies.length, 0))
const totalBrands = computed(() => groups.value.reduce((total, group) => total + group.companies.reduce((sum, company) => sum + company.brands.length, 0), 0))

const toggleGroup = (name: string) => {
  expandedGroups.value[name] = !expandedGroups.value[name]
}

const toggleCompany = (name: string) => {
  expandedCompanies.value[name] = !expandedCompanies.value[name]
}

const companyInitial = (name: string) => name.trim().charAt(0).toLocaleUpperCase('tr-TR')
</script>

<template>
  <div class="mx-auto w-full max-w-[1400px]">
    <div class="mb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">
        Organizasyon Yönetimi
      </h1>
      <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
        Kurumsal yapının hiyerarşik görünümünü inceleyin.
      </p>
    </div>

    <OrganizationTabs />

    <div class="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
            <Layers3 :size="18" />
          </span>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Grup</p>
            <p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ groups.length }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400">
            <Building2 :size="18" />
          </span>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Şirket</p>
            <p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ totalCompanies }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="flex items-center gap-3">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/10 dark:text-blue-light-400">
            <Network :size="18" />
          </span>
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Marka</p>
            <p class="mt-0.5 text-lg font-semibold text-gray-800 dark:text-white/90">{{ totalBrands }}</p>
          </div>
        </div>
      </div>
    </div>

    <section class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="border-b border-gray-100 px-6 py-5 dark:border-gray-800">
        <div class="flex items-center justify-between gap-4">
          <div>
            <h2 class="text-base font-semibold text-gray-800 dark:text-white/90">Organizasyon Hiyerarşisi</h2>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Holding ve grup yapısından şirket ve markalara kadar mevcut yapıyı görüntüleyin.</p>
          </div>
          <span class="hidden items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 sm:inline-flex dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
            <Network :size="14" />
            Salt okunur
          </span>
        </div>
      </div>

      <div class="overflow-x-auto p-6">
        <div class="min-w-[900px]">
          <div class="mx-auto flex w-fit flex-col items-center">
            <div class="flex min-w-[300px] items-center gap-3 rounded-xl border border-brand-200 bg-brand-50/70 px-5 py-4 shadow-theme-xs dark:border-brand-500/30 dark:bg-brand-500/10">
              <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white">
                <Network :size="20" />
              </span>
              <div>
                <div class="text-sm font-semibold text-gray-900 dark:text-white/90">Koç Holding</div>
                <div class="mt-0.5 text-xs text-brand-600 dark:text-brand-400">Holding</div>
              </div>
            </div>

            <div class="h-8 w-px bg-gray-200 dark:bg-gray-700" />

            <div class="relative flex w-full justify-center gap-8 before:absolute before:left-[16.66%] before:right-[16.66%] before:top-0 before:h-px before:bg-gray-200 dark:before:bg-gray-700">
              <div
                v-for="group in groups"
                :key="group.name"
                class="relative w-[280px] pt-6"
              >
                <div class="absolute left-1/2 top-0 h-6 w-px -translate-x-1/2 bg-gray-200 dark:bg-gray-700" />

                <button
                  type="button"
                  class="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-left shadow-theme-xs transition hover:border-brand-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500/30"
                  @click="toggleGroup(group.name)"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10 dark:text-brand-400">
                    <Layers3 :size="18" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-semibold text-gray-800 dark:text-white/90">{{ group.name }}</span>
                    <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ group.companies.length }} şirket</span>
                  </span>
                  <ChevronDown v-if="expandedGroups[group.name]" :size="16" class="shrink-0 text-gray-400" />
                  <ChevronRight v-else :size="16" class="shrink-0 text-gray-400" />
                </button>

                <div v-if="expandedGroups[group.name]" class="relative mt-4 space-y-3 pl-5 before:absolute before:bottom-6 before:left-1 before:top-0 before:w-px before:bg-gray-200 dark:before:bg-gray-700">
                  <div
                    v-for="company in group.companies"
                    :key="company.name"
                    class="relative"
                  >
                    <div class="absolute -left-4 top-5 h-px w-4 bg-gray-200 dark:bg-gray-700" />
                    <button
                      type="button"
                      class="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-left transition hover:border-success-200 hover:bg-success-50/30 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-success-500/30 dark:hover:bg-success-500/5"
                      @click="toggleCompany(company.name)"
                    >
                      <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-success-50 text-xs font-semibold text-success-600 dark:bg-success-500/10 dark:text-success-400">
                        {{ companyInitial(company.name) }}
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block truncate text-sm font-medium text-gray-800 dark:text-white/90">{{ company.name }}</span>
                        <span class="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{{ company.shortName }}</span>
                      </span>
                      <ChevronDown v-if="expandedCompanies[company.name]" :size="15" class="shrink-0 text-gray-400" />
                      <ChevronRight v-else :size="15" class="shrink-0 text-gray-400" />
                    </button>

                    <div v-if="expandedCompanies[company.name] && company.brands.length" class="mt-2 ml-5 space-y-1.5 border-l border-gray-200 pl-4 dark:border-gray-700">
                      <div
                        v-for="brand in company.brands"
                        :key="brand.name"
                        class="flex items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      >
                        <span class="h-2 w-2 rounded-full" :class="`bg-${brand.tone}-500`" />
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ brand.name }}</span>
                        <span class="ml-auto text-xs text-gray-400">{{ brand.shortName }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
        <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
          <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-brand-500" /> Holding / Grup</span>
          <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-success-500" /> Şirket</span>
          <span class="inline-flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-blue-light-500" /> Marka</span>
          <span class="ml-auto inline-flex items-center gap-2"><Factory :size="14" /> Yapı yalnızca görüntülenir.</span>
        </div>
      </div>
    </section>
  </div>
</template>
