<script setup lang="ts">
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Flame,
  Gauge,
  HardHat,
  History,
  PanelTop,
  ShieldCheck,
  ShieldAlert,
  Sprout,
  Tank,
  FileText,
  LayoutGrid,
  List,
} from 'lucide-vue-next'
import { useFireInspectionStore } from '~/stores/fireInspection'

definePageMeta({ layout: 'isg-portal' })

const fireInspection = useFireInspectionStore()
const activeTab = ref('Sistemler')
const viewMode = ref<'cards' | 'list'>('cards')

const tabs = ['Sistemler', 'Genel Bilgiler', 'Kontrol Maddeleri', 'Uygunsuzluklar', 'Özet', 'Dosyalar']

const systems = [
  { name: 'Yangın Pompa Dairesi', description: '2 ana + 1 jokey pompa', status: 'Uygunsuzluk Var', statusClass: 'danger', controls: 14, defects: 12, icon: Gauge },
  { name: 'Yangın Dolapları', description: '20 adet', status: 'Uygunsuzluk Var', statusClass: 'danger', controls: 16, defects: 6, progress: 100, icon: PanelTop },
  { name: 'Hidrant Sistemi', description: 'Mevcut', status: 'Kontrol Edilmedi', statusClass: 'neutral', controls: 3, defects: 0, icon: Droplets },
  { name: 'Sprinkler Sistemi', description: 'Upright, Pendent', status: 'Uygun', statusClass: 'success', controls: 12, defects: 0, icon: Sprout },
  { name: 'Yangın Su Deposu', description: '200 m³', status: 'Uygun', statusClass: 'success', controls: 4, defects: 0, icon: Tank },
  { name: 'Sabit Boru Tesisatı', description: 'Mevcut', status: 'Kısmi Uygun', statusClass: 'warning', controls: 3, defects: 1, icon: Droplets },
]

const defectStats = [
  { name: 'Yangın Dolapları', value: 6 },
  { name: 'Pompa Dairesi', value: 4 },
  { name: 'Sabit Boru Tesisatı', value: 1 },
  { name: 'Hidrant Sistemi', value: 0 },
  { name: 'Sprinkler Sistemi', value: 0 },
  { name: 'Su Deposu', value: 0 },
]

const facilityInfo = [
  { label: 'Söndürme Sistemi', value: 'Sulu', icon: Droplets },
  { label: 'Su Deposu Kapasitesi', value: '200 m³', icon: Tank },
  { label: 'Sprinkler Tipi', value: 'Upright, Pendent', icon: Sprout },
  { label: 'Bina Kullanım Amacı', value: 'Depo', icon: HardHat },
  { label: 'Bina / Yapı Yüksekliği', value: '-', icon: Activity },
  { label: 'Toplam Kapalı Alan', value: '-', icon: LayoutGrid },
  { label: 'Yangın Tehlike Sınıfı', value: '-', icon: ShieldAlert },
]

const locationName = computed(() => fireInspection.locationName || 'Beylikdüzü OSB')
const branchName = computed(() => fireInspection.branchName || 'Yangın Söndürme Sistemleri')
</script>

