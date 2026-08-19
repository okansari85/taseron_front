<template>
  <v-navigation-drawer
    :model-value="true"
    permanent
    :rail="rail"
    rail-width="80"
    width="264"
    class="taseron-sidebar"
  >
    <div class="logo-row" :class="rail ? 'justify-center px-0' : 'px-4'">
      <div class="logo-badge">
        <v-icon icon="mdi-sitemap-outline" size="20" color="primary" />
      </div>
      <transition name="fade">
        <div v-if="!rail" class="ml-3 logo-text">
          <div class="text-high-emphasis font-weight-bold text-body-2">TASERON</div>
          <div class="text-caption text-medium-emphasis logo-sub">MANAGEMENT</div>
        </div>
      </transition>
    </div>

    <v-divider class="sidebar-divider" />

    <v-list nav density="comfortable" class="px-2 mt-2 flex-grow-1">
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="lg"
        class="mb-1 nav-item"
        :class="{ 'nav-item--active': item.active }"
      />
    </v-list>

    <template #append>
      <v-divider class="sidebar-divider" />
      <div class="pa-3">
        <div class="d-flex align-center user-chip" :class="rail ? 'justify-center' : ''">
          <v-avatar color="primary" size="36">
            <span class="text-white text-caption font-weight-medium">AY</span>
          </v-avatar>
          <transition name="fade">
            <div v-if="!rail" class="ml-3 flex-grow-1 overflow-hidden">
              <div class="text-high-emphasis text-body-2 font-weight-medium text-truncate">Ahmet Yılmaz</div>
              <div class="text-caption text-medium-emphasis text-truncate">Sistem Yöneticisi</div>
            </div>
          </transition>
          <v-icon v-if="!rail" icon="mdi-chevron-down" size="16" class="text-medium-emphasis" />
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
defineProps<{ rail: boolean }>()

const navItems = [
  { title: 'Ana Sayfa', icon: 'mdi-home-outline' },
  { title: 'Tenantlar', icon: 'mdi-view-grid-outline', active: true },
  { title: 'Organizasyon', icon: 'mdi-sitemap-outline' },
  { title: 'Lokasyonlar', icon: 'mdi-map-marker-outline' },
  { title: 'Şirketler', icon: 'mdi-briefcase-outline' },
  { title: 'Taşeronlar', icon: 'mdi-account-group-outline' },
  { title: 'Kullanıcılar', icon: 'mdi-account-outline' },
  { title: 'Roller', icon: 'mdi-shield-outline' },
  { title: 'Sözleşmeler', icon: 'mdi-file-document-outline' },
  { title: 'Raporlar', icon: 'mdi-chart-bar' },
  { title: 'Bildirimler', icon: 'mdi-bell-outline' },
  { title: 'Ayarlar', icon: 'mdi-cog-outline' },
]
</script>

<style scoped>
.taseron-sidebar {
  background-color: #fff !important;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08) !important;
}
.logo-row {
  display: flex;
  align-items: center;
  padding-top: 20px;
  padding-bottom: 20px;
}
.logo-badge {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.10);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.logo-sub {
  letter-spacing: 0.12em;
}
.sidebar-divider {
  border-color: rgba(var(--v-theme-on-surface), 0.08) !important;
}
.nav-item {
  color: rgba(var(--v-theme-on-surface), 0.72) !important;
}
.nav-item :deep(.v-icon) {
  color: rgba(var(--v-theme-on-surface), 0.62);
}
.nav-item--active {
  background: rgba(var(--v-theme-primary), 0.10) !important;
  color: rgb(var(--v-theme-primary)) !important;
}
.nav-item--active :deep(.v-icon) {
  color: rgb(var(--v-theme-primary)) !important;
}
.user-chip {
  padding: 6px;
  border-radius: 10px;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.12s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
