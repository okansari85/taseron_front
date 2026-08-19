# Taseron Management — Yeni Tenant Sihirbazı

Nuxt 4 + Vue 3 + Vuetify 3 ile hazırlanmış, 3 adımlı "Yeni Tenant Oluştur" sihirbazı.
Açık/koyu tema desteği ve daraltılabilir (rail) kenar menüsü içerir.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda http://localhost:3000 adresini açın (otomatik olarak /tenants/new sayfasına yönlendirilir).

## Yapı

- `app/pages/tenants/new.vue` — 3 adımlı sihirbaz sayfası
- `app/components/Step*.vue` — Her adımın form içeriği (Tenant Bilgileri / İlk Organizasyon / Kontrol & Oluştur)
- `app/components/Panel*.vue` — Sağ taraftaki bilgi/önizleme panelleri
- `app/components/AppSidebar.vue` — Daraltılabilir (rail) kenar menü; kapanınca logo ve ikonlar kalır, yazılar gizlenir
- `app/components/AppHeader.vue` — Üst bar; menü aç/kapa, tema değiştirme, bildirim, yardım, kullanıcı
- `app/composables/useTenantForm.ts` — Sihirbazın paylaşılan form state'i
- `app/composables/useAppTheme.ts` — Açık/koyu tema geçişi (localStorage'da saklanır)
- `nuxt.config.ts` — Vuetify tema renkleri (taseronLight / taseronDark) burada tanımlı

## Notlar

- Form gönderildiğinde oluşturulacak payload tarayıcı konsoluna yazdırılır — kendi API'nize bağlamak için
  `app/pages/tenants/new.vue` içindeki `submit()` fonksiyonunu güncelleyin.
- Renk paleti ve tipografi `nuxt.config.ts` > `vuetify.vuetifyOptions.theme` altında özelleştirilebilir.
