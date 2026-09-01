<script setup lang="ts">
import OrganizationTabs from "~/components/organization/OrganizationTabs.vue";
import ContractorPoolTab from "./components/ContractorPoolTab.vue";

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => String(route.params.tenantId ?? ""));

const contractorTabs = [
  {
    label: "Alt Yüklenici Havuzu",
    to: `/tenants/${tenantId.value}/contractors/`,
    exact: true,
  },
  {
    label: "Alt Yüklenici Organizasyon Eşleştirmesi",
    path: "organization-matching",
  },
];
</script>

<template>
  <div class="font-outfit mx-auto w-full max-w-[1400px]">
    <div class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">
        Alt Yüklenici Havuzu
      </h1>
      <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
        Tenant içerisindeki alt yüklenicileri merkezi havuzdan yönetin.
      </p>
    </div>

    <OrganizationTabs :tabs="contractorTabs" base-path="contractors" />
    <ContractorPoolTab :tenant-id="tenantId" />
  </div>
</template>
