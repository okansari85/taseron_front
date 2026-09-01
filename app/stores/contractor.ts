import { defineStore } from 'pinia'
import { contractorApi, type ContractorApiRecord, type ContractorPayload } from '~/api/contractor'

export type Contractor = {
  id: number
  name: string
  shortName: string
  logoPath: string | null
  type: 'Daimi' | 'Geçici'
  status: 'active' | 'passive'
  initials: string
  avatarClass: string
}

const normalizeContractor = (record: ContractorApiRecord): Contractor => {
  const name = record.business_entity?.name ?? ''
  const shortName = record.short_name ?? ''
  const initials = shortName.trim().slice(0, 2).toLocaleUpperCase('tr-TR')

  return {
    id: record.id,
    name,
    shortName,
    logoPath: record.logo_path ?? null,
    type: record.contractor_type === 'permanent' ? 'Daimi' : 'Geçici',
    status: record.status ?? 'active',
    initials,
    avatarClass: 'bg-brand-50 text-brand-500',
  }
}

export const useContractorStore = defineStore('contractor', () => {
  const contractors = ref<Contractor[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const deleting = ref(false)
  const error = ref<string | null>(null)

  const fetchContractors = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await contractorApi.list()
      contractors.value = response.map(normalizeContractor)
      return contractors.value
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Alt yükleniciler alınamadı.'
      throw err
    } finally {
      loading.value = false
    }
  }

  const createContractor = async (payload: ContractorPayload) => {
    saving.value = true
    error.value = null
    try {
      const response = await contractorApi.create(payload)
      const contractor = normalizeContractor(response)
      contractors.value.unshift(contractor)
      return contractor
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Alt yüklenici oluşturulamadı.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const updateContractor = async (id: number, payload: ContractorPayload) => {
    saving.value = true
    error.value = null
    try {
      const response = await contractorApi.update(id, payload)
      const contractor = normalizeContractor(response)
      const index = contractors.value.findIndex(item => item.id === id)
      if (index !== -1) contractors.value[index] = contractor
      return contractor
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Alt yüklenici güncellenemedi.'
      throw err
    } finally {
      saving.value = false
    }
  }

  const deleteContractor = async (id: number) => {
    deleting.value = true
    error.value = null
    try {
      await contractorApi.remove(id)
      contractors.value = contractors.value.filter(item => item.id !== id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Alt yüklenici silinemedi.'
      throw err
    } finally {
      deleting.value = false
    }
  }

  return { contractors, loading, saving, deleting, error, fetchContractors, createContractor, updateContractor, deleteContractor }
})
