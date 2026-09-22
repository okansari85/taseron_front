<script setup lang="ts">
defineProps<{ activeTab: string; primaryColor: string }>()
defineEmits<{ (e: 'change', tab: string, anchor: string): void }>()
</script>
<template>
  <nav class="mt-5 flex gap-7 overflow-x-auto border-b border-slate-200" aria-label="Tesisat sekmeleri">
    <button v-for="tab in [{id:'systems',label:'Sistemler',anchor:'systems'},{id:'general',label:'Genel Bilgiler',anchor:'general'},{id:'controls',label:'Kontrol Maddeleri',anchor:'controls'},{id:'findings',label:'Uygunsuzluklar',anchor:'findings'},{id:'files',label:'Dosyalar',anchor:'files'}]" :key="tab.id" class="relative shrink-0 pb-3 text-xs font-semibold transition" :style="activeTab===tab.id?{color:primaryColor}:{color:'#50617f'}" @click="$emit('change', tab.id, tab.anchor)">{{tab.label}}<span v-if="activeTab===tab.id" class="absolute inset-x-0 bottom-0 h-0.5 rounded-full" :style="{backgroundColor:primaryColor}"/></button>
  </nav>
</template>
