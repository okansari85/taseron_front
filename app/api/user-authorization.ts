import { apiClient } from './client'

type ApiResponse<T> = T | { data?: T }

const unwrap = <T>(response: ApiResponse<T>): T => {
  if (response && typeof response === 'object' && 'data' in response && response.data !== undefined) {
    return response.data as T
  }
  return response as T
}

export type AuthorizationPermission = { id: number; name: string; guard_name?: string }
export type AuthorizationRole = { id: number; name: string; guard_name?: string; permissions?: AuthorizationPermission[] }
export type AuthorizationScope = { id: number; scope_type: 'tenant' | 'organization' | 'location' | string; scope_id: number }
export type AuthorizedUser = {
  id: number; name: string; email: string; roles?: AuthorizationRole[]; permissions?: AuthorizationPermission[]; forbidden_permissions?: AuthorizationPermission[]; scopes?: AuthorizationScope[]; status?: string | number | boolean
}
export type ImpersonationResponse = { message: string; token: string; user: { id: number; name: string; email: string; roles: string[] } }

export const userAuthorizationApi = {
  listUsers: async () => unwrap<AuthorizedUser[]>(await apiClient<ApiResponse<AuthorizedUser[]>>('/api/users/authorization')),
  getUser: async (userId: number) => unwrap<AuthorizedUser>(await apiClient<ApiResponse<AuthorizedUser>>(`/api/users/${userId}/authorization`)),
  createUser: async (payload: { name: string; email: string; password: string; role?: string }) => unwrap<AuthorizedUser>(await apiClient<ApiResponse<AuthorizedUser>>('/api/users', { method: 'POST', body: payload })),
  deleteUser: async (userId: number) => apiClient<void>(`/api/users/${userId}`, { method: 'DELETE' }),
  impersonate: async (userId: number) => apiClient<ImpersonationResponse>(`/api/users/${userId}/impersonate`, { method: 'POST' }),
  assignRole: async (userId: number, role: string) => unwrap<AuthorizedUser>(await apiClient<ApiResponse<AuthorizedUser>>(`/api/users/${userId}/role`, { method: 'POST', body: { role } })),
  syncPermissions: async (userId: number, permissions: string[]) => unwrap<AuthorizedUser>(await apiClient<ApiResponse<AuthorizedUser>>(`/api/users/${userId}/permissions`, { method: 'PUT', body: { permissions } })),
  syncForbiddenPermissions: async (userId: number, permissions: string[]) => unwrap<AuthorizedUser>(await apiClient<ApiResponse<AuthorizedUser>>(`/api/users/${userId}/forbidden-permissions`, { method: 'PUT', body: { permissions } })),
  listRoles: async () => unwrap<AuthorizationRole[]>(await apiClient<ApiResponse<AuthorizationRole[]>>('/api/roles')),
  listPermissions: async () => unwrap<AuthorizationPermission[]>(await apiClient<ApiResponse<AuthorizationPermission[]>>('/api/permissions')),
  syncRolePermissions: async (role: string, permissions: string[]) => unwrap<AuthorizationRole>(await apiClient<ApiResponse<AuthorizationRole>>(`/api/roles/${encodeURIComponent(role)}/permissions`, { method: 'PUT', body: { permissions } })),
  listScopes: async (userId: number) => unwrap<AuthorizationScope[]>(await apiClient<ApiResponse<AuthorizationScope[]>>(`/api/users/${userId}/scopes`)),
  syncScopes: async (userId: number, scopes: Array<{ scope_type: string; scope_id: number }>) => unwrap<AuthorizationScope[]>(await apiClient<ApiResponse<AuthorizationScope[]>>(`/api/users/${userId}/scopes`, { method: 'PUT', body: { scopes } })),
}
