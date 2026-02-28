
import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash, Edit, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Team {
  id: string
  name: string
  description?: string
  members?: Member[]
}

interface Service {
  id: string
  title: string
}

interface Member {
  id: string
  name: string
  email: string
  role: string
  teams: Team[]
  allowedServices: Service[]
}

export function TeamSettings() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("members")
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(false)

  // Forms State
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [isTeamFormOpen, setIsTeamFormOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  
  const [inviteData, setInviteData] = useState({ name: "", email: "", role: "MEMBER" })
  const [teamData, setTeamData] = useState({ name: "", description: "" })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        if (!token || !userStr) return
        const user = JSON.parse(userStr)
        if (!user.slug) return

        const headers = { "Authorization": `Bearer ${token}` }
        const baseUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}`

        const [membersRes, teamsRes, servicesRes] = await Promise.all([
            fetch(`${baseUrl}/team`, { headers }),
            fetch(`${baseUrl}/teams`, { headers }),
            fetch(`${baseUrl}/services`, { headers })
        ])

        if (membersRes.ok) setMembers(await membersRes.json())
        if (teamsRes.ok) setTeams(await teamsRes.json())
        if (servicesRes.ok) setServices(await servicesRes.json())

    } catch (error) {
        console.error(error)
        toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" })
    } finally {
        setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleInvite = async () => {
    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/team`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(inviteData)
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Membro convidado." })
        setIsInviteOpen(false)
        setInviteData({ name: "", email: "", role: "MEMBER" })
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  const handleRemoveMember = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este membro?")) return

    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/team/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Membro removido." })
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  const handleUpdateTeam = async (id: string, updates: Partial<Team>) => {
    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/teams/${id}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(updates)
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Time atualizado." })
        setEditingTeam(null)
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  const handleDeleteTeam = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este time?")) return

    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/teams/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Time excluído." })
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  const handleCreateTeam = async () => {
    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/teams`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(teamData)
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Time criado." })
        setIsTeamFormOpen(false)
        setTeamData({ name: "", description: "" })
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  const handleUpdatePermissions = async (memberId: string, updates: { teamIds: string[], serviceIds: string[] }) => {
    try {
        const token = localStorage.getItem("agency_token")
        const userStr = localStorage.getItem("agency_user")
        const user = userStr ? JSON.parse(userStr) : {}
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/team/${memberId}`, {
            method: "PUT",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify(updates)
        })

        if (!res.ok) throw new Error(await res.text())
        
        toast({ title: "Sucesso", description: "Permissões atualizadas." })
        setEditingMember(null)
        fetchData()
    } catch (error) {
        toast({ title: "Erro", description: (error as Error).message || "Erro desconhecido", variant: "destructive" })
    }
  }

  if (loading && members.length === 0) {
      // Opcional: loading state inicial
  }

  return (
    <div className="space-y-4">
        <div>
            <h2 className="text-lg font-medium">Gerenciamento de Equipe</h2>
            <p className="text-sm text-muted-foreground">Gerencie membros, times e permissões de acesso aos serviços.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="members">Membros</TabsTrigger>
            <TabsTrigger value="teams">Times</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Membros da Equipe</h3>
                <Button onClick={() => setIsInviteOpen(!isInviteOpen)} size="sm">
                    <Plus className="w-4 h-4 mr-2" /> Novo Membro
                </Button>
            </div>

            {isInviteOpen && (
                <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label>Nome</Label>
                            <Input value={inviteData.name} onChange={e => setInviteData({...inviteData, name: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            <Input value={inviteData.email} onChange={e => setInviteData({...inviteData, email: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Função</Label>
                            <Select value={inviteData.role} onValueChange={v => setInviteData({...inviteData, role: v})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MEMBER">Membro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancelar</Button>
                        <Button onClick={handleInvite}>Convidar</Button>
                    </div>
                </div>
            )}

            <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Times</TableHead>
                        <TableHead>Serviços</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {members.map(member => (
                        <TableRow key={member.id}>
                            <TableCell>{member.name}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell><Badge variant={member.role === 'ADMIN' ? 'default' : 'secondary'}>{member.role}</Badge></TableCell>
                            <TableCell>{member.teams?.map(t => t.name).join(', ') || '-'}</TableCell>
                            <TableCell>{member.allowedServices?.length || 'Todos'}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setEditingMember(member)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleRemoveMember(member.id)} className="text-red-500 hover:text-red-700">
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>

            {editingMember && (
                <Dialog open={!!editingMember} onOpenChange={() => setEditingMember(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Permissões: {editingMember.name}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Times</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {teams.map(team => (
                                        <div key={team.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`team-${team.id}`} 
                                                checked={editingMember.teams?.some(t => t.id === team.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentTeams = editingMember.teams?.map(t => t.id) || [];
                                                    const newTeams = checked 
                                                        ? [...currentTeams, team.id]
                                                        : currentTeams.filter(id => id !== team.id);
                                                    
                                                    // Optimistic update for UI
                                                    setEditingMember({
                                                        ...editingMember,
                                                        teams: newTeams.map(id => teams.find(t => t.id === id)).filter(Boolean) as Team[]
                                                    });
                                                }}
                                            />
                                            <Label htmlFor={`team-${team.id}`}>{team.name}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Acesso aos Serviços</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {services.map(service => (
                                        <div key={service.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`srv-${service.id}`} 
                                                checked={editingMember.allowedServices?.some(s => s.id === service.id)}
                                                onCheckedChange={(checked) => {
                                                    const currentServices = editingMember.allowedServices?.map(s => s.id) || [];
                                                    const newServices = checked 
                                                        ? [...currentServices, service.id]
                                                        : currentServices.filter(id => id !== service.id);
                                                    
                                                    setEditingMember({
                                                        ...editingMember,
                                                        allowedServices: newServices.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[]
                                                    });
                                                }}
                                            />
                                            <Label htmlFor={`srv-${service.id}`}>{service.title}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingMember(null)}>Cancelar</Button>
                            <Button onClick={() => handleUpdatePermissions(editingMember.id, {
                                teamIds: editingMember.teams.map(t => t.id),
                                serviceIds: editingMember.allowedServices.map(s => s.id)
                            })}>Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
          </TabsContent>

          <TabsContent value="teams" className="space-y-4 pt-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Times</h3>
                <Button onClick={() => setIsTeamFormOpen(!isTeamFormOpen)} size="sm">
                    <Users className="w-4 h-4 mr-2" /> Novo Time
                </Button>
            </div>

            {isTeamFormOpen && (
                <div className="grid gap-4 p-4 border rounded-md bg-muted/50">
                    <div className="grid gap-2">
                        <Label>Nome do Time</Label>
                        <Input value={teamData.name} onChange={e => setTeamData({...teamData, name: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Descrição</Label>
                        <Input value={teamData.description} onChange={e => setTeamData({...teamData, description: e.target.value})} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsTeamFormOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateTeam}>Criar Time</Button>
                    </div>
                </div>
            )}

            <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {teams.map(team => (
                        <TableRow key={team.id}>
                            <TableCell>{team.name}</TableCell>
                            <TableCell>{team.description}</TableCell>
                            <TableCell>{team.members?.length || 0}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => setEditingTeam(team)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteTeam(team.id)} className="text-red-500 hover:text-red-700">
                                    <Trash className="w-4 h-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </div>

            {editingTeam && (
                <Dialog open={!!editingTeam} onOpenChange={() => setEditingTeam(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Time</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Nome</Label>
                                <Input value={editingTeam.name} onChange={e => setEditingTeam({...editingTeam, name: e.target.value})} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Descrição</Label>
                                <Input value={editingTeam.description} onChange={e => setEditingTeam({...editingTeam, description: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setEditingTeam(null)}>Cancelar</Button>
                            <Button onClick={() => handleUpdateTeam(editingTeam.id, {
                                name: editingTeam.name,
                                description: editingTeam.description
                            })}>Salvar</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
          </TabsContent>
        </Tabs>
    </div>
  )
}
