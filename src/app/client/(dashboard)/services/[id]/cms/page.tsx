"use client"

import { useEffect, useState, ElementType } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
    FileEdit, 
    Code, 
    Copy, 
    Check, 
    Plus, 
    Search, 
    Settings, 
    FileText, 
    Image as ImageIcon,
    MoreHorizontal,
    LayoutTemplate,
    Trash2,
    Type,
    List,
    LayoutDashboard,
    ChevronDown,
    Info,
    Video,
    File,
    Images
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { 
    Accordion, 
    AccordionContent, 
    AccordionItem 
} from "@/components/ui/accordion"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { CredentialsDialog } from "@/components/cms/CredentialsDialog"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import Link from "next/link"
import Image from "next/image"

// --- Types ---

type FieldType = 'text' | 'rich-text' | 'number' | 'date' | 'boolean' | 'image' | 'gallery' | 'video' | 'document' | 'url' | 'json'

interface CmsField {
    key: string
    label: string
    type: FieldType
    required: boolean
    description?: string
    // Configuration for specific types
    config?: {
        allowedFileTypes?: string[] // for document/video
        maxFiles?: number // for gallery
        maxSize?: number // in MB
    }
}

interface CmsContentType {
    id: string
    name: string
    slug: string
    description?: string
    resolver?: 'standard' | 'products'
    fields: CmsField[]
    updatedAt: string
}

interface CmsContentEntry {
    id: string
    contentTypeId: string
    data: Record<string, unknown>
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    slug?: string
    updatedAt: string
}

const FIELD_TYPES: { value: FieldType; label: string; icon: ElementType }[] = [
    { value: 'text', label: 'Texto Curto', icon: Type },
    { value: 'rich-text', label: 'Texto Longo', icon: FileText },
    { value: 'number', label: 'Número', icon: List },
    { value: 'date', label: 'Data', icon: List },
    { value: 'boolean', label: 'Booleano (Sim/Não)', icon: Check },
    { value: 'image', label: 'Imagem (URL)', icon: ImageIcon },
    { value: 'gallery', label: 'Carrossel de Imagens', icon: Images },
    { value: 'video', label: 'Vídeo', icon: Video },
    { value: 'document', label: 'Documento (PDF/Doc)', icon: File },
    { value: 'url', label: 'Link / URL', icon: Code },
    { value: 'json', label: 'Objeto JSON', icon: Code },
]

