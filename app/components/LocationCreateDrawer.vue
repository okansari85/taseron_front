<script setup lang="ts">
import { MapPin, X } from 'lucide-vue-next'
import { locationApi, type City, type District } from '~/api/location'

const props = withDefaults(defineProps<{ modelValue: boolean }>(), { modelValue: false })
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; saved: [] }>()

const route = useRoute()
const tenantId = String(route.params.tenantId ?? '')
const form = reactive({ name: '', city_id: '', district_id: '', address: '', status: true })
const cities = ref<City[]>([])
const districts = ref<District[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const loading = ref(false)
const loadingCities = ref(false)
const loadingDistricts = ref(false)
const error = ref('')

const reset = () => {
  form.name = ''
  form.city_id = ''
  form.district_id = ''
  form.address = ''
  form.status = true
  districts.value = []
  imageFile.value = null
  imagePreview.value = ''
  error.value = ''
}

const close = () => emit('update:modelValue', false)

const loadCities = async () => {
  if (cities.value.length) return
  loadingCities.value = true
  try { cities.value = await locationApi.cities() }
  catch (e) { error.value = e instanceof Error ? e.message : 'İller yüklenemedi.' }
  finally { loadingCities.value = false }
}

const loadDistricts = async () => {
  form.district_id = ''
  districts.value = []
  if (!form.city_id) return
  loadingDistricts.value = true
  try { districts.value = await locationApi.districts(Number(form.city_id)) }
  catch (e) { error.value = e instanceof Error ? e.message : 'İlçeler yüklenemedi.' }
  finally { loadingDistricts.value = false }
}

const handleImageChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) { error.value = 'Lokasyon resmi en fazla 5 MB olabilir.'; return }
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
  error.value = ''
}

const submit = async () => {
  error.value = ''
  loading.value = true
  try {
    const data = new FormData()
    data.append('name', form.name)
    data.append('city_id', form.city_id)
    data.append('district_id', form.district_id)
    data.append('address', form.address)
    data.append('is_active', form.status ? '1' : '0')
    if (imageFile.value) data.append('image', imageFile.value)
    await locationApi.create(tenantId, data)
    emit('saved')
    close()
    reset()
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Lokasyon oluşturulamadı.'
  } finally { loading.value = false }
}

watch(() => props.modelValue, async value => {
  if (value) { error.value = ''; await loadCities() }
  else reset()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999]">
      <button aria-label="Yeni lokasyon panelini kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="close" />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"><MapPin :size="20" /></div>
            <div><h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Yeni Lokasyon</h2><p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenant seviyesinde yeni bir lokasyon oluşturun.</p></div>
          </div>
          <button type="button" class="rounded-lg p-2 text-gray-400" @click="close"><X :size="22" /></button>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
          <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{{ error }}</div>
            <div>
              <label class="mb-2 block text-sm font-semibold">Lokasyon Resmi</label>
              <div class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800"><img v-if="imagePreview" :src="imagePreview" class="h-full w-full object-cover" /><MapPin v-else :size="28" class="text-gray-400" /></div>
                <div><p class="text-sm font-medium">Lokasyon görseli</p><p class="mt-1 text-xs text-gray-500">PNG, JPG veya WEBP · Maks. 5MB</p><input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleImageChange" /><button type="button" class="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold" @click="imageInput?.click()">{{ imageFile ? 'Resmi Değiştir' : 'Resim Seç' }}</button><p v-if="imageFile" class="mt-2 max-w-[300px] truncate text-xs text-brand-600">{{ imageFile.name }}</p></div>
              </div>
            </div>
            <div><label class="mb-2 block text-sm font-semibold">Lokasyon Adı <span class="text-red-500">*</span></label><input v-model="form.name" required maxlength="255" placeholder="Örn. Beylikdüzü Kampüsü" class="h-12 w-full rounded-lg border px-4 text-sm" /></div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div><label class="mb-2 block text-sm font-semibold">İl <span class="text-red-500">*</span></label><select v-model="form.city_id" required class="h-12 w-full rounded-lg border px-4 text-sm" @change="loadDistricts"><option value="">{{ loadingCities ? 'İller yükleniyor...' : 'İl seçin' }}</option><option v-for="city in cities" :key="city.id" :value="String(city.id)">{{ city.name }}</option></select></div>
              <div><label class="mb-2 block text-sm font-semibold">İlçe <span class="text-red-500">*</span></label><select v-model="form.district_id" required :disabled="!form.city_id || loadingDistricts" class="h-12 w-full rounded-lg border px-4 text-sm"><option value="">{{ loadingDistricts ? 'İlçeler yükleniyor...' : 'İlçe seçin' }}</option><option v-for="district in districts" :key="district.id" :value="String(district.id)">{{ district.name }}</option></select></div>
            </div>
            <div><label class="mb-2 block text-sm font-semibold">Açık Adres <span class="text-red-500">*</span></label><textarea v-model="form.address" required maxlength="1000" rows="4" placeholder="Mahalle, cadde, sokak, bina no..." class="w-full resize-none rounded-lg border px-4 py-3 text-sm" /></div>
            <div><label class="mb-2 block text-sm font-semibold">Lokasyon Konumu</label><div class="relative h-36 overflow-hidden rounded-xl border bg-[#edf2f7]"><div class="absolute inset-0 bg-[linear-gradient(135deg,#edf2f7,#f8fafc)]" /><div class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"><MapPin :size="25" class="text-brand-500" /><span class="mt-2 rounded-md bg-white/90 px-2.5 py-1 text-[11px] text-gray-500 shadow-sm">Google Maps entegrasyonu yapılacak</span></div></div></div>
            <div class="flex items-center justify-between rounded-xl border px-4 py-4"><div><p class="text-sm font-semibold">Durum</p><p class="mt-1 text-xs text-gray-500">Lokasyon aktif olarak oluşturulur.</p></div><button type="button" role="switch" :aria-checked="form.status" class="relative h-6 w-11 rounded-full" :class="form.status ? 'bg-brand-500' : 'bg-gray-300'" @click="form.status = !form.status"><span class="absolute top-1 h-4 w-4 rounded-full bg-white transition" :class="form.status ? 'left-6' : 'left-1'" /></button></div>
          </div>
          <div class="flex items-center justify-end gap-3 border-t px-6 py-4"><button type="button" class="rounded-lg border px-4 py-2.5 text-sm font-semibold" @click="close">İptal</button><button type="submit" :disabled="loading" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{{ loading ? 'Kaydediliyor...' : 'Lokasyonu Oluştur' }}</button></div>
        </form>
      </aside>
    </div>
  </Teleport>
</template>
