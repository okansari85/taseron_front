<script setup lang="ts">
import {
  Bell, CalendarDays, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, ClipboardCheck,
  Download, Eye, FileText, Flame, Grid2X2, LayoutDashboard, ListFilter, MapPin, Menu,
  MoreVertical, Pencil, Plus, Printer, QrCode, RefreshCw, Search, Settings, ShieldCheck,
  Sparkles, Wrench, XCircle
} from '@lucide/vue'

definePageMeta({ layout: false })

type Extinguisher = {
  code: string
  serial: string
  type: string
  capacity: string
  location: string
  lastCheck: string
  nextCheck: string
  status: 'Aktif' | 'Aylık Kontrol' | 'Bakım Zamanı' | 'Dolum Zamanı'
  monthly: boolean
  annual: boolean
  filling4y: boolean
  nonconformities: number
}

const logoData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAM4AAABSCAYAAAAcu+v8AAAZ5klEQVR42u1deVRUR/b+Cpq1QUEEVNBxQdNCXBCNC7gEl5i4xJUk'
// The logo is rendered as a compact branded mark below; the uploaded Vector Fire Global logo can be replaced by /public assets later.

const tubeImage = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fire_extinguisher.svg'
const selectedCode = ref('YSC-001')
const activeTab = ref('Genel Bakış')
const search = ref('')
const statusFilter = ref('Tüm Durumlar')
const locationFilter = ref('Tüm Alanlar')
const typeFilter = ref('Tüm Tipler')
const page = ref(1)
const qrVisible = ref(true)

const tabs = [
  { label: 'Genel Bakış', icon: LayoutDashboard },
  { label: 'Aylık Kontroller', icon: CalendarDays },
  { label: 'Yıllık Bakımlar', icon: Wrench },
  { label: '4 Yıllık Dolumlar', icon: RefreshCw },
  { label: 'Kontrol Geçmişi', icon: ClipboardCheck },
]

