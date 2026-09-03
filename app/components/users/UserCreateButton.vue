<script setup lang="ts">
import { ref } from 'vue'
import { Check, LoaderCircle, UserPlus, X } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizationRole } from '~/api/user-authorization'

const props = defineProps<{ roles: AuthorizationRole[] }>()
const router = useRouter()
const { $toast } = useNuxtApp()
const open = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const role = ref('')
const saving = ref(false)

const openModal = () => {
  name.value = ''
  email.value = ''
  password.value = ''
  role.value = props.roles.find(item => item.name !== 'super-admin')?.name ?? ''
  open.value = true
}

const close = () => { if (!saving.value) open.value = false }

const create = async () => {
  if (saving.value || !name.value.trim() || !email.value.trim() || password.value.length < 8) return
  saving.value = true
  try {
    const user = await userAuthorizationApi.createUser({ name: name.value.trim(), email: email.value.trim(), password: password.value, role: role.value || undefined })
    open.value = false
    $toast.success('Kullanıcı başarıyla oluşturuldu.')
    await router.push(`/tenants/${router.currentRoute.value.params.tenantId}/users/${user.id}`)
  } catch (error) {
    console.error(error)
    $toast.error('Kullanıcı oluşturulamadı.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <>
    <button @click="openModal" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700">
      <UserPlus :size="15" /> Yeni Kullanıcı Ekle
    </button>

    <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" @click.self="close">
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-900">Yeni Kullanıcı Ekle</h2>
            <p class="mt-1 text-xs text-gray-500">Kullanıcıyı oluşturduktan sonra detay sayfasından scope ve yetkilerini belirleyebilirsiniz.</p>
          </div>
          <button @click="close" class="text-gray-400 hover:text-gray-700"><X :size="17" /></button>
        </div>

        <div class="mt-5 space-y-4">
          <div><label class="mb-2 block text-xs font-medium text-gray-700">Ad Soyad</label><input v-model="name" class="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none" placeholder="Ad Soyad" /></div>
          <div><label class="mb-2 block text-xs font-medium text-gray-700">E-posta</label><input v-model="email" type="email" class="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none" placeholder="ornek@firma.com" /></div>
          <div><label class="mb-2 block text-xs font-medium text-gray-700">Geçici Şifre</label><input v-model="password" type="password" class="h-10 w-full rounded-lg border border-gray-200 px-3 text-xs outline-none" placeholder="En az 8 karakter" /></div>
          <div><label class="mb-2 block text-xs font-medium text-gray-700">Rol</label><select v-model="role" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs outline-none"><option value="">Rol seçin</option><option v-for="item in roles.filter(item => item.name !== 'super-admin')" :key="item.id" :value="item.name">{{ item.name }}</option></select><p class="mt-2 text-[10px] text-gray-400">Super Admin hesabı bu ekrandan oluşturulmaz.</p></div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button @click="close" class="rounded-lg border border-gray-200 px-4 py-2 text-xs text-gray-600">Vazgeç</button>
          <button :disabled="saving || !name.trim() || !email.trim() || password.length < 8" @click="create" class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"><LoaderCircle v-if="saving" :size="14" class="animate-spin" /><Check v-else :size="14" />{{ saving ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur' }}</button>
        </div>
      </div>
    </div>
  </>
</template>
