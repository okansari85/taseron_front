import { fireSuppressionCategorySettingApi, type FireSuppressionCategorySettingItem } from '~/api/fire-suppression-category-settings'
import { FIRE_SUPPRESSION_CATEGORIES, FIRE_SUPPRESSION_CATEGORY_LABELS, type FireSuppressionCategory } from '~/types/fire-suppression-inventory'

// Kategori taksonomisi (yangin_dolabi, su_deposu, ...) SABİTTİR — eşleştirme/
// AI/rapor mantığı bu kodlara dayanır. Ama her müşteri tesisatında bunu
// kendi diliyle adlandırabilir ("genellikle her müşteride aynıdır ama ismi
// değişir") ve kullanmadığı kategorileri "Sistem Ekle" listesinden
// gizleyebilir — bkz. Ayarlar > Sistem Adları ekranı. Bu composable, o
// özelleştirmeleri BİR KEZ (module-level, paylaşılan state) yükler; her
// sayfa kendi isteğini atmaz, aynı veriyi paylaşır.
const settings = ref<FireSuppressionCategorySettingItem[]>([])
const loaded = ref(false)
const loading = ref(false)

export const useFireSuppressionCategorySettings = () => {
  const load = async (force = false) => {
    if ((loaded.value && !force) || loading.value) return
    loading.value = true
    try {
      const { data } = await fireSuppressionCategorySettingApi.list()
      settings.value = data
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  const byCategory = computed(() => new Map(settings.value.map(s => [s.category, s])))

  const label = (category: FireSuppressionCategory | string): string => {
    const override = byCategory.value.get(category as FireSuppressionCategory)
    return override?.custom_label || FIRE_SUPPRESSION_CATEGORY_LABELS[category as FireSuppressionCategory] || category
  }

  const isEnabled = (category: FireSuppressionCategory): boolean => byCategory.value.get(category)?.is_enabled ?? true

  const enabledCategories = computed(() => FIRE_SUPPRESSION_CATEGORIES.filter(isEnabled))

  const applyUpdate = (item: FireSuppressionCategorySettingItem) => {
    const idx = settings.value.findIndex(s => s.category === item.category)
    if (idx === -1) settings.value = [...settings.value, item]
    else settings.value = settings.value.map((s, i) => (i === idx ? item : s))
  }

  return { settings, loaded, loading, load, label, isEnabled, enabledCategories, applyUpdate }
}
