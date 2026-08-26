<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Search, ShieldCheck, UserRound, MoreHorizontal, LockKeyhole } from 'lucide-vue-next'

type UserStatus = 'Aktif' | 'Pasif'
type User = { id:number; name:string; email:string; role:string; scope:string; status:UserStatus; initials:string }
const users = ref<User[]>([
  { id:1, name:'Ahmet Yılmaz', email:'ahmet.yilmaz@firma.com', role:'tenant-admin', scope:'Tüm tenant', status:'Aktif', initials:'AY' },
  { id:2, name:'Mehmet Kaya', email:'mehmet.kaya@firma.com', role:'isg-manager', scope:'İstanbul · Kocaeli', status:'Aktif', initials:'MK' },
  { id:3, name:'Burak Demir', email:'burak.demir@firma.com', role:'isg-user', scope:'Beylikdüzü', status:'Aktif', initials:'BD' },
  { id:4, name:'Selin Çelik', email:'selin.celik@tasaron.com', role:'contractor-manager', scope:'ABC Taşeron', status:'Aktif', initials:'SÇ' },
  { id:5, name:'Can Özkan', email:'can.ozkan@firma.com', role:'viewer', scope:'Ankara', status:'Pasif', initials:'CÖ' },
])
const roles = [
  { key:'super-admin', name:'Super Admin', description:'Platformun tamamını yönetir.', level:'Platform', permissions:['tenant.view','tenant.manage','users.manage','roles.manage','reports.view'] },
  { key:'tenant-admin', name:'Tenant Admin', description:'Müşterinin tüm yönetim işlemlerini yapar.', level:'Tenant', permissions:['organizations.manage','locations.manage','contractors.manage','users.manage','reports.view'] },
  { key:'tenant-manager', name:'Tenant Manager', description:'Operasyon ve taşeron süreçlerini yönetir.', level:'Tenant', permissions:['organizations.view','locations.manage','contractors.manage','visits.manage','documents.manage','reports.view'] },
  { key:'isg-manager', name:'İSG Manager', description:'İSG süreçlerinin yöneticisidir.', level:'Tenant', permissions:['locations.view','contractors.view','visits.manage','documents.manage','findings.manage','reports.view'] },
  { key:'isg-user', name:'İSG User', description:'Saha ve İSG operasyonlarını yürütür.', level:'Tenant', permissions:['locations.view','contractors.view','visits.create','documents.view','findings.create'] },
  { key:'contractor-manager', name:'Contractor Manager', description:'Bağlı taşeronun operasyonunu yönetir.', level:'Contractor', permissions:['contractor.view','personnel.manage','assets.manage','documents.manage','visits.view'] },
  { key:'contractor-user', name:'Contractor User', description:'Taşeron kayıtlarını operasyonel olarak günceller.', level:'Contractor', permissions:['contractor.view','personnel.manage','assets.manage','documents.upload','visits.view'] },
  { key:'viewer', name:'Viewer', description:'Salt okunur erişime sahiptir.', level:'Tenant', permissions:['organizations.view','locations.view','contractors.view','visits.view','documents.view','reports.view'] },
]
const permissionGroups = [
  { name:'Kullanıcı Yönetimi', items:[['users.view','Kullanıcıları görüntüle'],['users.manage','Kullanıcı oluştur / düzenle'],['roles.manage','Rol ve yetki yönetimi']] },
  { name:'Organizasyon', items:[['organizations.view','Organizasyonları görüntüle'],['organizations.manage','Organizasyonları yönet']] },
  { name:'Lokasyon', items:[['locations.view','Lokasyonları görüntüle'],['locations.manage','Lokasyonları yönet']] },
  { name:'Taşeron', items:[['contractors.view','Taşeronları görüntüle'],['contractors.manage','Taşeronları yönet']] },
  { name:'Saha ve Evrak', items:[['visits.view','Ziyaretleri görüntüle'],['visits.create','Ziyaret oluştur'],['visits.manage','Ziyaretleri yönet'],['documents.view','Evrakları görüntüle'],['documents.upload','Evrak yükle'],['documents.manage','Evrakları yönet']] },
  { name:'Raporlama', items:[['reports.view','Raporları görüntüle']] },
]
const search = ref('')
const activeView = ref<'users'|'roles'|'permissions'>('users')
const showUserForm = ref(false)
const showRoleForm = ref(false)
const selectedRole = ref('isg-user')
const filteredUsers = computed(() => { const q=search.value.toLocaleLowerCase('tr-TR').trim(); return users.value.filter(u=>!q || `${u.name} ${u.email} ${u.role} ${u.scope}`.toLocaleLowerCase('tr-TR').includes(q)) })
const selectedRoleData = computed(() => roles.find(r=>r.key===selectedRole.value) ?? roles[0])
const selectedPermissions = ref<string[]>([...selectedRoleData.value.permissions])
const selectRole = (key:string) => { selectedRole.value=key; selectedPermissions.value=[...(roles.find(r=>r.key===key)?.permissions ?? [])] }
const togglePermission = (key:string) => { selectedPermissions.value=selectedPermissions.value.includes(key) ? selectedPermissions.value.filter(p=>p!==key) : [...selectedPermissions.value,key] }
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h1 class="text-xl font-semibold text-gray-900">Kullanıcılar</h1><p class="mt-1 text-sm text-gray-500">Kullanıcı, rol ve erişim yetkilerini yönetin.</p></div>
      <button v-if="activeView==='users'" @click="showUserForm=true" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><Plus :size="16"/> Kullanıcı Ekle</button>
      <button v-else-if="activeView==='roles'" @click="showRoleForm=true" class="inline-flex h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"><Plus :size="16"/> Rol Ekle</button>
    </div>

    <div class="flex gap-1 rounded-xl border border-gray-200 bg-white p-1">
      <button v-for="tab in [{key:'users',label:'Kullanıcılar',icon:UserRound},{key:'roles',label:'Roller',icon:ShieldCheck},{key:'permissions',label:'Permissions',icon:LockKeyhole}]" :key="tab.key" @click="activeView=tab.key as any" class="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium" :class="activeView===tab.key?'bg-brand-50 text-brand-600':'text-gray-500 hover:bg-gray-50'"><component :is="tab.icon" :size="15"/>{{tab.label}}</button>
    </div>

    <template v-if="activeView==='users'">
      <div class="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-3">
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Toplam Kullanıcı</p><p class="mt-1 text-2xl font-semibold text-gray-900">{{users.length}}</p></div>
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Aktif</p><p class="mt-1 text-2xl font-semibold text-success-600">{{users.filter(u=>u.status==='Aktif').length}}</p></div>
        <div class="min-w-0 rounded-xl border border-gray-200 bg-white p-4"><p class="text-xs text-gray-500">Rol Sayısı</p><p class="mt-1 text-2xl font-semibold text-brand-600">{{roles.length}}</p></div>
      </div>
      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white"><div class="border-b border-gray-100 p-4"><div class="relative max-w-md"><Search :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/><input v-model="search" class="h-9 w-full rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-xs outline-none" placeholder="Kullanıcı ara..."/></div></div><div class="overflow-x-auto"><table class="w-full min-w-[800px] text-left"><thead class="bg-gray-50/70 text-xs text-gray-500"><tr><th class="px-5 py-3">Kullanıcı</th><th class="px-4 py-3">Rol</th><th class="px-4 py-3">Erişim Alanı</th><th class="px-4 py-3">Durum</th><th class="w-12"></th></tr></thead><tbody><tr v-for="user in filteredUsers" :key="user.id" class="border-t border-gray-100"><td class="px-5 py-4"><div class="flex items-center gap-3"><span class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">{{user.initials}}</span><div><p class="text-sm font-medium text-gray-800">{{user.name}}</p><p class="text-[11px] text-gray-400">{{user.email}}</p></div></div></td><td class="px-4 py-4"><span class="rounded-md bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-600">{{user.role}}</span></td><td class="px-4 py-4 text-xs text-gray-600">{{user.scope}}</td><td class="px-4 py-4"><span class="rounded-full px-2.5 py-1 text-[11px] font-medium" :class="user.status==='Aktif'?'bg-success-50 text-success-600':'bg-gray-100 text-gray-500'">{{user.status}}</span></td><td class="px-4"><button class="text-gray-400 hover:text-gray-700"><MoreHorizontal :size="17"/></button></td></tr></tbody></table></div></div>
    </template>

    <template v-else-if="activeView==='roles'">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2"><div v-for="role in roles" :key="role.key" class="rounded-xl border border-gray-200 bg-white p-5"><div class="flex items-start justify-between"><div><div class="flex items-center gap-2"><ShieldCheck :size="17" class="text-brand-600"/><h3 class="text-sm font-semibold text-gray-900">{{role.name}}</h3></div><p class="mt-2 text-xs leading-5 text-gray-500">{{role.description}}</p></div><span class="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-500">{{role.level}}</span></div><div class="mt-4 flex flex-wrap gap-1.5"><span v-for="permission in role.permissions" :key="permission" class="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] text-gray-600">{{permission}}</span></div><button @click="selectRole(role.key); activeView='permissions'" class="mt-4 text-xs font-medium text-brand-600 hover:underline">Yetkileri düzenle →</button></div></div>
    </template>

    <template v-else>
      <div class="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
        <div class="rounded-xl border border-gray-200 bg-white p-3"><p class="px-2 py-2 text-xs font-semibold text-gray-700">Roller</p><button v-for="role in roles" :key="role.key" @click="selectRole(role.key)" class="mb-1 w-full rounded-lg px-3 py-2.5 text-left" :class="selectedRole===role.key?'bg-brand-50':'hover:bg-gray-50'"><p class="text-xs font-medium" :class="selectedRole===role.key?'text-brand-600':'text-gray-700'">{{role.name}}</p><p class="mt-0.5 text-[10px] text-gray-400">{{role.level}}</p></button></div>
        <div class="rounded-xl border border-gray-200 bg-white p-5"><div class="mb-5 flex items-center justify-between"><div><h2 class="text-sm font-semibold text-gray-900">{{selectedRoleData.name}} · Permissions</h2><p class="mt-1 text-xs text-gray-500">Bu rolün sahip olduğu yetkileri belirleyin.</p></div><span class="rounded-md bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-600">{{selectedPermissions.length}} yetki</span></div><div class="space-y-4"><div v-for="group in permissionGroups" :key="group.name"><h3 class="mb-2 text-xs font-semibold text-gray-700">{{group.name}}</h3><div class="divide-y divide-gray-100 rounded-lg border border-gray-100"><label v-for="item in group.items" :key="item[0]" class="flex cursor-pointer items-center justify-between px-3 py-3 hover:bg-gray-50"><span><span class="block text-xs font-medium text-gray-700">{{item[1]}}</span><span class="text-[10px] text-gray-400">{{item[0]}}</span></span><input type="checkbox" :checked="selectedPermissions.includes(item[0])" @change="togglePermission(item[0])" class="h-4 w-4 rounded border-gray-300 text-brand-600"/></label></div></div></div><div class="mt-5 flex justify-end"><button class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white">Yetkileri Kaydet</button></div></div>
      </div>
    </template>

    <div v-if="showUserForm || showRoleForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="showUserForm=false;showRoleForm=false"><div class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><h2 class="text-base font-semibold text-gray-900">{{showUserForm?'Yeni Kullanıcı':'Yeni Rol'}}</h2><p class="mt-1 text-xs text-gray-500">Form altyapısı hazır; API bağlantısı backend aşamasında bağlanacak.</p><div class="mt-6 flex justify-end gap-2"><button @click="showUserForm=false;showRoleForm=false" class="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600">Vazgeç</button><button @click="showUserForm=false;showRoleForm=false" class="rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white">Kaydet</button></div></div></div>
  </section>
</template>
