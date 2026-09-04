<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Check, LoaderCircle, UserPlus, X } from '@lucide/vue'
import { userAuthorizationApi, type AuthorizationContractor, type AuthorizationRole } from '~/api/user-authorization'

const router = useRouter()
const { $toast } = useNuxtApp()

const open = ref(false)
const name = ref('')
const email = ref('')
const password = ref('')
const role = ref('')
const contractorId = ref<number | ''>('')
const roles = ref<AuthorizationRole[]>([])
const contractors = ref<AuthorizationContractor[]>([])
const loadingRoles = ref(false)
const loadingContractors = ref(false)
const saving = ref(false)

const loadRoles = async () => {
  loadingRoles.value = true
  try {
    roles.value = await userAuthorizationApi.listRoles()
  } catch (error) {
    console.error(error)
    $toast.error('Roller alınamadı.')
  } finally {
    loadingRoles.value = false
  }
}

const loadContractors = async () => {
  loadingContractors.value = true
  try {
    contractors.value = await userAuthorizationApi.listContractors()
  } catch (error) {
    console.error(error)
    $toast.error('Taşeronlar alınamadı.')
  } finally {
    loadingContractors.value = false
  }
}

const availableRoles = () => roles.value.filter((item) => item.name !== 'super-admin')
const isContractorRole = () => role.value === 'contractor'

const openModal = async () => {
  name.value = ''
  email.value = ''
  password.value = ''
  role.value = ''
  contractorId.value = ''
  open.value = true

  if (!roles.value.length) {
    await loadRoles()
  }

  role.value = availableRoles()[0]?.name ?? ''

  if (isContractorRole() && !contractors.value.length) {
    await loadContractors()
  }
}

const onRoleChange = async () => {
  contractorId.value = ''
  if (isContractorRole() && !contractors.value.length) {
    await loadContractors()
  }
}

const close = () => {
  if (!saving.value) {
    open.value = false
  }
}

const create = async () => {
  if (saving.value || loadingRoles.value || loadingContractors.value || !name.value.trim() || !email.value.trim() || password.value.length < 8) {
    return
  }

  if (isContractorRole() && contractorId.value === '') {
    $toast.error('Contractor rolündeki kullanıcı için taşeron firma seçmelisiniz.')
    return
  }

  saving.value = true

  try {
    const user = await userAuthorizationApi.createUser({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
      role: role.value || undefined,
      contractor_id: isContractorRole() ? Number(contractorId.value) : undefined,
    })

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

onMounted(loadRoles)
</script>

<template>
  <div>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white hover:bg-brand-700"
      @click="openModal"
    >
      <UserPlus :size="15" />
      Yeni Kullanıcı Ekle
    </button>

    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      @click.self="close"
    >
      <div class="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Yeni Kullanıcı Ekle</h2>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Kullanıcıyı oluşturduktan sonra detay sayfasından scope ve yetkilerini belirleyebilirsiniz.
            </p>
          </div>
          <button type="button" class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" @click="close">
            <X :size="17" />
          </button>
        </div>

        <div class="mt-5 space-y-4">
          <div>
            <label class="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Ad Soyad</label>
            <input v-model="name" type="text" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="Ad Soyad" />
          </div>
          <div>
            <label class="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">E-posta</label>
            <input v-model="email" type="email" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="ornek@firma.com" />
          </div>
          <div>
            <label class="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Geçici Şifre</label>
            <input v-model="password" type="password" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" placeholder="En az 8 karakter" />
          </div>
          <div>
            <label class="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Rol</label>
            <select v-model="role" :disabled="loadingRoles" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" @change="onRoleChange">
              <option value="">Rol seçin</option>
              <option v-for="item in availableRoles()" :key="item.id" :value="item.name">
                {{ item.name }}
              </option>
            </select>
            <p class="mt-2 text-[10px] text-gray-400">Super Admin hesabı bu ekrandan oluşturulmaz.</p>
          </div>
          <div v-if="isContractorRole()">
            <label class="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">Taşeron Firması</label>
            <select v-model="contractorId" :disabled="loadingContractors" class="h-10 w-full rounded-lg border border-gray-200 bg-white px-3 text-xs text-gray-900 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Taşeron firması seçin</option>
              <option v-for="item in contractors" :key="item.id" :value="item.id">
                {{ item.short_name || item.business_entity?.name || `Taşeron #${item.id}` }}
              </option>
            </select>
            <p class="mt-2 text-[10px] text-gray-400">Bu kullanıcı doğrudan seçilen taşeron firmasına bağlanır.</p>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700" @click="close">
            Vazgeç
          </button>
          <button
            type="button"
            :disabled="saving || loadingRoles || loadingContractors || !name.trim() || !email.trim() || password.length < 8 || (isContractorRole() && contractorId === '')"
            class="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
            @click="create"
          >
            <LoaderCircle v-if="saving" :size="14" class="animate-spin" />
            <Check v-else :size="14" />
            {{ saving ? 'Oluşturuluyor...' : 'Kullanıcıyı Oluştur' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
