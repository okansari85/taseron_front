<script setup lang="ts">
import { BarChart3, Building2, ChevronRight, Filter, Info, LoaderCircle, Search, Settings, ShieldCheck, Users } from '@lucide/vue'
import { locationApi, type LocationApiItem } from '~/api/location'
import { useIsgDesktopContextStore } from '~/stores/isgDesktopContext'

definePageMeta({ layout: false })

const { $toast } = useNuxtApp()
const auth = useAuth()
const context = useIsgDesktopContextStore()

const locations = ref<LocationApiItem[]>([])
const loading = ref(true)
const search = ref('')
const selectedId = ref<number | null>(context.locationId)
const continuing = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    locations.value = await locationApi.list(auth.user.value?.tenant_id ?? '')
  } finally {
    loading.value = false
  }
})

const filtered = computed(() => {
  const term = search.value.trim().toLocaleLowerCase('tr-TR')
  if (!term) return locations.value
  return locations.value.filter(l => `${l.name} ${l.city?.name ?? ''} ${l.district?.name ?? ''}`.toLocaleLowerCase('tr-TR').includes(term))
})

const config = useRuntimeConfig()
const apiBaseUrl = String(config.public.apiBaseUrl || '').replace(/\/$/, '')
const resolveImageUrl = (image?: string | null) => {
  if (!image) return ''
  if (/^https?:\/\//i.test(image)) return image
  return `${apiBaseUrl}/storage/${String(image).replace(/^\/+/, '').replace(/^storage\//, '')}`
}

const selected = computed(() => locations.value.find(l => l.id === selectedId.value) ?? null)

const continueNext = async () => {
  if (!selected.value || continuing.value) return
  continuing.value = true
  try {
    const location = selected.value
    context.setLocation({
      id: location.id,
      name: location.name,
      city: location.city?.name,
      district: location.district?.name,
      image: resolveImageUrl(location.image),
      branchCount: location.branch_count ?? 0,
    })

    if (context.isStandaloneLocation) {
      const entities = await locationApi.businessEntities(location.id)
      const only = entities.find(e => e.type === 'company') ?? entities[0]
      if (!only) {
        $toast.error('Bu lokasyona bağlı bir şube bulunamadı.')
        return
      }
      context.setBranch({
        id: only.pivot?.id ?? only.id,
        name: only.pivot?.brands?.[0]?.name || only.company?.name || only.name,
        code: only.pivot?.code,
        logo: only.pivot?.brands?.[0]?.logo_url,
        isActive: only.pivot?.is_active,
      })
      await navigateTo('/isg-portal/desktop')
      return
    }

    await navigateTo('/isg-portal/desktop/select-branch')
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
    <div class="isg-location-page">
      <div class="isg-location-intro">
        <div>
          <p class="isg-location-eyebrow">ÇALIŞMA ALANI</p>
          <h2>Lokasyon Seç</h2>
          <p class="isg-location-subtitle">İşlem yapmak istediğiniz lokasyonu seçin.</p>
        </div>
        <div class="isg-location-counter">
          <span class="isg-location-counter-dot" />
          {{ locations.length }} lokasyon
        </div>
      </div>

      <div class="isg-location-panel">
        <div class="isg-location-panel-head">
          <div class="isg-location-tabs">
            <span class="isg-location-tab is-active">Lokasyonlar</span>
            <span class="isg-location-tab">Erişiminiz Olanlar</span>
          </div>
        </div>

        <div class="isg-location-toolbar">
          <div class="isg-search-box">
            <Search :size="17" />
            <input v-model="search" type="search" placeholder="Lokasyon ara..." />
          </div>
          <button type="button" class="isg-filter-button">
            <Filter :size="16" />
            Filtrele
          </button>
        </div>

        <div class="isg-location-table-head">
          <span>LOKASYON</span>
          <span>FİZİKSEL KONUM</span>
          <span>ŞUBELER</span>
          <span>EKİPMAN</span>
          <span class="text-right">İŞLEM</span>
        </div>

        <div v-if="loading" class="isg-location-state">
          <LoaderCircle :size="22" class="animate-spin" />
          Lokasyonlar yükleniyor...
        </div>

        <div v-else-if="!filtered.length" class="isg-location-state is-empty">
          <Building2 :size="26" />
          <div>
            <strong>Lokasyon bulunamadı.</strong>
            <p>Arama kriterinizi değiştirerek tekrar deneyin.</p>
          </div>
        </div>

        <div v-else class="isg-location-list">
          <button
            v-for="location in filtered"
            :key="location.id"
            type="button"
            class="isg-location-row"
            :class="{ 'is-selected': selectedId === location.id }"
            @click="selectedId = location.id"
          >
            <div class="isg-location-name-cell">
              <div class="isg-location-image">
                <img v-if="location.image" :src="resolveImageUrl(location.image)" :alt="location.name" />
                <Building2 v-else :size="22" />
              </div>
              <div class="min-w-0">
                <p class="isg-location-name">{{ location.name }}</p>
                <p class="isg-location-region">{{ [location.district?.name, location.city?.name].filter(Boolean).join(' / ') || 'Konum bilgisi yok' }}</p>
              </div>
            </div>

            <div class="isg-location-address">
              <span class="isg-location-pin"><span /></span>
              <span>{{ [location.district?.name, location.city?.name].filter(Boolean).join(', ') || '—' }}</span>
            </div>

            <div class="isg-location-metric">
              <span class="isg-metric-badge">{{ location.branch_count ?? 0 }}</span>
              <span>şube</span>
            </div>

            <div class="isg-location-metric">
              <span class="isg-metric-badge">{{ location.equipment_count ?? 0 }}</span>
              <span>ekipman</span>
            </div>

            <div class="isg-location-action">
              <span class="isg-select-state">{{ selectedId === location.id ? 'Seçildi' : 'Seç' }}</span>
              <span class="isg-chevron"><ChevronRight :size="17" /></span>
            </div>
          </button>
        </div>

        <div class="isg-location-footer">
          <div class="isg-location-help">
            <span class="isg-help-icon"><Info :size="15" /></span>
            <div>
              <strong>Listede aradığınız lokasyonu göremiyor musunuz?</strong>
              <p>Erişim talebi için sistem yöneticiniz ile iletişime geçin.</p>
            </div>
          </div>

          <button
            type="button"
            :disabled="!selected || continuing"
            class="isg-continue-button"
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
.isg-location-page {
  width: 100%;
  max-width: 1220px;
  margin: 0 auto;
  padding: 34px 42px 36px;
}

.isg-location-intro {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.isg-location-eyebrow {
  margin: 0 0 7px;
  color: #7a89b0;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .16em;
}

.isg-location-intro h2 {
  margin: 0;
  color: #17245f;
  font-size: 29px;
  font-weight: 750;
  line-height: 1.15;
  letter-spacing: -.025em;
}

.isg-location-subtitle {
  margin: 7px 0 0;
  color: #7885a5;
  font-size: 13px;
  line-height: 1.45;
}

.isg-location-counter {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #e5e9f4;
  border-radius: 9px;
  background: #fff;
  color: #657294;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(42, 58, 106, .035);
}

.isg-location-counter-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4c46e8;
  box-shadow: 0 0 0 3px #efefff;
}

.isg-location-panel {
  overflow: hidden;
  border: 1px solid #e3e7f1;
  border-radius: 13px;
  background: #fff;
  box-shadow: 0 5px 22px rgba(37, 51, 93, .045);
}

.isg-location-panel-head {
  height: 58px;
  border-bottom: 1px solid #edf0f6;
}

.isg-location-tabs {
  display: flex;
  height: 100%;
  align-items: stretch;
  padding-left: 20px;
  gap: 25px;
}

.isg-location-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  color: #6e7b9c;
  font-size: 12px;
  font-weight: 650;
}

.isg-location-tab.is-active {
  color: #4b46e9;
}

.isg-location-tab.is-active::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: #5149ed;
  content: '';
}

.isg-location-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid #edf0f6;
}

