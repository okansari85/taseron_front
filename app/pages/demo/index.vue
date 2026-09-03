<script setup lang="ts">
import { Building2, Check, ChevronRight, ClipboardList, FileCheck2, QrCode, ShieldCheck, Users, Wrench } from '@lucide/vue'
import { demoNavigation, demoRequest, demoRoles, demoSteps, type DemoRole } from '~/data/demo'

const activeRole = ref<DemoRole>('requester')
const activeStep = ref(1)
const requestApproved = ref(false)
const contractorReady = ref(false)
const qrReady = ref(false)
const securityPassed = ref(false)
const proposedDate = ref(demoRequest.date)
const proposedTime = ref(demoRequest.proposedTime)

const role = computed(() => demoRoles.find(item => item.id === activeRole.value) ?? demoRoles[0])
const navigation = computed(() => demoNavigation[activeRole.value])

function selectRole(roleId: DemoRole) {
  activeRole.value = roleId
  if (roleId === 'requester') activeStep.value = 1
  if (roleId === 'temporary') activeStep.value = 2
  if (roleId === 'security') activeStep.value = 5
  if (roleId === 'holding') activeStep.value = 3
  if (roleId === 'permanent') activeStep.value = 2
}

function markContractorReady() {
  contractorReady.value = true
  activeStep.value = 3
  activeRole.value = 'requester'
}

function approveRequest() {
  requestApproved.value = true
  activeStep.value = 4
  qrReady.value = true
}

function scanQr() {
  securityPassed.value = true
  activeStep.value = 5
  activeRole.value = 'security'
}