<template>
  <div class="fire-status-page">
    <div class="page-header">
      <div>
        <div class="eyebrow">YANGIN SÖNDÜRME SİSTEMLERİ</div>
        <h1>Yangın Tesisatı Durumu</h1>
        <p>Son periyodik kontrol raporuna göre tesisatın genel durumu ve sistem bazlı sonuçları.</p>
      </div>

      <button class="history-button" type="button"><History :size="16" />Rapor Geçmişi</button>
    </div>

    <section class="summary-card">
      <div class="summary-main"><div class="summary-icon summary-danger-icon"><Flame :size="29" /></div><div><span class="summary-label">Genel Durum</span><strong class="summary-danger">Uygun Değil</strong><p>Son rapora göre yangın tesisatında uygunsuzluklar bulunmaktadır.</p></div></div>
      <div class="summary-divider" />
      <div class="summary-item"><div class="small-icon blue"><CalendarDays :size="22" /></div><div><span class="summary-label">Son Periyodik Kontrol</span><strong>10.04.2026</strong><small>4A Periyodik Kontrol</small></div></div>
      <div class="summary-divider" />
      <div class="summary-item"><div class="small-icon green"><ShieldCheck :size="22" /></div><div><span class="summary-label">Geçerlilik Tarihi</span><strong>10.04.2027</strong><small class="green-text">Kalan süre: 218 gün</small></div></div>
      <div class="summary-divider" />
      <div class="summary-item"><div class="small-icon gray"><FileText :size="22" /></div><div><span class="summary-label">Rapor No</span><strong>PK.239.00026.01</strong><button class="report-link" type="button">Raporu Görüntüle <ArrowRight :size="14" /></button></div></div>
    </section>

    <nav class="tabs" aria-label="Yangın tesisatı sekmeleri">
      <button v-for="tab in tabs" :key="tab" type="button" :class="['tab', { active: activeTab === tab }]" @click="activeTab = tab">{{ tab }}</button>
    </nav>

    <template v-if="activeTab === 'Sistemler'">
      <div class="section-heading">
        <div><h2>Sistem Bazlı Durum</h2><p>Son rapora göre yangın tesisatında bulunan sistemlerin kontrol sonuçları.</p></div>
        <div class="view-switcher"><button :class="{ active: viewMode === 'cards' }" type="button" @click="viewMode = 'cards'"><LayoutGrid :size="14" /> Kart Görünümü</button><button :class="{ active: viewMode === 'list' }" type="button" @click="viewMode = 'list'"><List :size="14" /> Liste Görünümü</button></div>
      </div>

      <div v-if="viewMode === 'cards'" class="systems-grid">
        <article v-for="system in systems" :key="system.name" class="system-card">
          <div :class="['system-icon', `system-${system.statusClass}`]"><component :is="system.icon" :size="25" /></div>
          <div class="system-content">
            <div class="system-title-row"><div><h3>{{ system.name }}</h3><p>{{ system.description }}</p></div><ArrowRight :size="20" class="card-arrow" /></div>
            <span :class="['status-badge', `badge-${system.statusClass}`]">{{ system.status }}</span>
            <template v-if="system.progress"><div class="progress-track"><div class="progress-fill" :style="{ width: `${system.progress}%` }" /></div><div class="progress-label">20 / 20 uygunsuz</div></template>
            <div class="system-meta"><span>{{ system.controls }} kontrol maddesi</span><span>{{ system.defects }} uygunsuzluk{{ system.defects === 1 ? '' : '' }}</span></div>
          </div>
        </article>
      </div>

      <div v-else class="list-panel">
        <div v-for="system in systems" :key="system.name" class="list-row">
          <div :class="['system-icon compact', `system-${system.statusClass}`]"><component :is="system.icon" :size="20" /></div>
          <div class="list-main"><strong>{{ system.name }}</strong><span>{{ system.description }}</span></div>
          <span :class="['status-badge', `badge-${system.statusClass}`]">{{ system.status }}</span>
          <span class="list-number">{{ system.controls }} kontrol</span>
          <span class="list-number">{{ system.defects }} uygunsuzluk</span>
          <ArrowRight :size="18" class="card-arrow" />
        </div>
      </div>

      <div class="lower-grid">
        <section class="panel"><div class="panel-title"><h3>Kontrol Sonuçlarının Dağılımı</h3><BarChart3 :size="16" /></div><div class="donut-area"><div class="donut"><div class="donut-center"><strong>44</strong><span>Kontrol Maddesi</span></div></div><div class="legend"><div><span class="legend-dot success-dot" /> <span>Uygun</span><b>24 (%55)</b></div><div><span class="legend-dot danger-dot" /> <span>Uygun Değil</span><b>16 (%36)</b></div><div><span class="legend-dot neutral-dot" /> <span>Uygulaması Yok</span><b>4 (%9)</b></div></div></div></section>
        <section class="panel"><div class="panel-title"><h3>Sistemlere Göre Uygunsuzluk Sayısı</h3><ClipboardCheck :size="16" /></div><div class="bar-list"><div v-for="item in defectStats" :key="item.name" class="bar-row"><span>{{ item.name }}</span><div class="bar-track"><div class="bar-fill" :style="{ width: `${(item.value / 6) * 100}%` }" /></div><strong>{{ item.value }}</strong></div></div></section>
        <section class="panel"><div class="panel-title"><h3>Tesisat Bilgileri (Rapor'dan)</h3><FileText :size="16" /></div><div class="facility-list"><div v-for="item in facilityInfo" :key="item.label" class="facility-row"><component :is="item.icon" :size="15" /><span>{{ item.label }}</span><strong>{{ item.value }}</strong></div></div></section>
      </div>
    </template>

    <section v-else class="placeholder-panel"><div class="placeholder-icon"><ClipboardCheck :size="24" /></div><h2>{{ activeTab }}</h2><p>{{ locationName }} / {{ branchName }} için bu sekmenin içeriği sonraki aşamada bağlanacak.</p></section>
  </div>
</template>

<style scoped>
.fire-status-page{width:100%;padding:4px 2px 32px;color:#17325f}.page-header{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:18px;gap:20px}.eyebrow{color:#ed2029;font-size:13px;font-weight:800;letter-spacing:.7px;margin-bottom:4px}h1{margin:0;font-size:27px;line-height:1.2;font-weight:800;color:#102b58}.page-header p{margin:6px 0 0;color:#71809a;font-size:13px}.history-button{display:flex;align-items:center;gap:8px;border:1px solid #dce4ee;background:#fff;color:#173966;border-radius:8px;padding:10px 14px;font-size:12px;font-weight:700;white-space:nowrap}.summary-card{display:grid;grid-template-columns:1.55fr 1px 1fr 1px 1fr 1px 1fr;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:11px;padding:14px;min-height:106px;box-shadow:0 2px 8px rgba(22,45,80,.035)}.summary-main,.summary-item{display:flex;align-items:center;gap:12px;padding:3px 10px}.summary-divider{width:1px;height:70px;background:#edf1f5}.summary-icon,.small-icon{display:flex;align-items:center;justify-content:center;flex:none;border-radius:11px}.summary-icon{width:51px;height:51px}.small-icon{width:45px;height:45px}.summary-danger-icon{background:#fff0f1;color:#ed2029}.small-icon.blue{background:#eaf6ff;color:#178de5}.small-icon.green{background:#eafbf2;color:#13b96a}.small-icon.gray{background:#f1f4f7;color:#627894}.summary-label{display:block;color:#70809a;font-size:11px;margin-bottom:3px}.summary-main strong,.summary-item strong{display:block;font-size:17px;font-weight:800}.summary-danger{color:#ed2029}.summary-main p{margin:4px 0 0;color:#71809a;font-size:10px;line-height:1.35;max-width:235px}.summary-item small{display:block;color:#71809a;font-size:10px;margin-top:4px}.green-text{color:#12b766!important;font-weight:700}.report-link{display:flex;align-items:center;gap:3px;padding:0;margin-top:5px;border:0;background:none;color:#173f76;font-size:10px;font-weight:700}.tabs{display:flex;align-items:flex-end;border-bottom:1px solid #dbe3ed;height:56px;margin-top:8px;gap:2px}.tab{height:56px;padding:0 17px;border:0;background:transparent;color:#526783;font-size:12px;font-weight:700;position:relative}.tab.active{color:#ed2029}.tab.active:after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:#ed2029}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;margin:18px 0 13px}.section-heading h2{margin:0;font-size:21px;font-weight:800;color:#102b58}.section-heading p{margin:4px 0 0;color:#71809a;font-size:11px}.view-switcher{display:flex;gap:4px}.view-switcher button{display:flex;align-items:center;gap:6px;border:1px solid #dce4ed;background:#fff;color:#526783;border-radius:7px;padding:8px 11px;font-size:10px;font-weight:700}.view-switcher button.active{background:#ed2029;border-color:#ed2029;color:#fff}.systems-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.system-card{display:flex;gap:12px;min-height:141px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:13px;box-shadow:0 2px 6px rgba(25,50,90,.025)}.system-icon{display:flex;align-items:center;justify-content:center;width:49px;height:49px;flex:0 0 49px;border-radius:11px}.system-danger{background:#fff0f1;color:#ed2029}.system-success{background:#e9fbf2;color:#12b96a}.system-neutral{background:#f1f4f7;color:#637894}.system-warning{background:#fff5df;color:#df980e}.system-content{min-width:0;flex:1}.system-title-row{display:flex;justify-content:space-between;gap:5px}.system-title-row h3{margin:0;color:#123363;font-size:12px;font-weight:800}.system-title-row p{margin:3px 0 0;color:#71819a;font-size:10px;font-weight:600}.card-arrow{color:#173d70;flex:none}.status-badge{display:inline-flex;margin-top:9px;padding:5px 8px;border-radius:6px;font-size:9px;font-weight:800}.badge-danger{background:#fff0f1;color:#ed2029}.badge-success{background:#e9fbf2;color:#10aa5d}.badge-neutral{background:#edf1f5;color:#53657d}.badge-warning{background:#fff5df;color:#d9910c}.progress-track{height:7px;margin-top:8px;background:#e9edf2;border-radius:10px;overflow:hidden}.progress-fill{height:100%;background:#fb5158;border-radius:10px}.progress-label{color:#ed2029;font-size:9px;font-weight:800;margin-top:3px}.system-meta{display:flex;gap:11px;margin-top:12px;color:#637793;font-size:9px}.list-panel{background:#fff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}.list-row{display:grid;grid-template-columns:42px minmax(180px,1fr) auto 80px 95px 20px;align-items:center;gap:12px;padding:10px 14px;border-bottom:1px solid #edf1f5}.list-row:last-child{border-bottom:0}.system-icon.compact{width:38px;height:38px}.list-main{display:flex;flex-direction:column;gap:3px}.list-main strong{font-size:12px;color:#173662}.list-main span,.list-number{font-size:10px;color:#71809a}.list-number{text-align:right}.lower-grid{display:grid;grid-template-columns:1.05fr 1.05fr .95fr;gap:10px;margin-top:11px}.panel{background:#fff;border:1px solid #e2e8f0;border-radius:10px;min-height:235px;padding:13px 15px}.panel-title{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #edf1f5;padding-bottom:10px;color:#637894}.panel-title h3{margin:0;color:#173562;font-size:12px;font-weight:800}.donut-area{height:185px;display:flex;align-items:center;justify-content:center;gap:27px}.donut{width:126px;height:126px;border-radius:50%;background:conic-gradient(#28ce80 0 55%,#ff4f51 55% 91%,#aeb8c5 91% 100%);display:flex;align-items:center;justify-content:center}.donut:after{content:"";position:absolute;width:88px;height:88px;background:#fff;border-radius:50%}.donut-center{position:relative;z-index:1;text-align:center}.donut-center strong{display:block;color:#173966;font-size:19px}.donut-center span{display:block;color:#71809a;font-size:8px;margin-top:2px}.legend{display:flex;flex-direction:column;gap:11px;min-width:130px}.legend>div{display:grid;grid-template-columns:9px 1fr auto;gap:6px;align-items:center;color:#63748f;font-size:9px}.legend b{font-size:9px;color:#5c6f8c}.legend-dot{width:9px;height:9px;border-radius:2px}.success-dot{background:#28ce80}.danger-dot{background:#ff4f51}.neutral-dot{background:#aeb8c5}.bar-list{display:flex;flex-direction:column;gap:12px;padding-top:15px}.bar-row{display:grid;grid-template-columns:112px 1fr 13px;align-items:center;gap:7px;color:#657793;font-size:9px}.bar-track{height:10px;background:#edf1f5;border-radius:10px;overflow:hidden}.bar-fill{height:100%;background:#ff575a;border-radius:10px}.bar-row strong{color:#203b67;text-align:right;font-size:10px}.facility-list{padding-top:5px}.facility-row{display:grid;grid-template-columns:17px 1fr auto;align-items:center;gap:6px;min-height:26px;border-bottom:1px solid #f0f3f6;color:#60728d;font-size:9px}.facility-row strong{color:#1c365f;font-size:9px}.placeholder-panel{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:320px;margin-top:20px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;text-align:center}.placeholder-icon{display:flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:14px;background:#fff0f1;color:#ed2029}.placeholder-panel h2{margin:12px 0 4px;color:#173562;font-size:20px}.placeholder-panel p{margin:0;color:#71809a;font-size:12px}@media (max-width:1200px){.summary-card{grid-template-columns:1fr 1fr}.summary-divider{display:none}.systems-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.lower-grid{grid-template-columns:1fr 1fr}.lower-grid .panel:last-child{grid-column:span 2}}@media (max-width:800px){.fire-status-page{padding:10px}.page-header{align-items:flex-start;flex-direction:column}.summary-card{grid-template-columns:1fr}.systems-grid,.lower-grid{grid-template-columns:1fr}.lower-grid .panel:last-child{grid-column:auto}.tabs{overflow-x:auto}.tab{white-space:nowrap;padding:0 12px}.view-switcher{display:none}.list-row{grid-template-columns:38px 1fr auto}.list-number{display:none}}
</style>
