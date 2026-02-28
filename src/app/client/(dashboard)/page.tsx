
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  MetricWidget, 
  ListWidget, 
  ChartWidget, 
  CarouselWidget, 
  CalendarWidget,
  MetricData,
  ListData,
  ChartData,
  CarouselData,
  CalendarData
} from "@/components/dashboard/dashboard-widgets"
import { DashboardCustomizer } from "@/components/dashboard/dashboard-customizer"
import { SortableWidget } from "@/components/dashboard/sortable-widget"
import { 
  DashboardWidget, 
  DEFAULT_WIDGETS, 
  DashboardUser, 
  DashboardResponse,
  LegacyDataSource,
  WidgetComponentType,
  DataSourceDefinition,
} from "@/components/dashboard/types"
import { AVAILABLE_DATA_SOURCES } from "@/components/dashboard/mock-data-sources"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus } from "lucide-react"
import { api } from "@/lib/api"
import { isAxiosError } from "axios"

export default function ClientDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [data, setData] = useState<DashboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [widgets, setWidgets] = useState<DashboardWidget[]>([])
  const [configLoaded, setConfigLoaded] = useState(false)
  const [isSetup, setIsSetup] = useState(false)

  // Customizer State
  const [customizerOpen, setCustomizerOpen] = useState(false)
  const [customizerMode, setCustomizerMode] = useState<'add' | 'edit'>('add')
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8, // Require 8px movement before drag starts to prevent accidental clicks
        }
    }),
    useSensor(KeyboardSensor)
  )

  useEffect(() => {
    const fetchDashboardData = async (userData?: DashboardUser) => {
      const currentUser = userData
      if (!currentUser) {
          setLoading(false)
          return
      }
  
      try {
        // 1. Fetch Dashboard Stats
        // Note: api baseURL already includes /api, so we just need /${currentUser.slug}/dashboard
        const dashboardRes = await api.get(`/${currentUser.slug}/dashboard`)
        
        const dashboardJson = dashboardRes.data
        const stats = dashboardJson.stats
  
        // 2. Fetch Tracking Stats (if module active)
        try {
            const datasetsRes = await api.get(`/tracking/datasets`)
            if (datasetsRes.data) {
                const datasets = datasetsRes.data
                if (datasets.length > 0) {
                    const datasetId = datasets[0].id // Use first dataset
                    const statsRes = await api.get(`/tracking/datasets/${datasetId}/stats`)
                    if (statsRes.data) {
                        const trackingStats = statsRes.data
                        stats.tracking = trackingStats
                    }
                }
            }
        } catch (e: unknown) {
            console.error("Error fetching tracking stats", e)
            if (isAxiosError(e) && e.response?.status === 401) {
                throw e
            }
        }

        // Update state
        setData({
            stats: stats || {},
            recentActivity: dashboardJson.recentActivity || []
        })

      } catch (error: unknown) {
        console.error("Erro ao buscar dados do dashboard:", error)
        
        if (isAxiosError(error) && error.response?.status === 401) {
          localStorage.removeItem("agency_token")
          localStorage.removeItem("agency_user")
          // Clear other potential conflicting tokens
          localStorage.removeItem("agency_admin_token")
          localStorage.removeItem("agency_client_token")
          
          router.push('/auth/login')
          return
        }

        // Fallback: Set data to null or empty to avoid mock data
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    // Load config from localStorage
    const storedConfig = localStorage.getItem("dashboard_widgets_config")
    if (storedConfig) {
      try {
        const parsedConfig = JSON.parse(storedConfig)
        // Migration check: if config is old format (no dataSource property), reset to defaults
        if (parsedConfig.length > 0 && !parsedConfig[0].dataSource) {
           console.log("Migrating old dashboard config to new format")
           setWidgets(DEFAULT_WIDGETS)
           localStorage.setItem("dashboard_widgets_config", JSON.stringify(DEFAULT_WIDGETS))
           setIsSetup(true)
        } else {
           setWidgets(parsedConfig)
           setIsSetup(true)
        }
      } catch (e) {
        console.error("Failed to parse widget config", e)
        setWidgets(DEFAULT_WIDGETS)
        setIsSetup(true)
      }
    } else {
      setIsSetup(false)
    }
    setConfigLoaded(true)

    const storedUser = localStorage.getItem("agency_user")
    const token = localStorage.getItem("agency_token")

    if (storedUser && storedUser !== "undefined" && token) {
      // Clear potential conflicting tokens from other sessions (e.g. admin)
      localStorage.removeItem("agency_admin_token")
      localStorage.removeItem("agency_client_token")

      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        fetchDashboardData(parsedUser)
      } catch (e) {
        console.error("Erro ao fazer parse do usuário:", e)
        localStorage.removeItem("agency_user")
        setLoading(false)
      }
    } else {
        // Redirect if not logged in
        setLoading(false)
        router.push('/auth/login')
    }
  }, [router])

  const handleSetupChoice = (choice: 'base' | 'custom') => {
    if (choice === 'base') {
        saveConfig(DEFAULT_WIDGETS)
    } else {
        saveConfig([])
    }
    setIsSetup(true)
  }

  const saveConfig = (newWidgets: DashboardWidget[]) => {
    setWidgets(newWidgets)
    localStorage.setItem("dashboard_widgets_config", JSON.stringify(newWidgets))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)
        
        const newOrder = arrayMove(items, oldIndex, newIndex)
        localStorage.setItem("dashboard_widgets_config", JSON.stringify(newOrder))
        return newOrder
      })
    }
  }

  const openAddCustomizer = () => {
    setCustomizerMode('add')
    setEditingWidgetId(null)
    setCustomizerOpen(true)
  }

  const openEditCustomizer = (id: string) => {
    setCustomizerMode('edit')
    setEditingWidgetId(id)
    setCustomizerOpen(true)
  }

  const handleAddWidget = (dataSource: LegacyDataSource | string, type: WidgetComponentType, title: string) => {
    const newWidget: DashboardWidget = {
        id: `widget-${Date.now()}`,
        type,
        dataSource,
        title,
        size: type === 'list' || type === 'calendar' || type === 'chart' ? 'half' : 'quarter',
        enabled: true,
        config: {}
    }

    // Default configs based on type
    if (type === 'chart') {
        newWidget.config.chartType = 'bar'
    }

    const updatedWidgets = [...widgets, newWidget]
    saveConfig(updatedWidgets)
    setCustomizerOpen(false)
  }

  const handleUpdateWidget = (id: string, updates: Partial<DashboardWidget>) => {
    const updatedWidgets = widgets.map(w => w.id === id ? { ...w, ...updates } : w)
    saveConfig(updatedWidgets)
  }

  const handleConfigUpdate = (id: string, configUpdates: Partial<DashboardWidget['config']>) => {
    const updatedWidgets = widgets.map(w => 
        w.id === id ? { ...w, config: { ...w.config, ...configUpdates } } : w
    )
    saveConfig(updatedWidgets)
  }

  const handleRemoveWidget = (id: string) => {
    const updatedWidgets = widgets.filter(w => w.id !== id)
    saveConfig(updatedWidgets)
  }

  if (loading || !configLoaded) {
    return <div className="p-8">Carregando painel...</div>
  }

  if (!isSetup) {
    return (
        <div className="flex flex-1 flex-col gap-4 p-8 items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4 max-w-lg">
                <h2 className="text-3xl font-bold tracking-tight">Bem-vindo ao seu Painel</h2>
                <p className="text-muted-foreground">
                    Escolha como deseja iniciar sua experiência. Você pode começar com nosso template padrão ou criar um painel totalmente personalizado do zero.
                </p>
                <div className="flex gap-4 justify-center pt-4">
                    <Button onClick={() => handleSetupChoice('base')} size="lg">
                        Usar Template Padrão
                    </Button>
                    <Button onClick={() => handleSetupChoice('custom')} variant="outline" size="lg">
                        Personalizar do Zero
                    </Button>
                </div>
            </div>
        </div>
    )
  }

  // --- DATA ADAPTER LAYER ---
  // Transforms the global data + widget configuration into the specific props needed by the generic widget
  const getWidgetData = (widget: DashboardWidget): MetricData | ListData | ChartData | CarouselData | CalendarData | null => {
    if (!data) return null

    // HANDLE CUSTOM DATABASE SOURCES
    if (widget.dataSource === 'database' || (widget.dataConfig && widget.dataConfig.sourceId)) {
        const sourceDef = AVAILABLE_DATA_SOURCES.find(s => s.id === widget.dataConfig?.sourceId)
        
        if (widget.type === 'metric') {
            const field = sourceDef?.fields.find(f => f.key === widget.dataConfig?.metricField)
            if (!field) return { value: '-', label: 'Configure o Widget' } as MetricData
            
            // Real Data Mapping
            let val: string | number = 0
            
            if (sourceDef?.id === 'seo' && data.stats.tracking) {
                if (field.key === 'id') val = data.stats.tracking.totalEvents24h // Using ID count as total events proxy
                // Add more mappings as available in API
            } else if (sourceDef?.id === 'campaigns' && data.stats.campaigns) {
                 if (field.key === 'budget') val = data.stats.campaigns.spend
                 if (field.key === 'status') val = data.stats.campaigns.active
            } else if (sourceDef?.id.startsWith('database_')) {
                 // Mapeamento provisório para evitar valores zerados
                 if (sourceDef.id === 'database_leads') {
                     if (field.key === 'status') val = data.stats.activeServices 
                 }
                 if (sourceDef.id === 'database_deals') {
                     if (field.key === 'value') val = data.stats.pendingInvoicesAmount
                 }
                 if (sourceDef.id === 'database_general') {
                    if (field.key === 'records') val = 154 // Mock placeholder
                    if (field.key === 'size') val = '1.2 GB'
                 }
            }

            return {
                value: val,
                label: field.label,
                // trend: '+5%', // Removed mock trend
                // trendDirection: 'up',
                footer: `Fonte: ${sourceDef?.name}`
            } as MetricData
        }

        if (widget.type === 'chart') {
            const dimKey = widget.dataConfig?.dimensionField
            const seriesKey = widget.dataConfig?.seriesField
            
            if (!dimKey || !seriesKey) {
                return { 
                    data: [{ name: 'Configure', value: 0 }], 
                    type: widget.config.chartType || 'bar' 
                } as ChartData
            }

            let chartData: { name: string, value: number }[] = []

            if (sourceDef?.id === 'tracking_events' && data.stats.tracking) {
                 const eventsByHour = data.stats.tracking.eventsByHour || []
                 const now = new Date()
                 chartData = eventsByHour.map((count: number, i: number) => {
                     const hour = (now.getHours() - (23 - i) + 24) % 24
                     return {
                         name: `${hour}h`,
                         value: count
                     }
                 })
            } else if (sourceDef?.id === 'cms' && data.stats.cms?.types) {
                // Map CMS types to chart
                chartData = data.stats.cms.types.map(t => ({
                    name: t.name,
                    value: t.count
                }))
            }
            
            // If no real data found, return empty to avoid lying to user
            if (chartData.length === 0) {
                 return {
                    data: [],
                    type: widget.config.chartType || 'bar'
                 } as ChartData
            }

            return {
                data: chartData,
                type: widget.config.chartType || 'bar'
            } as ChartData
        }
    }

    switch (widget.type) {
        case 'metric':
            // Logic to extract single metric based on source
            if (widget.dataSource === 'services') {
                return { 
                    value: data.stats.activeServices, 
                    label: 'Serviços Contratados',
                    link: { href: '/client/services', label: 'Ver Serviços' }
                } as MetricData
            }
            if (widget.dataSource === 'tickets') {
                return { 
                    value: data.stats.openTickets, 
                    label: 'Tickets Abertos',
                    link: { href: '/client/support', label: 'Acessar Suporte' }
                } as MetricData
            }
            if (widget.dataSource === 'campaigns') {
                return {
                    value: data.stats.campaigns?.active || 0,
                    label: 'Campanhas Ativas',
                    footer: `Investimento: R$ ${data.stats.campaigns?.spend.toFixed(2)}`,
                    link: { href: '/client/services', label: 'Gerenciar' }
                } as MetricData
            }
            // Default/Fallback
            return { value: 0, label: 'Dados não disponíveis' } as MetricData

        case 'chart':
            if (widget.dataSource === 'cms') {
                return {
                    data: data.stats.cms?.types?.map(t => ({ name: t.name, value: t.count })) || [],
                    type: widget.config.chartType || 'pie'
                } as ChartData
            }
            if (widget.dataSource === 'general') {
                 // Try to show something useful if available, or empty
                 if (data.stats.tracking) {
                     // Reuse tracking logic or similar
                     return {
                        data: data.stats.tracking.eventsByHour.map((v, i) => ({ name: `${i}h`, value: v })),
                        type: widget.config.chartType || 'area'
                     } as ChartData
                 }
                 return { data: [], type: 'bar' } as ChartData
            }
            return { data: [], type: 'bar' } as ChartData

        case 'list':
            if (widget.dataSource === 'general' && widget.title === 'Atividade Recente') {
                return {
                    items: data.recentActivity.map((a, i) => ({
                        id: i,
                        title: a.description,
                        date: new Date(a.date).toLocaleDateString(),
                        value: a.amount ? `R$ ${a.amount.toFixed(2)}` : undefined
                    }))
                } as ListData
            }
            if (widget.dataSource === 'campaigns') {
                 // Campaign summary list
                 return {
                     items: [
                         { id: 'active', title: 'Campanhas Ativas', value: data.stats.campaigns?.active },
                         { id: 'spend', title: 'Investimento Mensal', value: `R$ ${data.stats.campaigns?.spend.toFixed(2)}` },
                         { id: 'clicks', title: 'Total de Cliques', value: data.stats.campaigns?.clicks }
                     ]
                 } as ListData
            }
            return { items: [] } as ListData

        case 'carousel':
            return {
                slides: [
                    { title: "Bem-vindo", content: `Olá ${user?.name || 'Cliente'}, seu painel está pronto.` },
                    // Placeholder for future dynamic announcements
                ]
            } as CarouselData
            
        case 'calendar':
             return {
                 events: [
                     // TODO: Connect to appointments API
                 ]
             } as CalendarData
            
        default:
            return null
    }
  }

  const getAvailableSources = (): DataSourceDefinition[] => {
      if (!data?.stats) return []
      
      const activeIds: string[] = []
      
      // SEO e Visibilidade (was tracking)
      if (data.stats.tracking) activeIds.push('seo')
      
      // Campanhas
      if (data.stats.campaigns) activeIds.push('campaigns')
      
      // Conteúdo CMS
      if (data.stats.cms) activeIds.push('cms')
      
      // Base de Dados (Assumed always available if user exists, or check for leads/services)
      if (data.stats.activeServices || data.stats.openTickets) {
          activeIds.push('database_leads')
          activeIds.push('database_deals')
          activeIds.push('database_contacts')
          activeIds.push('database_general')
      }

      // Formulários e Checkout (Assumed available if tracking or base data exists)
      if (data.stats.tracking) activeIds.push('forms')
      
      return AVAILABLE_DATA_SOURCES.filter(s => activeIds.includes(s.id))
  }

  const renderWidget = (widget: DashboardWidget) => {
    const widgetData = getWidgetData(widget)

    switch (widget.type) {
      case 'metric':
        return <MetricWidget key={widget.id} widget={widget} data={widgetData} loading={loading} />
      case 'chart':
        return <ChartWidget key={widget.id} widget={widget} data={widgetData} loading={loading} />
      case 'list':
        return <ListWidget key={widget.id} widget={widget} data={widgetData} loading={loading} />
      case 'carousel':
        return <CarouselWidget key={widget.id} widget={widget} data={widgetData} loading={loading} />
      case 'calendar':
        return <CalendarWidget key={widget.id} widget={widget} data={widgetData} loading={loading} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between p-4 rounded-lg">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Painel do Cliente</h2>
            <p className="text-muted-foreground">
                Bem-vindo, {user?.name || "Cliente"}.
            </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={openAddCustomizer} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Widget
            </Button>
            <DashboardCustomizer 
                open={customizerOpen}
                onOpenChange={setCustomizerOpen}
                mode={customizerMode}
                editingWidget={widgets.find(w => w.id === editingWidgetId)}
                onAdd={handleAddWidget}
                onUpdate={handleUpdateWidget}
                onConfigUpdate={handleConfigUpdate}
                onRemove={handleRemoveWidget}
                availableSources={getAvailableSources()}
            />
            <Button asChild>
                <Link href="/client/support/new">Novo Ticket</Link>
            </Button>
        </div>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={widgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 grid-flow-dense auto-rows-min">
            {widgets.map(widget => {
              if (!widget.enabled) return null
                return (
                    <SortableWidget 
                        key={widget.id} 
                        id={widget.id} 
                        widget={widget}
                        onEdit={openEditCustomizer}
                    >
                        {renderWidget(widget)}
                    </SortableWidget>
                )
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}
