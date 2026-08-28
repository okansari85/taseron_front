import { defineStore } from "pinia";
import type { Company, CompanyApiRecord } from "~/types/company";
import { companyApi } from "~/api/company";
import { organizationCompanyApi } from "~/api/organization-company";

const normalizeCompany = (item: CompanyApiRecord): Company => {
  const group = item.organizations?.find(
    (organization) => organization.type === "group",
  );
  return {
    id: item.id,
    name: item.name,
    shortName: item.short_name ?? "",
    description: item.description ?? "",
    group: group?.name ?? "—",
    groupId: group?.id ?? null,
    brandCount: item.brands_count ?? 0,
    status: item.is_active === false ? "passive" : "active",
    createdAt: item.created_at ?? "",
    company_type: item.company_type ?? null,
    business_entity_id:
      item.business_entity_id ?? item.business_entity?.id ?? null,
  };
};

export const useCompanyStore = defineStore("company", () => {
  const companies = ref<Company[]>([]);
  const loadedTenantId = ref<number | null>(null);
  const loading = ref(false);
  const saving = ref(false);
  const deleting = ref(false);
  const error = ref<string | null>(null);
  const fetchCompanies = async (tenantId?: number) => {
    loading.value = true;
    error.value = null;
    try {
      const response = await companyApi.list();
      companies.value = response.map(normalizeCompany);
      loadedTenantId.value = tenantId ?? null;
      return companies.value;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Şirket listesi alınamadı.";
      throw err;
    } finally {
      loading.value = false;
    }
  };
  const createCompany = async (
    organizationId: number,
    payload: {
      name: string;
      company_type: "corporate";
      short_name: string;
      description: string;
      is_active: boolean;
    },
  ) => {
    saving.value = true;
    error.value = null;
    try {
      const created = await companyApi.create(payload);
      await organizationCompanyApi.attach(organizationId, created.id);
      return created;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Şirket oluşturulamadı.";
      throw err;
    } finally {
      saving.value = false;
    }
  };
  const updateCompany = async (
    id: number,
    payload: {
      name: string;
      company_type: "corporate";
      short_name: string;
      description: string;
      is_active: boolean;
    },
    previousOrganizationId?: number,
    newOrganizationId?: number,
    _businessEntityId?: number | null,
  ) => {
    saving.value = true;
    error.value = null;
    try {
      const response = await companyApi.update(id, payload);
      if (
        previousOrganizationId &&
        newOrganizationId &&
        previousOrganizationId !== newOrganizationId
      ) {
        await organizationCompanyApi.attach(newOrganizationId, id);
      }
      await fetchCompanies(loadedTenantId.value ?? undefined);
      return response;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Şirket güncellenemedi.";
      throw err;
    } finally {
      saving.value = false;
    }
  };
  const deleteCompany = async (id: number) => {
    deleting.value = true;
    error.value = null;
    try {
      await companyApi.remove(id);
      companies.value = companies.value.filter((item) => item.id !== id);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Şirket silinemedi.";
      throw err;
    } finally {
      deleting.value = false;
    }
  };
  return {
    companies,
    loadedTenantId,
    loading,
    saving,
    deleting,
    error,
    fetchCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
  };
});
