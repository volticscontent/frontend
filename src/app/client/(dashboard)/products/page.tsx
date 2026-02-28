"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Edit, Search, ImageIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getProducts, createProduct, updateProduct, deleteProduct, syncCmsProductToStripe, Product } from "@/services/product"
import { RefreshCw, CreditCard } from "lucide-react"

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [clientSlug, setClientSlug] = useState<string | null>(null)
  
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
        const userStr = localStorage.getItem('agency_user') || localStorage.getItem('agency_admin_user')
        const slug = userStr ? JSON.parse(userStr)?.slug : null
        console.log("[ProductsPage] Loaded slug from localStorage:", slug)
        setClientSlug(slug)
    } catch (e) {
        console.error("[ProductsPage] Error parsing user slug", e)
    }
  }, [])

  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', clientSlug],
    queryFn: async () => {
        if (!clientSlug) return []
        console.log("Fetching products for slug:", clientSlug)
        return getProducts(clientSlug)
    },
    enabled: !!clientSlug
  })

  console.log("Current clientSlug:", clientSlug)

  if (error) {
    console.error("Error fetching products:", error)
  }

  const createMutation = useMutation({
    mutationFn: (data: Partial<Product>) => {
        if (!clientSlug) throw new Error("Client not found")
        return createProduct(clientSlug, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['datasources'] }) // Invalidate datasources as product creation might add one
      setIsCreateOpen(false)
      toast.success("Produto criado com sucesso")
    },
    onError: () => toast.error("Erro ao criar produto")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Product> }) => {
        if (!clientSlug) throw new Error("Client not found")
        return updateProduct(clientSlug, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setEditingProduct(null)
      toast.success("Produto atualizado com sucesso")
    },
    onError: () => toast.error("Erro ao atualizar produto")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
        if (!clientSlug) throw new Error("Client not found")
        return deleteProduct(clientSlug, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Produto removido com sucesso")
    },
    onError: () => toast.error("Erro ao remover produto")
  })

  const syncCmsMutation = useMutation({
    mutationFn: (productId: string) => {
        console.log("[syncCmsMutation] mutationFn called with productId:", productId)
        console.log("[syncCmsMutation] current clientSlug:", clientSlug)
        if (!clientSlug) {
            console.error("[syncCmsMutation] Error: clientSlug is missing!")
            throw new Error("Client not found - clientSlug is missing in mutation")
        }
        return syncCmsProductToStripe(clientSlug, productId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success("Produto sincronizado com o Stripe")
    },
    onError: (err: any) => {
        console.group("Sync error details:")
        console.error("Full error object:", err)
        if (err.response) {
            console.error("Response data:", err.response.data)
            console.error("Response status:", err.response.status)
        }
        if (err.config) {
            console.error("Request URL:", err.config.url)
            console.error("Base URL:", err.config.baseURL)
            console.error("Full URL:", `${err.config.baseURL}${err.config.url}`)
        }
        console.groupEnd()
        toast.error(`Erro ao sincronizar: ${err.response?.data?.error || err.message}`)
    }
  })

  const filteredProducts = products?.filter((p: Product) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string,
      sku: formData.get('sku') as string,
      active: true // default
    }

    if (editingProduct) {
        updateMutation.mutate({ id: editingProduct.id, data })
    } else {
        createMutation.mutate(data)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos e serviços.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Novo Produto
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle>Catálogo</CardTitle>
            <CardDescription>Lista de produtos disponíveis no sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Buscar por nome ou SKU..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredProducts?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">Nenhum produto encontrado.</TableCell>
                    </TableRow>
                  ) : (
                    filteredProducts?.map((product: Product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                                {product.image ? (
                                    <div className="relative h-10 w-10 overflow-hidden rounded-md border">
                                        <Image 
                                            src={product.image} 
                                            alt={product.name} 
                                            fill 
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="h-10 w-10 flex items-center justify-center rounded-md border bg-muted">
                                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <span>{product.name}</span>
                                    <span className="text-xs text-muted-foreground">{product.description}</span>
                                    {product.tags && product.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {product.tags.map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0 h-4">
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </TableCell>
                        <TableCell>{product.sku || '-'}</TableCell>
                        <TableCell>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: product.currency || 'BRL' }).format(product.price)}
                        </TableCell>
                        <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                {product.active ? 'Ativo' : 'Inativo'}
                            </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {product.source === 'CMS' && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    title="Sincronizar com Stripe"
                                    onClick={() => syncCmsMutation.mutate(product.id)}
                                    disabled={syncCmsMutation.isPending}
                                >
                                    <RefreshCw className={`h-4 w-4 text-blue-500 ${syncCmsMutation.isPending ? 'animate-spin' : ''}`} />
                                </Button>
                            )}
                            {(product as any).stripeProductId && (
                                <div title="Sincronizado com Stripe">
                                    <CreditCard className="h-4 w-4 text-green-500" />
                                </div>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setEditingProduct(product)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(product.id)}>
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
      </div>

      <Dialog open={isCreateOpen || !!editingProduct} onOpenChange={(open) => {
        if (!open) {
            setIsCreateOpen(false)
            setEditingProduct(null)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
            <DialogDescription>
              Preencha as informações do produto abaixo.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Nome do Produto</Label>
                    <Input id="name" name="name" required defaultValue={editingProduct?.name} />
                </div>
                <div className="space-y-2 col-span-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" name="description" defaultValue={editingProduct?.description || ''} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Preço</Label>
                    <Input id="price" name="price" type="number" step="0.01" required defaultValue={editingProduct?.price} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="currency">Moeda</Label>
                    <Select name="currency" defaultValue={editingProduct?.currency || "BRL"}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="BRL">Real (BRL)</SelectItem>
                            <SelectItem value="USD">Dólar (USD)</SelectItem>
                            <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Opcional)</Label>
                    <Input id="sku" name="sku" defaultValue={editingProduct?.sku || ''} />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setIsCreateOpen(false); setEditingProduct(null); }}>Cancelar</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {createMutation.isPending || updateMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