.isg-search-box {
  display: flex;
  height: 42px;
  flex: 1;
  align-items: center;
  gap: 10px;
  max-width: 410px;
  padding: 0 13px;
  border: 1px solid #e0e5ef;
  border-radius: 9px;
  background: #fff;
  color: #8792ac;
  transition: border-color .2s, box-shadow .2s;
}

.isg-search-box:focus-within {
  border-color: #aaa7f5;
  box-shadow: 0 0 0 3px rgba(81, 73, 237, .07);
}

.isg-search-box input {
  width: 100%;
  border: 0;
  outline: 0;
  background: transparent;
  color: #24315d;
  font-size: 12px;
}

.isg-search-box input::placeholder {
  color: #9aa4bb;
}

.isg-filter-button {
  display: inline-flex;
  height: 42px;
  align-items: center;
  gap: 8px;
  padding: 0 15px;
  border: 1px solid #e0e5ef;
  border-radius: 9px;
  background: #fff;
  color: #53617f;
  font-size: 12px;
  font-weight: 600;
}

.isg-filter-button:hover {
  border-color: #cfd5e4;
  background: #fafbfe;
}

.isg-location-table-head,
.isg-location-row {
  display: grid;
  grid-template-columns: minmax(260px, 1.55fr) minmax(170px, 1fr) 110px 110px minmax(100px, .65fr);
  align-items: center;
  column-gap: 20px;
}

