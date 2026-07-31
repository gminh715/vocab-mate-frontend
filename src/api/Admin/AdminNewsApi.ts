import { apiClient } from '@/config/apiClient'
import type {
  AdminNewsSearchData,
  AdminNewsSearchParams,
  AdminNewsSyncData,
  AdminNewsSyncRequest,
} from '@/types/Admin/adminNews'

const adminNewsPath = '/admin/news'

export const adminNewsSearchRequestParams = (
  params: AdminNewsSearchParams,
) => ({
  ...(params.q ? { q: params.q } : {}),
  ...(params.section ? { section: params.section } : {}),
  ...(params.fromDate ? { fromDate: params.fromDate } : {}),
  ...(params.toDate ? { toDate: params.toDate } : {}),
  orderBy: params.orderBy,
  page: params.page,
  pageSize: params.pageSize,
})

export const adminNewsApi = {
  search: (params: AdminNewsSearchParams): Promise<AdminNewsSearchData> =>
    apiClient.get<AdminNewsSearchData>(`${adminNewsPath}/search`, {
      params: adminNewsSearchRequestParams(params),
    }),

  sync: (request: AdminNewsSyncRequest): Promise<AdminNewsSyncData> =>
    apiClient.post<AdminNewsSyncData>(`${adminNewsPath}/sync`, request),
}
