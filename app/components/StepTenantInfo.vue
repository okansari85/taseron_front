<template>
  <section>
    <div class="mb-6 flex items-start gap-3">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400">
        <Building2 :size="20" />
      </div>
      <div>
        <h2 class="text-theme-xl font-semibold text-gray-800 dark:text-white/90">Tenant Bilgileri</h2>
        <p class="mt-1 text-theme-sm text-gray-500 dark:text-gray-400">Tenant hesabınızın temel bilgilerini girin.</p>
      </div>
    </div>

    <div class="space-y-6">
      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Tenant Adı *</label>
        <input v-model="form.tenantName" type="text" placeholder="Örn. Koç Holding" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" @input="onTenantNameChange" />
        <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">Tenant sistemde bu ad ile görüntülenecektir.</p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Slug (Kısa Ad) *</label>
        <input v-model="form.slug" type="text" placeholder="koc-holding" class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800" @input="onSlugChange" />
        <p class="mt-1.5 text-theme-xs text-gray-500 dark:text-gray-400">Sistemde benzersiz olmalıdır. Küçük harf, rakam ve tire (-) kullanılabilir.</p>
      </div>

      <div>
        <div class="mb-3 text-sm font-medium text-gray-700 dark:text-gray-400">Durum <span class="text-error-500">*</span></div>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button type="button" :class="['rounded-lg border p-4 text-left transition', form.status === 'active' ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700']" @click="form.status = 'active'">
            <div class="flex items-center gap-2">
              <span :class="['h-4 w-4 rounded-full border-2 p-0.5', form.status === 'active' ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600']"><span v-if="form.status === 'active'" class="block h-full w-full rounded-full bg-brand-500" /></span>
              <span class="text-sm font-medium text-gray-800 dark:text-white/90">Aktif</span>
              <TailAdminBadge tone="success">Önerilen</TailAdminBadge>
            </div>
            <p class="mt-2 pl-6 text-theme-xs text-gray-500 dark:text-gray-400">Tenant hesabı aktif olarak kullanılabilir.</p>
          </button>

          <button type="button" :class="['rounded-lg border p-4 text-left transition', form.status === 'passive' ? 'border-brand-500 bg-brand-50/60 dark:border-brand-500 dark:bg-brand-500/10' : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-white/[0.03] dark:hover:border-gray-700']" @click="form.status = 'passive'">
            <div class="flex items-center gap-2">
              <span :class="['h-4 w-4 rounded-full border-2 p-0.5', form.status === 'passive' ? 'border-brand-500' : 'border-gray-300 dark:border-gray-600']"><span v-if="form.status === 'passive'" class="block h-full w-full rounded-full bg-brand-500" /></span>
              <span class="text-sm font-medium text-gray-800 dark:text-white/90">Pasif</span>
              <TailAdminBadge tone="gray">Devre dışı</TailAdminBadge>
            </div>
            <p class="mt-2 pl-6 text-theme-xs text-gray-500 dark:text-gray-400">Tenant hesabı pasif durumda oluşturulur.</p>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Building2 } from '@lucide/vue'

const form = useTenantForm()

function onTenantNameChange() {
  if (!form.value.slugTouched) form.value.slug = slugify(form.value.tenantName)
}

function onSlugChange() {
  form.value.slugTouched = true
  form.value.slug = slugify(form.value.slug)
}
</script>
