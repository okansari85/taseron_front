export const useTenantRequestContext = () => {
  const tenantId = useState<number | null>('tenant_request_id', () => null)

  const setTenantId = (value: unknown) => {
    const raw = Array.isArray(value) ? value[0] : value
    const parsed = Number(raw)

    tenantId.value = Number.isInteger(parsed) && parsed > 0 ? parsed : null
  }

  const clearTenantId = () => {
    tenantId.value = null
  }

  return {
    tenantId,
    setTenantId,
    clearTenantId,
  }
}
