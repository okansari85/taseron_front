import { workspaceThemeApi, type WorkspaceTheme } from '~/api/workspace-theme'

/**
 * Paylaşılan çalışma alanı (grup) teması: aktif grubun rengini ve logosunu
 * tüm Tanımlamalar sayfalarında tutarlı şekilde kullanmak için.
 * TenantSidebar'daki aynı mantığın paylaşılan/önbelleklenmiş hali.
 */
export const useWorkspaceTheme = () => {
  const theme = useState<WorkspaceTheme | null>('workspace-theme', () => null)
  const loadedForTenant = useState<number | null>('workspace-theme-tenant', () => null)

  const load = async (tenantId: number | null | undefined) => {
    if (!tenantId) {
      theme.value = null
      loadedForTenant.value = null
      return
    }
    if (loadedForTenant.value === tenantId && theme.value) return
    try {
      const response = await workspaceThemeApi.get()
      theme.value = response.data
      loadedForTenant.value = tenantId
    } catch (error) {
      theme.value = null
    }
  }

  const color = computed(() => theme.value?.organization?.color ?? null)
  const groupName = computed(() => theme.value?.organization?.name ?? null)

  return { theme, color, groupName, load }
}
