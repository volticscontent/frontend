
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select"
import { DashboardWidget, ChartType, WidgetSize, LegacyDataSource, WidgetComponentType, WidgetDataConfig } from "./types"
import { useEffect } from "react"
import { Trash2, Database, BarChart2 } from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AVAILABLE_DATA_SOURCES } from "./mock-data-sources"
import { DataSourceDefinition } from "./types"

interface DashboardCustomizerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'add' | 'edit'
  editingWidget?: DashboardWidget
  onAdd: (dataSource: LegacyDataSource | string, type: WidgetComponentType, title: string) => void
  onUpdate: (id: string, updates: Partial<DashboardWidget>) => void
  onConfigUpdate: (id: string, updates: Partial<DashboardWidget['config']>) => void
  onRemove: (id: string) => void
  availableSources?: DataSourceDefinition[]
}

export function DashboardCustomizer({ 
    open, 
    onOpenChange, 
    mode, 
    editingWidget,
    onAdd,
    onUpdate,
    onConfigUpdate,
    onRemove,
    availableSources = AVAILABLE_DATA_SOURCES
}: DashboardCustomizerProps) {
  
  // Balance Rule: Access sidebar context to collapse it when customizer is open
  const { setOpen: setSidebarOpen, isMobile } = useSidebar()

  // "Balance" rule logic
  useEffect(() => {
    if (open && !isMobile) {
      setSidebarOpen(false)
    }
  }, [open, isMobile, setSidebarOpen])

  const handleDataConfigUpdate = (updates: Partial<WidgetDataConfig>) => {
    if (!editingWidget) return
    
    const currentConfig = editingWidget.dataConfig || { sourceId: '' }
    onUpdate(editingWidget.id, {
        dataConfig: { ...currentConfig, ...updates }
    })
  }

  const selectedSource = editingWidget?.dataConfig?.sourceId 
    ? availableSources.find(s => s.id === editingWidget.dataConfig?.sourceId)
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col p-0 gap-0">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle>{mode === 'add' ? 'Adicionar Widget' : 'Configurar Widget'}</SheetTitle>
          <SheetDescription>
            {mode === 'add' 
                ? 'Escolha um tipo de widget para adicionar ao seu painel.' 
                : 'Ajuste as propriedades deste widget.'}
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6">
            <div className="py-6 space-y-6">
                
                {mode === 'add' && (
                     <div className="grid gap-6">
                        
                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Métricas e Resumos</h3>
                            <div className="grid gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('services', 'metric', 'Serviços Ativos')}
                                >
                                    <span className="font-semibold">Resumo: Serviços Contratados</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Card simples com contagem de serviços ativos.
                                    </span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('database', 'metric', 'Métrica Personalizada')}
                                >
                                    <Database className="h-4 w-4 mb-1 text-primary" />
                                    <span className="font-semibold">Métrica: Fontes de Dados</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Configure uma métrica a partir de suas fontes de dados.
                                    </span>
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-3">
                             <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Listas e Tabelas</h3>
                             <div className="grid gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('general', 'list', 'Atividade Recente')}
                                >
                                    <span className="font-semibold">Lista: Atividade Recente</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Lista cronológica de ações e notificações.
                                    </span>
                                </Button>
                             </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Visualização de Dados</h3>
                            <div className="grid gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('database', 'chart', 'Gráfico Personalizado')}
                                >
                                    <BarChart2 className="h-4 w-4 mb-1 text-primary" />
                                    <span className="font-semibold">Gráfico: Fontes de Dados</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Crie gráficos a partir de suas campanhas ou formulários.
                                    </span>
                                </Button>
                            </div>
                        </div>

                         <div className="space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Ferramentas e Organização</h3>
                            <div className="grid gap-2">
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('general', 'carousel', 'Destaques')}
                                >
                                    <span className="font-semibold">Carrossel de Informações</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Widget rotativo para dicas e novidades.
                                    </span>
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="h-auto p-4 flex flex-col items-start gap-2 justify-start"
                                    onClick={() => onAdd('general', 'calendar', 'Calendário')}
                                >
                                    <span className="font-semibold">Calendário</span>
                                    <span className="text-xs text-muted-foreground font-normal text-left">
                                        Visualização mensal de eventos.
                                    </span>
                                </Button>
                            </div>
                        </div>

                     </div>
                )}

                {mode === 'edit' && editingWidget && (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Título do Widget</Label>
                            <Input 
                                value={editingWidget.title} 
                                onChange={(e) => onUpdate(editingWidget.id, { title: e.target.value })}
                            />
                        </div>

                        {/* DATA SOURCE CONFIGURATION */}
                        {(editingWidget.dataSource === 'database' || editingWidget.dataConfig?.sourceId) && (
                            <div className="p-4 bg-muted/30 rounded-lg border space-y-4">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    Fonte de Dados
                                </h4>
                                
                                <div className="space-y-2">
                                    <Label>Subserviço (Fonte de Dados)</Label>
                                    <Select 
                                        value={editingWidget.dataConfig?.sourceId || ''} 
                                        onValueChange={(val) => handleDataConfigUpdate({ sourceId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o subserviço..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {/* Group sources by category */}
                                            {Object.entries(
                                                availableSources.reduce((acc, source) => {
                                                    const category = source.category || 'Outros'
                                                    if (!acc[category]) acc[category] = []
                                                    acc[category].push(source)
                                                    return acc
                                                }, {} as Record<string, typeof availableSources>)
                                            ).map(([category, sources]) => (
                                                <SelectGroup key={category}>
                                                    <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                                                        {category}
                                                    </SelectLabel>
                                                    {sources.map(source => (
                                                        <SelectItem key={source.id} value={source.id}>
                                                            {source.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        Selecione o subserviço de onde os dados serão extraídos.
                                    </p>
                                </div>

                                {selectedSource && editingWidget.type === 'metric' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Campo de Valor</Label>
                                            <Select 
                                                value={editingWidget.dataConfig?.metricField || ''} 
                                                onValueChange={(val) => handleDataConfigUpdate({ metricField: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione o campo..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedSource.fields
                                                        .filter(f => ['number', 'currency', 'percentage'].includes(f.type))
                                                        .map(field => (
                                                        <SelectItem key={field.key} value={field.key}>
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Agregação</Label>
                                            <Select 
                                                value={editingWidget.dataConfig?.aggregation || 'sum'} 
                                                onValueChange={(val) => handleDataConfigUpdate({ aggregation: val as WidgetDataConfig['aggregation'] })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="sum">Soma</SelectItem>
                                                    <SelectItem value="avg">Média</SelectItem>
                                                    <SelectItem value="count">Contagem</SelectItem>
                                                    <SelectItem value="min">Mínimo</SelectItem>
                                                    <SelectItem value="max">Máximo</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}

                                {selectedSource && editingWidget.type === 'chart' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label>Eixo X (Dimensão)</Label>
                                            <Select 
                                                value={editingWidget.dataConfig?.dimensionField || ''} 
                                                onValueChange={(val) => handleDataConfigUpdate({ dimensionField: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Data ou Categoria..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedSource.fields.map(field => (
                                                        <SelectItem key={field.key} value={field.key}>
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Eixo Y (Métrica)</Label>
                                            <Select 
                                                value={editingWidget.dataConfig?.seriesField || ''} 
                                                onValueChange={(val) => handleDataConfigUpdate({ seriesField: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Valor numérico..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {selectedSource.fields
                                                        .filter(f => ['number', 'currency', 'percentage'].includes(f.type))
                                                        .map(field => (
                                                        <SelectItem key={field.key} value={field.key}>
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Tamanho</Label>
                            <Select 
                                value={editingWidget.size} 
                                onValueChange={(val) => onUpdate(editingWidget.id, { size: val as WidgetSize })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="quarter">Pequeno (1/4)</SelectItem>
                                    <SelectItem value="half">Médio (1/2)</SelectItem>
                                    <SelectItem value="full">Grande (1/1)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Descrição / Subtítulo</Label>
                            <Input 
                                value={editingWidget.config.description || ''} 
                                onChange={(e) => onConfigUpdate(editingWidget.id, { description: e.target.value })}
                                placeholder="Texto auxiliar..."
                            />
                        </div>

                        {editingWidget.type === 'chart' && (
                            <div className="space-y-2 pt-4 border-t">
                                <Label>Tipo de Gráfico</Label>
                                <Select 
                                    value={editingWidget.config.chartType || 'bar'} 
                                    onValueChange={(val) => onConfigUpdate(editingWidget.id, { chartType: val as ChartType })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pie">Gráfico de Pizza</SelectItem>
                                        <SelectItem value="bar">Gráfico de Barras</SelectItem>
                                        <SelectItem value="line">Gráfico de Linha</SelectItem>
                                        <SelectItem value="area">Gráfico de Área</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="pt-6 border-t">
                             <Button 
                                variant="destructive" 
                                className="w-full gap-2"
                                onClick={() => onRemove(editingWidget.id)}
                            >
                                <Trash2 className="h-4 w-4" />
                                Remover Widget
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
