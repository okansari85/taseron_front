# CLAUDE.md

Bu dosya, bu repoda (taseron-front) çalışırken Claude'un uyması gereken proje kurallarını içerir.

## Datatable üzerinde kayıt güncelleme (update) davranışı

Bir datatable'daki bir kaydı düzenleme modalı/drawer'ı üzerinden güncellerken şu pattern uygulanmalı (referans: `app/pages/tenants/[tenantId]/locations/` altındaki lokasyon listesi ve lokasyon detay sayfası — `LocationDataTable.vue`, `LocationCompaniesTab.vue`, `LocationContractorsTab.vue`, `LocationOperationalAreasTab.vue`, `stores/location.ts`, `stores/locationOperationalArea.ts`):

1. **Modal/drawer hemen kapanır.** Kullanıcı "Kaydet"e bastığında, PUT/PATCH isteği beklenmeden modal/drawer kapatılır. İstek arka planda devam eder.
2. **Sadece ilgili satır "güncelleniyor" durumuna girer.** İlgili kaydın id'si bir `updatingId` (veya tabloya özel benzer isimli) ref/state'te tutulur. Bu id'yle eşleşen satır:
   - hafifçe soluklaşır (örn. `:class="{'opacity-60': row.id === updatingId}"`),
   - işlem butonları (düzenle/sil/vb.) yerine küçük bir spinner gösterir (`animate-spin` ile dönen bir daire — `LocationDataTable.vue`'daki spinner'la aynı stil).
   - **Diğer satırlar ve tablonun geri kalanı tamamen etkileşimli kalır** — sayfa/tab genelinde bir "Yükleniyor..." ekranına asla düşülmez.
