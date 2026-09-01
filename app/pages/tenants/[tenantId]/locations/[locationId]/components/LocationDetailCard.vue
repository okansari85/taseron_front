<script setup lang="ts">
import { EllipsisVertical, MapPin, Pencil } from "lucide-vue-next";

type LocationView = {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  image: string;
  status: "active" | "passive";
};

defineProps<{
  location: LocationView;
}>();
</script>

<template>
  <section
    class="overflow-hidden rounded-[10px] border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/[0.03]"
  >
    <div
      class="grid min-h-[207px] items-stretch lg:grid-cols-[252px_minmax(0,1fr)]"
    >
      <div class="p-3.5 lg:p-4">
        <div
          class="h-[178px] overflow-hidden rounded-[8px] bg-gray-100 dark:bg-gray-900"
        >
          <img
            v-if="location.image"
            :src="location.image"
            :alt="location.name"
            class="h-full w-full object-cover"
          />
        </div>
      </div>

      <div class="relative min-w-0 px-4 py-3.5 lg:px-5">
        <div
          class="absolute right-4 top-3.5 z-10 flex items-center gap-2"
        >
          <button
            class="inline-flex h-9 items-center gap-2 rounded-[7px] bg-brand-500 px-4 text-[11px] font-semibold text-white"
          >
            <Pencil :size="13" />
            Düzenle
          </button>

          <button
            class="flex h-9 w-9 items-center justify-center rounded-[7px] border border-gray-200 text-gray-500"
          >
            <EllipsisVertical :size="15" />
          </button>
        </div>

        <div class="grid h-full grid-cols-[minmax(0,1fr)_288px]">
          <div class="min-w-0 pt-5 pr-6">
            <div class="flex items-center gap-2">
              <h1
                class="text-[19px] font-semibold leading-6 tracking-tight text-gray-900 dark:text-white/90"
              >
                {{ location.name || "Lokasyon" }}
              </h1>

              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-[10px] font-semibold text-success-600"
              >
                <span
                  class="h-1.5 w-1.5 rounded-full bg-success-500"
                />
                {{ location.status === "active" ? "Aktif" : "Pasif" }}
              </span>
            </div>

            <div class="mt-7 space-y-5 text-[11px] text-gray-600">
              <div class="flex items-center gap-3">
                <MapPin :size="15" />
                <span>
                  {{ location.district }} / {{ location.city }}
                </span>
              </div>

              <div class="flex items-start gap-3">
                <MapPin :size="15" class="mt-0.5 shrink-0" />
                <span class="leading-4 text-gray-500">
                  {{ location.address }}
                </span>
              </div>
            </div>
          </div>

          <div class="pt-14">
            <div
              class="h-[96px] overflow-hidden rounded-[7px] border border-gray-200 bg-[#edf2f7]"
            >
              <div
                class="relative h-full w-full bg-[linear-gradient(135deg,#edf2f7,#f8fafc)]"
              >
                <div
                  class="absolute left-[52%] top-[48%] flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-500/15"
                >
                  <MapPin :size="25" class="text-brand-500" />
                </div>
              </div>
            </div>

            <button
              class="mt-2 inline-flex h-8 w-full items-center justify-center gap-2 rounded-[7px] border border-gray-200 bg-white text-[10px] font-semibold text-brand-500"
            >
              <MapPin :size="13" />
              Haritada Görüntüle
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>