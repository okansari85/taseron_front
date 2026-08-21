<script setup lang="ts">
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  Info,
  Save,
  Upload,
  X,
} from 'lucide-vue-next'
import { slugify } from '~/utils/slugify'

definePageMeta({
  layout: 'workspace',
})

const route = useRoute()

const groupName = ref('')
const slug = ref('')
const slugManuallyEdited = ref(false)
const description = ref('')
const groupCode = ref('')
const displayOrder = ref(0)
const isActive = ref(true)
const parentGroup = ref('')
const selectedColor = ref('#465FFF')

const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)

const tenantId = computed(() => Number(route.params.tenantId))

const tenant = computed(() => ({
  id: tenantId.value,
  name: 'Koç Holding',
}))

const workspace = computed(() => ({
  name: 'Koç Holding Workspace',
}))

const parentGroups = [
  { id: 1, name: 'Tüketici Durable' },
  { id: 2, name: 'Enerji' },
  { id: 3, name: 'Otomotiv' },
]

const colors = [
  '#465FFF',
  '#1599E5',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#EC4899',
  '#475467',
]

watch(groupName, (value) => {
  if (!slugManuallyEdited.value) {
    slug.value = slugify(value)
  }
})

const handleSlugInput = () => {
  slugManuallyEdited.value = true
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  selectedFile.value = input.files[0]

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }

  previewUrl.value = URL.createObjectURL(selectedFile.value)
}

const removeFile = () => {
  selectedFile.value = null

  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
}

const saveGroup = async () => {
  const payload = {
    tenant_id: tenantId.value,
    workspace: workspace.value.name,
    name: groupName.value,
    slug: slug.value,
    description: description.value,
    code: groupCode.value,
    display_order: displayOrder.value,
    is_active: isActive.value,
    parent_id: parentGroup.value || null,
    color: selectedColor.value,
    logo: selectedFile.value,
  }

  console.log('Yeni grup:', payload)
}

const cancel = () => {
  navigateTo(`/tenants/${tenantId.value}/organization/groups`)
}
</script>

