<template>
  <v-navigation-drawer
    :model-value="true"
    permanent
    :rail="rail"
    rail-width="80"
    width="264"
    color="surface"
    class="taseron-sidebar"
  >
    <div class="logo-row" :class="rail ? 'justify-center px-0' : 'px-4'">
      <div class="logo-badge">
        <v-icon icon="mdi-sitemap-outline" size="20" color="white" />
      </div>
      <transition name="fade">
        <div v-if="!rail" class="ml-3 logo-text">
          <div class="font-weight-bold text-body-2" :class="isDark ? 'text-white' : 'text-high-emphasis'">TASERON</div>
          <div class="text-caption logo-sub" :class="isDark ? 'text-white-disabled' : 'text-medium-emphasis'">MANAGEMENT</div>
        </div>
      </transition>
    </div>

    <v-divider />

    <v-list nav density="comfortable" class="px-2 mt-2 flex-grow-1">
      <v-list-item
        v-for="item in navItems"
        :key="item.title"
        :prepend-icon="item.icon"
        :title="item.title"
        rounded="lg"
        class="mb-1 nav-item"
        :class="{ 'nav-item--active': item.active, 'nav-item--dark': isDark }"
      />
    </v-list>

    <template #append>
      <v-divider />
      <div class="pa-3">
        <div class="d-flex align-center" :class="rail ? 'justify-center' : ''">
          <v-avatar color="primary" size="36">
            <span class="text-white text-caption font-weight-medium">AY</span>
          </v-avatar>
          <transition name="fade">
            <div v-if="!rail" class="ml-3 flex-grow-1 overflow-hidden">
              <div class="text-body-2 font-weight-medium text-truncate" :class="isDark ? 'text-white' : 'text-high-emphasis'">Ahmet Yılmaz</div>
              <div class="text-caption text-truncate" :class="isDark ? 'text-white-disabled' : 'text-medium-emphasis'">Sistem Yöneticisi</div>
            </div>
          </transition>
          <v-icon
            v-if="!rail"
            icon="mdi-chevron-down"
            size="16"
            :class="isDark ? 'text-white-disabled' : 'text-medium-emphasis'"
          />
        </div>
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
defineProps<{ rail: boolean }>()

const { isDark } = useAppTheme()

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
  background: linear-gradient(135deg, #6d5dfb, #8b7bff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.logo-sub {
  letter-spacing: 0.12em;
}

.nav-item {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.nav-item :deep(.v-icon) {
  color: rgb(var(--v-theme-on-surface)) !important;
}

.nav-item--dark {
  color: rgba(255, 255, 255, 0.72) !important;
}

.nav-item--dark :deep(.v-icon) {
  color: rgba(255, 255, 255, 0.72) !important;
}

.nav-item--active {
  background-color: rgb(var(--v-theme-primary)) !important;
  color: #fff !important;
}

.nav-item--active :deep(.v-icon) {
  color: #fff !important;
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
