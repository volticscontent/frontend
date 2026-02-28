"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, RefreshCw, Plus, Trash2, Link as LinkIcon, Activity, Eye as EyeIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getCrmStats } from "@/services/crm"
import { getDataSources, createDataSource, syncDataSource, deleteDataSource, getDataSourceData, DataSource, ColumnDefinition, DataSourceDataResponse } from "@/services/datasource"
import { toast } from "sonner"
import { useParams } from "next/navigation"

function ViewDataDialog({ dataSource, open, onOpenChange, slug }: { dataSource: DataSource | null, open: boolean, onOpenChange: (open: boolean) => void, slug: string }) {
  const [page, setPage] = useState(1)
  const [sourceFilter, setSourceFilter] = useState("ALL")

  const { data: sourceDataRaw, isLoading } = useQuery({
    queryKey: ['datasource-data', dataSource?.id, page, sourceFilter],
    queryFn: () => getDataSourceData(slug, dataSource!.id, page, 50, { source: sourceFilter }),
    enabled: !!dataSource && open
  })
  
  const sourceData = sourceDataRaw as DataSourceDataResponse | undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dados: {dataSource?.name}</DialogTitle>
          <DialogDescription>
            Visualizando registros da fonte de dados.
          </DialogDescription>
          {dataSource?.type === 'CMS' && (
             <div className="flex items-center gap-2 mt-2">
                <span className="text-sm font-medium">Filtrar por Origem:</span>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Origem" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas</SelectItem>
                        <SelectItem value="MANUAL">Manual (CMS)</SelectItem>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                        <SelectItem value="FORM">Formulário</SelectItem>
                        <SelectItem value="TRACKING">Tracking</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          )}
        </DialogHeader>
        
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {sourceData?.columns?.map((col: ColumnDefinition) => (
                  <TableHead key={col.key}>{col.label || col.key}</TableHead>
                ))}
                {!sourceData?.columns?.length && !isLoading && <TableHead>Dados</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={sourceData?.columns?.length || 1} className="text-center h-24">Carregando...</TableCell>
                </TableRow>
              ) : sourceData?.data?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={sourceData?.columns?.length || 1} className="text-center h-24">Nenhum registro encontrado.</TableCell>
                </TableRow>
              ) : (
                sourceData?.data?.map((row: Record<string, unknown>, index: number) => (
                  <TableRow key={(row.id as string) || index}>
                    {sourceData?.columns?.map((col: ColumnDefinition) => (
                      <TableCell key={`${(row.id as string) || index}-${col.key}`}>
                        {typeof row[col.mappingKey] === 'object' 
                          ? JSON.stringify(row[col.mappingKey]) 
                          : String(row[col.mappingKey] ?? '-')}
                      </TableCell>
                    ))}
                    {!sourceData?.columns?.length && (
                        <TableCell>
                            <pre className="text-xs">{JSON.stringify(row, null, 2)}</pre>
                        </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">Página {page}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={!sourceData?.data?.length || isLoading}
          >
            Próxima
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function DatabasesPage() {
  const params = useParams()
  const slug = params.slug as string
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newSource, setNewSource] = useState({ name: "", type: "MANUAL" })
  const [viewSource, setViewSource] = useState<DataSource | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("ALL")
  
  const queryClient = useQueryClient()

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['crm-stats', slug],
    queryFn: () => getCrmStats(slug!),
    enabled: !!slug
  })

  const { data: dataSources, isLoading: sourcesLoading } = useQuery({
    queryKey: ['datasources', slug],
    queryFn: () => getDataSources(slug!),
    enabled: !!slug
  })

  const createMutation = useMutation({
    mutationFn: (data: { name: string, type: string }) => createDataSource(slug!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources', slug] })
      setIsCreateOpen(false)
      setNewSource({ name: "", type: "MANUAL" })
      toast.success("Fonte de dados criada com sucesso")
    },
    onError: () => {
      toast.error("Erro ao criar fonte de dados")
    }
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => syncDataSource(slug!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources', slug] })
      toast.success("Sincronização iniciada")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteDataSource(slug!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['datasources', slug] })
      toast.success("Fonte de dados removida")
    }
  })

  const handleCreate = () => {
    if (!newSource.name) return
    createMutation.mutate(newSource)
  }

  const totalContacts = stats?.contacts.total || 0
  const totalDeals = stats?.deals.total || 0

  const filteredDataSources = dataSources?.filter(ds => {
    const matchesSearch = ds.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === "ALL" || ds.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <div className="flex items-center justify-between p-4 rounded-lg">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">Unified Data Sources</h2>
            <p className="text-muted-foreground">
                Gerencie todas as suas fontes de dados (CRM, Stripe, Forms, etc.) em um só lugar.
            </p>
        </div>
        <div className="flex items-center space-x-2">
            <Button variant="outline" className="gap-2" onClick={() => queryClient.invalidateQueries({ queryKey: ['datasources', slug] })}>
                <RefreshCw className="h-4 w-4" />
                Atualizar
            </Button>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Fonte
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Fonte de Dados</DialogTitle>
                  <DialogDescription>
                    Crie uma nova fonte de dados para unificar suas informações.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Nome
                    </Label>
                    <Input
                      id="name"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right">
                      Tipo
                    </Label>
                    <Select 
                      value={newSource.type} 
                      onValueChange={(value) => setNewSource({ ...newSource, type: value })}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                        <SelectItem value="FORM">Formulário</SelectItem>
                        <SelectItem value="CAMPAIGN">Campanha</SelectItem>
                        <SelectItem value="TRACKING">Tracking</SelectItem>
                        <SelectItem value="CMS">CMS</SelectItem>
                        <SelectItem value="PRODUCT">Produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Criando..." : "Criar Fonte"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {statsLoading ? "..." : totalContacts.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                    Em todas as fontes
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Processados</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {statsLoading ? "..." : totalDeals.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                    Últimos 30 dias
                </p>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fontes Ativas</CardTitle>
                <LinkIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {sourcesLoading ? "..." : dataSources?.filter(ds => ds.status === 'ACTIVE').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                    Conectadas e sincronizando
                </p>
            </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
            <CardTitle>Minhas Fontes de Dados</CardTitle>
            <CardDescription>Lista de todas as bases de dados vinculadas à sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4 py-4">
                <Input
                    placeholder="Filtrar fontes..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tipo de Fonte" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">Todas</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="STRIPE">Stripe</SelectItem>
                        <SelectItem value="FORM">Formulário</SelectItem>
                        <SelectItem value="CAMPAIGN">Campanha</SelectItem>
                        <SelectItem value="TRACKING">Tracking</SelectItem>
                        <SelectItem value="CMS">CMS</SelectItem>
                        <SelectItem value="PRODUCT">Produto</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Última Sincronização</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sourcesLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell>
                            </TableRow>
                        ) : filteredDataSources?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">Nenhuma fonte encontrada.</TableCell>
                            </TableRow>
                        ) : (
                            filteredDataSources?.map((source) => (
                                <TableRow key={source.id}>
                                    <TableCell className="font-medium">{source.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">{source.type}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={source.status === 'ACTIVE' ? 'default' : 'secondary'}>
                                            {source.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{source.lastSyncedAt ? new Date(source.lastSyncedAt).toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => syncMutation.mutate(source.id)} title="Sincronizar">
                                                <RefreshCw className={`h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setViewSource(source)} title="Visualizar Dados">
                                                <EyeIcon className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(source.id)} title="Remover">
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>

      {viewSource && (
        <ViewDataDialog 
            dataSource={viewSource} 
            open={!!viewSource} 
            onOpenChange={(open) => !open && setViewSource(null)}
            slug={slug}
        />
      )}
    </div>
  )
}
