<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth',
})

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')

const auth = useAuth()

const handleSubmit = async () => {
  errorMessage.value = ''

  try {
    await auth.login(email.value, password.value)
    await navigateTo('/')
  } catch (error: any) {
    errorMessage.value = error?.data?.message || 'E-posta veya şifre hatalı.'
  }
}
</script>

<template>
  <main class="min-h-screen bg-white lg:grid lg:grid-cols-2">
    <section class="flex min-h-screen flex-col px-6 py-8 sm:px-10 lg:px-16 xl:px-24">
      <div class="flex items-center">
        <NuxtLink to="/" class="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
          <span aria-hidden="true">←</span>
          Dashboard'a dön
        </NuxtLink>
      </div>

      <div class="mx-auto flex w-full max-w-[500px] flex-1 items-center py-12 lg:py-16">
        <div class="w-full">
          <div class="mb-8">
            <h1 class="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Giriş Yap</h1>
            <p class="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
              E-posta adresiniz ve şifreniz ile giriş yapın.
            </p>
          </div>

          <form class="space-y-6" @submit.prevent="handleSubmit">
            <div>
              <label for="email" class="mb-2 block text-sm font-semibold text-slate-800">E-posta<span class="text-red-500">*</span></label>
              <div class="relative">
                <span aria-hidden="true" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">✉</span>
                <input id="email" v-model="email" type="email" autocomplete="email" required placeholder="E-posta adresinizi giriniz" class="h-14 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
              </div>
            </div>

            <div>
              <label for="password" class="mb-2 block text-sm font-semibold text-slate-800">Şifre<span class="text-red-500">*</span></label>
              <div class="relative">
                <span aria-hidden="true" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">▣</span>
                <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required placeholder="Şifrenizi giriniz" class="h-14 w-full rounded-lg border border-slate-300 bg-white pl-12 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10" />
                <button type="button" class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700" :aria-label="showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'" @click="showPassword = !showPassword">
                  {{ showPassword ? '◉' : '◌' }}
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between gap-4">
              <label class="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
                <input v-model="rememberMe" type="checkbox" class="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Oturumumu açık tut
              </label>
              <button type="button" class="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700">Şifremi unuttum?</button>
            </div>

            <p v-if="errorMessage" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {{ errorMessage }}
            </p>

            <button type="submit" :disabled="auth.loading" class="h-14 w-full rounded-lg bg-indigo-600 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              {{ auth.loading ? 'Giriş yapılıyor...' : 'Giriş Yap' }}
            </button>

            <p class="text-sm text-slate-600">
              Hesabınız yok mu?
              <button type="button" class="font-semibold text-indigo-600 transition hover:text-indigo-700">Kayıt Ol</button>
            </p>
          </form>
        </div>
      </div>
    </section>

    <section class="relative hidden min-h-screen overflow-hidden bg-slate-950 lg:block">
      <img src="/images/taseron-login-workers.jpg" alt="Şantiye sahasında çalışan taşeron ekip" class="absolute inset-0 h-full w-full object-cover" />
      <div class="absolute inset-0 bg-slate-950/20" />
      <div class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-950/35 to-transparent" />

      <div class="relative flex h-full min-h-screen items-center justify-center px-12 text-center">
        <div class="max-w-xl rounded-3xl bg-slate-950/20 px-8 py-10 backdrop-blur-[2px]">
          <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-950/30">
            <span class="text-2xl font-black text-white">T</span>
          </div>
          <h2 class="text-4xl font-bold tracking-tight text-white drop-shadow-sm xl:text-5xl">Taşeron Yönetimi</h2>
          <p class="mx-auto mt-4 max-w-lg text-base leading-7 text-white/85 xl:text-lg">
            Taşeronlarınızı, firmalarınızı, organizasyonlarınızı ve lokasyonlarınızı tek merkezden yönetin.
          </p>
        </div>
      </div>
    </section>
  </main>
</template>
