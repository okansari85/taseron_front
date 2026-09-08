<script setup lang="ts">
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-vue-next";
import { fireSafetyDashboardApi } from "~/api/fire-safety-dashboard";
import type { FireSafetyDashboard } from "~/types/fire-safety-dashboard";

const { color: workspaceColor, load: loadWorkspaceTheme } = useWorkspaceTheme();
const themeColor = computed(() => workspaceColor.value || "#465fff");

definePageMeta({ layout: "default" });

const route = useRoute();
const tenantId = computed(() => Number(route.params.tenantId ?? 0));

const dashboard = ref<FireSafetyDashboard | null>(null);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const load = async () => {
  loading.value = true;
  errorMessage.value = null;
  try {
    dashboard.value = await fireSafetyDashboardApi.get();
  } catch (error) {
    errorMessage.value = "Dashboard verileri yüklenirken bir hata oluştu.";
  } finally {
    loading.value = false;
  }
};

onMounted(load);
onMounted(() => loadWorkspaceTheme(tenantId.value));
watch(tenantId, (id) => loadWorkspaceTheme(id));

const stats = computed(() => dashboard.value?.stats ?? {
  total_branches: 0,
  total_equipment: 0,
  up_to_date: 0,
  upcoming: 0,
  overdue: 0,
  open_nonconformities: 0,
});

// Marka dağılımı — donut grafiği. Renkler markanın isim sırasına göre sabit
// atanıyor (filtre/veri değiştiğinde aynı marka hep aynı renk kalsın diye),
// "Markasız" her zaman gri ve en sonda.
const BRAND_PALETTE = ["#465fff", "#12b76a", "#f79009", "#7a5af8", "#0ea5e9", "#ec4899"];
const UNBRANDED_COLOR = "#94a3b8";

const donutSegments = computed(() => {
  const slices = dashboard.value?.brand_distribution ?? [];
  const total = slices.reduce((sum, s) => sum + s.equipment_count, 0);
  if (total === 0) return [];

  const named = slices.filter((s) => s.brand_name !== "Markasız").sort((a, b) => a.brand_name.localeCompare(b.brand_name, "tr-TR"));
  const unbranded = slices.find((s) => s.brand_name === "Markasız");
  const ordered = unbranded ? [...named, unbranded] : named;

  let offset = 0;
  return ordered.map((slice, index) => {
    const percent = (slice.equipment_count / total) * 100;
    const color = slice.brand_name === "Markasız" ? UNBRANDED_COLOR : BRAND_PALETTE[index % BRAND_PALETTE.length];
    const segment = { name: slice.brand_name, count: slice.equipment_count, percent, offset, color };
    offset += percent;
    return segment;
  });
});

const totalBrandEquipment = computed(() => (dashboard.value?.brand_distribution ?? []).reduce((sum, s) => sum + s.equipment_count, 0));

const maxCategoryCount = computed(() => Math.max(1, ...(dashboard.value?.category_nonconformities ?? []).map((c) => c.open_count)));

const statusMeta: Record<"good" | "warning" | "critical", { label: string; dot: string; text: string }> = {
  good: { label: "İyi", dot: "bg-success-500", text: "text-success-600" },
  warning: { label: "Uyarı", dot: "bg-warning-500", text: "text-warning-600" },
  critical: { label: "Kritik", dot: "bg-error-500", text: "text-error-600" },
};

const formatDate = (value: string) => {
  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return value;
  }
};
</script>

