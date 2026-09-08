<script setup lang="ts">
import { ChevronDown, Filter, Plus, Search } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import LocationCreateDrawer from '~/components/LocationCreateDrawer.vue'
import LocationEditDrawer from '~/components/locations/LocationEditDrawer.vue'
import LocationDataTable from '~/components/locations/LocationDataTable.vue'
import LocationBusinessEntityDataTable from '~/components/locations/LocationBusinessEntityDataTable.vue'
import ConfirmationModal from '~/components/ConfirmationModal.vue'
import { type LocationApiItem } from '~/api/location'
import { useLocationStore } from '~/stores/location'
import { useLocationBusinessEntityStore } from '~/stores/locationBusinessEntity'
import { useWorkspaceContextStore } from '~/stores/workspaceContext'

definePageMeta({ layout: 'default' })
const route=useRoute();const tenantId=computed(()=>String(route.params.tenantId??''));const search=ref('');const companyFilter=ref('all');const cityFilter=ref('all');const statusFilter=ref('all');const currentPage=ref(1);const perPage=ref(10);const createDrawerOpen=ref(false);const editDrawerOpen=ref(false);const editingLocation=ref<LocationApiItem|null>(null);const editLoading=ref(false);const deleteDialogOpen=ref(false);const deletingId=ref<number|null>(null)
const locationStore=useLocationStore();const{locations,loading,error,updatingId,deletingId:storeDeletingId}=storeToRefs(locationStore);const deleting=computed(()=>storeDeletingId.value!==null)
const lbeStore=useLocationBusinessEntityStore();const{items:businessEntities,loading:lbeLoading,error:lbeError}=storeToRefs(lbeStore)
// Süper admin bu sayfayı workspaceContext'ten TAMAMEN bağımsız görür: o store
// sadece 'tenant' layout'unda (tenant-layout.global.ts) başlatılıyor/resetleniyor.
// Süper admin hiç o layout'a girmediği için (impersonation'dan çıksa bile) store
// önceki oturumdan kalma bayat bir değer taşıyabilir — bu yüzden isBranchView
// ve contextReady'i süper admin için hiç dikkate ALMIYORUZ, davranış birebir eski
// (her zaman lokasyon bazlı, context header'ı göndermeden) haliyle kalıyor.
const normalizeRole=(role:string)=>role.trim().toLocaleLowerCase('tr-TR').replace(/[_\s-]/g,'')
const auth=useAuth();const isSuperAdmin=computed(()=>(auth.user.value?.roles??[]).some(r=>normalizeRole(r).includes('superadmin')))
const workspaceContext=useWorkspaceContextStore();const{contextSignature,contextReady,locationViewMode}=storeToRefs(workspaceContext)
const isBranchView=computed(()=>!isSuperAdmin.value&&locationViewMode.value==='business_entity')
// Header'daki context selector (Organizasyon/Lokasyon/Alan) değişince liste
// de yeniden çekilmeli — sadece tenantId değişimini izlemek yetmez, aksi
// halde context değişse bile bu sayfa eski/filtresiz veriyi göstermeye devam eder.
// contextReady false iken fetch ETMİYORUZ (sadece gerçek tenant/context'li
// kullanıcılarda): TenantHeader'daki workspaceContext.init() henüz bitmeden
// çekilirse bir an filtresiz liste görünüp hemen doğru veriyle değişir ("blink").
// Süper admin için contextReady hiçbir zaman true olmaz (init() hiç çağrılmaz),
// bu yüzden süper admin bu beklemeyi ATLAR — yoksa liste sonsuza kadar boş kalır.
watch([tenantId,contextSignature,contextReady,isBranchView,isSuperAdmin],()=>{
  if(!isSuperAdmin.value&&!contextReady.value)return
  if(isBranchView.value)lbeStore.fetchItems()
  else locationStore.fetchLocations(tenantId.value)
},{immediate:true})
const pageLoading=computed(()=>(isBranchView.value?lbeLoading.value:loading.value)||(!isSuperAdmin.value&&!contextReady.value))
const companyOptions=computed(()=>[...new Set(locations.value.flatMap(x=>x.businessEntities.map(e=>e.companyName)).filter(Boolean))]);const cityOptions=computed(()=>[...new Set(locations.value.map(x=>x.city).filter(Boolean))])
const filteredLocations=computed(()=>{const t=search.value.trim().toLocaleLowerCase('tr-TR');return locations.value.filter(x=>{const h=`${x.name} ${x.city} ${x.district} ${x.address} ${x.businessEntities.map(e=>`${e.companyName} ${e.brandName||''}`).join(' ')}`.toLocaleLowerCase('tr-TR');return(!t||h.includes(t))&&(companyFilter.value==='all'||x.businessEntities.some(e=>e.companyName===companyFilter.value))&&(cityFilter.value==='all'||x.city===cityFilter.value)&&(statusFilter.value==='all'||x.status===statusFilter.value)})})
const filteredEntities=computed(()=>{const t=search.value.trim().toLocaleLowerCase('tr-TR');return businessEntities.value.filter(x=>{const companyName=x.business_entity?.company?.name||x.business_entity?.name||'';const brandNames=x.brands.map(b=>b.name).join(' ');const h=`${companyName} ${brandNames} ${x.location?.name||''} ${x.address||''}`.toLocaleLowerCase('tr-TR');return(!t||h.includes(t))&&(companyFilter.value==='all'||companyName===companyFilter.value)&&(cityFilter.value==='all'||x.location?.city?.name===cityFilter.value)&&(statusFilter.value==='all'||(statusFilter.value==='active')===x.is_active)})})
const totalPages=computed(()=>{const count=isBranchView.value?filteredEntities.value.length:filteredLocations.value.length;return Math.max(1,Math.ceil(count/perPage.value))})
const paginatedLocations=computed(()=>filteredLocations.value.slice((currentPage.value-1)*perPage.value,currentPage.value*perPage.value))
const paginatedEntities=computed(()=>filteredEntities.value.slice((currentPage.value-1)*perPage.value,currentPage.value*perPage.value))
const visiblePages=computed(()=>Array.from({length:Math.min(5,totalPages.value)},(_,i)=>Math.min(Math.max(1,currentPage.value-2)+i,totalPages.value)).filter((p,i,a)=>a.indexOf(p)===i));watch([search,companyFilter,cityFilter,statusFilter,perPage],()=>currentPage.value=1)
const resetFilters=()=>{search.value='';companyFilter.value='all';cityFilter.value='all';statusFilter.value='all'};const goToLocation=(id:number)=>navigateTo(`/tenants/${tenantId.value}/locations/${id}`)
const pageError=computed(()=>isBranchView.value?lbeError.value:error.value)
const askDelete=(id:number)=>{deletingId.value=id;deleteDialogOpen.value=true}
const confirmDelete=async()=>{if(deletingId.value===null)return;try{await locationStore.deleteLocation(tenantId.value,deletingId.value)}catch(e){}finally{deleteDialogOpen.value=false;deletingId.value=null}}
const edit=async(id:number)=>{editingLocation.value=null;editDrawerOpen.value=true;editLoading.value=true;try{editingLocation.value=await locationStore.getLocation(tenantId.value,id)}catch(e){editDrawerOpen.value=false}finally{editLoading.value=false}}
const update=async(payload:any)=>{if(!editingLocation.value)return;const id=editingLocation.value.id;const form=new FormData();form.append('name',payload.name);if(payload.city_id!==null)form.append('city_id',String(payload.city_id));if(payload.district_id!==null)form.append('district_id',String(payload.district_id));form.append('address',payload.address);form.append('is_active',payload.status==='active'?'1':'0');if(payload.file instanceof File)form.append('image',payload.file);editDrawerOpen.value=false;editingLocation.value=null;try{await locationStore.updateLocation(tenantId.value,id,form)}catch(e){}}
</script>

