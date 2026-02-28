"use client"

import { useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Plus, Layers, MoreHorizontal, ShieldCheck } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface Collaborator {
  id: string
  name: string
  role?: string
  email?: string
}

interface ServiceModule {
    id?: string
    key: string
    name?: string
    collaborators: Collaborator[]
}

interface CreateServicePayload {
    title: string
    sector?: string
    description?: string
    status: string
    headId?: string
    modules?: { key: string, collaboratorIds: string[] }[]
    features?: string[]
}

interface Service {
  id: string
  title: string
  sector?: string
  description?: string
  status: string
  createdAt: string
  collaborators: Collaborator[] // Legacy
  head?: Collaborator
  modules?: ServiceModule[]
  features?: string[] // Legacy
}

interface UserDetail {
  id: string
  name: string
  email: string
  slug: string
  services: Service[]
}

const MODULE_DEFINITIONS = {
    'Marketing': [
        { key: 'TRACKING', label: 'Tracking & Pixel' },
        { key: 'CAMPAIGNS', label: 'Gestão de Campanhas' },
    ],
    'Desenvolvimento': [
        { key: 'SEO', label: 'SEO & Visibilidade' },
        { key: 'CMS', label: 'Conteúdo (CMS)' },
        { key: 'FORMS', label: 'Formulários Avançados' },
        { key: 'CHECKOUT', label: 'Checkout & Pagamentos' },
    ],
    'Design': [
        { key: 'BRANDING', label: 'Identidade Visual' },
        { key: 'SOCIAL_MEDIA', label: 'Social Media Arts' },
    ]
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const userId = params.id as string
  
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddServiceDialogOpen, setIsAddServiceDialogOpen] = useState(false)

  // Form states for Edit
  const [editSector, setEditSector] = useState("")
  const [editHeadId, setEditHeadId] = useState<string | undefined>(undefined)
  const [editStatus, setEditStatus] = useState("ACTIVE")
  
  // Modules state: Map of key -> { name, collaboratorIds }
  const [editModules, setEditModules] = useState<Record<string, { active: boolean, collaboratorIds: string[] }>>({})

  // Form states for Add
  const [newServiceTitle, setNewServiceTitle] = useState("")
  const [newServiceSector, setNewServiceSector] = useState("")
  const [newServiceDesc, setNewServiceDesc] = useState("")
  const [newHeadId, setNewHeadId] = useState<string | undefined>(undefined)
  const [newModules, setNewModules] = useState<Record<string, { active: boolean, collaboratorIds: string[] }>>({})

  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Fetch User Details
  const { data: user, isLoading: isLoadingUser } = useQuery<UserDetail>({
    queryKey: ["master", "user", userId],
    queryFn: async () => {
      const token = localStorage.getItem("agency_admin_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem("agency_admin_token")
        window.location.href = "/master/login"
        throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Falha ao buscar detalhes do cliente")
      return res.json()
    },
  })

  // Fetch Admins for selection
  const { data: admins } = useQuery<Collaborator[]>({
    queryKey: ["master", "admins"],
    queryFn: async () => {
      const token = localStorage.getItem("agency_admin_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem("agency_admin_token")
        window.location.href = "/master/login"
        throw new Error("Sessão expirada")
      }
      if (!res.ok) throw new Error("Falha ao buscar admins")
      return res.json()
    },
  })

  // Update Service Mutation
  const updateServiceMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
        const token = localStorage.getItem("agency_admin_token")
        if (!data.id) throw new Error("No service ID provided")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/services/${data.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        if (res.status === 401) {
            localStorage.removeItem("agency_admin_token")
            window.location.href = "/master/login"
            throw new Error("Sessão expirada")
        }
        if (!res.ok) throw new Error("Falha ao atualizar serviço")
        return res.json()
    },
    onSuccess: (updatedService: Service) => {
        toast({
            title: "Serviço atualizado",
            description: "As alterações foram salvas com sucesso.",
        })
        
        // Optimistically update the cache with the server response
        queryClient.setQueryData(["master", "user", userId], (oldData: UserDetail | undefined) => {
             if (!oldData) return oldData;
             return {
                 ...oldData,
                 services: oldData.services.map(s => s.id === updatedService.id ? updatedService : s)
             };
        });

        queryClient.invalidateQueries({ queryKey: ["master", "user", userId] })
        setIsEditDialogOpen(false)
        setSelectedService(null)
    },
    onError: (error) => {
        toast({
            variant: "destructive",
            title: "Erro ao atualizar",
            description: error.message || "Ocorreu um erro ao salvar as alterações.",
        })
    }
  })

  // Add Service Mutation
  const addServiceMutation = useMutation({
    mutationFn: async (data: CreateServicePayload) => {
        const token = localStorage.getItem("agency_admin_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/users/${userId}/services`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        if (res.status === 401) {
            localStorage.removeItem("agency_admin_token")
            window.location.href = "/master/login"
            throw new Error("Sessão expirada")
        }
        if (!res.ok) throw new Error("Falha ao criar serviço")
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["master", "user", userId] })
        setIsAddServiceDialogOpen(false)
        setNewServiceTitle("")
        setNewServiceSector("")
        setNewServiceDesc("")
        setNewHeadId(undefined)
        setNewModules({})
    }
  })

  const confirmDelete = () => {
    if (serviceToDelete) {
      deleteServiceMutation.mutate(serviceToDelete.id)
    }
  }

  // Delete Service Mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
        const token = localStorage.getItem("agency_admin_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/services/${serviceId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("Falha ao excluir serviço")
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["master", "user", userId] })
        setIsDeleteDialogOpen(false)
        setServiceToDelete(null)
        toast({ title: "Serviço excluído", description: "O serviço foi removido com sucesso." })
    },
    onError: (error) => {
        toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" })
    }
  })

  const handleEditClick = (service: Service) => {
      setSelectedService(service)
      setEditSector(service.sector || "")
      setEditStatus(service.status)
      setEditHeadId(service.head?.id || "no_head")
      
      // Map modules
      const initialModules: Record<string, { active: boolean, collaboratorIds: string[] }> = {}
      
      // Initialize with existing modules
      service.modules?.forEach(mod => {
          initialModules[mod.key] = {
              active: true,
              collaboratorIds: mod.collaborators?.map(c => c.id) || []
          }
      })

      // Fallback for legacy features string array if no modules
      if ((!service.modules || service.modules.length === 0) && service.features) {
          service.features.forEach(feat => {
              initialModules[feat] = {
                  active: true,
                  collaboratorIds: service.collaborators?.map(c => c.id) || [] // Default to service collaborators
              }
          })
      }

      setEditModules(initialModules)
      setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
      if (!selectedService) return

      // Transform editModules back to array
      const modulesPayload = Object.entries(editModules)
        .filter(([, value]) => value.active)
        .map(([key, value]) => ({
            key,
            collaboratorIds: value.collaboratorIds
        }))

      // Also update legacy features array for backward compatibility
      const featuresPayload = modulesPayload.map(m => m.key)

      updateServiceMutation.mutate({
          id: selectedService.id,
          sector: editSector,
          status: editStatus,
          headId: editHeadId === "no_head" ? "" : editHeadId,
          modules: modulesPayload,
          features: featuresPayload
      })
  }

  const handleAddService = () => {
      // Transform newModules to array
      const modulesPayload = Object.entries(newModules)
        .filter(([, value]) => value.active)
        .map(([key, value]) => ({
            key,
            collaboratorIds: value.collaboratorIds
        }))

      const featuresPayload = modulesPayload.map(m => m.key)

      addServiceMutation.mutate({
          title: newServiceTitle,
          sector: newServiceSector,
          description: newServiceDesc,
          status: "ACTIVE",
          headId: newHeadId === "no_head" ? undefined : newHeadId,
          modules: modulesPayload,
          features: featuresPayload
      })
  }

  const toggleModule = (key: string, checked: boolean) => {
      setEditModules(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              active: checked,
              collaboratorIds: prev[key]?.collaboratorIds || []
          }
      }))
  }

  const toggleModuleCollaborator = (moduleKey: string, adminId: string) => {
      setEditModules(prev => {
          const current = prev[moduleKey] || { active: true, collaboratorIds: [] }
          const currentIds = current.collaboratorIds
          
          const newIds = currentIds.includes(adminId)
            ? currentIds.filter(id => id !== adminId)
            : [...currentIds, adminId]
            
          return {
              ...prev,
              [moduleKey]: {
                  ...current,
                  collaboratorIds: newIds
              }
          }
      })
  }

  const availableModulesList = useMemo(() => {
      if (!editSector) return []
      // Find matching sector definition or default
      const sectorKey = Object.keys(MODULE_DEFINITIONS).find(k => editSector.includes(k))
      return sectorKey ? MODULE_DEFINITIONS[sectorKey as keyof typeof MODULE_DEFINITIONS] : []
  }, [editSector])

  // Helpers for New Service Form
  const toggleNewModule = (key: string, checked: boolean) => {
      setNewModules(prev => ({
          ...prev,
          [key]: {
              ...prev[key],
              active: checked,
              collaboratorIds: prev[key]?.collaboratorIds || []
          }
      }))
  }

  const toggleNewModuleCollaborator = (moduleKey: string, adminId: string) => {
      setNewModules(prev => {
          const current = prev[moduleKey] || { active: true, collaboratorIds: [] }
          const currentIds = current.collaboratorIds
          
          const newIds = currentIds.includes(adminId)
            ? currentIds.filter(id => id !== adminId)
            : [...currentIds, adminId]
            
          return {
              ...prev,
              [moduleKey]: {
                  ...current,
                  collaboratorIds: newIds
              }
          }
      })
  }

  const availableNewModulesList = useMemo(() => {
      if (!newServiceSector) return []
      const sectorKey = Object.keys(MODULE_DEFINITIONS).find(k => newServiceSector.includes(k))
      return sectorKey ? MODULE_DEFINITIONS[sectorKey as keyof typeof MODULE_DEFINITIONS] : []
  }, [newServiceSector])

  if (isLoadingUser) return <div className="p-8">Carregando...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-muted-foreground">{user?.slug} • {user?.email}</p>
        </div>
        <div className="ml-auto">
            <Button onClick={() => setIsAddServiceDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Serviço
            </Button>
        </div>
      </div>

      <Separator />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {user?.services?.map((service: Service) => (
            <Card key={service.id} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${service.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <Badge variant="outline" className="mb-2">{service.sector || "Sem Setor"}</Badge>
                            <CardTitle className="text-lg">{service.title}</CardTitle>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="-mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditClick(service)}>
                                    Editar Configurações
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                    Desativar Serviço
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2">{service.description || "Sem descrição"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Head */}
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                            <div className="text-sm">
                                <span className="font-semibold text-muted-foreground block text-xs">Head / Responsável</span>
                                {service.head ? service.head.name : <span className="text-muted-foreground italic">Não definido</span>}
                            </div>
                        </div>

                        <Separator />

                        {/* Modules */}
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Layers className="h-4 w-4" />
                                Módulos & Equipe
                            </div>
                            <ScrollArea className="h-[120px]">
                                {service.modules && service.modules.length > 0 ? (
                                    <div className="space-y-3">
                                        {service.modules.map(mod => (
                                            <div key={mod.key} className="text-xs bg-muted/30 p-2 rounded">
                                                <div className="font-medium mb-1 flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                                    {mod.name || mod.key}
                                                </div>
                                                <div className="pl-3 text-muted-foreground">
                                                    {mod.collaborators.length > 0 
                                                        ? mod.collaborators.map(c => c.name.split(' ')[0]).join(', ') 
                                                        : "Sem colaboradores"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-muted-foreground italic">Nenhum módulo configurado</p>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-3 mx-5 rounded-full text-xs text-muted-foreground flex justify-between">
                   <span>Criado em {format(new Date(service.createdAt), "dd/MM/yyyy")}</span>
                   <Badge variant={service.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] h-5">
                       {service.status}
                   </Badge>
                </CardFooter>
            </Card>
        ))}
        {user?.services?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center p-12 border border-dashed rounded-lg text-muted-foreground">
                <Layers className="h-12 w-12 mb-4 opacity-20" />
                <p>Nenhum serviço contratado.</p>
                <Button variant="link" onClick={() => setIsAddServiceDialogOpen(true)}>Adicionar o primeiro serviço</Button>
            </div>
        )}
      </div>

      {/* Edit Service Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configurar Serviço</DialogTitle>
            <DialogDescription>
              Defina o setor, responsável (Head) e a equipe por sub-serviço.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="sector">Setor / Área</Label>
                    <Select value={editSector} onValueChange={setEditSector}>
                        <SelectTrigger>
                        <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Marketing">Marketing & Social</SelectItem>
                        <SelectItem value="Desenvolvimento">Desenvolvimento & Tech</SelectItem>
                        <SelectItem value="Design">Design & Criativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={setEditStatus}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACTIVE">Ativo</SelectItem>
                            <SelectItem value="PAUSED">Pausado</SelectItem>
                            <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Responsável pelo Setor (Head)</Label>
                <Select value={editHeadId || ""} onValueChange={setEditHeadId}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione um Head" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="no_head" className="text-muted-foreground font-medium">-- Nenhum / Remover --</SelectItem>
                        {admins?.map(admin => (
                            <SelectItem key={admin.id} value={admin.id}>
                                {admin.name} ({admin.role})
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            <div className="grid gap-4">
                <Label>Módulos & Sub-serviços</Label>
                <p className="text-xs text-muted-foreground -mt-2">Selecione os módulos e atribua a equipe responsável.</p>
                
                {availableModulesList.length > 0 ? (
                    <div className="space-y-4">
                        {availableModulesList.map(module => (
                            <div key={module.key} className="border p-4 rounded-md space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`mod-${module.key}`}
                                        checked={editModules[module.key]?.active ?? false} 
                                        onCheckedChange={(checked) => toggleModule(module.key, !!checked)}
                                    />
                                    <Label htmlFor={`mod-${module.key}`} className="font-semibold text-base cursor-pointer">
                                        {module.label}
                                    </Label>
                                </div>
                                
                                {editModules[module.key]?.active && (
                                    <div className="pl-6 bg-muted/20 p-2 rounded-md">
                                        <Label className="text-xs text-muted-foreground mb-2 block font-medium">
                                            Colaboradores Responsáveis (Squad)
                                        </Label>
                                        <ScrollArea className="h-[100px] border rounded-md p-2 bg-background">
                                            <div className="space-y-1">
                                                {admins?.map(admin => (
                                                    <div key={admin.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`mod-${module.key}-${admin.id}`}
                                                            checked={editModules[module.key]?.collaboratorIds?.includes(admin.id) || false}
                                                            onCheckedChange={() => toggleModuleCollaborator(module.key, admin.id)}
                                                        />
                                                        <label 
                                                            htmlFor={`mod-${module.key}-${admin.id}`}
                                                            className="text-sm cursor-pointer flex-1"
                                                        >
                                                            {admin.name} <span className="text-[10px] text-muted-foreground">({admin.role})</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4 border border-dashed rounded text-muted-foreground text-sm">
                        Selecione um setor acima para ver os módulos disponíveis.
                    </div>
                )}
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar Configurações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service Dialog */}
      <Dialog open={isAddServiceDialogOpen} onOpenChange={setIsAddServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Serviço</DialogTitle>
            <DialogDescription>Adicione um novo serviço para este cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-1">
            <div className="grid gap-2">
                <Label>Título do Serviço</Label>
                <Input value={newServiceTitle} onChange={(e) => setNewServiceTitle(e.target.value)} placeholder="Ex: Gestão de Tráfego" />
            </div>
            <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input value={newServiceDesc} onChange={(e) => setNewServiceDesc(e.target.value)} placeholder="Breve descrição..." />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label>Setor</Label>
                    <Select value={newServiceSector} onValueChange={setNewServiceSector}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Marketing">Marketing & Social</SelectItem>
                            <SelectItem value="Desenvolvimento">Desenvolvimento & Tech</SelectItem>
                            <SelectItem value="Design">Design & Criativo</SelectItem>
                            <SelectItem value="Conteúdo">Conteúdo & Copy</SelectItem>
                            <SelectItem value="Consultoria">Consultoria & Estratégia</SelectItem>
                            <SelectItem value="Suporte">Suporte Técnico</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="grid gap-2">
                    <Label>Responsável (Head)</Label>
                    <Select value={newHeadId || ""} onValueChange={setNewHeadId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um Head" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="no_head" className="text-muted-foreground font-medium">-- Nenhum --</SelectItem>
                            {admins?.map(admin => (
                                <SelectItem key={admin.id} value={admin.id}>
                                    {admin.name} ({admin.role})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            <div className="grid gap-4">
                <Label>Módulos & Sub-serviços</Label>
                <p className="text-xs text-muted-foreground -mt-2">Selecione os módulos e atribua a equipe responsável.</p>
                
                {availableNewModulesList.length > 0 ? (
                    <div className="space-y-4">
                        {availableNewModulesList.map(module => (
                            <div key={module.key} className="border p-4 rounded-md space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`new-mod-${module.key}`}
                                        checked={newModules[module.key]?.active ?? false} 
                                        onCheckedChange={(checked) => toggleNewModule(module.key, !!checked)}
                                    />
                                    <Label htmlFor={`new-mod-${module.key}`} className="font-semibold text-base cursor-pointer">
                                        {module.label}
                                    </Label>
                                </div>
                                
                                {newModules[module.key]?.active && (
                                    <div className="pl-6 bg-muted/20 p-2 rounded-md">
                                        <Label className="text-xs text-muted-foreground mb-2 block font-medium">
                                            Colaboradores Responsáveis (Squad)
                                        </Label>
                                        <ScrollArea className="h-[100px] border rounded-md p-2 bg-background">
                                            <div className="space-y-1">
                                                {admins?.map(admin => (
                                                    <div key={admin.id} className="flex items-center space-x-2">
                                                        <Checkbox 
                                                            id={`new-mod-${module.key}-${admin.id}`}
                                                            checked={newModules[module.key]?.collaboratorIds?.includes(admin.id) || false}
                                                            onCheckedChange={() => toggleNewModuleCollaborator(module.key, admin.id)}
                                                        />
                                                        <label 
                                                            htmlFor={`new-mod-${module.key}-${admin.id}`}
                                                            className="text-sm cursor-pointer flex-1"
                                                        >
                                                            {admin.name} <span className="text-[10px] text-muted-foreground">({admin.role})</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center p-4 border border-dashed rounded text-muted-foreground text-sm">
                        Selecione um setor acima para ver os módulos disponíveis.
                    </div>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddServiceDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddService} disabled={!newServiceTitle || addServiceMutation.isPending}>
                {addServiceMutation.isPending ? "Criando..." : "Criar Serviço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o serviço
              <span className="font-semibold text-foreground"> {serviceToDelete?.title} </span>
              e removerá todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteServiceMutation.isPending ? "Excluindo..." : "Sim, excluir serviço"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