<template>
  <div class="font-outfit" :style="{ '--wc': themeColor }">
    <div class="mx-auto w-full max-w-[1400px]">
      <nav class="mb-2 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <span>Yangın Modülü</span>
        <ChevronRight :size="12" />
        <span class="font-medium text-gray-500 dark:text-gray-400">Dashboard</span>
      </nav>

      <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Yangın Güvenliği Yönetim Dashboard</h1>
          <p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Şubelerdeki acil durum ekipmanlarının denetim durumu — gerçek veriden hesaplanır.
          </p>
        </div>
        <button
          type="button"
          class="inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 shadow-theme-xs transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
          :disabled="loading"
          @click="load"
        >
          <RefreshCw :size="15" :class="{ 'animate-spin': loading }" />Yenile
        </button>
      </div>

      <div v-if="errorMessage" class="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{ errorMessage }}</div>

      <div v-if="loading && !dashboard" class="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-16 text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03]">
        Yükleniyor...
      </div>

      <template v-else>
        <!-- Stat kartları -->
        <div class="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10"><Building2 :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.total_branches }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Toplam Şube</p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/10"><Flame :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.total_equipment }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Toplam Ekipman</p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-success-50 text-success-600 dark:bg-success-500/10"><ShieldCheck :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.up_to_date }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Kontrolü Güncel</p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-500 dark:bg-warning-500/10"><Clock :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.upcoming }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Yaklaşan Kontroller</p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-600 dark:bg-error-500/10"><AlertTriangle :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.overdue }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Geciken Kontroller</p></div>
          </div>
          <div class="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-600 dark:bg-error-500/10"><ShieldAlert :size="19" /></span>
            <div><p class="text-lg font-semibold text-gray-800 dark:text-white/90">{{ stats.open_nonconformities }}</p><p class="text-xs text-gray-500 dark:text-gray-400">Açık Uygunsuzluk</p></div>
          </div>
        </div>

        <!-- Marka dağılımı + Kategori bazlı uygunsuzluk -->
        <div class="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Marka Bazlı Ekipman Dağılımı</h2>
            <div v-if="!donutSegments.length" class="py-10 text-center text-sm text-gray-400">Henüz ekipman kaydı yok.</div>
            <div v-else class="flex flex-col items-center gap-6 sm:flex-row">
              <svg viewBox="0 0 36 36" class="h-36 w-36 shrink-0 -rotate-90">
                <circle
                  v-for="seg in donutSegments"
                  :key="seg.name"
                  cx="18" cy="18" r="15.9155"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="4"
                  path-length="100"
                  :stroke-dasharray="`${seg.percent} ${100 - seg.percent}`"
                  :stroke-dashoffset="-seg.offset"
                />
              </svg>
              <div class="flex-1 space-y-2">
                <div v-for="seg in donutSegments" :key="seg.name" class="flex items-center justify-between gap-3 text-sm">
                  <span class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: seg.color }" />
                    {{ seg.name }}
                  </span>
                  <span class="font-medium text-gray-800 dark:text-white/90">{{ seg.count }} <span class="font-normal text-gray-400">({{ Math.round(seg.percent) }}%)</span></span>
                </div>
                <div class="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-400 dark:border-gray-800">Toplam {{ totalBrandEquipment }} ekipman</div>
              </div>
            </div>
          </section>

          <section class="rounded-xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <h2 class="mb-4 text-sm font-semibold text-gray-800 dark:text-white/90">Kategori Bazlı Açık Uygunsuzluk</h2>
            <div v-if="!dashboard?.category_nonconformities?.length" class="py-10 text-center text-sm text-gray-400">Açık uygunsuzluk bulunmuyor.</div>
            <div v-else class="space-y-3">
              <div v-for="cat in dashboard.category_nonconformities" :key="cat.equipment_type_name">
                <div class="mb-1 flex items-center justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-300">{{ cat.equipment_type_name }}</span>
                  <span class="font-medium text-error-600">{{ cat.open_count }}</span>
                </div>
                <div class="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                  <div class="h-full rounded-full bg-error-500" :style="{ width: `${(cat.open_count / maxCategoryCount) * 100}%` }" />
                </div>
              </div>
            </div>
            <p class="mt-4 text-xs text-gray-400">Şu an sadece "Yangın Tüpü" ekipman türü tanımlı — diğer kategoriler (Acil Çıkış, Aydınlatma, Yangın Dolabı vb.) eklendikçe burada otomatik görünecek.</p>
          </section>
        </div>

        <!-- Şube durum listesi -->
        <section class="mb-5 rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
          <div class="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Şube Durum Listesi</h2>
            <p class="text-xs text-gray-400">Türkiye haritası yerine — konum koordinatı verisi eklendiğinde haritaya dönüştürülebilir.</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] text-left">
              <thead class="border-b border-gray-100 bg-gray-50/70 dark:border-gray-800 dark:bg-white/[0.02]">
                <tr>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Şube</th>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Marka</th>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Ekipman</th>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Geciken</th>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Açık Uygunsuzluk</th>
                  <th class="px-5 py-3 text-xs font-medium text-gray-500">Durum</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="branch in dashboard?.branch_status ?? []" :key="branch.location_business_entity_id ?? branch.branch_name">
                  <td class="px-5 py-3 text-sm font-medium text-gray-800 dark:text-white/90">{{ branch.branch_name }}</td>
                  <td class="px-5 py-3 text-sm text-gray-500">{{ branch.brand_name }}</td>
                  <td class="px-5 py-3 text-sm text-gray-500">{{ branch.equipment_count }}</td>
                  <td class="px-5 py-3 text-sm text-gray-500">{{ branch.overdue_count }}</td>
                  <td class="px-5 py-3 text-sm text-gray-500">{{ branch.open_count }}</td>
                  <td class="px-5 py-3">
                    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium" :class="[statusMeta[branch.status].text, branch.status === 'good' ? 'bg-success-50 dark:bg-success-500/10' : branch.status === 'warning' ? 'bg-warning-50 dark:bg-warning-500/10' : 'bg-error-50 dark:bg-error-500/10']">
                      <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[branch.status].dot" />{{ statusMeta[branch.status].label }}
                    </span>
                  </td>
                </tr>
                <tr v-if="!dashboard?.branch_status?.length">
                  <td colspan="6" class="px-5 py-10 text-center text-sm text-gray-400">Henüz ekipman eklenmiş şube yok.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Geciken / Yaklaşan kontrol tabloları -->
        <div class="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Geciken Kontroller</h2>
            </div>
            <div v-if="!dashboard?.overdue_list?.length" class="px-5 py-8 text-center text-sm text-gray-400">Geciken kontrol yok.</div>
            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <li v-for="item in dashboard.overdue_list" :key="item.equipment_id" class="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ item.branch_name }} <span class="font-normal text-gray-400">— {{ item.equipment_type_name }}{{ item.code ? ` (${item.code})` : '' }}</span></p>
                  <p class="text-xs text-gray-400">Son tarih: {{ formatDate(item.due_date) }}</p>
                </div>
                <span class="shrink-0 rounded-full bg-error-50 px-2.5 py-1 text-xs font-medium text-error-600 dark:bg-error-500/10">{{ item.days_overdue }} gün gecikti</span>
              </li>
            </ul>
          </section>

          <section class="rounded-xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
              <h2 class="text-sm font-semibold text-gray-800 dark:text-white/90">Yaklaşan Kontroller <span class="font-normal text-gray-400">(7 gün içinde)</span></h2>
            </div>
            <div v-if="!dashboard?.upcoming_list?.length" class="px-5 py-8 text-center text-sm text-gray-400">Yaklaşan kontrol yok.</div>
            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <li v-for="item in dashboard.upcoming_list" :key="item.equipment_id" class="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div class="min-w-0">
                  <p class="truncate font-medium text-gray-800 dark:text-white/90">{{ item.branch_name }} <span class="font-normal text-gray-400">— {{ item.equipment_type_name }}{{ item.code ? ` (${item.code})` : '' }}</span></p>
                  <p class="text-xs text-gray-400">Kontrol tarihi: {{ formatDate(item.due_date) }}</p>
                </div>
                <span class="shrink-0 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-medium text-warning-600 dark:bg-warning-500/10">{{ item.days_until }} gün kaldı</span>
              </li>
            </ul>
          </section>
        </div>

        <div class="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-4 text-xs text-gray-500 dark:border-gray-700 dark:bg-white/[0.02] dark:text-gray-400">
          <strong class="text-gray-700 dark:text-gray-300">Not:</strong> Bu dashboard gerçek ekipman ve denetim verisinden hesaplanır. Aksiyon takibi (Açık/Devam Ediyor/Beklemede/Tamamlandı) için ayrı bir modül planlanmıyor — checklist/denetim takibi yeterli kabul edildi. Türkiye haritası, konum bazlı koordinat verisi eklenene kadar yukarıdaki Şube Durum Listesi ile karşılanıyor.
        </div>
      </template>
    </div>
  </div>
</template>
