<script setup lang="ts">
import { UserRound } from "lucide-vue-next";
type Contractor={id:number;name:string;logo:string;operationalArea:string;activity:string;subActivity:string;nace:string;dangerClass:string;sgk:string;status:"active"|"passive";contractorType:string}
defineProps<{ contractors:Contractor[] }>()
</script>
<template>
<table class="w-full min-w-[1080px] text-left"><thead class="border-b border-gray-100 bg-gray-50/70"><tr><th v-for="h in ['Firma','Faaliyet / Alt Faaliyet','NACE Kodu','Tehlike Sınıfı','SGK Sicil No','Taşeron Tipi','Durum','İşlemler']" :key="h" class="px-4 py-4 text-xs font-medium text-gray-500">{{h}}</th></tr></thead><tbody class="divide-y divide-gray-100"><tr v-for="company in contractors" :key="company.id"><td class="px-4 py-4 text-sm font-semibold text-gray-800">{{company.name}}</td><td class="px-4 py-4 text-sm text-gray-500"><span class="font-medium text-gray-700">{{company.activity}}</span> / {{company.subActivity}}</td><td class="px-4 py-4 text-sm text-gray-500">{{company.nace}}</td><td class="px-4 py-4"><DangerClassBadge :danger-class="company.dangerClass" /></td><td class="px-4 py-4 text-sm text-gray-500">{{company.sgk}}</td><td class="px-4 py-4 text-sm text-gray-600">{{company.contractorType}}</td><td class="px-4 py-4 text-sm text-success-600">Aktif</td><td class="px-4 py-4 text-right"><button class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-700"><UserRound :size="14"/> Uzman Ata</button></td></tr></tbody></table>
</template>