<template><div class="font-outfit"><div class="mx-auto w-full max-w-[1400px]"><div class="mb-6"><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Lokasyonlar</h1><p class="mt-1.5 text-sm text-gray-500 dark:text-gray-400">Tenant içerisindeki fiziksel lokasyonları görüntüleyin ve yönetin.</p></div><div class="mb-5 flex justify-end"><button v-if="isBranchView" type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="navigateTo(`/tenants/${tenantId}/locations/new-branch`)"><Plus :size="16"/> Yeni Şube</button><button v-else type="button" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white" @click="createDrawerOpen=true"><Plus :size="16"/> Yeni Lokasyon</button></div><div v-if="pageError" class="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600">{{pageError}}</div><section class="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><div class="grid grid-cols-1 gap-3 md:grid-cols-[minmax(220px,1.35fr)_1fr_1fr_1fr_auto]"><div class="relative"><Search :size="16" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input v-model="search" type="search" placeholder="Lokasyon ara..." class="h-11 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm"/></div><div class="relative"><select v-model="companyFilter" class="h-11 w-full appearance-none rounded-lg border px-3 pr-9 text-sm"><option value="all">Tüm Şirketler</option><option v-for="x in companyOptions" :key="x" :value="x">{{x}}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/></div><div class="relative"><select v-model="cityFilter" class="h-11 w-full appearance-none rounded-lg border px-3 pr-9 text-sm"><option value="all">Tüm İller</option><option v-for="x in cityOptions" :key="x" :value="x">{{x}}</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/></div><div class="relative"><select v-model="statusFilter" class="h-11 w-full appearance-none rounded-lg border px-3 pr-9 text-sm"><option value="all">Tüm Durumlar</option><option value="active">Aktif</option><option value="passive">Pasif</option></select><ChevronDown :size="15" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"/></div><button type="button" class="inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-4 text-sm" @click="resetFilters"><Filter :size="15"/> Filtreleri Temizle</button></div></section><div v-if="pageLoading" class="rounded-xl border bg-white p-12 text-center text-sm text-gray-500">Lokasyonlar yükleniyor...</div><LocationBusinessEntityDataTable v-else-if="isBranchView" :items="paginatedEntities" :filtered-count="filteredEntities.length" :current-page="currentPage" :total-pages="totalPages" :visible-pages="visiblePages" :per-page="perPage" @view="goToLocation" @update:current-page="currentPage=$event" @update:per-page="perPage=$event"/><LocationDataTable v-else :locations="paginatedLocations" :filtered-count="filteredLocations.length" :current-page="currentPage" :total-pages="totalPages" :visible-pages="visiblePages" :per-page="perPage" @view="goToLocation" @edit="edit" @delete="askDelete" @update:current-page="currentPage=$event" @update:per-page="perPage=$event" :updating-id="updatingId"/><LocationCreateDrawer v-model="createDrawerOpen" /><LocationEditDrawer v-model="editDrawerOpen" :location="editingLocation" :loading="editLoading" @save="update"/><ConfirmationModal v-model:open="deleteDialogOpen" title="Lokasyonu Sil" message="Bu lokasyonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz." confirm-text="Sil" cancel-text="Vazgeç" :loading="deleting" @confirm="confirmDelete"/></div></div></template>