.isg-location-table-head {
  min-height: 43px;
  padding: 0 20px;
  border-bottom: 1px solid #edf0f6;
  background: #fbfcfe;
  color: #7b87a4;
  font-size: 9px;
  font-weight: 750;
  letter-spacing: .055em;
}

.isg-location-row {
  width: 100%;
  min-height: 92px;
  padding: 13px 20px;
  border: 0;
  border-bottom: 1px solid #edf0f6;
  background: #fff;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .18s, box-shadow .18s;
}

.isg-location-row:last-child {
  border-bottom: 0;
}

.isg-location-row:hover {
  background: #fafbff;
}

.isg-location-row.is-selected {
  background: #f7f7ff;
  box-shadow: inset 3px 0 0 #5149ed;
}

.isg-location-name-cell {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 13px;
}

.isg-location-image {
  display: flex;
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid #e6e9f0;
  border-radius: 10px;
  background: #f2f4f9;
  color: #9aa5be;
}

.isg-location-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.isg-location-name {
  margin: 0;
  overflow: hidden;
  color: #1d2a59;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.isg-location-region {
  margin: 5px 0 0;
  overflow: hidden;
  color: #8290ae;
  font-size: 10px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.isg-location-address {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  color: #5f6e8e;
  font-size: 11px;
  line-height: 1.4;
}

.isg-location-pin {
  position: relative;
  display: inline-flex;
  width: 15px;
  height: 15px;
  flex: 0 0 15px;
  align-items: center;
  justify-content: center;
  border: 1.5px solid #7786a8;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.isg-location-pin span {
  width: 4px;
  height: 4px;
  border: 1px solid #7786a8;
  border-radius: 50%;
}

.isg-location-metric {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #7c88a3;
  font-size: 10px;
}

.isg-metric-badge {
  display: inline-flex;
  min-width: 30px;
  height: 28px;
  align-items: center;
  justify-content: center;
  padding: 0 7px;
  border-radius: 8px;
  background: #f0efff;
  color: #5149e7;
  font-size: 11px;
  font-weight: 750;
}

.isg-location-action {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 9px;
}

.isg-select-state {
  color: #8b96ad;
  font-size: 10px;
  font-weight: 650;
}

.is-selected .isg-select-state {
  color: #5149e7;
}

.isg-chevron {
  display: inline-flex;
  width: 31px;
  height: 31px;
  align-items: center;
  justify-content: center;
  border: 1px solid #e3e7f0;
  border-radius: 8px;
  color: #8792aa;
  background: #fff;
}

.is-selected .isg-chevron {
  border-color: #d8d6ff;
  background: #eeedff;
  color: #5149e7;
}

.isg-location-state {
  display: flex;
  min-height: 260px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8792ab;
  font-size: 12px;
}

.isg-location-state.is-empty {
  flex-direction: column;
  gap: 8px;
}

.isg-location-state.is-empty > svg {
  color: #a1abc0;
}

.isg-location-state strong {
  display: block;
  color: #455273;
  font-size: 12px;
  text-align: center;
}

.isg-location-state p {
  margin: 4px 0 0;
  color: #9aa4b8;
  font-size: 10px;
  text-align: center;
}

.isg-location-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 20px;
  border-top: 1px solid #edf0f6;
  background: #fcfdff;
}