3. **Sayfa/tab seviyesindeki genel `loading` flag'i SADECE ilk yüklemede kullanılır.** Bir listeyi hem ilk açılışta hem de bir güncelleme sonrası tazelemek gerekiyorsa, fetch mantığı ikiye ayrılır:
   - `fetchX()`: sadece veriyi çekip state'e yazar, `loading` flag'ine dokunmaz (sessiz tazeleme).
   - `loadX()`: `loading.value = true` yapar, `fetchX()`'i çağırır, `finally`'de `loading.value = false` yapar (ilk yükleme / dış tetiklemeler için).
   Güncelleme sonrası tazeleme her zaman `fetchX()` ile yapılır, `loadX()` ile DEĞİL — aksi halde tüm tab/tablo "Yükleniyor..." ekranının arkasında kaybolur (bu repoda `LocationCompaniesTab.vue`'da tam olarak bu hataya rastlandı ve düzeltildi).
4. **İstek başarılı olursa state/store güncellenir.** Backend güncel kaydı response'ta dönüyorsa (örn. `useLocationStore.updateLocation`, `useLocationOperationalAreaStore.updateArea`), dönen veri doğrudan ilgili dizide `splice` ile yerine konur — tam liste yeniden çekilmez. Backend güncel veri döndürmüyorsa (örn. `LocationBusinessEntityController::update` sadece mesaj döner), adım 3'teki sessiz `fetchX()` ile hedefli bir tazeleme yapılır.
5. **Aynı veri birden fazla sekme/sayfada kullanılıyorsa paylaşılan bir Pinia store'a taşınır** (örn. `useLocationStore`, `useLocationOperationalAreaStore`), tek bir bileşenin local ref'i olarak tutulmaz — böylece bir yerde yapılan güncelleme, aynı veriyi gösteren diğer sekme/bileşenlerde de anında yansır.
6. **Hata durumunda** `updatingId` `finally` bloğunda temizlenir, hata mevcut hata banner'ında gösterilir; kullanıcı tekrar düzenle'ye basarak yeniden deneyebilir.

Bu pattern, "kullanıcı odaklı" — kaydı düzenlerken kullanıcının tüm tabloyu/sayfayı kaybetmemesi, sadece ilgilendiği satırın durumunu görmesi esas alınır.

**Kullanıcı bu pattern'in ileride tüm datatable güncelleme akışlarında (yeni eklenecek tablar/tablolar dahil) uygulanmasını istiyor — yeni bir datatable + düzenleme akışı eklenirken varsayılan olarak bu şekilde yapılmalı, ayrıca sorulmasına gerek yok.**

## Her CRUD işleminden sonra toast bildirimi

Bir kayıt eklendiğinde/güncellendiğinde/silindiğinde, istek sonucunda kullanıcıya mutlaka bir toast bildirimi gösterilmeli — sadece hata banner'ı/console log yeterli değil.

- Kullanılacak araç: `vue-sonner` (`nuxt.config.ts`'de `vue-sonner/nuxt` modülü zaten kurulu). Kullanım: `const {$toast}=useNuxtApp();` sonra `$toast.success("...")` / `$toast.error("...")`.
- Doğru referans örnek: `app/pages/tenants/[tenantId]/locations/[locationId]/index.vue` içindeki `saveContractor` ve `removeContractor` (ve `saveLocation`) — başarılıysa `$toast.success(mesaj)`, hataysa `$toast.error(mesaj)` çağırıyor.
- **Şu an eksik olan yerler** (fark edildiği anda düzeltilmemiş, ileride istenirse tamamlanacak):
  - Lokasyon listesi sayfası (`app/pages/tenants/[tenantId]/locations/index.vue`) — ekleme/güncelleme/silme işlemlerinde toast yok, sadece hata banner'ı var.
  - `LocationCompaniesTab.vue` — firma ekleme/güncelleme/silme işlemlerinde toast yok.
  - `LocationOperationalAreasTab.vue` — alan ekleme/güncelleme/silme işlemlerinde toast yok.
- **Kural:** Yeni eklenen veya düzenlenen her create/update/delete akışında, işlem başarılı olduğunda kısa bir başarı mesajıyla `$toast.success(...)` çağrılmalı; hata durumunda da (mevcut hata banner'ına ek olarak, onun yerine değil) `$toast.error(...)` çağrılmalı. Mesajlar kısa ve Türkçe olmalı (örn. "Firma güncellendi.", "Operasyonel alan silindi.").

## Combobox / dropdown verileri için Pinia store zorunlu

Bir combobox/dropdown'ın seçenek listesi (şehir, ilçe, grup, firma, marka, operasyonel alan vb. — kısaca bir yerde seçim yapmak için kullanılan referans veri) **mutlaka paylaşılan bir Pinia store üzerinden** gelmeli. Aynı veri her modal/drawer açıldığında, her sekme değişiminde tekrar tekrar API'den çekilmemeli.

Kural:
- Böyle bir referans veri için store yoksa oluşturulur (`app/stores/` altında, `useLocationStore` / `useLocationOperationalAreaStore` ile aynı pattern: `items`, `loading`, `error` state + `fetchItems()` action).
- `fetchItems()` her çağrıldığında API'ye gitmemeli — zaten veri varsa (`if (!store.items.length)` gibi bir guard ile, ya da store'da bir `loaded`/`loadedAt` flag'iyle) tekrar fetch atlanmalı. Kullanıcı verinin bayatlamış olabileceğini düşünüyorsa açıkça bir "yenile" aksiyonu eklenir, ama varsayılan davranış cache'ten okumaktır.
- Combobox'ı gösteren bileşen, veriyi kendi local state'inde tutup component her mount olduğunda/modal her açıldığında yeniden çekmek yerine, store'dan `storeToRefs` ile okumalı.
- **Şu an bu kurala uymayan / gözden geçirilmesi gereken yerler:**
  - `LocationCreateDrawer.vue` ve `LocationEditDrawer.vue` — `cities`/`districts` (`locationApi.cities()`, `locationApi.districts()`) her açılışta yeniden çekiliyor, cache yok.
  - `LocationCompaniesTab.vue` — `loadOptions()` içindeki `groups`/`companies` (organizasyon grupları ve firma listesi) sadece bileşenin kendi local ref'inde cache'leniyor, paylaşılan bir store'da değil; aynı veriye ihtiyaç duyan başka bir yer (örn. organizasyon > firmalar sayfası) ayrıca kendi fetch'ini yapıyor.
  - `[locationId]/index.vue`'daki `contractorPool`/`availableContractors` (daimi taşeron havuzu) de benzer şekilde sayfa-local.
- İyi örnekler (zaten bu kurala uygun): `useCompanyStore`, `useOrganizationStore`, `useLocationStore`, `useLocationOperationalAreaStore`.

Amaç: aynı referans veriyi (şehir/ilçe/grup/firma/marka listesi gibi) kullanıcı sayfa içinde gezinirken gereksiz yere defalarca ağ isteğiyle çekmemek.

## Tenant değişince veri yeniden çekilmeli (sadece `onMounted` yetmez)

Nuxt'ta `<NuxtPage>` için bir `page-key` tanımlı değil (`app.vue`), bu yüzden aynı route dosyasını kullanan iki farklı `tenantId` arasında geçiş (örn. header'daki tenant seçici — `TailAdminHeader.vue`'daki `selectTenant`, `router.push(\`/tenants/${id}${suffix}\`)` ile aynı sayfayı farklı param'la açıyor) **component'i yeniden mount etmez**. Sonuç: sadece `onMounted` içinde veri çeken bir sayfa/sekme, tenant değiştiğinde eski tenant'a ait veriyi state'te tutmaya devam eder — backend doğru tenant'a göre filtrelese bile ekranda yanlış tenant'ın verisi görünür.

Bu tam olarak taşeron havuzunda yaşanan hatanın bir parçasıydı: backend'de `ContractorService`/`ContractorRepository`'nin tenant filtresi yoktu (düzeltildi), AMA ayrıca `ContractorPoolTab.vue` da tenant değişimini izlemiyordu — ikisi birlikte "Ata Holding'i seçince Koç Holding'in taşeronları görünüyor" sorununu oluşturuyordu.

**Kural:** Tenant'a göre değişen bir listeyi/veriyi sadece `onMounted` ile çekmek yerine, `tenantId`'yi (route param'dan gelen `computed`) izleyen bir `watch` ile çekmek gerekir:

```js
// YANLIŞ — tenant değişince yeniden çekmez
onMounted(() => store.fetchX(tenantId.value))

// DOĞRU — hem ilk yüklemede hem tenant değişince çalışır
watch(tenantId, () => store.fetchX(tenantId.value), { immediate: true })
```

- Uygulanan yerler: `app/pages/tenants/[tenantId]/locations/index.vue`, `app/pages/tenants/[tenantId]/contractors/components/ContractorPoolTab.vue`.
- **Henüz uygulanmayan / gözden geçirilmesi gereken yerler** (hepsi `onMounted` içinde tenant'a bağlı veri çekiyor, tenant değişimini izleyen `watch` yok):
  - `app/pages/tenants/[tenantId]/organization/brands/index.vue`
  - `app/pages/tenants/[tenantId]/organization/companies/index.vue`
  - `app/pages/tenants/[tenantId]/organization/groups/index.vue`
  - `app/pages/tenants/[tenantId]/organization/groups/[groupId].vue`
  - `app/pages/tenants/[tenantId]/organization/brands/create.vue`, `companies/create.vue`, `groups/create.vue` (dropdown/referans verileri için)
  - `app/pages/tenants/[tenantId]/locations/[locationId]/index.vue` (öncelikle `locationId`'ye bağlı, ama içindeki tenant-seviyeli referans veri çekimleri de gözden geçirilmeli)
- **Kullanıcı bu deseni ileride çoğu sayfaya uygulamak istiyor** — yeni bir sayfa/sekme tenant'a göre değişen veri çekiyorsa varsayılan olarak `onMounted` yerine bu `watch(tenantId, ..., {immediate:true})` deseni kullanılmalı, ayrıca sorulmasına gerek yok.
- Alternatif (daha kökten ama daha büyük etkili) bir çözüm: `app.vue`'da `<NuxtPage :page-key="route => route.fullPath" />` tanımlayıp tüm sayfaları her route değişiminde (param değişimi dahil) yeniden mount etmek — bu her sayfadaki `onMounted`'ı otomatik olarak tetikler ama sayfa-içi local state'i (scroll, açık modal vb.) her navigasyonda sıfırlar; bu yüzden tek tek `watch` eklemek yerine bu genel çözüm istenirse ayrıca konuşulup karar verilmeli.
