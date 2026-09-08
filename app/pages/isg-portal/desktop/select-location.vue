<script setup lang="ts">
import { BarChart3, Building2, ChevronRight, Filter, Info, LoaderCircle, MapPin, Search, Settings, ShieldCheck, Users } from '@lucide/vue'
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
          <strong>{{ locations.length }}</strong> lokasyon
        </div>
      </div>

      <div class="isg-location-toolbar">
        <div class="isg-search-box">
          <Search :size="17" />
          <input v-model="search" type="search" placeholder="Lokasyon adı, şehir veya ilçe ara..." />
        </div>
        <button type="button" class="isg-filter-button">
          <Filter :size="16" />
          Filtrele
        </button>
      </div>

      <div v-if="loading" class="isg-location-state">
        <LoaderCircle :size="22" class="animate-spin" />
        Lokasyonlar yükleniyor...
      </div>

      <div v-else-if="!filtered.length" class="isg-location-state is-empty">
        <span class="isg-empty-icon"><Building2 :size="25" /></span>
        <div>
          <strong>Lokasyon bulunamadı.</strong>
          <p>Arama kriterinizi değiştirerek tekrar deneyin.</p>
        </div>
      </div>

      <TransitionGroup v-else name="location-list" tag="div" class="isg-location-list">
        <button
          v-for="location in filtered"
          :key="location.id"
          type="button"
          class="isg-location-card"
          :class="{ 'is-selected': selectedId === location.id }"
          @click="selectedId = location.id"
        >
          <div class="isg-location-card-image">
            <img v-if="location.image" :src="resolveImageUrl(location.image)" :alt="location.name" />
            <Building2 v-else :size="27" />
            <span class="isg-location-image-overlay" />
          </div>

          <div class="isg-location-card-main">
            <div class="isg-location-card-heading">
              <div class="min-w-0">
                <span class="isg-location-card-label">LOKASYON</span>
                <h3>{{ location.name }}</h3>
                <p>{{ [location.district?.name, location.city?.name].filter(Boolean).join(' / ') || 'Konum bilgisi yok' }}</p>
              </div>
            </div>

            <div class="isg-location-card-meta">
              <div class="isg-location-meta-item">
                <span class="isg-location-meta-icon"><MapPin :size="15" /></span>
                <div>
                  <small>Fiziksel konum</small>
                  <strong>{{ [location.district?.name, location.city?.name].filter(Boolean).join(', ') || '—' }}</strong>
                </div>
              </div>

              <div class="isg-location-meta-item is-compact">
                <span class="isg-location-meta-icon"><Building2 :size="15" /></span>
                <div>
                  <small>Şube</small>
                  <strong>{{ location.branch_count ?? 0 }}</strong>
                </div>
              </div>

              <div class="isg-location-meta-item is-compact">
                <span class="isg-location-meta-icon"><Settings :size="15" /></span>
                <div>
                  <small>Ekipman</small>
                  <strong>{{ location.equipment_count ?? 0 }}</strong>
                </div>
              </div>
            </div>
          </div>

          <div class="isg-location-card-select">
            <span>{{ selectedId === location.id ? 'Seçildi' : 'Seç' }}</span>
            <span class="isg-location-check" :class="{ 'is-checked': selectedId === location.id }">
              <span v-if="selectedId === location.id">✓</span>
            </span>
          </div>
        </button>
      </TransitionGroup>

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
  </IsgContextShell>
</template>