export default function ServiceCmsPage() {
  const [clientSlug, setClientSlug] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>('dashboard')
  const [searchQuery, setSearchQuery] = useState("")
  
  // Dialog States
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false)
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false)
  
  // Editing States
  const [editingType, setEditingType] = useState<CmsContentType | null>(null)
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  
  // Type Form State
  const [typeName, setTypeName] = useState("")
  const [typeSlug, setTypeSlug] = useState("")
  const [typeResolver, setTypeResolver] = useState<'standard' | 'products'>('standard')
  const [typeFields, setTypeFields] = useState<CmsField[]>([
      { key: 'title', label: 'Título', type: 'text', required: true }
  ])

  // Entry Form State
  const [entryData, setEntryData] = useState<Record<string, unknown>>({})
  const [entrySlug, setEntrySlug] = useState("")
  const [entryStatus, setEntryStatus] = useState("DRAFT")

  const queryClient = useQueryClient()

  useEffect(() => {
    const storedUser = localStorage.getItem("agency_user")
    if (storedUser) {
        try {
            const user = JSON.parse(storedUser)
            if (user.slug) setTimeout(() => setClientSlug(user.slug), 0)
        } catch (e) {
            console.error(e)
        }
    }
  }, [])

  // --- Queries ---

  const { data: contentTypes = [], isLoading: isLoadingTypes } = useQuery<CmsContentType[]>({
      queryKey: ['cmsTypes'],
      queryFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`, {
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to fetch types")
          return res.json()
      }
  })

  const entriesQuery = useQuery<CmsContentEntry[]>({
      queryKey: ['cmsEntries', selectedTypeId],
      enabled: !!selectedTypeId && selectedTypeId !== 'dashboard',
      queryFn: async () => {
          if (selectedTypeId === 'dashboard') return []
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${selectedTypeId}`, {
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to fetch entries")
          return res.json()
      }
  })

  const entries = entriesQuery.data || []
  const isLoadingEntries = entriesQuery.isLoading

  // --- Mutations ---

  const createTypeMutation = useMutation({
      mutationFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  name: typeName,
                  slug: typeSlug || typeName.toLowerCase().replace(/\s+/g, '-'),
                  resolver: typeResolver,
                  fields: typeFields
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create type")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
          setIsTypeDialogOpen(false)
          resetTypeForm()
          toast({ title: "Coleção criada com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao criar coleção", description: err.message, variant: "destructive" })
      }
  })

  const updateTypeMutation = useMutation({
    mutationFn: async () => {
        if (!editingType) return
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types/${editingType.id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({
                name: typeName,
                slug: typeSlug,
                resolver: typeResolver,
                fields: typeFields
            })
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to update type")
        }
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
        setIsTypeDialogOpen(false)
        resetTypeForm()
        toast({ title: "Coleção atualizada com sucesso!" })
    },
    onError: (err) => {
        toast({ title: "Erro ao atualizar coleção", description: err.message, variant: "destructive" })
    }
  })

  const createEntryMutation = useMutation({
      mutationFn: async () => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${selectedTypeId}`, {
              method: "POST",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  data: entryData,
                  slug: entrySlug || undefined,
                  status: entryStatus
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create entry")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          setIsEntryDialogOpen(false)
          resetEntryForm()
          toast({ title: "Item criado com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao criar item", description: err.message, variant: "destructive" })
      }
  })

  const updateEntryMutation = useMutation({
      mutationFn: async () => {
          if (!editingEntryId) return
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${editingEntryId}`, {
              method: "PUT",
              headers: { 
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}` 
              },
              body: JSON.stringify({
                  data: entryData,
                  slug: entrySlug || undefined,
                  status: entryStatus
              })
          })
          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to update entry")
          }
          return res.json()
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          setIsEntryDialogOpen(false)
          resetEntryForm()
          toast({ title: "Item atualizado com sucesso!" })
      },
      onError: (err) => {
          toast({ title: "Erro ao atualizar item", description: err.message, variant: "destructive" })
      }
  })

  const deleteTypeMutation = useMutation({
      mutationFn: async (id: string) => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/types/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to delete type")
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsTypes'] })
          if (selectedTypeId) setSelectedTypeId('dashboard')
          toast({ title: "Coleção excluída" })
      },
      onError: (err) => {
          toast({ title: "Erro ao excluir coleção", description: err.message, variant: "destructive" })
      }
  })
  
  const deleteEntryMutation = useMutation({
      mutationFn: async (id: string) => {
          const token = localStorage.getItem("agency_token")
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cms/entries/${id}`, {
              method: "DELETE",
              headers: { "Authorization": `Bearer ${token}` }
          })
          if (!res.ok) throw new Error("Failed to delete entry")
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['cmsEntries', selectedTypeId] })
          toast({ title: "Item excluído" })
      }
  })

  // --- Helpers ---

  const selectedType = contentTypes.find(t => t.id === selectedTypeId)
  
  const filteredEntries = entries.filter(entry => {
      const data = entry.data || {}
      const title = data.title || data.name || Object.values(data)[0] || ''
      return String(title).toLowerCase().includes(searchQuery.toLowerCase())
  })

  const apiUrl = selectedType 
    ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/cms/public/${clientSlug}/${selectedType.slug}`
    : ''

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Field Builder Logic
  const addField = () => {
      setTypeFields([...typeFields, { key: '', label: '', type: 'text', required: false }])
  }

  const updateField = (index: number, field: Partial<CmsField>) => {
      const newFields = [...typeFields]
      newFields[index] = { ...newFields[index], ...field }
      // Auto-generate key from label if key is empty
      if (field.label && !newFields[index].key) {
          newFields[index].key = field.label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      }
      setTypeFields(newFields)
  }

  const removeField = (index: number) => {
      setTypeFields(typeFields.filter((_, i) => i !== index))
  }

  const handleResolverChange = (val: 'standard' | 'products') => {
    setTypeResolver(val)
    if (val === 'products') {
        setTypeSlug('products')
        setTypeName('Produtos')
        
        // Define standard product schema
        const productFields: CmsField[] = [
            { key: 'name', label: 'Nome do Produto', type: 'text', required: true, description: 'Nome principal do produto exibido na loja.' },
            { key: 'description', label: 'Descrição', type: 'rich-text', required: false, description: 'Detalhes completos do produto.' },
            { key: 'price', label: 'Preço', type: 'number', required: true, description: 'Valor numérico (ex: 99.90).' },
            { key: 'currency', label: 'Moeda', type: 'text', required: true, description: 'Código da moeda (ex: BRL).' },
            { key: 'image', label: 'Imagem Principal', type: 'image', required: false, description: 'URL da imagem de capa.' },
            { key: 'sku', label: 'SKU', type: 'text', required: false, description: 'Código único de estoque.' },
            { key: 'active', label: 'Ativo', type: 'boolean', required: false, description: 'Se o produto está visível na loja.' }
        ]
        
        // If editing existing type, try to preserve existing fields if they match keys, otherwise replace
        if (editingType && editingType.resolver === 'products') {
             // If we are already editing a product type, don't overwrite user changes unless they want to reset
             // For now, let's just append missing required fields to be safe
             const existingKeys = new Set(typeFields.map(f => f.key))
             const missingFields = productFields.filter(f => !existingKeys.has(f.key))
             setTypeFields([...typeFields, ...missingFields])
        } else {
             // New type or switching from standard -> full replacement
             setTypeFields(productFields)
        }
    } else {
        // Switching back to standard
        if (!editingType) {
            setTypeName('')
            setTypeSlug('')
            setTypeFields([{ key: 'title', label: 'Título', type: 'text', required: true }])
        }
    }
  }

  // Form Resetters
  const resetTypeForm = () => {
      setTypeName("")
      setTypeSlug("")
      setTypeResolver("standard")
      setTypeFields([{ key: 'title', label: 'Título', type: 'text', required: true }])
      setEditingType(null)
  }

  const resetEntryForm = () => {
      setEntryData({})
      setEntrySlug("")
      setEntryStatus("DRAFT")
      setEditingEntryId(null)
  }

  const openEditType = (type: CmsContentType) => {
      setEditingType(type)
      setTypeName(type.name)
      setTypeSlug(type.slug)
      setTypeResolver(type.resolver || "standard")
      setTypeFields(type.fields)
      setIsTypeDialogOpen(true)
  }

  const openEditEntry = (entry: CmsContentEntry) => {
      setEditingEntryId(entry.id)
      setEntryData(entry.data || {})
      setEntrySlug(entry.slug || "")
      setEntryStatus(entry.status)
      setIsEntryDialogOpen(true)
  }

  // --- Render ---

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-6 py-4 flex items-center justify-between bg-background">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">CMS & Conteúdo</h2>
            <p className="text-muted-foreground text-sm">Gerencie suas coleções e conteúdo dinâmico.</p>
        </div>
        <div className="flex gap-2">
            <CredentialsDialog />
            <Link href="/docs" target="_blank">
                <Button variant="outline">
                    <Code className="mr-2 h-4 w-4" />
                    Documentação API
                </Button>
            </Link>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar de Coleções */}
        <div className="w-72 border-r bg-muted/10 p-4 flex flex-col mb-14 gap-4 overflow-y-auto">
            <div className="space-y-1">
                 <Button
                    variant={selectedTypeId === 'dashboard' ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedTypeId('dashboard')}
                >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Visão Geral
                </Button>
            </div>

            <Separator />

            <div className="flex items-center justify-between px-2 mb-2">
                <span className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Coleções</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    resetTypeForm()
                    setIsTypeDialogOpen(true)
                }}>
                    <Plus className="h-4 w-4" />
                </Button>
            </div>

            <div className="space-y-1">
                {isLoadingTypes ? (
                    <div className="text-sm text-muted-foreground p-2">Carregando...</div>
                ) : contentTypes.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-2 text-center border border-dashed rounded-md">
                        Nenhuma coleção.
                    </div>
                ) : (
                    contentTypes.map((type) => (
                        <div key={type.id} className="group relative flex items-center">
                            <Button
                                variant={selectedTypeId === type.id ? "secondary" : "ghost"}
                                className="w-full justify-start pr-8"
                                onClick={() => setSelectedTypeId(type.id)}
                            >
                                <LayoutTemplate className="mr-2 h-4 w-4" />
                                <span className="truncate">{type.name}</span>
                            </Button>
                        </div>
                    ))
                )}
            </div>
            
            {selectedType && (
                <div className="mt-auto">
                    <Card className="bg-primary/5 border-none shadow-none">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Code className="h-4 w-4 text-primary" />
                                <span className="font-semibold text-sm text-primary">API Endpoint</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3 break-all font-mono bg-background p-1 rounded border">
                                .../api/cms/public/{clientSlug}/{selectedType.slug}
                            </p>
                            <Button variant="secondary" size="sm" className="w-full h-7 text-xs" onClick={copyToClipboard}>
                                {copied ? <Check className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                                Copiar URL
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>

        {/* Área Principal */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {selectedTypeId === 'dashboard' ? (
                <div className="p-8 overflow-y-auto">
                    <h3 className="text-xl font-semibold mb-6">Visão Geral do Projeto</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Coleções</CardTitle>
                                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{contentTypes.length}</div>
                            </CardContent>
                        </Card>
                        {/* More stats could go here */}
                        <Card className="md:col-span-2 bg-muted/20 border-dashed">
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Acesso Rápido</CardTitle>
                            </CardHeader>
                            <CardContent className="flex gap-4">
                                <Button variant="outline" onClick={() => setIsTypeDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Nova Coleção
                                </Button>
                                <Link href="/docs" target="_blank">
                                    <Button variant="outline">
                                        <Code className="mr-2 h-4 w-4" /> Ver Documentação
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>

                    <h4 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">Suas Coleções</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {contentTypes.map(type => (
                            <Card key={type.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTypeId(type.id)}>
                                <CardHeader>
                                    <CardTitle className="text-base flex items-center justify-between">
                                        {type.name}
                                        <Badge variant="secondary">{type.fields.length} campos</Badge>
                                    </CardTitle>
                                    <CardDescription className="font-mono text-xs">{type.slug}</CardDescription>
                                </CardHeader>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : selectedType ? (
                <>
                    {/* Toolbar */}
                    <div className="border-b p-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder={`Buscar em ${selectedType.name}...`} 
                                    className="pl-9" 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => openEditType(selectedType)}>
                                <Settings className="mr-2 h-4 w-4" />
                                Configurações
                            </Button>
                            <Button onClick={() => {
                                resetEntryForm()
                                setIsEntryDialogOpen(true)
                            }}>
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Item
                            </Button>
                        </div>
                    </div>

                    {/* Tabela de Conteúdo */}
                    <div className="flex-1 overflow-auto p-6">
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título / ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Slug</TableHead>
                                        {selectedType.fields.slice(0, 2).map(f => (
                                            <TableHead key={f.key}>{f.label}</TableHead>
                                        ))}
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoadingEntries ? (
                                        <TableRow>
                                            <TableCell colSpan={5 + selectedType.fields.length} className="h-24 text-center">
                                                Carregando itens...
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredEntries.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5 + selectedType.fields.length} className="h-24 text-center">
                                                Nenhum item encontrado.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredEntries.map((entry) => (
                                            <TableRow key={entry.id}>
                                                <TableCell className="font-medium">
                                                    {(entry.data?.title as string) || (entry.data?.name as string) || <span className="text-muted-foreground italic">Sem título</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={entry.status === 'PUBLISHED' ? 'default' : 'secondary'}>
                                                        {entry.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">
                                                    {entry.slug}
                                                </TableCell>
                                                {selectedType.fields.slice(0, 2).map(f => (
                                                    <TableCell key={f.key} className="max-w-[200px] truncate">
                                                        {typeof (entry.data || {})[f.key] === 'boolean' 
                                                            ? ((entry.data || {})[f.key] ? 'Sim' : 'Não')
                                                            : String((entry.data || {})[f.key] ?? '')}
                                                    </TableCell>
                                                ))}
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => openEditEntry(entry)}>
                                                                <FileEdit className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem className="text-destructive" onClick={() => deleteEntryMutation.mutate(entry.id)}>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                    <LayoutTemplate className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-lg font-semibold">Selecione uma Coleção</h3>
                </div>
            )}
        </div>
      </div>

      {/* Dialogs */}
      
      {/* Create/Edit Type Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingType ? "Editar Coleção" : "Nova Coleção"}</DialogTitle>
                <DialogDescription>Coleções definem a estrutura do seu conteúdo (ex: Blog Posts, Produtos).</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
                    <TabsTrigger value="general">Configurações Gerais</TabsTrigger>
                    <TabsTrigger value="fields">Estrutura de Campos</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="space-y-4 py-4">
                    <div className="space-y-2 p-4 border rounded-md bg-accent/20">
                        <Label className="text-base font-semibold">Tipo de Coleção</Label>
                        <div className="flex gap-4 pt-2">
                            <Button 
                                type="button"
                                variant={typeResolver === 'standard' ? 'default' : 'outline'} 
                                onClick={() => handleResolverChange('standard')}
                                className="flex-1"
                            >
                                Banco de Dados (Unificado)
                            </Button>
                            <Button 
                                type="button"
                                variant={typeResolver === 'products' ? 'default' : 'outline'} 
                                onClick={() => handleResolverChange('products')}
                                className="flex-1"
                            >
                                Produtos (Catálogo)
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground pt-2">
                            {typeResolver === 'products' 
                                ? "Sincroniza automaticamente com o catálogo da loja. Campos de preço e moeda são obrigatórios." 
                                : "Cria uma base de dados unificada para receber dados de formulários, integrações e outros serviços."}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Nome da Coleção</Label>
                            <Input 
                                placeholder="Ex: Blog Posts" 
                                value={typeName}
                                onChange={(e) => setTypeName(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">Nome visível para os editores no painel.</p>
                        </div>
                        <div className="space-y-2">
                            <Label>Slug (Identificador API)</Label>
                            <div className="relative">
                                <Code className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                placeholder="blog-posts" 
                                className="pl-8 font-mono"
                                value={typeSlug}
                                onChange={(e) => setTypeSlug(e.target.value)}
                                disabled={typeResolver === 'products'}
                            />
                            </div>
                            <p className="text-xs text-muted-foreground">Identificador único usado na URL da API. Use hífens em vez de espaços.</p>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="fields" className="space-y-4 py-4">
                    <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border">
                        <div className="space-y-0.5">
                            <Label className="text-base">Campos do Schema</Label>
                            <p className="text-xs text-muted-foreground">Defina as propriedades que cada item desta coleção terá.</p>
                        </div>
                        <Button size="sm" onClick={addField}>
                            <Plus className="mr-2 h-3 w-3" /> Adicionar Campo
                        </Button>
                    </div>

                    <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
                        {typeFields.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                Nenhuma campo definido. Adicione campos para começar.
                            </div>
                        )}
                        
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {typeFields.map((field, index) => {
                                const FieldIcon = FIELD_TYPES.find(t => t.value === field.type)?.icon || Code
                                return (
                                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4 bg-card">
                                        <AccordionPrimitive.Header className="flex items-center">
                                            <AccordionPrimitive.Trigger className="flex flex-1 items-center gap-3 py-3 font-medium transition-all hover:underline [&[data-state=open]>.chevron]:rotate-180 text-left">
                                                <div className="bg-muted p-2 rounded-md">
                                                    <FieldIcon className="h-4 w-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-sm truncate">{field.label || "Novo Campo"}</span>
                                                        {field.required && <Badge variant="secondary" className="text-[10px] h-4 px-1">Obrigatório</Badge>}
                                                    </div>
                                                    <div className="text-xs font-mono text-muted-foreground truncate flex items-center gap-1">
                                                        {field.key || "sem-chave"} 
                                                        <span className="text-muted-foreground/50 mx-1">•</span> 
                                                        {FIELD_TYPES.find(t => t.value === field.type)?.label}
                                                    </div>
                                                </div>
                                                <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 chevron mr-2" />
                                            </AccordionPrimitive.Trigger>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                                                onClick={() => removeField(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AccordionPrimitive.Header>
                                        <AccordionContent className="pt-2 pb-4">
                                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 border-t pt-4">
                                                <div className="md:col-span-6 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs">Rótulo (Label)</Label>
                                                        <HoverCard>
                                                            <HoverCardTrigger asChild>
                                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </HoverCardTrigger>
                                                            <HoverCardContent className="w-80 max-w-[90vw]">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-sm font-semibold">O que é o Rótulo?</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        É o nome amigável que aparece para quem vai editar o conteúdo. 
                                                                        Pode conter acentos, espaços e caracteres especiais.
                                                                    </p>
                                                                    <div className="bg-muted p-2 rounded text-xs">
                                                                        Exemplo: &quot;Título do Post&quot;, &quot;Foto de Capa&quot;
                                                                    </div>
                                                                </div>
                                                            </HoverCardContent>
                                                        </HoverCard>
                                                    </div>
                                                    <Input 
                                                        value={field.label} 
                                                        onChange={(e) => updateField(index, { label: e.target.value })}
                                                        placeholder="Ex: Título do Post"
                                                        className="h-8"
                                                    />
                                                </div>
                                                <div className="md:col-span-6 space-y-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Label className="text-xs flex items-center gap-1">
                                                            Chave API <Code className="h-3 w-3 opacity-50" />
                                                        </Label>
                                                        <HoverCard>
                                                            <HoverCardTrigger asChild>
                                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                                            </HoverCardTrigger>
                                                            <HoverCardContent className="w-80 max-w-[90vw]">
                                                                <div className="space-y-2">
                                                                    <h4 className="text-sm font-semibold">O que é a Chave API?</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        É o identificador técnico usado pelos programadores no código.
                                                                        Deve ser único, sem espaços e sem acentos.
                                                                    </p>
                                                                    <div className="bg-muted p-2 rounded text-xs font-mono">
                                                                        Exemplo: &quot;titulo_post&quot;, &quot;foto_capa&quot;
                                                                    </div>
                                                                </div>
                                                            </HoverCardContent>
                                                        </HoverCard>
                                                    </div>
                                                    <Input 
                                                        value={field.key} 
                                                        onChange={(e) => updateField(index, { key: e.target.value })}
                                                        placeholder="titulo_post"
                                                        className="h-8 font-mono text-xs bg-muted/50"
                                                    />
                                                </div>
                                                <div className="md:col-span-6 space-y-1.5">
                                                    <Label className="text-xs">Tipo de Dado</Label>
                                                    <Select 
                                                        value={field.type} 
                                                        onValueChange={(v) => updateField(index, { type: v as FieldType })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {FIELD_TYPES.map(t => (
                                                                <SelectItem key={t.value} value={t.value}>
                                                                    <div className="flex items-center gap-2">
                                                                        <t.icon className="h-3 w-3" />
                                                                        {t.label}
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="md:col-span-6 flex items-center gap-2 pt-6">
                                                    <Switch 
                                                        id={`req-${index}`}
                                                        checked={field.required}
                                                        onCheckedChange={(c) => updateField(index, { required: c })}
                                                    />
                                                    <Label htmlFor={`req-${index}`} className="text-xs cursor-pointer">Campo Obrigatório</Label>
                                                </div>
                                                <div className="md:col-span-12 space-y-1.5">
                                                    <Label className="text-xs">Descrição / Helper Text</Label>
                                                    <Input 
                                                        value={field.description || ''} 
                                                        onChange={(e) => updateField(index, { description: e.target.value })}
                                                        placeholder="Ex: Texto curto que aparece nos cards de listagem."
                                                        className="h-8"
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">Instruções para quem for preencher este campo.</p>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>
                    </div>
                </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center sm:justify-between mt-4">
                {editingType ? (
                     <Button variant="destructive" onClick={() => {
                        if (confirm("ATENÇÃO: Isso excluirá a coleção e TODOS os itens nela. Deseja continuar?")) {
                            deleteTypeMutation.mutate(editingType.id)
                            setIsTypeDialogOpen(false)
                        }
                    }}>
                        Excluir Coleção
                    </Button>
                ) : <div></div>}
               
               <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsTypeDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={() => editingType ? updateTypeMutation.mutate() : createTypeMutation.mutate()}>
                        {createTypeMutation.isPending || updateTypeMutation.isPending ? "Salvando..." : (editingType ? "Salvar Alterações" : "Criar Coleção")}
                    </Button>
               </div>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>{editingEntryId ? "Editar Item" : "Novo Item"}: {selectedType?.name}</DialogTitle>
                <DialogDescription>Preencha as informações abaixo.</DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="content" className="w-full mt-2">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 h-auto">
                    <TabsTrigger value="content">Conteúdo</TabsTrigger>
                    <TabsTrigger value="settings">Configurações & Metadados</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="py-4 space-y-6 max-h-[60vh] overflow-y-auto px-1">
                    {selectedType?.fields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 border-2 border-dashed rounded-lg bg-muted/20">
                            <LayoutTemplate className="h-10 w-10 text-muted-foreground/50" />
                            <div className="space-y-1">
                                <p className="font-medium">Nenhum campo definido</p>
                                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                                    Esta coleção ainda não possui estrutura. Adicione campos (ex: Título, Imagem) para começar a criar itens.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                setIsEntryDialogOpen(false)
                                if (selectedType) openEditType(selectedType)
                            }}>
                                <Settings className="mr-2 h-3 w-3" />
                                Configurar Campos
                            </Button>
                        </div>
                    ) : (
                        selectedType?.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <div className="space-y-1">
                                <Label className="text-base font-medium flex items-center gap-2">
                                    {field.label}
                                    {field.required && <Badge variant="destructive" className="text-[10px] px-1 h-4">Obrigatório</Badge>}
                                </Label>
                                {field.description && <p className="text-sm text-muted-foreground">{field.description}</p>}
                            </div>
                            
                            {field.type === 'rich-text' || field.type === 'json' ? (
                                <Textarea 
                                    value={
                                        field.type === 'json' && typeof entryData[field.key] === 'object'
                                            ? JSON.stringify(entryData[field.key], null, 2)
                                            : (entryData[field.key] as string | number) || ''
                                    }
                                    onChange={(e) => {
                                        let val: string | object = e.target.value
                                        if (field.type === 'json') {
                                            try {
                                                val = JSON.parse(e.target.value)
                                            } catch {
                                                // keep string
                                            }
                                        }
                                        setEntryData({...entryData, [field.key]: val})
                                    }}
                                    className={field.type === 'json' ? "font-mono text-xs bg-muted/50 border-input" : "min-h-[120px] resize-y"}
                                    placeholder={field.type === 'json' ? '{ "key": "value" }' : 'Digite o conteúdo aqui...'}
                                />
                            ) : field.type === 'boolean' ? (
                                <div className="flex items-center gap-3 border p-4 rounded-lg bg-card shadow-sm">
                                    <Switch 
                                        checked={!!entryData[field.key]}
                                        onCheckedChange={(c) => setEntryData({...entryData, [field.key]: c})}
                                    />
                                    <span className="text-sm font-medium">{entryData[field.key] ? 'Sim' : 'Não'}</span>
                                </div>
                            ) : field.type === 'image' ? (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <ImageIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="text"
                                                placeholder="https://exemplo.com/imagem.jpg"
                                                value={(entryData[field.key] as string | number) || ''}
                                                onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                                                className="pl-9 bg-background"
                                            />
                                        </div>
                                    </div>
                                    
                                    {!!entryData[field.key] ? (
                                        <div className="relative w-full h-56 bg-background rounded-lg overflow-hidden border shadow-sm group">
                                            <Image 
                                                src={String(entryData[field.key])} 
                                                alt="Preview" 
                                                fill
                                                className="object-cover transition-transform group-hover:scale-105"
                                                unoptimized
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button variant="secondary" size="sm" onClick={() => window.open(String(entryData[field.key]), '_blank')}>
                                                    Ver Original
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-background/50">
                                            <ImageIcon className="h-8 w-8 mb-2 opacity-20" />
                                            <span className="text-xs">Pré-visualização da imagem</span>
                                        </div>
                                    )}
                                </div>
                            ) : field.type === 'video' ? (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Video className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="text"
                                                placeholder="https://exemplo.com/video.mp4 ou URL do YouTube"
                                                value={(entryData[field.key] as string) || ''}
                                                onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                                                className="pl-9 bg-background"
                                            />
                                        </div>
                                    </div>
                                    {!!entryData[field.key] ? (
                                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border shadow-sm">
                                            <video 
                                                src={String(entryData[field.key])} 
                                                controls
                                                className="w-full h-full"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </div>
                                    ) : (
                                        <div className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-background/50">
                                            <Video className="h-8 w-8 mb-2 opacity-20" />
                                            <span className="text-xs">Pré-visualização do vídeo</span>
                                        </div>
                                    )}
                                </div>
                            ) : field.type === 'document' ? (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <File className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                type="text"
                                                placeholder="https://exemplo.com/documento.pdf"
                                                value={(entryData[field.key] as string) || ''}
                                                onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                                                className="pl-9 bg-background"
                                            />
                                        </div>
                                    </div>
                                    {!!entryData[field.key] && (
                                        <div className="flex items-center p-3 bg-background border rounded-lg">
                                            <File className="h-8 w-8 text-primary mr-3" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{String(entryData[field.key]).split('/').pop()}</p>
                                                <p className="text-xs text-muted-foreground truncate">{String(entryData[field.key])}</p>
                                            </div>
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={String(entryData[field.key])} target="_blank" rel="noopener noreferrer">Abrir</a>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : field.type === 'gallery' ? (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">URLs das Imagens (uma por linha)</Label>
                                        <Textarea 
                                            placeholder="https://exemplo.com/imagem1.jpg&#10;https://exemplo.com/imagem2.jpg"
                                            value={Array.isArray(entryData[field.key]) ? (entryData[field.key] as string[]).join('\n') : (entryData[field.key] as string) || ''}
                                            onChange={(e) => {
                                                const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
                                                setEntryData({...entryData, [field.key]: urls});
                                            }}
                                            className="min-h-[100px] font-mono text-xs"
                                        />
                                    </div>
                                    
                                    {Array.isArray(entryData[field.key]) && (entryData[field.key] as string[]).length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                                            {(entryData[field.key] as string[]).map((url, idx) => (
                                                <div key={idx} className="relative aspect-square bg-background rounded-md overflow-hidden border group">
                                                    <Image 
                                                        src={url} 
                                                        alt={`Item ${idx + 1}`}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                         <Button variant="destructive" size="icon" className="h-6 w-6" onClick={() => {
                                                             const newUrls = [...(entryData[field.key] as string[])];
                                                             newUrls.splice(idx, 1);
                                                             setEntryData({...entryData, [field.key]: newUrls});
                                                         }}>
                                                            <Trash2 className="h-3 w-3" />
                                                         </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-24 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-background/50">
                                            <Images className="h-6 w-6 mb-2 opacity-20" />
                                            <span className="text-xs">Nenhuma imagem adicionada</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Input 
                                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                                    value={(entryData[field.key] as string | number) || ''}
                                    onChange={(e) => setEntryData({...entryData, [field.key]: e.target.value})}
                                    className="h-10"
                                />
                            )}
                        </div>
                    ))
                    )}
                </TabsContent>

                <TabsContent value="settings" className="py-4 space-y-6">
                    <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                        <h4 className="text-sm font-semibold flex items-center gap-2">
                            <Settings className="h-4 w-4" /> Configurações de Publicação
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-xs">Slug Personalizado (Opcional)</Label>
                                <Input 
                                    placeholder="slug-automatico" 
                                    value={entrySlug}
                                    onChange={(e) => setEntrySlug(e.target.value)}
                                    className="h-9 text-sm font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground">Deixe em branco para gerar automaticamente do título.</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs">Status do Item</Label>
                                <Select value={entryStatus} onValueChange={setEntryStatus}>
                                    <SelectTrigger className="h-9 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DRAFT">Rascunho</SelectItem>
                                        <SelectItem value="PUBLISHED">Publicado</SelectItem>
                                        <SelectItem value="ARCHIVED">Arquivado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>Cancelar</Button>
                <Button onClick={() => editingEntryId ? updateEntryMutation.mutate() : createEntryMutation.mutate()}>
                    {createEntryMutation.isPending || updateEntryMutation.isPending ? "Salvando..." : (editingEntryId ? "Salvar Alterações" : "Criar Item")}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
