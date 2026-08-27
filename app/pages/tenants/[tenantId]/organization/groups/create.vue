<script setup lang="ts">
import { ChevronDown, ChevronRight, FolderTree, Info, Save, X } from 'lucide-vue-next'
import { slugify } from '~/utils/slugify'
import { useOrganizationStore } from '~/stores/organization'
import { useTenantStore } from '~/stores/tenant'
import type { OrganizationPayload } from '~/types/organization'

definePageMeta({ layout: 'default' })
const route = useRoute()
const router = useRouter()
const organizationStore = useOrganizationStore()
const tenantStore = useTenantStore()
const groupName = ref('')
const slug = ref('')
const slugManuallyEdited = ref(false)
const description = ref('')
const groupCode = ref('')
const displayOrder = ref(0)
const isActive = ref(true)
const parentGroup = ref('')
const selectedColor = ref('#465FFF')
const tenantId = computed(() => Number(route.params.tenantId))
const tenant = computed(() => tenantStore.currentTenant)
const parentGroups = computed(() => organizationStore.groups)
const colors = ['#465FFF', '#1599E5', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#475467']

watch(groupName, value => { if (!slugManuallyEdited.value) slug.value = slugify(value) })

onMounted(async () => {
  if (tenantStore.currentTenant?.id !== tenantId.value) await tenantStore.fetchTenant(tenantId.value)
  await organizationStore.fetchOrganizationsForTenant(tenantId.value)
})

const saveGroup = async () => {
  const payload: OrganizationPayload = {
    name: groupName.value,
    slug: slug.value,
    description: description.value || null,
    code: groupCode.value || null,
    display_order: displayOrder.value,
    is_active: isActive.value,
    parent_id: parentGroup.value ? Number(parentGroup.value) : null,
    color: selectedColor.value,
    type: 'group',
  }

  await organizationStore.createOrganizationForTenant(tenantId.value, payload)
  await router.push(`/tenants/${tenantId.value}/organization/groups`)
}
</script>

<template>
  <div class="font-outfit">
    <div class="mx-auto w-full max-w-[1400px]">
      <div class="mb-5 flex items-center gap-2 text-xs text-gray-400"><span>Organizasyon</span><ChevronRight :size="14" /><span>Gruplar</span><ChevronRight :size="14" /><span class="font-medium text-brand-500">Yeni Grup</span></div>
      <div class="mb-7 flex items-start justify-between gap-6"><div><h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white/90">Yeni Grup</h1><p class="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">Sisteme yeni bir grup ekleyin. Grup, holding altında yer alan şirketlerin bağlı olduğu üst yapı birimidir.</p></div><div class="flex shrink-0 items-center gap-3"><button type="button" class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300"><X :size="16" />İptal</button><button type="button" class="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600" @click="saveGroup"><Save :size="16" />Kaydet</button></div></div>
      <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]"><section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><div class="mb-6"><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Genel Bilgiler</h2></div><div class="grid grid-cols-1 gap-5 md:grid-cols-2"><div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Grup Adı <span class="text-error-500">*</span></label><input v-model="groupName" type="text" placeholder="Grup adını giriniz" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><p class="mt-1.5 text-xs text-gray-400">Grubun sistemde görünecek adı.</p></div><div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Slug <span class="text-error-500">*</span></label><input v-model="slug" type="text" placeholder="Grup slug giriniz" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" @input="slugManuallyEdited = true" /><p class="mt-1.5 text-xs text-gray-400">URL'de kullanılacak kısa isim.</p></div><div class="md:col-span-2"><div class="flex items-center justify-between"><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açıklama</label><span class="text-xs text-gray-400">{{ description.length }} / 500</span></div><textarea v-model="description" maxlength="500" rows="4" placeholder="Grup hakkında açıklama giriniz (opsiyonel)" class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><p class="mt-1.5 text-xs text-gray-400">Grubun amacı, kapsamı ve bağlı olduğu şirketler hakkında bilgi.</p></div><div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Grup Kodu <span class="font-normal text-gray-400">(Opsiyonel)</span></label><input v-model="groupCode" type="text" placeholder="Grup kodu giriniz" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><p class="mt-1.5 text-xs text-gray-400">İç raporlama ve entegrasyonlar için kullanılır.</p></div><div><label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Sıra</label><input v-model.number="displayOrder" type="number" min="0" class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" /><p class="mt-1.5 text-xs text-gray-400">Listelerdeki görüntülenme sırası.</p></div></div><div class="my-6 border-t border-gray-100 dark:border-gray-800" /><div><h3 class="text-sm font-semibold text-gray-800 dark:text-white/90">Ebeveyn Grup</h3><p class="mt-1 text-xs text-gray-400">Bu grup başka bir grubun altında yer alabilir. Üst seviye grup oluşturuyorsanız boş bırakın.</p><div class="relative mt-4"><FolderTree :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><select v-model="parentGroup" class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"><option value="">Ebeveyn grup seçiniz (opsiyonel)</option><option v-for="group in parentGroups" :key="group.id" :value="group.id">{{ group.name }}</option></select><ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" /></div></div><div class="mt-5 flex gap-3 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/5"><Info :size="17" class="mt-0.5 shrink-0 text-brand-500" /><p class="text-xs leading-5 text-gray-600 dark:text-gray-300">Üst seviye grup doğrudan <span class="font-semibold text-brand-600 dark:text-brand-400">{{ tenant?.name ?? 'Tenant' }}</span> altında yer alır.</p></div></section><div class="space-y-5"><section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Durum</h2><div class="mt-5"><div class="text-sm font-medium text-gray-700 dark:text-gray-300">Aktif Durumu</div><button type="button" class="mt-3 flex items-center gap-3" @click="isActive = !isActive"><span class="relative h-6 w-11 rounded-full transition" :class="isActive ? 'bg-brand-500' : 'bg-gray-300'"><span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition" :class="isActive ? 'left-[22px]' : 'left-0.5'" /></span><span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ isActive ? 'Aktif' : 'Pasif' }}</span></button><p class="mt-2 text-xs leading-5 text-gray-400">Pasif gruplar sistemde listelenmez ve seçilemez.</p></div></section><section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"><h2 class="text-sm font-semibold text-gray-900 dark:text-white/90">Görünüm</h2><div class="mt-5"><label class="text-sm font-medium text-gray-700 dark:text-gray-300">İkon Rengi</label><div class="mt-3 flex items-center gap-3"><button v-for="color in colors" :key="color" type="button" class="flex h-7 w-7 items-center justify-center rounded-full transition" :style="{ backgroundColor: color }" @click="selectedColor = color"><span v-if="selectedColor === color" class="text-xs font-bold text-white">✓</span></button></div><p class="mt-3 text-xs leading-5 text-gray-400">Listelerde ve hiyerarşide kullanılacak vurgu rengi.</p></div></section></div></div>
      <section class="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 px-5 py-4 dark:border-brand-500/20 dark:bg-brand-500/5"><div class="flex gap-3"><Info :size="18" class="mt-0.5 shrink-0 text-brand-500" /><div><h3 class="text-sm font-semibold text-brand-600 dark:text-brand-400">Bilgilendirme</h3><ul class="mt-2 space-y-1 text-xs leading-5 text-gray-600 dark:text-gray-300"><li>• Grup kaydedildikten sonra şirketler bu gruba bağlanabilir.</li><li>• Grup hiyerarşisi Hiyerarşi Görünümü ekranından yönetilebilir.</li><li>• Bilgiler daha sonra düzenlenebilir.</li></ul></div></div></section>
    </div>
  </div>
</template>
