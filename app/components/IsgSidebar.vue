<template>
  <aside class="isg-sidebar">
    <div class="sidebar-brand">ISG Portal</div>
    <nav>
      <NuxtLink to="/isg-portal/desktop" class="nav-item">Ana Sayfa</NuxtLink>
      <div class="nav-section">YANGIN YÖNETİMİ</div>
      <div class="nav-group-title">Yangın Ekipmanları</div>
      <NuxtLink to="/isg-portal/desktop/fire-extinguishers" class="nav-sub">Yangın Söndürücüler (YSC)</NuxtLink>
      <NuxtLink to="/isg-portal/desktop/fire-cabinets" class="nav-sub">Yangın Dolapları</NuxtLink>
      <NuxtLink to="/isg-portal/desktop/fire-pumps" class="nav-sub">Yangın Pompaları</NuxtLink>
      <NuxtLink to="/isg-portal/desktop/hydrants" class="nav-sub">Hidrantlar</NuxtLink>
      <div class="nav-section">YANGIN TESİSATI</div>
      <NuxtLink to="/isg-portal/desktop/fire-suppression/inventory" class="nav-sub">Tesisat Envanteri</NuxtLink>
      <NuxtLink to="/isg-portal/desktop/fire-detection" class="nav-sub">Yangın Algılama Sistemleri</NuxtLink>
      <div class="nav-section">PERİYODİK KONTROLLER</div>
      <NuxtLink to="/isg-portal/desktop/fire-suppression/reports" class="nav-item">Raporlar</NuxtLink>
      <NuxtLink to="/isg-portal/desktop/analytics" class="nav-item">Analiz ve İstatistikler</NuxtLink>
      <div class="nav-section">YÖNETİM</div>
      <NuxtLink to="/isg-portal/desktop/settings" class="nav-item">Ayarlar</NuxtLink>
    </nav>
  </aside>
</template>
<style scoped>
.isg-sidebar{background:#0b1220;color:#fff;width:240px;min-height:100vh;padding:18px 12px}.sidebar-brand{font-size:20px;font-weight:800;padding:10px 12px 28px}.nav-section{font-size:11px;color:#7f8ba3;font-weight:700;letter-spacing:.08em;margin:24px 8px 8px}.nav-item,.nav-sub{display:flex;align-items:center;min-height:38px;padding:0 14px;border-radius:8px;color:#dce3ef;text-decoration:none;font-size:13px;font-weight:600;margin:3px 0}.nav-item.router-link-active,.nav-sub.router-link-active{background:#ef1118;color:#fff}.nav-group-title{background:#4b1115;border-radius:8px;padding:11px 14px;font-size:13px;font-weight:700;color:#fff}.nav-sub{margin-left:10px;padding-left:18px;font-size:12px}
</style>