.isg-location-help {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.isg-help-icon {
  display: inline-flex;
  width: 31px;
  height: 31px;
  flex: 0 0 31px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f0f1ff;
  color: #5b55e9;
}

.isg-location-help strong {
  display: block;
  color: #495674;
  font-size: 10px;
  font-weight: 650;
}

.isg-location-help p {
  margin: 3px 0 0;
  color: #98a1b4;
  font-size: 9px;
}

.isg-continue-button {
  display: inline-flex;
  height: 40px;
  min-width: 130px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 17px;
  border: 0;
  border-radius: 9px;
  background: #5149ed;
  color: #fff;
  box-shadow: 0 5px 13px rgba(81, 73, 237, .17);
  font-size: 11px;
  font-weight: 700;
  transition: transform .18s, box-shadow .18s, background .18s;
}

.isg-continue-button:hover:not(:disabled) {
  background: #453dde;
  box-shadow: 0 7px 17px rgba(81, 73, 237, .22);
  transform: translateY(-1px);
}

.isg-continue-button:disabled {
  cursor: not-allowed;
  opacity: .42;
}

@media (max-width: 1180px) {
  .isg-location-page {
    padding-right: 28px;
    padding-left: 28px;
  }

  .isg-location-table-head,
  .isg-location-row {
    grid-template-columns: minmax(230px, 1.4fr) minmax(150px, .9fr) 90px 90px minmax(90px, .55fr);
    column-gap: 13px;
  }
}

@media (max-width: 900px) {
  .isg-location-page {
    padding: 26px 20px 28px;
  }

  .isg-location-table-head {
    display: none;
  }

  .isg-location-row {
    grid-template-columns: 1fr auto;
    row-gap: 10px;
    padding: 14px 16px;
  }

  .isg-location-address {
    grid-column: 1 / 2;
  }

  .isg-location-metric {
    display: none;
  }

  .isg-location-action {
    grid-column: 2;
    grid-row: 1 / span 2;
  }
}

@media (max-width: 640px) {
  .isg-location-page {
    padding: 22px 14px 24px;
  }

  .isg-location-intro {
    align-items: flex-start;
  }

  .isg-location-counter {
    display: none;
  }

  .isg-location-intro h2 {
    font-size: 25px;
  }

  .isg-location-panel-head {
    height: 52px;
  }

  .isg-location-tabs {
    padding-left: 16px;
    gap: 18px;
  }

  .isg-location-toolbar {
    padding: 14px 15px;
  }

  .isg-filter-button {
    padding: 0 11px;
  }

  .isg-filter-button {
    font-size: 0;
  }

  .isg-filter-button svg {
    margin: 0;
  }

  .isg-location-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .isg-continue-button {
    width: 100%;
  }
}
</style>
