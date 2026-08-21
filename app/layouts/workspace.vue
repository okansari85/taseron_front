<script setup lang="ts">
import {
  Bell,
  Building2,
  ChevronDown,
  FileText,
  FolderTree,
  Home,
  LayoutGrid,
  Menu,
  Moon,
  Settings,
  Users,
} from 'lucide-vue-next'

const tenant = {
  name: 'Koç Holding',
}

const workspace = {
  name: 'Koç Holding Workspace',
}

const navigation = [
  { label: 'Ana Sayfa', icon: Home },
  {
    label: 'Organizasyon',
    icon: Building2,
    expanded: true,
    children: [
      { label: 'Gruplar', to: '/tenants/1/organization/groups', active: true },
      { label: 'Şirketler', to: '/tenants/1/organization/companies' },
      { label: 'Markalar', to: '/tenants/1/organization/brands' },
      { label: 'Lokasyonlar', to: '/tenants/1/organization/locations' },
      { label: 'Hiyerarşi Görünümü', to: '/tenants/1/organization/hierarchy' },
    ],
  },
  { label: 'Taşeronlar', icon: Users },
  { label: 'Kullanıcılar', icon: Users },
  { label: 'Raporlar', icon: FileText },
  { label: 'Ayarlar', icon: Settings },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 font-outfit text-gray-800">
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[250px] border-r border-gray-200 bg-white lg:flex lg:flex-col">
      <div class="flex h-[88px] items-center gap-3 border-b border-gray-100 px-6">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-lg font-bold text-white">
          T
        </div>
        <div>
          <div class="text-lg font-bold leading-5 text-gray-900">Taşeron</div>
          <div class="text-xs text-gray-400">Management</div>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto px-4 py-6">
        <p class="mb-4 px-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          Menü
        </p>

        <nav class="space-y-1">
          <template v-for="item in navigation" :key="item.label">
            <button
              class="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition"
              :class="item.label === 'Organizasyon' ? 'bg-brand-50 text-brand-500' : 'text-gray-700 hover:bg-gray-50'"
            >
              <component :is="item.icon" :size="17" :stroke-width="1.8" />
              <span class="flex-1 text-left">{{ item.label }}</span>
              <ChevronDown v-if="item.children" :size="15" class="rotate-180" />
            </button>

            <div v-if="item.children" class="ml-5 border-l border-gray-200 pl-3">
              <NuxtLink
                v-for="child in item.children"
                :key="child.label"
                :to="child.to"
                class="mb-1 flex w-full items-center rounded-lg px-3 py-2 text-sm transition"
                :class="child.active ? 'bg-brand-50 font-medium text-brand-500' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                {{ child.label }}
              </NuxtLink>
            </div>
          </template>
        </nav>
      </div>

      <div class="px-4 pb-4">
        <div class="rounded-xl border border-gray-200 bg-white p-4">
          <div class="mb-2 flex items-center gap-2">
            <LayoutGrid :size="14" class="text-brand-500" />
            <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Aktif Workspace
            </span>
          </div>
          <div class="text-sm font-semibold text-gray-800">{{ workspace.name }}</div>
          <div class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700">
            <span class="h-1.5 w-1.5 rounded-full bg-success-500" />
            Aktif
          </div>
          <div class="mt-4 border-t border-gray-100 pt-3">
            <button class="flex w-full items-center gap-2 text-xs font-medium text-brand-500">
              <Settings :size="14" />
              Workspace Ayarları
            </button>
          </div>
        </div>
      </div>

      <div class="border-t border-gray-200 p-4">
        <button class="flex w-full items-center gap-3 rounded-xl p-2 text-left hover:bg-gray-50">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500">
            AY
          </div>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm font-semibold text-gray-800">Ahmet Yılmaz</div>
            <div class="text-xs text-gray-400">Sistem Yöneticisi</div>
          </div>
          <ChevronDown :size="16" class="text-gray-400" />
        </button>
      </div>
    </aside>

    <div class="min-h-screen lg:pl-[250px]">
      <header class="sticky top-0 z-30 flex h-[88px] items-center border-b border-gray-200 bg-white px-6">
        <div class="flex flex-1 items-center gap-3">
          <button class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
            <Menu :size="19" />
          </button>

          <button class="flex h-12 min-w-[190px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 text-left hover:border-gray-300">
            <Building2 :size="17" class="text-brand-500" />
            <div class="flex-1">
              <div class="text-[10px] text-gray-400">Tenant</div>
              <div class="text-sm font-semibold text-gray-800">{{ tenant.name }}</div>
            </div>
            <ChevronDown :size="15" class="text-gray-400" />
          </button>

          <button class="flex h-12 min-w-[230px] items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 text-left hover:border-gray-300">
            <LayoutGrid :size="17" class="text-brand-500" />
            <div class="flex-1">
              <div class="text-[10px] text-gray-400">Workspace</div>
              <div class="truncate text-sm font-semibold text-gray-800">{{ workspace.name }}</div>
            </div>
            <ChevronDown :size="15" class="text-gray-400" />
          </button>
        </div>

        <div class="flex items-center gap-5">
          <button class="text-gray-500 hover:text-gray-800"><Moon :size="18" /></button>
          <button class="relative text-gray-500 hover:text-gray-800">
            <Bell :size="18" />
            <span class="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[9px] font-bold text-white">3</span>
          </button>
          <div class="h-8 w-px bg-gray-200" />
          <button class="flex items-center gap-3">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-500">AY</div>
            <div class="hidden text-left sm:block">
              <div class="text-sm font-semibold text-gray-800">Ahmet Yılmaz</div>
              <div class="text-xs text-gray-400">Sistem Yöneticisi</div>
            </div>
            <ChevronDown :size="15" class="text-gray-400" />
          </button>
        </div>
      </header>

      <main class="px-6 py-7">
        <slot />
      </main>
    </div>
  </div>
</template>
