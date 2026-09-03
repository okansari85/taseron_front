<template>
  <div class="min-h-screen xl:flex">
    <TailAdminSidebar />
    <div
      :class="[
        'min-w-0 flex-1 transition-all duration-300 ease-in-out',
        isExpanded ? 'lg:ml-[290px]' : 'lg:ml-[90px]',
      ]
    >
      <TailAdminHeader />
      <main class="mx-auto w-full max-w-[2000px] p-4 md:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const tenantStore = useTenantStore()
const { isExpanded } = useTailAdminSidebar()
useTailAdminTheme()

const tenantId = computed(() => {
  const value = route.params.tenantId
  return Number(Array.isArray(value) ? value[0] : value)
})

watch(tenantId, async id => {
  if (!Number.isInteger(id) || id <= 0) return
  if (tenantStore.currentTenant?.id === id && tenantStore.currentTenant?.root_organization) return
  await tenantStore.fetchTenant(id)
}, { immediate: true })
</script>
