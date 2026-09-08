<script setup lang="ts">
import { LockKeyhole, ShieldCheck } from '@lucide/vue'

definePageMeta({ layout: 'auth' })

const auth = useAuth()
const tenantContext = useTenantRequestContext()

const form = reactive({ email: '', password: '' })
const errorMessage = ref('')
const isSubmitting = ref(false)

const login = async () => {
  if (isSubmitting.value) return
  errorMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await auth.login(form.email, form.password)
    const roles = response.user.roles ?? []

    if (!roles.includes('contractor')) {
      await auth.logout()
      errorMessage.value = 'Bu panel yalnızca taşeron kullanıcıları içindir.'
      return
    }

    tenantContext.setTenantId(response.user.contractor?.tenant_id)
    await navigateTo('/contractor-portal/dashboard')
  } catch (error: any) {
    const status = error?.response?.status || error?.statusCode

    if (status === 401) {
      errorMessage.value = 'Kullanıcı adı veya şifre hatalı.'
    } else if (error?.name === 'FetchError' || error?.name === 'AbortError') {
      errorMessage.value = 'Sunucuya bağlanılamadı.'
    } else {
      errorMessage.value = error?.data?.message || error?.message || 'Giriş sırasında bir hata oluştu.'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>
<template>
  <div class="min-h-screen bg-gray-50 px-4 py-10 dark:bg-gray-950">
    <div class="mx-auto flex min-h-[80vh] max-w-md items-center">
      <div class="w-full rounded-2xl border border-gray-200 bg-white p-8 shadow-theme-xs dark:border-gray-800 dark:bg-gray-900">
        <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/10">
          <ShieldCheck :size="24" />
        </div>
        <h1 class="mt-5 text-center text-2xl font-semibold">Taşeron Portalı</h1>
        <p class="mt-1 text-center text-sm text-gray-500">E-posta ve şifrenizle giriş yapın.</p>
        <form class="mt-8 space-y-4" @submit.prevent="login">
          <label class="block">
            <span class="mb-2 block text-sm">E-posta</span>
            <input
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              class="h-11 w-full rounded-xl border border-gray-200 px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
              placeholder="ornek@firma.com"
            />
          </label>
          <label class="block">
            <span class="mb-2 block text-sm">Şifre</span>
            <div class="relative">
              <LockKeyhole class="absolute left-3 top-3 text-gray-400" :size="17" />
              <input
                v-model="form.password"
                required
                type="password"
                autocomplete="current-password"
                class="h-11 w-full rounded-xl border border-gray-200 pl-10 pr-3 text-sm dark:border-gray-700 dark:bg-gray-900"
                placeholder="••••••••"
              />
            </div>
          </label>
          <p v-if="errorMessage" class="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-xs text-error-600">
            {{ errorMessage }}
          </p>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="h-11 w-full rounded-xl bg-brand-500 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{ isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
          </button>
        </form>
        <div class="mt-6 rounded-xl bg-gray-50 p-3 text-xs text-gray-500 dark:bg-white/5">
          Bu panel yalnızca taşeron kullanıcıları içindir. Daimi ve geçici taşeron yetkileri aynı giriş altyapısını kullanır; menü ve iş akışı tipine göre ayrılır.
        </div>
      </div>
    </div>
  </div>
</template>