<style scoped>
.isg-location-page { width: 100%; max-width: 1180px; margin: 0 auto; padding: 38px 46px 42px; }
.isg-location-intro { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; margin-bottom: 22px; }
.isg-location-eyebrow { margin: 0 0 8px; color: #7e8caf; font-size: 10px; font-weight: 800; letter-spacing: .18em; }
.isg-location-intro h2 { margin: 0; color: #18265f; font-size: 30px; font-weight: 780; line-height: 1.08; letter-spacing: -.035em; }
.isg-location-subtitle { margin: 8px 0 0; color: #7886a6; font-size: 13px; }
.isg-location-counter { display: inline-flex; align-items: center; gap: 6px; padding: 9px 13px; border: 1px solid #e2e7f2; border-radius: 10px; background: rgba(255,255,255,.9); color: #74809d; font-size: 11px; }
.isg-location-counter strong { color: #5149e8; font-size: 12px; }
.isg-location-counter-dot { width: 7px; height: 7px; border-radius: 50%; background: #5149e8; box-shadow: 0 0 0 3px #efefff; }
.isg-location-toolbar { display: flex; align-items: center; gap: 10px; margin-bottom: 17px; }
.isg-search-box { display: flex; height: 43px; flex: 1; align-items: center; gap: 10px; max-width: 460px; padding: 0 14px; border: 1px solid #dfe5f0; border-radius: 10px; background: #fff; color: #8994ae; transition: border-color .2s, box-shadow .2s; }
.isg-search-box:focus-within { border-color: #aaa7f3; box-shadow: 0 0 0 3px rgba(81,73,237,.07); }
.isg-search-box input { width: 100%; border: 0; outline: 0; background: transparent; color: #24315d; font-size: 12px; }
.isg-search-box input::placeholder { color: #9aa4ba; }
.isg-filter-button { display: inline-flex; height: 43px; align-items: center; gap: 8px; padding: 0 15px; border: 1px solid #dfe5f0; border-radius: 10px; background: #fff; color: #596782; font-size: 12px; font-weight: 650; transition: .2s; }
.isg-filter-button:hover { border-color: #cbd2e2; background: #fafbfe; }
.isg-location-list { display: flex; flex-direction: column; gap: 11px; }
.location-list-move, .location-list-enter-active, .location-list-leave-active { transition: none !important; }
.location-list-enter-from, .location-list-leave-to { opacity: 1; transform: none; }
.location-list-leave-active { position: static; width: auto; }
.isg-location-card { position: relative; display: grid; grid-template-columns: 148px minmax(0,1fr) 88px; width: 100%; min-height: 144px; overflow: hidden; padding: 0; border: 1px solid #e2e7f1; border-radius: 13px; background: #fff; color: inherit; text-align: left; cursor: pointer; transition: border-color .2s, box-shadow .2s, transform .18s ease, background .2s; }
.isg-location-card:hover { border-color: #cbd1e5; box-shadow: 0 6px 18px rgba(42,55,103,.07); transform: perspective(900px) rotateX(.35deg) rotateY(-.45deg) translateY(-1px); }
.isg-location-card.is-selected { border-color: #bdb9fb; background: #fbfbff; box-shadow: inset 3px 0 0 #5149e8; }
.isg-location-card-image { position: relative; width: 100%; height: 100%; min-height: 144px; overflow: hidden; background: #eef1f7; color: #8b96af; }
.isg-location-card-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .25s ease; }
.isg-location-card:hover .isg-location-card-image img { transform: scale(1.025); }
.isg-location-image-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, rgba(19,32,79,.03), rgba(19,32,79,.11)); pointer-events: none; }
.isg-location-card-main { min-width: 0; padding: 20px 22px 17px; }
.isg-location-card-label { display: block; margin-bottom: 5px; color: #929db5; font-size: 8px; font-weight: 800; letter-spacing: .12em; }
.isg-location-card h3 { margin: 0; overflow: hidden; color: #1b285d; font-size: 17px; font-weight: 750; line-height: 1.2; letter-spacing: -.015em; text-overflow: ellipsis; white-space: nowrap; }
.isg-location-card-heading p { margin: 5px 0 0; overflow: hidden; color: #7f8ba7; font-size: 10px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
.isg-location-card-meta { display: flex; align-items: center; gap: 30px; margin-top: 18px; }
.isg-location-meta-item { display: flex; min-width: 0; align-items: center; gap: 9px; }
.isg-location-meta-item.is-compact { min-width: 72px; }
.isg-location-meta-icon { display: inline-flex; width: 31px; height: 31px; flex: 0 0 31px; align-items: center; justify-content: center; border: 1px solid #e9ebf4; border-radius: 9px; background: #f7f8fc; color: #677596; }
.isg-location-card.is-selected .isg-location-meta-icon { border-color: #e8e6ff; background: #f3f2ff; color: #5952e8; }
.isg-location-meta-item small { display: block; margin-bottom: 2px; color: #9aa3b7; font-size: 8px; font-weight: 600; }
.isg-location-meta-item strong { display: block; overflow: hidden; max-width: 170px; color: #4d5b79; font-size: 10px; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.isg-location-meta-item.is-compact strong { color: #27345f; font-size: 13px; }
.isg-location-card-select { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; border-left: 1px solid #edf0f5; color: #9aa3b8; font-size: 9px; font-weight: 650; }
.isg-location-card.is-selected .isg-location-card-select { border-left-color: #e7e5fb; color: #5149e8; }
.isg-location-check { display: inline-flex; width: 24px; height: 24px; align-items: center; justify-content: center; border: 1px solid #dfe4ee; border-radius: 50%; background: #fff; color: #fff; font-size: 12px; font-weight: 800; }
.isg-location-check.is-checked { border-color: #5149e8; background: #5149e8; box-shadow: 0 0 0 4px #efefff; }
.isg-location-state { display: flex; min-height: 280px; align-items: center; justify-content: center; gap: 10px; color: #8994ad; font-size: 12px; }
.isg-location-state.is-empty { flex-direction: column; gap: 10px; }
.isg-empty-icon { display: inline-flex; width: 48px; height: 48px; align-items: center; justify-content: center; border-radius: 13px; background: #f0f1ff; color: #6861e8; }
.isg-location-state strong { display: block; color: #455273; font-size: 12px; text-align: center; }
.isg-location-state p { margin: 4px 0 0; color: #9aa4b8; font-size: 10px; text-align: center; }
.isg-location-footer { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-top: 16px; padding: 14px 3px 0; }
.isg-location-help { display: flex; min-width: 0; align-items: center; gap: 10px; }
.isg-help-icon { display: inline-flex; width: 32px; height: 32px; flex: 0 0 32px; align-items: center; justify-content: center; border-radius: 9px; background: #f0f1ff; color: #5c55e8; }
.isg-location-help strong { display: block; color: #56627e; font-size: 10px; font-weight: 650; }
.isg-location-help p { margin: 3px 0 0; color: #9aa3b7; font-size: 9px; }
.isg-continue-button { display: inline-flex; height: 41px; min-width: 132px; flex: 0 0 auto; align-items: center; justify-content: center; gap: 8px; padding: 0 18px; border: 0; border-radius: 10px; background: #5149ed; color: #fff; box-shadow: 0 6px 15px rgba(81,73,237,.18); font-size: 11px; font-weight: 700; transition: .2s; }
.isg-continue-button:hover:not(:disabled) { background: #453ddd; box-shadow: 0 8px 19px rgba(81,73,237,.23); transform: translateY(-1px); }
.isg-continue-button:disabled { cursor: not-allowed; opacity: .42; }
@media (max-width:1120px) { .isg-location-page { padding-right:30px; padding-left:30px; } .isg-location-card { grid-template-columns:128px minmax(0,1fr) 78px; } .isg-location-card-meta { gap:18px; } }
@media (max-width:820px) { .isg-location-page { padding:28px 22px 34px; } .isg-location-card { grid-template-columns:112px minmax(0,1fr) 64px; } .isg-location-card-main { padding:17px; } .isg-location-card-meta { gap:12px; margin-top:14px; } .isg-location-meta-item:first-child { max-width:48%; } .isg-location-meta-item:first-child strong { max-width:110px; } }
@media (max-width:640px) { .isg-location-page { padding:22px 14px 28px; } .isg-location-intro { align-items:flex-start; } .isg-location-counter { display:none; } .isg-location-intro h2 { font-size:26px; } .isg-filter-button { width:43px; padding:0; justify-content:center; font-size:0; } .isg-location-card { grid-template-columns:88px minmax(0,1fr) 48px; min-height:128px; } .isg-location-card-image { min-height:128px; } .isg-location-card-main { padding:14px 12px; } .isg-location-card-label { margin-bottom:4px; font-size:7px; } .isg-location-card h3 { font-size:14px; } .isg-location-card-heading p { font-size:9px; } .isg-location-card-meta { margin-top:11px; } .isg-location-meta-item:first-child { display:none; } .isg-location-meta-item.is-compact { min-width:54px; } .isg-location-meta-icon { width:27px; height:27px; flex-basis:27px; } .isg-location-meta-item small { font-size:7px; } .isg-location-meta-item.is-compact strong { font-size:12px; } .isg-location-card-select { gap:7px; font-size:8px; } .isg-location-check { width:21px; height:21px; } .isg-location-footer { align-items:stretch; flex-direction:column; padding-top:13px; } .isg-continue-button { width:100%; } }
</style>