function resetDemo() {
  activeRole.value = 'requester'
  activeStep.value = 1
  requestApproved.value = false
  contractorReady.value = false
  qrReady.value = false
  securityPassed.value = false
  proposedDate.value = demoRequest.date
  proposedTime.value = demoRequest.proposedTime
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-white/90">
    <header class="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <div class="mx-auto flex max-w-[1500px] items-center gap-5 px-6 py-4">
        <div class="flex items-center gap-3 border-r border-gray-200 pr-5 dark:border-gray-700">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"><Building2 :size="19" /></div>
          <div><p class="text-xs font-medium uppercase tracking-wide text-gray-400">Taşeron Projesi</p><h1 class="text-base font-semibold">Rol Önizleme Merkezi</h1></div>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-xs text-gray-400">Senaryo</p>
          <p class="truncate text-sm font-medium">İş talebi → Taşeron → Onay → QR → Güvenlik</p>
        </div>
        <button class="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800" @click="resetDemo">Senaryoyu Sıfırla</button>
      </div>
    </header>

    <main class="mx-auto max-w-[1500px] px-6 py-6">
      <section class="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div class="mb-4 flex items-center justify-between gap-4">
          <div><p class="text-sm font-semibold">Rolü değiştir ve aynı süreci izle</p><p class="mt-1 text-xs text-gray-500">Bu alan yalnızca frontend önizlemesidir; gerçek kayıt oluşturmaz.</p></div>
          <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">Demo / Mock</span>
        </div>
        <div class="grid gap-2 md:grid-cols-5">
          <button v-for="item in demoRoles" :key="item.id" class="rounded-xl border px-4 py-3 text-left transition" :class="activeRole === item.id ? 'border-brand-500 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10' : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'" @click="selectRole(item.id)">
            <p class="text-sm font-semibold">{{ item.short }}</p><p class="mt-1 text-xs text-gray-500">{{ item.description }}</p>
          </button>
        </div>
      </section>

      <section class="mb-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div class="flex min-w-[900px] items-start">
          <template v-for="(step, index) in demoSteps" :key="step.id">
            <div class="flex min-w-[165px] flex-1 items-start gap-3">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold" :class="activeStep >= step.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-200 text-gray-400 dark:border-gray-700'">
                <Check v-if="activeStep > step.id" :size="16" /><span v-else>{{ step.id }}</span>
              </div>
              <div><p class="text-sm font-semibold">{{ step.label }}</p><p class="mt-0.5 text-xs text-gray-400">{{ step.description }}</p></div>
              <div v-if="index < demoSteps.length - 1" class="mt-4 h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </template>
        </div>
      </section>

      <div class="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <aside class="rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
          <div class="mb-3 rounded-xl bg-gray-50 p-3 dark:bg-gray-800/60"><p class="text-[11px] font-medium uppercase tracking-wide text-gray-400">Aktif rol</p><p class="mt-1 text-sm font-semibold">{{ role.name }}</p></div>
          <nav class="space-y-1">
            <button v-for="item in navigation" :key="item" class="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm" :class="item === navigation[0] ? 'bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'">
              <span>{{ item }}</span><ChevronRight :size="14" class="opacity-40" />
            </button>
          </nav>
        </aside>

        <section class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-3"><div><p class="text-sm text-gray-400">{{ role.name }}</p><h2 class="mt-1 text-2xl font-semibold">{{ activeRole === 'security' ? 'Giriş Kontrolü' : activeRole === 'holding' ? 'Operasyon Özeti' : 'İş Talebi' }}</h2></div><span class="rounded-full border px-3 py-1.5 text-xs font-medium" :class="securityPassed ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-500/10 dark:text-green-400' : 'border-gray-200 text-gray-500 dark:border-gray-700'">{{ securityPassed ? 'Giriş Onaylandı' : 'Canlı senaryo' }}</span></div>

          <div class="grid gap-4 md:grid-cols-4">
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><ClipboardList class="text-brand-500" :size="20"/><p class="mt-3 text-xs text-gray-400">Talep</p><p class="mt-1 font-semibold">{{ demoRequest.id }}</p></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><Wrench class="text-brand-500" :size="20"/><p class="mt-3 text-xs text-gray-400">Çalışma</p><p class="mt-1 font-semibold">{{ demoRequest.title }}</p></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><Users class="text-brand-500" :size="20"/><p class="mt-3 text-xs text-gray-400">Taşeron</p><p class="mt-1 font-semibold">{{ demoRequest.contractor }}</p></div>
            <div class="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"><ShieldCheck class="text-brand-500" :size="20"/><p class="mt-3 text-xs text-gray-400">Durum</p><p class="mt-1 font-semibold">{{ securityPassed ? 'Girişe Uygun' : requestApproved ? 'QR Hazır' : contractorReady ? 'Onay Bekliyor' : 'Taşeron Bekliyor' }}</p></div>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
            <div class="mb-5 flex items-start justify-between gap-4"><div><p class="text-xs font-medium uppercase tracking-wide text-gray-400">{{ demoRequest.id }}</p><h3 class="mt-1 text-lg font-semibold">{{ demoRequest.title }}</h3><p class="mt-1 text-sm text-gray-500">{{ demoRequest.company }} · {{ demoRequest.workplace }} · {{ demoRequest.location }}</p></div><div v-if="qrReady" class="flex h-16 w-16 items-center justify-center rounded-xl border border-dashed border-gray-300 dark:border-gray-700"><QrCode :size="38" /></div></div>

            <div class="grid gap-4 md:grid-cols-2">
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60"><p class="text-xs text-gray-400">Planlanan tarih</p><p class="mt-1 text-sm font-medium">{{ demoRequest.date }} · {{ demoRequest.time }}</p><p class="mt-3 text-xs text-gray-400">Taşeron önerisi</p><p class="mt-1 text-sm font-medium">{{ proposedDate }} · {{ proposedTime }}</p></div>
              <div class="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/60"><p class="text-xs text-gray-400">Atanan ekip</p><p class="mt-1 text-sm font-medium">Ahmet Yıldız · Burak Aydın</p><p class="mt-3 text-xs text-gray-400">Araç / Kimyasal</p><p class="mt-1 text-sm font-medium">1 araç · 0 kimyasal</p></div>
            </div>

            <div v-if="activeRole === 'temporary' && !contractorReady" class="mt-5 rounded-xl border border-brand-200 bg-brand-50/50 p-4 dark:border-brand-900 dark:bg-brand-500/5"><p class="text-sm font-semibold">Taşeron hazırlığı</p><div class="mt-3 grid gap-3 md:grid-cols-2"><label class="text-xs text-gray-500">Tarih<input v-model="proposedDate" class="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /></label><label class="text-xs text-gray-500">Saat<input v-model="proposedTime" class="mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900" /></label></div><button class="mt-4 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600" @click="markContractorReady">Hazırlığı Tamamla</button></div>

            <div v-if="activeRole === 'requester' && !requestApproved && contractorReady" class="mt-5 rounded-xl border border-green-200 bg-green-50/60 p-4 dark:border-green-900 dark:bg-green-500/5"><p class="text-sm font-semibold">Taşeron hazırlığı tamamlandı</p><p class="mt-1 text-sm text-gray-500">Önerilen tarih {{ proposedDate }} · {{ proposedTime }}. Evrak ve ekip kontrolü yapılmış durumda.</p><button class="mt-4 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600" @click="approveRequest">Arçelik Olarak Onayla</button></div>

            <div v-if="activeRole === 'security' && qrReady && !securityPassed" class="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div class="flex items-center gap-3"><QrCode :size="24"/><div><p class="text-sm font-semibold">QR / Barkod kontrolü</p><p class="text-xs text-gray-500">{{ demoRequest.qr }} · {{ demoRequest.location }} · Eğitim tamamlandı</p></div></div><button class="mt-4 rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600" @click="scanQr">QR'ı Tara ve Girişi Onayla</button></div>

            <div v-if="securityPassed" class="mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-500/10"><div class="flex h-9 w-9 items-center justify-center rounded-full bg-green-500 text-white"><Check :size="18" /></div><div><p class="text-sm font-semibold text-green-800 dark:text-green-300">Giriş onaylandı</p><p class="mt-0.5 text-xs text-green-700/80 dark:text-green-400">QR, talep, personel ve zorunlu eğitim kontrolleri başarılı.</p></div></div>

            <div v-if="activeRole === 'holding'" class="mt-5 grid gap-3 md:grid-cols-3"><div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><p class="text-xs text-gray-400">Açık iş talebi</p><p class="mt-1 text-2xl font-semibold">12</p></div><div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><p class="text-xs text-gray-400">Onay bekleyen</p><p class="mt-1 text-2xl font-semibold">4</p></div><div class="rounded-xl border border-gray-200 p-4 dark:border-gray-700"><p class="text-xs text-gray-400">Girişe hazır</p><p class="mt-1 text-2xl font-semibold">5</p></div></div>

            <div v-if="activeRole === 'permanent'" class="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-700"><div class="flex items-center gap-3"><FileCheck2 :size="22" class="text-brand-500"/><div><p class="text-sm font-semibold">Daimi taşeron görünümü</p><p class="mt-1 text-xs text-gray-500">Bu rol lokasyona bağlı sürekli taşeronun kendi evrak ve personel durumunu yönetir. İş talebi bazlı akıştan ayrıdır.</p></div></div></div>
          </div>
        </section>
      </div>
    </main>
  </div>
</template>
