
export type WidgetComponentType = 'metric' | 'chart' | 'list' | 'carousel' | 'calendar'
export type LegacyDataSource = 'services' | 'tickets' | 'campaigns' | 'cms' | 'general'
export type DataSourceType = 'database' | 'campaign_context' | 'form_context' | 'system'

export type DataFieldType = 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage'

export interface DataField {
  key: string
  label: string
  type: DataFieldType
}

export interface DataSourceDefinition {
  id: string
  name: string
  type: DataSourceType
  category?: string
  fields: DataField[]
}

export interface WidgetDataConfig {
  sourceId: string
  
  // Selection
  metricField?: string
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max'
  
  dimensionField?: string // X-Axis
  seriesField?: string // Y-Axis
  
  columns?: string[] // For lists
  
  filters?: {
    field: string
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains'
    value: unknown
  }[]
  limit?: number
}

export type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'metric'
export type WidgetSize = 'full' | 'half' | 'quarter' | 'third'

export interface DashboardWidget {
  id: string
  type: WidgetComponentType
  title: string
  dataSource: LegacyDataSource | string // Support both legacy enum and dynamic source IDs
  size: WidgetSize
  enabled: boolean
  config: {
    chartType?: ChartType
    description?: string
  }
  dataConfig?: WidgetDataConfig // New configuration object
}

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { 
    id: 'default-services', 
    type: 'metric', 
    title: 'Serviços Ativos', 
    dataSource: 'services', 
    size: 'quarter',
    enabled: true,
    config: { description: 'Resumo dos serviços contratados.' } 
  },
  { 
    id: 'default-tickets', 
    type: 'metric', 
    title: 'Suporte', 
    dataSource: 'tickets', 
    size: 'quarter',
    enabled: true,
    config: { description: 'Tickets abertos e atualizações recentes.' } 
  },
  { 
    id: 'default-campaigns', 
    type: 'metric', 
    title: 'Campanhas', 
    dataSource: 'campaigns', 
    size: 'quarter',
    enabled: true,
    config: { description: 'Desempenho geral das campanhas.' } 
  },
  { 
    id: 'default-cms', 
    type: 'chart', 
    title: 'CMS / Dados', 
    dataSource: 'cms', 
    size: 'quarter',
    enabled: true,
    config: { description: 'Estatísticas de conteúdo.', chartType: 'pie' } 
  },
  { 
    id: 'default-activity', 
    type: 'list', 
    title: 'Atividade Recente', 
    dataSource: 'general', 
    size: 'full',
    enabled: true,
    config: { description: 'Histórico de ações e eventos.' } 
  },
]

export interface DashboardUser {
  slug: string
  name: string
  email: string
}

export interface CmsTypeStat {
  id: string
  name: string
  count: number
}

export interface DashboardStats {
  activeServices: number
  pendingInvoicesAmount: number
  openTickets: number
  campaigns?: { active: number, spend: number, clicks: number }
  cms?: { collections: number, entries: number, types?: CmsTypeStat[] }
  tracking?: {
    totalEvents24h: number
    eventsByHour: number[]
    lastEventTime: string | null
  }
}

export interface DashboardActivity {
  description: string
  date: string
  amount?: number
}

export interface DashboardResponse {
  stats: DashboardStats
  recentActivity: DashboardActivity[]
}