const extinguishers: Extinguisher[] = [
  { code: 'YSC-001', serial: 'TR-2024-001', type: 'KKT', capacity: '6 kg', location: 'Giriş Kat - Restoran Alanı', lastCheck: '15.08.2025', nextCheck: '15.09.2025', status: 'Aylık Kontrol', monthly: true, annual: true, filling4y: false, nonconformities: 0 },
  { code: 'YSC-002', serial: 'TR-2023-045', type: 'KKT', capacity: '6 kg', location: 'Mutfak', lastCheck: '10.07.2025', nextCheck: '10.07.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 0 },
  { code: 'YSC-003', serial: 'TR-2022-112', type: 'CO₂', capacity: '5 kg', location: 'Jeneratör Odası', lastCheck: '05.06.2025', nextCheck: '05.06.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 1 },
  { code: 'YSC-004', serial: 'TR-2021-078', type: 'KKT', capacity: '12 kg', location: 'Depo', lastCheck: '12.05.2025', nextCheck: '12.05.2029', status: 'Dolum Zamanı', monthly: true, annual: true, filling4y: true, nonconformities: 0 },
  { code: 'YSC-005', serial: 'TR-2024-210', type: 'KKT', capacity: '6 kg', location: 'Ofis', lastCheck: '20.08.2025', nextCheck: '20.09.2025', status: 'Aylık Kontrol', monthly: true, annual: true, filling4y: false, nonconformities: 0 },
  { code: 'YSC-006', serial: 'TR-2023-067', type: 'KKT', capacity: '6 kg', location: '2. Kat - Koridor', lastCheck: '15.03.2025', nextCheck: '15.03.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 2 },
  { code: 'YSC-007', serial: 'TR-2022-189', type: 'CO₂', capacity: '5 kg', location: 'Elektrik Odası', lastCheck: '18.06.2025', nextCheck: '18.06.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 0 },
  { code: 'YSC-008', serial: 'TR-2021-091', type: 'KKT', capacity: '12 kg', location: 'Müşteri Alanı', lastCheck: '25.04.2025', nextCheck: '25.04.2029', status: 'Bakım Zamanı', monthly: true, annual: true, filling4y: true, nonconformities: 1 },
  { code: 'YSC-009', serial: 'TR-2024-333', type: 'KKT', capacity: '6 kg', location: 'Çocuk Oyun Alanı', lastCheck: '25.04.2025', nextCheck: '25.04.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 1 },
  { code: 'YSC-010', serial: 'TR-2023-156', type: 'KKT', capacity: '6 kg', location: 'Arka Kapı', lastCheck: '05.05.2025', nextCheck: '05.05.2026', status: 'Aktif', monthly: true, annual: true, filling4y: false, nonconformities: 0 },
]

const selected = computed(() => extinguishers.find(x => x.code === selectedCode.value) ?? extinguishers[0])
const filtered = computed(() => extinguishers.filter(item => {
  const q = search.value.trim().toLocaleLowerCase('tr-TR')
  return (!q || `${item.code} ${item.serial} ${item.location} ${item.type}`.toLocaleLowerCase('tr-TR').includes(q))
    && (statusFilter.value === 'Tüm Durumlar' || item.status === statusFilter.value)
    && (locationFilter.value === 'Tüm Alanlar' || item.location.includes(locationFilter.value))
    && (typeFilter.value === 'Tüm Tipler' || item.type === typeFilter.value)
}))

const statusClass = (status: Extinguisher['status']) => ({
  'Aktif': 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100',
  'Aylık Kontrol': 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-100',
  'Bakım Zamanı': 'bg-red-50 text-red-600 ring-1 ring-inset ring-red-100',
  'Dolum Zamanı': 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-100',
}[status])

const clearFilters = () => {
  search.value = ''
  statusFilter.value = 'Tüm Durumlar'
  locationFilter.value = 'Tüm Alanlar'
  typeFilter.value = 'Tüm Tipler'
  page.value = 1
}

const selectItem = (item: Extinguisher) => {
  selectedCode.value = item.code
}

const qrUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(`https://taseron.local/ysc/${selected.value.code}`)}`)
</script>

<template>
  <div class="min-h-screen bg-[#f7f8fb] font-outfit text-[#111827]">
    <!-- Sidebar -->
    <aside class="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col overflow-hidden bg-[#050607] text-white shadow-[10px_0_35px_rgba(0,0,0,0.18)] lg:flex">
      <div class="flex h-[68px] items-center border-b border-white/[0.07] px-5">
        <div class="flex h-11 w-full items-center rounded-xl bg-white px-3 shadow-[0_4px_20px_rgba(255,255,255,0.08)]">
          <div class="flex h-8 w-8 items-center justify-center rounded-md bg-[#090909] text-white">
            <span class="text-[22px] font-black leading-none">V</span>
          </div>
          <div class="ml-2 leading-none">
            <div class="font-serif text-[16px] font-bold tracking-tight text-[#171717]">VECTOR</div>
            <div class="font-serif text-[11px] font-bold tracking-[0.08em] text-[#171717]">FIRE GLOBAL</div>
          </div>
        </div>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-5">
        <div class="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Ana Menü</div>
        <NuxtLink to="/isg-portal/desktop" class="group mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white">
          <LayoutDashboard :size="18" class="text-white/50 group-hover:text-white" /> Ana Sayfa
        </NuxtLink>

        <div class="mt-5 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Yangın Yönetimi</div>
        <NuxtLink to="/isg-portal/desktop" class="group mb-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white">
          <LayoutDashboard :size="18" class="text-white/50 group-hover:text-[#ef1b23]" /> Dashboard
        </NuxtLink>

        <div class="rounded-2xl border border-white/[0.05] bg-white/[0.025] p-1.5">
          <div class="flex h-11 items-center gap-3 rounded-xl bg-gradient-to-r from-[#d71920] to-[#b80f16] px-3 text-[13px] font-bold text-white shadow-[0_7px_20px_rgba(215,25,32,0.22)]">
            <Flame :size="19" fill="currentColor" /> Yangın Ekipmanları
            <ChevronDown :size="15" class="ml-auto rotate-180" />
          </div>
          <div class="mt-1 space-y-0.5 pl-1">
            <NuxtLink to="/isg-portal/desktop/field-findings" class="group relative flex h-10 items-center gap-3 rounded-lg bg-[#ed1c24] px-3 text-[12px] font-bold text-white shadow-[0_5px_16px_rgba(237,28,36,0.25)]">
              <span class="absolute -left-1 h-6 w-1 rounded-full bg-white" />
              <Flame :size="16" /> Yangın Söndürücüler (YSC)
            </NuxtLink>
            <a href="#" class="group flex h-10 items-center gap-3 rounded-lg px-3 text-[12px] font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white"><ShieldCheck :size="16" /> Yangın Dolapları</a>
            <a href="#" class="group flex h-10 items-center gap-3 rounded-lg px-3 text-[12px] font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white"><Wrench :size="16" /> Yangın Pompaları</a>
            <a href="#" class="group flex h-10 items-center gap-3 rounded-lg px-3 text-[12px] font-medium text-white/55 transition hover:bg-white/[0.05] hover:text-white"><Sparkles :size="16" /> Hidrantlar</a>
          </div>
        </div>

        <div class="mt-4 rounded-xl transition hover:bg-white/[0.025]">
          <a href="#" class="group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:text-white"><Grid2X2 :size="18" class="group-hover:text-[#ef1b23]" /> Sistem ve Tesisat <ChevronDown :size="15" class="ml-auto" /></a>
          <a href="#" class="ml-8 flex h-9 items-center px-3 text-[12px] text-white/45 transition hover:text-white">Tesisat Raporları</a>
        </div>
        <a href="#" class="group mt-1 flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"><FileText :size="18" class="group-hover:text-[#ef1b23]" /> Saha Bulguları</a>

        <div class="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Raporlar</div>
        <a href="#" class="group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"><ClipboardCheck :size="18" class="group-hover:text-[#ef1b23]" /> Yangın Raporları</a>
        <a href="#" class="group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"><Grid2X2 :size="18" class="group-hover:text-[#ef1b23]" /> Analiz ve İstatistikler</a>

        <div class="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Yönetim</div>
        <a href="#" class="group flex h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/65 transition hover:bg-white/[0.06] hover:text-white"><Settings :size="18" class="group-hover:text-[#ef1b23]" /> Ayarlar</a>
      </nav>

      <div class="border-t border-white/[0.07] p-4">
        <div class="flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-white/[0.05]">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#d71920] text-xs font-bold">DK</div>
          <div class="min-w-0"><div class="truncate text-xs font-bold text-white">Deniz Kaya</div><div class="text-[10px] text-white/45">İSG Uzmanı</div></div>
          <ChevronDown :size="14" class="ml-auto text-white/35" />
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="min-h-screen lg:pl-[240px]">
      <header class="sticky top-0 z-30 flex h-[58px] items-center justify-between border-b border-[#e9ebef] bg-white/95 px-5 backdrop-blur-xl lg:px-7">
        <div class="flex items-center gap-2 text-[12px] font-medium text-[#64748b]">
          <span class="text-[#0f2b78]">Olivium Burger</span><ChevronRight :size="14" />
          <span class="text-[#0f2b78]">Yangın Yönetimi</span><ChevronRight :size="14" />
          <span class="font-bold text-[#172554]">Yangın Söndürücüler (YSC)</span>
        </div>
        <div class="flex items-center gap-3">
          <button class="hidden h-10 items-center gap-2 rounded-xl border border-[#e4e7ec] px-4 text-xs font-semibold text-[#172554] sm:flex"><MapPin :size="15" class="text-[#d71920]" /> Olivium Burger <ChevronDown :size="13" /></button>
          <button class="relative flex h-9 w-9 items-center justify-center rounded-xl text-[#64748b] hover:bg-[#f5f6f8]"><Bell :size="18" /><span class="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d71920] px-1 text-[9px] font-bold text-white">3</span></button>
          <div class="hidden h-8 w-px bg-[#e8ebef] sm:block" />
          <div class="flex items-center gap-2"><div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#3b1ba8] text-xs font-bold text-white">DK</div><div class="hidden leading-tight sm:block"><div class="text-[11px] font-bold text-[#172554]">Deniz Kaya</div><div class="text-[10px] text-[#64748b]">İSG Uzmanı</div></div><ChevronDown :size="14" /></div>
        </div>
      </header>

      <main class="px-4 pb-8 pt-5 sm:px-6 lg:px-7">
        <div class="mx-auto max-w-[1500px]">
          <section class="mb-5 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div class="flex items-center gap-4">
              <div class="flex h-[58px] w-[48px] items-center justify-center"><img :src="tubeImage" alt="Yangın söndürücü" class="h-[56px] w-auto object-contain" /></div>
              <div><h1 class="text-[29px] font-bold leading-none tracking-[-0.035em] text-[#101d57]">Yangın Söndürücüler (YSC)</h1><p class="mt-2 text-[13px] text-[#64748b]">Olivium Burger şubesindeki yangın söndürücüleri yönetin, kontrol, bakım ve dolum süreçlerini takip edin.</p></div>
            </div>
            <button class="inline-flex h-11 items-center justify-center gap-2 self-start rounded-lg bg-[#ed1c24] px-5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(237,28,36,0.2)] transition hover:bg-[#d71920] xl:self-auto"><Plus :size="18" stroke-width="2.5" /> Yeni YSC Ekle</button>
          </section>

          <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div class="rounded-xl border border-[#e7ebf0] bg-gradient-to-br from-[#eef7ff] to-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"><div class="flex items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#d71920] shadow-sm"><img :src="tubeImage" class="h-10 w-auto object-contain" alt="" /></div><div><div class="text-[12px] font-semibold text-[#172554]">Toplam YSC</div><div class="mt-1 text-[27px] font-extrabold leading-none text-[#172554]">28</div><div class="mt-1 text-[10px] text-[#64748b]">Bu şubedeki söndürücüler</div></div></div></div>
            <div class="rounded-xl border border-[#e7ebf0] bg-gradient-to-br from-[#f0fff8] to-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"><div class="flex items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck :size="25" /></div><div><div class="text-[12px] font-semibold text-[#172554]">Aktif</div><div class="mt-1 text-[27px] font-extrabold leading-none text-[#172554]">26 <span class="ml-1 text-[10px] font-bold text-emerald-600">↑ %92</span></div><div class="mt-1 text-[10px] text-[#64748b]">Kullanıma hazır</div></div></div></div>
            <div class="rounded-xl border border-[#e7ebf0] bg-gradient-to-br from-[#fff9ef] to-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"><div class="flex items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><CalendarDays :size="25" /></div><div><div class="text-[12px] font-semibold text-[#172554]">Aylık Kontrol Bekleyen</div><div class="mt-1 text-[27px] font-extrabold leading-none text-[#172554]">4 <span class="ml-1 text-[10px] font-bold text-red-500">↑ %14</span></div><div class="mt-1 text-[10px] text-[#64748b]">Bu ay kontrol edilmesi gereken</div></div></div></div>
            <div class="rounded-xl border border-[#e7ebf0] bg-gradient-to-br from-[#fff2f3] to-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"><div class="flex items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#ed1c24]"><Wrench :size="25" /></div><div><div class="text-[12px] font-semibold text-[#172554]">Yıllık Bakım Bekleyen</div><div class="mt-1 text-[27px] font-extrabold leading-none text-[#172554]">2 <span class="ml-1 text-[10px] font-bold text-red-500">↑ %7</span></div><div class="mt-1 text-[10px] text-[#64748b]">Bu yıl bakım zamanı gelen</div></div></div></div>
            <div class="rounded-xl border border-[#e7ebf0] bg-gradient-to-br from-[#f7f2ff] to-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)]"><div class="flex items-start gap-3"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><RefreshCw :size="25" /></div><div><div class="text-[12px] font-semibold text-[#172554]">4 Yıllık Dolum Bekleyen</div><div class="mt-1 text-[27px] font-extrabold leading-none text-[#172554]">1 <span class="ml-1 text-[10px] font-bold text-red-500">↑ %4</span></div><div class="mt-1 text-[10px] text-[#64748b]">Bu yıl dolum zamanı gelen</div></div></div></div>
          </section>

          <section class="mt-4 overflow-x-auto rounded-xl border border-[#e4e8ed] bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
            <div class="flex min-w-[900px] items-stretch">
              <button v-for="tab in tabs" :key="tab.label" type="button" class="flex h-[44px] flex-1 items-center justify-center gap-2 border-r border-[#edf0f3] px-4 text-[12px] font-semibold transition last:border-r-0" :class="activeTab === tab.label ? 'bg-[#ed1c24] text-white shadow-[0_5px_14px_rgba(237,28,36,0.2)]' : 'text-[#334155] hover:bg-[#f8f9fb]'" @click="activeTab = tab.label"><component :is="tab.icon" :size="16" />{{ tab.label }}</button>
            </div>
          </section>

          <section class="mt-4 rounded-xl border border-[#e4e8ed] bg-white p-3 shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
            <div class="flex flex-col gap-2 xl:flex-row">
              <div class="relative flex-1"><Search :size="17" class="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" /><input v-model="search" class="h-10 w-full rounded-lg border border-[#dfe4ea] pl-9 pr-3 text-[12px] outline-none focus:border-[#ed1c24] focus:ring-2 focus:ring-red-500/10" placeholder="YSC kodu, seri no, konum, tip ara..." /></div>
              <select v-model="locationFilter" class="h-10 min-w-[130px] rounded-lg border border-[#dfe4ea] px-3 text-[12px] font-medium text-[#334155] outline-none"><option>Tüm Alanlar</option><option>Mutfak</option><option>Depo</option><option>Ofis</option></select>
              <select v-model="typeFilter" class="h-10 min-w-[125px] rounded-lg border border-[#dfe4ea] px-3 text-[12px] font-medium text-[#334155] outline-none"><option>Tüm Tipler</option><option>KKT</option><option>CO₂</option></select>
              <select v-model="statusFilter" class="h-10 min-w-[135px] rounded-lg border border-[#dfe4ea] px-3 text-[12px] font-medium text-[#334155] outline-none"><option>Tüm Durumlar</option><option>Aktif</option><option>Aylık Kontrol</option><option>Bakım Zamanı</option><option>Dolum Zamanı</option></select>
              <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe4ea] px-4 text-[12px] font-semibold text-[#334155] hover:border-[#ed1c24] hover:text-[#ed1c24]" @click="clearFilters"><ListFilter :size="15" /> Filtrele</button>
              <button type="button" class="h-10 rounded-lg border border-[#dfe4ea] px-4 text-[12px] font-semibold text-[#64748b] hover:text-[#ed1c24]" @click="clearFilters">Temizle</button>
              <button type="button" class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#dfe4ea] px-4 text-[12px] font-semibold text-[#334155] hover:text-[#ed1c24]"><Download :size="15" /> Excel'e Aktar</button>
            </div>
          </section>

          <section class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_276px]">
            <div class="overflow-hidden rounded-xl border border-[#e4e8ed] bg-white shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
              <div class="flex items-center justify-between border-b border-[#edf0f3] px-4 py-3.5"><div class="flex items-center gap-3"><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff0f1] text-[#ed1c24]"><Flame :size="17" /></div><h2 class="text-[14px] font-bold text-[#172554]">Yangın Söndürücü Listesi</h2><span class="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[10px] font-semibold text-[#64748b]">Toplam 28 kayıt</span></div><button class="hidden items-center gap-2 text-[11px] font-semibold text-[#64748b] sm:flex"><MoreVertical :size="17" /></button></div>
              <div class="overflow-x-auto">
                <table class="min-w-[900px] w-full text-left">
                  <thead><tr class="border-b border-[#e8ebef] bg-[#fafbfc]"><th class="w-9 px-3 py-3"><input type="checkbox" class="accent-[#ed1c24]" /></th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Fotoğraf</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">YSC Kodu</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Seri Numarası</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Tip / Kapasite</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Konum</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Son Kontrol</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Sonraki Kontrol</th><th class="px-2 py-3 text-[10px] font-bold text-[#64748b]">Durum</th><th class="w-20 px-2 py-3 text-[10px] font-bold text-[#64748b]">İşlemler</th></tr></thead>
                  <tbody>
                    <tr v-for="item in filtered" :key="item.code" class="cursor-pointer border-b border-[#f0f2f4] transition hover:bg-[#fffafa]" :class="selectedCode === item.code ? 'bg-[#fff8f8]' : ''" @click="selectItem(item)">
                      <td class="px-3 py-2.5"><input type="checkbox" class="accent-[#ed1c24]" @click.stop /></td>
                      <td class="px-2 py-2"><div class="flex h-9 w-8 items-center justify-center"><img :src="tubeImage" class="h-9 w-auto object-contain" alt="" /></div></td>
                      <td class="px-2 py-2 text-[11px] font-bold text-[#153276]">{{ item.code }}</td>
                      <td class="px-2 py-2 text-[10px] font-medium text-[#334155]">{{ item.serial }}</td>
                      <td class="px-2 py-2 text-[10px] font-semibold text-[#334155]">{{ item.type }} / {{ item.capacity }}</td>
                      <td class="px-2 py-2 text-[10px] text-[#334155]">{{ item.location }}</td>
                      <td class="px-2 py-2 text-[10px] font-medium text-[#334155]">{{ item.lastCheck }}</td>
                      <td class="px-2 py-2 text-[10px] font-bold" :class="item.status === 'Aylık Kontrol' || item.status === 'Bakım Zamanı' ? 'text-[#ed1c24]' : 'text-emerald-600'">{{ item.nextCheck }}</td>
                      <td class="px-2 py-2"><span class="inline-flex whitespace-nowrap items-center gap-1.5 rounded-md px-2 py-1 text-[9px] font-bold" :class="statusClass(item.status)"><span class="h-1.5 w-1.5 rounded-full bg-current" />{{ item.status }}</span></td>
                      <td class="px-2 py-2"><div class="flex items-center gap-1"><button class="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f3f4f6] hover:text-[#ed1c24]" @click.stop="selectItem(item)"><Eye :size="14" /></button><button class="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f3f4f6] hover:text-[#ed1c24]"><Pencil :size="13" /></button><button class="flex h-7 w-7 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f3f4f6] hover:text-[#ed1c24]"><MoreVertical :size="14" /></button></div></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="flex flex-col gap-3 border-t border-[#edf0f3] px-4 py-3 text-[10px] text-[#64748b] sm:flex-row sm:items-center sm:justify-between"><div>Sayfa başına <select class="mx-1 rounded-md border border-[#dfe4ea] px-2 py-1.5"><option>10</option><option>20</option></select> kayıt gösteriliyor. Toplam 28 kayıt.</div><div class="flex items-center gap-1"><button class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e1e5ea]"><ChevronLeft :size="14" /></button><button class="flex h-7 w-7 items-center justify-center rounded-md bg-[#ed1c24] text-[10px] font-bold text-white">1</button><button class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e1e5ea]">2</button><button class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e1e5ea]">3</button><button class="flex h-7 w-7 items-center justify-center rounded-md border border-[#e1e5ea]"><ChevronRight :size="14" /></button></div></div>
            </div>

            <aside class="rounded-xl border border-[#e4e8ed] bg-white p-3.5 shadow-[0_3px_16px_rgba(15,23,42,0.04)]">
              <div class="flex items-center justify-between"><h2 class="text-[14px] font-bold text-[#172554]">{{ selected.code }} Detayları</h2><span class="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Aktif</span></div>
              <div class="mt-3 grid grid-cols-[1fr_112px] items-start gap-2 rounded-xl bg-[#fbfcfd] p-2.5"><div class="flex h-[125px] items-center justify-center"><img :src="tubeImage" class="h-[122px] w-auto object-contain" alt="Yangın söndürücü" /></div><div v-if="qrVisible" class="rounded-lg bg-white p-1.5 shadow-sm"><img :src="qrUrl" alt="YSC QR" class="h-[100px] w-[100px]" /><div class="mt-1 text-center text-[9px] font-bold text-[#172554]">{{ selected.code }}</div><div class="text-center text-[8px] text-[#64748b]">{{ selected.serial }}</div></div></div>
              <div class="mt-3 space-y-2 text-[10px]"><div class="flex justify-between gap-3"><span class="text-[#64748b]">Tip / Kapasite</span><strong>{{ selected.type }} / {{ selected.capacity }}</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Marka / Model</span><strong>KKT ABC</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Üretim Tarihi</span><strong>12.03.2024</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Konum</span><strong class="text-right">{{ selected.location }}</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Son Kontrol</span><strong>{{ selected.lastCheck }}</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Sonraki Kontrol</span><strong class="text-[#ed1c24]">{{ selected.nextCheck }}</strong></div><div class="flex justify-between gap-3"><span class="text-[#64748b]">Sorumlu</span><strong>Ahmet Yılmaz</strong></div></div>
              <div class="mt-4 grid grid-cols-2 gap-2"><button class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe4ea] text-[10px] font-bold text-[#334155] hover:border-[#ed1c24] hover:text-[#ed1c24]"><Pencil :size="13" /> Düzenle</button><button class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe4ea] text-[10px] font-bold text-[#334155] hover:border-[#ed1c24] hover:text-[#ed1c24]"><CalendarDays :size="13" /> Kontrol Ekle</button></div>
              <div class="mt-2 grid grid-cols-2 gap-2"><button class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe4ea] text-[10px] font-bold text-[#334155] hover:border-[#ed1c24] hover:text-[#ed1c24]"><Download :size="13" /> QR Kod İndir</button><button class="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#dfe4ea] text-[10px] font-bold text-[#334155] hover:border-[#ed1c24] hover:text-[#ed1c24]"><Printer :size="13" /> QR Yazdır</button></div>
              <button class="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#ed1c24] text-[11px] font-bold text-white shadow-[0_7px_18px_rgba(237,28,36,0.18)]">Detayları Görüntüle <ChevronRight :size="15" /></button>
            </aside>
          </section>

          <section class="mt-4 overflow-hidden rounded-xl border border-red-100 bg-gradient-to-r from-[#fff1f2] via-[#fff6f6] to-[#fff1f2] px-5 py-3.5"><div class="flex items-center gap-4"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ed1c24] text-white"><Flame :size="24" /></div><div><div class="text-[15px] font-extrabold text-[#d71920]">Yangın güvenliği, güvenli lezzet demektir.</div><div class="mt-0.5 text-[11px] text-[#64748b]">Düzenli kontrol, güvenli yarınlar. Olivium Burger.</div></div><div class="ml-auto hidden text-right text-[11px] font-semibold italic text-[#d71920] sm:block">Güvenli<br />Mekanlar<br />Daha Güzel Lezzetler!</div></div></section>
        </div>
      </main>
    </div>
  </div>
</template>
