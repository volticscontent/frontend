"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, ShieldAlert, ShieldCheck, User as UserIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useParams } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"

interface TeamMember {
  id: string
  name: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER"
}

export default function ClientTeamPage() {
  const params = useParams()
  const clientSlug = params?.clientSlug as string || 'demo'
  
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "MEMBER"
  })

  const { data: members, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["client", clientSlug, "team"],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${clientSlug}/team`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch team members")
      return res.json()
    },
  })

  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${clientSlug}/team`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || "Failed to invite member")
        }
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client", clientSlug, "team"] })
        setIsOpen(false)
        setFormData({ name: "", email: "", role: "MEMBER" })
        toast({
            title: "Convite enviado",
            description: "O novo membro foi adicionado à equipe com sucesso.",
        })
    },
    onError: (error) => {
        toast({
            title: "Erro ao convidar",
            description: error.message,
            variant: "destructive"
        })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${clientSlug}/team/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) throw new Error("Failed to remove member")
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["client", clientSlug, "team"] })
        toast({
            title: "Membro removido",
            description: "O membro foi removido da equipe com sucesso.",
        })
    }
  })

  const handleSubmit = () => {
      if (!formData.name || !formData.email) {
          toast({
              title: "Campos obrigatórios",
              description: "Por favor, preencha nome e email.",
              variant: "destructive"
          })
          return
      }
      createMutation.mutate(formData)
  }

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'OWNER': return <Badge variant="default" className="bg-purple-600"><ShieldAlert className="w-3 h-3 mr-1"/> Proprietário</Badge>
          case 'ADMIN': return <Badge variant="default" className="bg-blue-600"><ShieldCheck className="w-3 h-3 mr-1"/> Admin</Badge>
          default: return <Badge variant="secondary"><UserIcon className="w-3 h-3 mr-1"/> Membro</Badge>
      }
  }

  if (isLoading) return <div className="p-8">Carregando equipe...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Minha Equipe</h1>
          <p className="text-muted-foreground">
            Gerencie quem tem acesso ao painel da sua empresa.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Convidar novo membro</DialogTitle>
              <DialogDescription>
                Adicione um novo usuário para acessar o painel. Eles receberão uma senha temporária.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail Profissional</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="joao@empresa.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Nível de Acesso</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">
                        <div className="flex items-center">
                            <ShieldCheck className="w-4 h-4 mr-2 text-blue-600"/>
                            <span>Admin (Acesso Total)</span>
                        </div>
                    </SelectItem>
                    <SelectItem value="MEMBER">
                        <div className="flex items-center">
                            <UserIcon className="w-4 h-4 mr-2 text-slate-600"/>
                            <span>Membro (Visualização e Edição Limitada)</span>
                        </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Convidando..." : "Enviar Convite"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Membros Ativos</CardTitle>
            <CardDescription>Lista de usuários com acesso ao painel</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members && members.length > 0 ? (
                        members.map((member) => (
                            <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>{getRoleBadge(member.role)}</TableCell>
                                <TableCell className="text-right">
                                    {member.role !== 'OWNER' && (
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => {
                                                if(confirm('Tem certeza que deseja remover este membro?')) {
                                                    deleteMutation.mutate(member.id)
                                                }
                                            }}
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                Nenhum membro encontrado além de você.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  )
}
