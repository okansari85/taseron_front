<script setup lang="ts">
import { ArrowLeft, ArrowLeftRight, BarChart3, Building2, ChevronRight, Filter, LoaderCircle, Search, Settings, ShieldCheck, Tag, Users } from '@lucide/vue'
import { locationApi, type LocationBusinessEntity } from '~/api/location'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const context = useIsgDesktopContextStore()

const branches = ref<LocationBusinessEntity[]>([])
const loading = ref(true)
const search = ref('')
const selectedId = ref<number | null>(null)
const continuing = ref(false)

onMounted(async () => {
  if (!context.locationId) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  // Müstakil (tek şubeli) lokasyonlarda bu ekran hiç gösterilmemeli — mantık hatasıydı,
  // burada da select-location.vue'daki otomatik atlama mantığı tekrarlanıyor.
  if (context.isStandaloneLocation) {
    await navigateTo('/isg-portal/desktop/select-location')
    return
  }
  loading.value = true
  try {
    const all = await locationApi.businessEntities(context.locationId)
    branches.value = all.filter(b => b.type === 'company')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return branches.value
  return branches.value.filter(b => `${branchLabel(b)} ${b.pivot?.code ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

const branchBrand = (b: LocationBusinessEntity) => b.pivot?.brands?.[0] ?? null
const branchLabel = (b: LocationBusinessEntity) => branchBrand(b)?.name || b.company?.name || b.name
const branchPhoto = (b: LocationBusinessEntity) => b.pivot?.photos?.[0]?.photo_url ?? null

const selected = computed(() => branches.value.find(b => (b.pivot?.id ?? b.id) === selectedId.value) ?? null)

const continueNext = async () => {
  if (!selected.value || continuing.value) return
  continuing.value = true
  try {
    const b = selected.value
    context.setBranch({
      id: b.pivot?.id ?? b.id,
      name: branchLabel(b),
      code: b.pivot?.code,
      logo: branchBrand(b)?.logo_url,
      isActive: b.pivot?.is_active,
    })
    await navigateTo('/isg-portal/desktop')
  } finally {
    continuing.value = false
  }
}

const features = [
  { icon: ShieldCheck, title: 'Güvenli İş Yerleri', subtitle: 'Riskleri birlikte azaltalım.' },
  { icon: BarChart3, title: 'Verimli Süreçler', subtitle: 'Tüm denetimler tek ekranda.' },
  { icon: Users, title: 'Sürdürülebilir Gelecek', subtitle: 'İnsan odaklı, güvenli yarınlar.' },
]
</script>

<template>
  <IsgContextShell
    variant="location"
    image-src="/images/abc.png"
    headline="Güvenli İşletmeler Güçlü Gelecek"
    description="Yangın güvenliği ve taşeron yönetimi süreçlerinizi tek platformda yönetin. Daha güvenli, daha sürdürülebilir işletmeler için birlikte."
    :features="features"
  >
    <div class="isg-branch-page">
      <div class="isg-branch-topbar">
        <NuxtLink to="/isg-portal/desktop/select-location" class="isg-branch-back">
          <ArrowLeft :size="15" />
          Lokasyonlara Dön
        </NuxtLink>
        <div class="isg-branch-location">
          <span class="isg-branch-location-dot" />
          <span>{{ context.locationName }}</span>
        </div>
      </div>

      <div class="isg-branch-intro">
        <div>
          <p class="isg-branch-eyebrow">ÇALIŞMA ALANI</p>
          <h2>Şube Seç</h2>
          <p class="isg-branch-subtitle">{{ context.locationName }} lokasyonu için işlem yapacağınız şubeyi seçin.</p>
        </div>
        <div class="isg-branch-count">
          <strong>{{ branches.length }}</strong>
          <span>şube</span>
        </div>
      </div>

      <div class="isg-branch-toolbar">
        <div class="isg-branch-search">
          <Search :size="17" />
          <input v-model="search" type="search" placeholder="Şube adı, kodu veya marka ara..." />
        </div>
        <button type="button" class="isg-branch-filter">
          <Filter :size="16" />
          Filtrele
        </button>
      </div>

      <div v-if="loading" class="isg-branch-state">
        <LoaderCircle :size="22" class="animate-spin" />
        Şubeler yükleniyor...
      </div>

      <div v-else-if="!filtered.length" class="isg-branch-state is-empty">
        <span class="isg-branch-empty-icon"><Building2 :size="24" /></span>
        <div>
          <strong>Şube bulunamadı.</strong>
          <p>Arama kriterinizi değiştirerek tekrar deneyin.</p>
        </div>
      </div>

      <div v-else class="isg-branch-list">
        <button
          v-for="b in filtered"
          :key="b.pivot?.id ?? b.id"
          type="button"
          class="isg-branch-card"
          :class="{ 'is-selected': selectedId === (b.pivot?.id ?? b.id) }"
          @click="selectedId = b.pivot?.id ?? b.id"
        >
          <div class="isg-branch-photo">
            <img v-if="branchPhoto(b)" :src="branchPhoto(b)!" :alt="branchLabel(b)" />
            <span v-else class="isg-branch-photo-empty"><Building2 :size="25" /></span>
          </div>

          <div class="isg-branch-main">
            <div class="isg-branch-heading">
              <div class="min-w-0">
                <span class="isg-branch-label">ŞUBE</span>
                <h3>{{ branchLabel(b) }}</h3>
                <p>{{ context.locationName }}</p>
              </div>
              <ChevronRight :size="18" class="isg-branch-arrow" />
            </div>

            <div class="isg-branch-meta">
              <div class="isg-branch-meta-item">
                <span class="isg-branch-meta-icon">
                  <img v-if="branchBrand(b)?.logo_url" :src="branchBrand(b)!.logo_url!" :alt="branchLabel(b)" />
                  <span v-else>{{ branchLabel(b).charAt(0) }}</span>
                </span>
                <div>
                  <small>Marka</small>
                  <strong>{{ branchBrand(b)?.name || '—' }}</strong>
                </div>
              </div>
              <div class="isg-branch-meta-item">
                <span class="isg-branch-meta-icon"><Tag :size="14" /></span>
                <div>
                  <small>Şube kodu</small>
                  <strong>{{ b.pivot?.code || '—' }}</strong>
                </div>
              </div>
              <div class="isg-branch-meta-item">
                <span class="isg-branch-meta-icon"><Settings :size="14" /></span>
                <div>
                  <small>Ekipman</small>
                  <strong>{{ b.pivot?.equipment_count ?? 0 }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="isg-branch-select">
            <span class="isg-branch-status" :class="b.pivot?.is_active ? 'is-active' : 'is-passive'">
              {{ b.pivot?.is_active ? 'Aktif' : 'Pasif' }}
            </span>
            <span class="isg-branch-check" :class="{ 'is-checked': selectedId === (b.pivot?.id ?? b.id) }">
              <span v-if="selectedId === (b.pivot?.id ?? b.id)">✓</span>
            </span>
          </div>
        </button>
      </div>

      <div class="isg-branch-footer">
        <div class="isg-branch-help">
          <span class="isg-branch-help-icon">i</span>
          <div>
            <strong>Aradığınız şubeyi göremiyor musunuz?</strong>
            <p>Erişim talebi için sistem yöneticiniz ile iletişime geçin.</p>
          </div>
        </div>

        <div class="isg-branch-actions">
          <NuxtLink to="/isg-portal/desktop/select-location" class="isg-branch-cancel">
            <ArrowLeft :size="15" />
            Geri
          </NuxtLink>
          <button
            type="button"
            :disabled="!selected || continuing"
            class="isg-branch-continue"
            @click="continueNext"
          >
            <LoaderCircle v-if="continuing" :size="16" class="animate-spin" />
            {{ continuing ? 'Hazırlanıyor' : 'Devam Et' }}
            <ChevronRight :size="17" />
          </button>
        </div>
      </div>
    </div>
  </IsgContextShell>
</template>

<style scoped>
.isg-branch-page {
  width: 100%;
  max-width: 1180px;
  margin: 0 auto;
  padding: 30px 46px 38px;
}

.isg-branch-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26px;
}

.isg-branch-back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #697794;
  font-size: 11px;
  font-weight: 650;
  text-decoration: none;
}

.isg-branch-back:hover { color: #5149e8; }

.isg-branch-location {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #697794;
  font-size: 11px;
  font-weight: 650;
}

.isg-branch-location-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #5149e8;
  box-shadow: 0 0 0 3px #efefff;
}

.isg-branch-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.isg-branch-eyebrow {
  margin: 0 0 8px;
  color: #7e8caf;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .18em;
}

.isg-branch-intro h2 {
  margin: 0;
  color: #18265f;
  font-size: 30px;
  font-weight: 780;
  line-height: 1.08;
  letter-spacing: -.035em;
}

.isg-branch-subtitle {
  margin: 8px 0 0;
  color: #7886a6;
  font-size: 13px;
}

.isg-branch-count {
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: #8a95ac;
  font-size: 11px;
}

.isg-branch-count strong {
  color: #5149e8;
  font-size: 19px;
  font-weight: 750;
}

.isg-branch-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.isg-branch-search {
  display: flex;
  height: 43px;
  flex: 1;
  align-items: center;
  gap: 10px;
  max-width: 470px;
  padding: 0 14px;
  border: 1px solid #dfe5f0;
  border-radius: 9px;
  background: #fff;
  color: #8994ae;
}

.isg-branch-search:focus-within { border-color: #aaa7f3; }

.isg-branch-search input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #24315d;
  font-size: 12px;
}

.isg-branch-search input::placeholder { color: #9aa4ba; }

.isg-branch-filter {
  display: inline-flex;
  height: 43px;
  align-items: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid #dfe5f0;
  border-radius: 9px;
  background: #fff;
  color: #596782;
  font-size: 12px;
  font-weight: 650;
}

.isg-branch-filter:hover { border-color: #cbd2e2; }

.isg-branch-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.isg-branch-card {
  position: relative;
  display: grid;
  grid-template-columns: 112px minmax(0, 1fr) 54px;
  min-height: 148px;
  overflow: hidden;
  padding: 0;
  border: 1px solid #e0e5ef;
  border-radius: 11px;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color .18s, background .18s;
}

.isg-branch-card:hover { border-color: #c9cfe1; }

.isg-branch-card.is-selected {
  border-color: #bcb8f7;
  background: #fcfcff;
  box-shadow: inset 3px 0 0 #5149e8;
}

.isg-branch-photo {
  height: 100%;
  min-height: 148px;
  overflow: hidden;
  background: #f1f3f8;
}

.isg-branch-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.isg-branch-photo-empty {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  color: #9aa5ba;
}

.isg-branch-main {
  min-width: 0;
  padding: 17px 16px 15px;
}

.isg-branch-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.isg-branch-label {
  display: block;
  margin-bottom: 5px;
  color: #929db5;
  font-size: 8px;
  font-weight: 800;
  letter-spacing: .12em;
}

.isg-branch-card h3 {
  margin: 0;
  overflow: hidden;
  color: #1b285d;
  font-size: 15px;
  font-weight: 750;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.isg-branch-card p {
  margin: 4px 0 0;
  overflow: hidden;
  color: #8490aa;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.isg-branch-arrow {
  flex: 0 0 auto;
  margin-top: 2px;
  color: #b1b9cb;
}

.isg-branch-meta {
  display: flex;
  align-items: center;
  gap: 13px;
  margin-top: 20px;
}

.isg-branch-meta-item {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
}

.isg-branch-meta-icon {
  display: flex;
  width: 27px;
  height: 27px;
  flex: 0 0 27px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e3e7f1;
  border-radius: 7px;
  background: #fafbfe;
  color: #6e68e8;
  font-size: 10px;
  font-weight: 750;
}

.isg-branch-meta-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.isg-branch-meta-item div { min-width: 0; }

.isg-branch-meta-item small {
  display: block;
  color: #9aa4b8;
  font-size: 8px;
  line-height: 1.1;
}

.isg-branch-meta-item strong {
  display: block;
  max-width: 90px;
  margin-top: 3px;
  overflow: hidden;
  color: #303d68;
  font-size: 10px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.isg-branch-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 16px 10px 15px;
  border-left: 1px solid #edf0f5;
}

.isg-branch-status {
  padding: 4px 7px;
  border-radius: 999px;
  font-size: 8px;
  font-weight: 750;
}

.isg-branch-status.is-active { background: #edf9f3; color: #299668; }
.isg-branch-status.is-passive { background: #f2f3f6; color: #8992a4; }

.isg-branch-check {
  display: flex;
  width: 27px;
  height: 27px;
  align-items: center;
  justify-content: center;
  border: 1px solid #dfe4ef;
  border-radius: 50%;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
}

.isg-branch-check.is-checked {
  border-color: #5149e8;
  background: #5149e8;
}

.isg-branch-state {
  display: flex;
  min-height: 210px;
  align-items: center;
  justify-content: center;
  gap: 9px;
  color: #8b96ab;
  font-size: 12px;
}

.isg-branch-state.is-empty { gap: 12px; }
.isg-branch-empty-icon { display: flex; width: 42px; height: 42px; align-items: center; justify-content: center; border-radius: 10px; background: #f0f1ff; color: #6b65e8; }
.isg-branch-state strong { color: #364267; font-size: 12px; }
.isg-branch-state p { margin: 3px 0 0; color: #9aa3b5; font-size: 10px; }

.isg-branch-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
}

.isg-branch-help {
  display: flex;
  align-items: center;
  gap: 10px;
}

.isg-branch-help-icon {
  display: flex;
  width: 31px;
  height: 31px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f0f1ff;
  color: #635de8;
  font-size: 12px;
  font-weight: 800;
}

.isg-branch-help strong { display: block; color: #4b5877; font-size: 10px; }
.isg-branch-help p { margin: 2px 0 0; color: #9aa4b7; font-size: 9px; }

.isg-branch-actions { display: flex; align-items: center; gap: 9px; }

.isg-branch-cancel,
.isg-branch-continue {
  display: inline-flex;
  height: 42px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  text-decoration: none;
}

.isg-branch-cancel {
  padding: 0 14px;
  border: 1px solid #dfe4ee;
  background: #fff;
  color: #68748f;
}

.isg-branch-continue {
  min-width: 118px;
  padding: 0 16px;
  border: 0;
  background: #5149e8;
  color: #fff;
  box-shadow: none;
}

.isg-branch-continue:disabled { cursor: not-allowed; opacity: .4; }

@media (max-width: 1100px) {
  .isg-branch-page { padding-left: 30px; padding-right: 30px; }
  .isg-branch-list { grid-template-columns: 1fr; }
}

@media (max-width: 700px) {
  .isg-branch-page { padding: 22px 18px 30px; }
  .isg-branch-topbar { margin-bottom: 20px; }
  .isg-branch-intro { align-items: flex-start; }
  .isg-branch-count { display: none; }
  .isg-branch-toolbar { flex-direction: column; align-items: stretch; }
  .isg-branch-search { max-width: none; }
  .isg-branch-card { grid-template-columns: 88px minmax(0, 1fr) 48px; }
  .isg-branch-meta { gap: 8px; }
  .isg-branch-meta-item:nth-child(1) { display: none; }
  .isg-branch-footer { align-items: stretch; flex-direction: column; }
  .isg-branch-actions { justify-content: flex-end; }
}
</style>
