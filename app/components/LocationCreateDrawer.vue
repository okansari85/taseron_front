<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[9999]">
      <button aria-label="Yeni lokasyon panelini kapat" class="absolute inset-0 h-full w-full cursor-default bg-slate-950/35 backdrop-blur-[1px]" @click="close"></button>

      <aside class="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col bg-white shadow-2xl dark:bg-gray-950">
        <div class="flex items-start justify-between border-b border-gray-200 px-6 py-5 dark:border-gray-800">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/10"><MapPin :size="20" /></div>
            <div>
              <h2 class="text-xl font-semibold text-gray-800 dark:text-white/90">Yeni Lokasyon</h2>
              <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Tenant seviyesinde yeni bir lokasyon oluşturun.</p>
            </div>
          </div>
          <button type="button" class="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Kapat" @click="close"><X :size="22" /></button>
        </div>

        <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="submit">
          <div class="flex-1 space-y-6 overflow-y-auto px-6 py-6">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Lokasyon Resmi</label>
              <div class="flex items-center gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
                  <img v-if="imagePreview" :src="imagePreview" alt="Lokasyon önizleme" class="h-full w-full object-cover" />
                  <MapPin v-else :size="28" class="text-gray-400" />
                </div>
                <div class="min-w-0">
                  <p class="text-sm font-medium text-gray-800 dark:text-white/90">Lokasyon görseli</p>
                  <p class="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">PNG, JPG veya WEBP · Maks. 2MB</p>
                  <input ref="imageInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="handleImageChange" />
                  <button type="button" class="mt-3 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="imageInput?.click()">{{ imageFile ? 'Resmi Değiştir' : 'Resim Seç' }}</button>
                  <p v-if="imageFile" class="mt-2 max-w-[300px] truncate text-xs text-brand-600 dark:text-brand-400">{{ imageFile.name }}</p>
                </div>
              </div>
            </div>

            <div>
              <label for="location-name" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Lokasyon Adı <span class="text-red-500">*</span></label>
              <input id="location-name" v-model="form.name" required maxlength="255" placeholder="Örn. Beylikdüzü Kampüsü" class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label for="location-city" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">İl <span class="text-red-500">*</span></label>
                <select id="location-city" v-model="form.city" required class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90">
                  <option value="">İl seçin</option>
                  <option v-for="city in cities" :key="city" :value="city">{{ city }}</option>
                </select>
              </div>
              <div>
                <label for="location-district" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">İlçe <span class="text-red-500">*</span></label>
                <input id="location-district" v-model="form.district" required maxlength="100" placeholder="İlçe" class="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90" />
              </div>
            </div>

            <div>
              <label for="location-address" class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Açık Adres <span class="text-red-500">*</span></label>
              <textarea id="location-address" v-model="form.address" required maxlength="1000" rows="4" placeholder="Mahalle, cadde, sokak, bina no..." class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"></textarea>
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-800 dark:text-white/90">Lokasyon Konumu</label>
              <div class="relative h-36 overflow-hidden rounded-xl border border-gray-200 bg-[#edf2f7] dark:border-gray-800 dark:bg-gray-900">
                <div class="absolute inset-0 bg-[linear-gradient(135deg,#edf2f7,#f8fafc)] dark:bg-[linear-gradient(135deg,#111827,#1f2937)]"></div>
                <div class="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
                  <span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/15"><MapPin :size="25" class="text-brand-500" /></span>
                  <span class="mt-2 rounded-md bg-white/90 px-2.5 py-1 text-[11px] font-medium text-gray-500 shadow-sm dark:bg-gray-900/90 dark:text-gray-400">Google Maps entegrasyonu yapılacak</span>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-4 dark:border-gray-800">
              <div>
                <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Durum</p>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Lokasyon aktif olarak oluşturulur.</p>
              </div>
              <button type="button" role="switch" :aria-checked="form.status === 'active'" class="relative h-6 w-11 rounded-full transition" :class="form.status === 'active' ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'" @click="form.status = form.status === 'active' ? 'passive' : 'active'">
                <span class="absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition" :class="form.status === 'active' ? 'left-6' : 'left-1'"></span>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
            <button type="button" class="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5" @click="close">İptal</button>
            <button type="submit" class="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600">Lokasyonu Oluştur</button>
          </div>
        </form>
      </aside>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { MapPin, X } from 'lucide-vue-next'

interface LocationForm {
  name: string
  city: string
  district: string
  address: string
  status: 'active' | 'passive'
}

const props = withDefaults(defineProps<{
  modelValue: boolean
}>(), { modelValue: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  save: [payload: LocationForm & { image: string }]
}>()

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Kocaeli', 'Bursa', 'Tekirdağ', 'Eskişehir', 'Manisa', 'Bolu']
const imageInput = ref<HTMLInputElement | null>(null)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const form = reactive<LocationForm>({ name: '', city: '', district: '', address: '', status: 'active' })

const reset = () => {
  form.name = ''
  form.city = ''
  form.district = ''
  form.address = ''
  form.status = 'active'
  imageFile.value = null
  imagePreview.value = ''
}

const close = () => emit('update:modelValue', false)

const handleImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  imageFile.value = file
  imagePreview.value = URL.createObjectURL(file)
}

const submit = () => {
  emit('save', { ...form, image: imagePreview.value })
  close()
  reset()
}

watch(() => props.modelValue, value => {
  if (!value) reset()
})
</script>
