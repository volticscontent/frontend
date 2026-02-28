"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Plus, Shield, ShieldAlert, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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

interface Admin {
  id: string
  name: string
  email: string
  role: "MASTER" | "DEV" | "COLABORADOR"
}

export default function TeamPage() {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "COLABORADOR"
  })

  const { data: admins, isLoading } = useQuery<Admin[]>({
    queryKey: ["master", "admins"],
    queryFn: async () => {
      const token = localStorage.getItem("agency_admin_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/admins`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error("Failed to fetch admins")
      return res.json()
    },
  })

  const createMutation = useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: async (data: any) => {
        const token = localStorage.getItem("agency_admin_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/master/admins`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}` 
            },
            body: JSON.stringify(data)
        })
        if (!res.ok) throw new Error("Failed to create admin")
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["master", "admins"] })
        setIsOpen(false)
        setFormData({ name: "", email: "", password: "", role: "COLABORADOR" })
    }
  })

  const handleSubmit = () => {
      createMutation.mutate(formData)
  }

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'MASTER': return <Badge variant="destructive"><ShieldAlert className="w-3 h-3 mr-1"/> Master</Badge>
          case 'DEV': return <Badge variant="default"><ShieldCheck className="w-3 h-3 mr-1"/> Dev</Badge>
          default: return <Badge variant="secondary"><Shield className="w-3 h-3 mr-1"/> Colaborador</Badge>
      }
  }

  if (isLoading) return <div className="p-8">Carregando equipe...</div>

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gerenciamento de Equipe</h2>
          <p className="text-muted-foreground">
            Gerencie os acessos e permissões dos membros do time.
          </p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro</DialogTitle>
              <DialogDescription>
                Crie um novo acesso para a equipe administrativa.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome</Label>
                <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                    id="email" 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                    id="password" 
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Função / Time</Label>
                <Select 
                    value={formData.role} 
                    onValueChange={(val) => setFormData({...formData, role: val})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MASTER">Master (Acesso Total)</SelectItem>
                    <SelectItem value="DEV">Desenvolvedor (Técnico)</SelectItem>
                    <SelectItem value="COLABORADOR">Colaborador (Operacional)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Criando..." : "Criar Acesso"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {admins?.map((admin) => (
          <Card key={admin.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {admin.name}
              </CardTitle>
              {getRoleBadge(admin.role)}
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mt-2">{admin.email}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
