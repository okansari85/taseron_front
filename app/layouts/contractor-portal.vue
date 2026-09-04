<template>
  <div class="min-h-screen xl:flex">
    <ContractorSidebar />
    <div :class="['min-w-0 flex-1 transition-all duration-300 ease-in-out', isExpanded ? 'lg:ml-[290px]' : 'lg:ml-[90px]']">
      <ContractorHeader />
      <ImpersonationBanner />
      <main class="mx-auto w-full max-w-[2000px] p-4 md:p-6"><slot /></main>
    </div>
  </div>
</template>
<script setup lang="ts">
const { isExpanded } = useTailAdminSidebar(); useTailAdminTheme()
</script>
