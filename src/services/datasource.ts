import { api } from "@/lib/api"

export interface DataSourceConfig {
  [key: string]: unknown
}

export interface DataSource {
  id: string
  name: string
  type: 'STRIPE' | 'FORM' | 'CAMPAIGN' | 'TRACKING' | 'CMS' | 'MANUAL' | 'SYSTEM' | 'PRODUCT'
  integrationId?: string
  status: 'ACTIVE' | 'PENDING' | 'ERROR' | 'ARCHIVED'
  config?: DataSourceConfig
  lastSyncedAt?: string
  createdAt: string
  updatedAt: string
}

export interface CreateDataSourceDTO {
  name: string
  type: string
  integrationId?: string
  config?: DataSourceConfig
  status?: string
}

export interface ColumnDefinition {
  key: string
  label?: string
  mappingKey: string
  type?: string
}

export interface DataSourceDataResponse {
  columns: ColumnDefinition[]
  data: Record<string, unknown>[]
  total: number
}

export const getDataSources = async (clientSlug: string): Promise<DataSource[]> => {
  const response = await api.get(`/${clientSlug}/datasources`)
  return response.data
}

export const createDataSource = async (clientSlug: string, data: CreateDataSourceDTO): Promise<DataSource> => {
  const response = await api.post(`/${clientSlug}/datasources`, data)
  return response.data
}

export const updateDataSource = async (clientSlug: string, id: string, data: Partial<CreateDataSourceDTO>): Promise<DataSource> => {
  const response = await api.put(`/${clientSlug}/datasources/${id}`, data)
  return response.data
}

export const deleteDataSource = async (clientSlug: string, id: string): Promise<void> => {
  await api.delete(`/${clientSlug}/datasources/${id}`)
}

export const syncDataSource = async (clientSlug: string, id: string): Promise<DataSource> => {
  const response = await api.post(`/${clientSlug}/datasources/${id}/sync`)
  return response.data
}

export const getDataSourceData = async (clientSlug: string, id: string, page = 1, limit = 50, filters: Record<string, unknown> = {}): Promise<DataSourceDataResponse> => {
  const response = await api.get(`/${clientSlug}/datasources/${id}/data`, { params: { page, limit, filters: JSON.stringify(filters) } })
  return response.data
}