<template>
  <div class="mx-auto w-full max-w-[1250px] font-outfit">
    <div class="mb-5 flex items-center gap-2 text-xs text-gray-400">
      <span>Organizasyon</span>
      <ChevronRight :size="14" />
      <span>Gruplar</span>
      <ChevronRight :size="14" />
      <span class="font-medium text-brand-500">Yeni Grup</span>
    </div>

    <div class="mb-7 flex items-start justify-between gap-6">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900">Yeni Grup</h1>
        <p class="mt-1.5 max-w-2xl text-sm leading-6 text-gray-500">
          Sisteme yeni bir grup ekleyin. Grup, holding altında yer alan şirketlerin bağlı olduğu üst yapı birimidir.
        </p>
      </div>

      <div class="flex shrink-0 items-center gap-3">
        <button
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          @click="cancel"
        >
          <X :size="16" />
          İptal
        </button>

        <button
          type="button"
          class="inline-flex h-11 items-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-semibold text-white shadow-theme-xs transition hover:bg-brand-600"
          @click="saveGroup"
        >
          <Save :size="16" />
          Kaydet
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
        <div class="mb-6">
          <h2 class="text-sm font-semibold text-gray-900">Genel Bilgiler</h2>
        </div>

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-800">
              Grup Adı <span class="text-error-500">*</span>
            </label>
            <input
              v-model="groupName"
              type="text"
              placeholder="Grup adını giriniz"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <p class="mt-1.5 text-xs text-gray-400">Grubun sistemde görünecek adı.</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-800">
              Slug <span class="text-error-500">*</span>
            </label>
            <input
              v-model="slug"
              type="text"
              placeholder="Grup slug giriniz"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
              @input="handleSlugInput"
            />
            <p class="mt-1.5 text-xs text-gray-400">URL'de kullanılacak kısa isim.</p>
          </div>

          <div class="md:col-span-2">
            <div class="flex items-center justify-between">
              <label class="mb-2 block text-sm font-semibold text-gray-800">Açıklama</label>
              <span class="text-xs text-gray-400">{{ description.length }} / 500</span>
            </div>
            <textarea
              v-model="description"
              maxlength="500"
              rows="4"
              placeholder="Grup hakkında açıklama giriniz (opsiyonel)"
              class="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <p class="mt-1.5 text-xs text-gray-400">Grubun amacı, kapsamı ve bağlı olduğu şirketler hakkında bilgi.</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-800">
              Grup Kodu <span class="font-normal text-gray-400">(Opsiyonel)</span>
            </label>
            <input
              v-model="groupCode"
              type="text"
              placeholder="Grup kodu giriniz"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <p class="mt-1.5 text-xs text-gray-400">İç raporlama ve entegrasyonlar için kullanılır.</p>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-800">Sıra</label>
            <input
              v-model.number="displayOrder"
              type="number"
              min="0"
              class="h-11 w-full rounded-lg border border-gray-300 bg-white px-4 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            />
            <p class="mt-1.5 text-xs text-gray-400">Listelerdeki görüntülenme sırası.</p>
          </div>
        </div>

        <div class="my-6 border-t border-gray-100" />

        <div>
          <h3 class="text-sm font-semibold text-gray-800">Ebeveyn Grup</h3>
          <p class="mt-1 text-xs text-gray-400">
            Bu grup başka bir grubun altında yer alabilir. Üst seviye grup oluşturacaksanız boş bırakın.
          </p>

          <div class="relative mt-4">
            <FolderTree :size="17" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              v-model="parentGroup"
              class="h-11 w-full appearance-none rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
            >
              <option value="">Ebeveyn grup seçiniz (opsiyonel)</option>
              <option v-for="group in parentGroups" :key="group.id" :value="group.id">
                {{ group.name }}
              </option>
            </select>
            <ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        <div class="mt-5 flex gap-3 rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3">
          <Info :size="17" class="mt-0.5 shrink-0 text-brand-500" />
          <p class="text-xs leading-5 text-gray-600">
            Üst seviye grup doğrudan <span class="font-semibold text-brand-600">{{ tenant.name }}</span> altında yer alır.
          </p>
        </div>
      </section>

      <div class="space-y-5">
        <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
          <h2 class="text-sm font-semibold text-gray-900">Durum</h2>
          <div class="mt-5">
            <div class="text-sm font-medium text-gray-700">Aktif Durumu</div>
            <button type="button" class="mt-3 flex items-center gap-3" @click="isActive = !isActive">
              <span class="relative h-6 w-11 rounded-full transition" :class="isActive ? 'bg-brand-500' : 'bg-gray-300'">
                <span class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition" :class="isActive ? 'left-[22px]' : 'left-0.5'" />
              </span>
              <span class="text-sm font-medium text-gray-700">{{ isActive ? 'Aktif' : 'Pasif' }}</span>
            </button>
            <p class="mt-2 text-xs leading-5 text-gray-400">Pasif gruplar sistemde listelenmez ve seçilemez.</p>
          </div>
        </section>

        <section class="rounded-xl border border-gray-200 bg-white p-6 shadow-theme-xs">
          <h2 class="text-sm font-semibold text-gray-900">Görsel</h2>

          <div class="mt-5">
            <label class="text-sm font-medium text-gray-700">Grup Logosu</label>
            <input id="group-logo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" class="hidden" @change="handleFileChange" />

            <label
              for="group-logo"
              class="mt-3 flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50/50 transition hover:border-brand-300 hover:bg-brand-50/30"
            >
              <template v-if="previewUrl">
                <img :src="previewUrl" alt="Grup logosu" class="h-32 max-w-[180px] object-contain" />
              </template>
              <template v-else>
                <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm">
                  <Upload :size="18" />
                </div>
                <span class="text-sm font-medium text-gray-700">Logo yükleyin</span>
                <span class="mt-1 text-xs text-gray-400">PNG, JPG veya SVG</span>
                <span class="text-xs text-gray-400">Maks. 2MB</span>
              </template>
            </label>

            <button
              v-if="selectedFile"
              type="button"
              class="mt-2 text-xs font-medium text-error-500 hover:text-error-700"
              @click="removeFile"
            >
              Görseli kaldır
            </button>
          </div>

          <div class="mt-7">
            <label class="text-sm font-medium text-gray-700">İkon Rengi</label>
            <div class="mt-3 flex items-center gap-3">
              <button
                v-for="color in colors"
                :key="color"
                type="button"
                class="flex h-7 w-7 items-center justify-center rounded-full transition"
                :style="{ backgroundColor: color }"
                @click="selectedColor = color"
              >
                <span v-if="selectedColor === color" class="text-xs font-bold text-white">✓</span>
              </button>
            </div>
            <p class="mt-3 text-xs leading-5 text-gray-400">Listelerde ve hiyerarşide kullanılacak vurgu rengi.</p>
          </div>
        </section>
      </div>
    </div>

    <section class="mt-5 rounded-xl border border-brand-100 bg-brand-50/50 px-5 py-4">
      <div class="flex gap-3">
        <Info :size="18" class="mt-0.5 shrink-0 text-brand-500" />
        <div>
          <h3 class="text-sm font-semibold text-brand-600">Bilgilendirme</h3>
          <ul class="mt-2 space-y-1 text-xs leading-5 text-gray-600">
            <li>• Grup kaydedildikten sonra şirketler bu gruba bağlanabilir.</li>
            <li>• Grup hiyerarşisi Hiyerarşi Görünümü ekranından yönetilebilir.</li>
            <li>• Bilgiler daha sonra düzenlenebilir.</li>
          </ul>
        </div>
      </div>
    </section>
  </div>
</template>
