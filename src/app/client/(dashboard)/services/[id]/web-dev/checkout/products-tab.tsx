"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, MoreHorizontal, Package, Loader2, RefreshCw } from "lucide-react"
import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface StripeProduct {
  id: string
  name: string
  description: string | null
  image: string | null
  active: boolean
  price: number
  currency: string
  updatedAt: number
}

export function ProductsTab() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    currency: "brl",
    image: ""
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Get userSlug from localStorage (safe access)
  const userSlug = typeof window !== 'undefined' ? localStorage.getItem('userSlug') : null

  const { data: products, isLoading, isError, error, refetch } = useQuery<StripeProduct[]>({
    queryKey: ['stripe-products', userSlug],
    queryFn: async () => {
      if (!userSlug) throw new Error("User slug not found")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/products`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch products')
      }
      return response.json()
    },
    enabled: !!userSlug,
  })

  const createMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      if (!userSlug) throw new Error("User slug not found")
      
      const payload = {
        ...data,
        price: parseFloat(data.price) // Send as number (e.g. 10.50)
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const resData = await response.json()
        throw new Error(resData.error || 'Failed to create product')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stripe-products', userSlug] })
      setIsOpen(false)
      setNewProduct({ name: "", description: "", price: "", currency: "brl", image: "" })
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso na Stripe e no CRM.",
      })
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Erro ao criar produto",
        description: err.message,
      })
    }
  })

  const handleCreate = () => {
    if (!newProduct.name || !newProduct.price) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o nome e o preço do produto.",
      })
      return
    }
    createMutation.mutate(newProduct)
  }

  const handleCreateCheckout = async (priceId: string) => {
    if (!userSlug) return

    try {
        toast({ title: "Gerando link...", description: "Aguarde um momento." })
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userSlug}/stripe/checkout-session`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                priceId,
                successUrl: window.location.href, // Return to same page for now
                cancelUrl: window.location.href,
                quantity: 1
            })
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to create checkout session")
        }

        const data = await res.json()
        if (data.url) {
            window.open(data.url, '_blank')
        }
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "An error occurred"
        toast({ title: "Erro", description: errorMessage, variant: "destructive" })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount / 100) // Stripe sends amount in cents
  }

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          <p className="text-destructive">Erro ao carregar produtos. Verifique suas credenciais na aba Configurações.</p>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meus Produtos</CardTitle>
            <CardDescription>Gerencie os produtos sincronizados com sua conta Stripe.</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Produto</DialogTitle>
                <DialogDescription>
                  Este produto será criado automaticamente na sua conta Stripe.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nome
                  </Label>
                  <Input
                    id="name"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                    className="col-span-3"
                    placeholder="Ex: Consultoria Premium"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Preço
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Textarea
                    id="description"
                    value={newProduct.description}
                    onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                    className="col-span-3"
                    placeholder="Breve descrição do produto"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Produto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-md">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                          {product.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(product.price, product.currency)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleCreateCheckout(product.id)}>
                            Gerar Link de Checkout
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
