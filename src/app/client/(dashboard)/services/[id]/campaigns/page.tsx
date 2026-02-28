"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Megaphone, Plus, Loader2, Pencil, Trash2, Search, Facebook } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { IntegrationsPanel } from "@/components/marketing/IntegrationsPanel"

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  createdAt: string
}

declare global {
  interface Window {
    fbAsyncInit: () => void;
    FB: FacebookSDK;
  }
}

interface FacebookSDK {
    init: (params: Record<string, unknown>) => void;
    login: (callback: (response: FBLoginResponse) => void, options?: Record<string, unknown>) => void;
    getLoginStatus: (callback: (response: FBLoginResponse) => void) => void;
}

interface FBLoginResponse {
    status: string;
    authResponse: {
        accessToken: string;
        userID: string;
        expiresIn: number;
        signedRequest: string;
    };
}

interface AdAccount {
    id: string;
    name: string;
    account_id: string;
}

export default function ServiceCampaignsPage() {
  const params = useParams()
  const serviceId = params.id as string
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const { data: campaigns = [], isLoading: loading } = useQuery<Campaign[]>({
    queryKey: ['campaigns', serviceId],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      if (!token) return []

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}/campaigns`, {
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to fetch campaigns")

      return response.json()
    }
  })

  const [search, setSearch] = useState("")
  const [fbStatus, setFbStatus] = useState<string>("unknown")
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentCampaign, setCurrentCampaign] = useState<Partial<Campaign>>({})
  const [saving, setSaving] = useState(false)

  // Meta Integration State
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([])
  const [isAdAccountDialogOpen, setIsAdAccountDialogOpen] = useState(false)
  const [selectedAdAccount, setSelectedAdAccount] = useState<string>("")
  const [isConnectingMeta, setIsConnectingMeta] = useState(false)
  const [isSdkReady, setIsSdkReady] = useState(false)

  const saveMetaToken = async (token: string) => {
    setIsConnectingMeta(true);
    try {
      const authToken = localStorage.getItem("agency_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/auth/meta/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ token })
      });

      if (!response.ok) throw new Error('Failed to save token');
      
      toast({
        title: "Sucesso",
        description: "Conectado ao Meta com sucesso.",
      });

      fetchAdAccounts();
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro",
        description: "Falha ao salvar token do Meta.",
        variant: "destructive"
      });
      setIsConnectingMeta(false);
    }
  };

  const fetchAdAccounts = async () => {
    try {
        const authToken = localStorage.getItem("agency_token")
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/auth/meta/ad-accounts`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch ad accounts');
        const data = await response.json();
        setAdAccounts(data.data || data); 
        setIsAdAccountDialogOpen(true);
    } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Falha ao buscar contas de anúncio.", variant: "destructive" });
    } finally {
        setIsConnectingMeta(false);
    }
  }

  const handleSaveAdAccount = async () => {
      if (!selectedAdAccount) return;
      
      try {
        const authToken = localStorage.getItem("agency_token")
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ metaAdAccountId: selectedAdAccount })
        });
        
        if (!response.ok) throw new Error('Failed to save ad account');

        setIsAdAccountDialogOpen(false);
        toast({ title: "Sucesso", description: "Conta de anúncios selecionada.", });
      } catch {
           toast({ title: "Erro", description: "Falha ao salvar conta de anúncio.", variant: "destructive" });
      }
  }

  // Load Facebook SDK
  useEffect(() => {
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID || "1273951891458687", 
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      
      setIsSdkReady(true);

      if (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        try {
            window.FB.getLoginStatus(function(response: FBLoginResponse) {
                if (response.status === 'connected') {
                setFbStatus('connected');
                console.log('FB Connected', response.authResponse.accessToken);
                // TODO: Send token to backend to sync campaigns
                } else {
                setFbStatus(response.status);
                }
            });
        } catch (e) {
            console.warn("FB SDK Error:", e);
        }
      } else {
        console.warn("Skipping FB.getLoginStatus on non-HTTPS connection");
      }
    };

    (function(d, s, id){
       const fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       const js = d.createElement(s) as HTMLScriptElement; js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       if (fjs && fjs.parentNode) {
           fjs.parentNode.insertBefore(js, fjs);
       }
     }(document, 'script', 'facebook-jssdk'));
  }, []);

  const handleFacebookLogin = () => {
    if (!window.FB) return;
    
    // Check for secure context (HTTPS or localhost)
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1';

    if (!isSecure) {
        toast({
            title: "Requer Conexão Segura",
            description: "O Login do Facebook requer HTTPS ou localhost. Acesse via https:// ou localhost.",
            variant: "destructive"
        });
        return;
    }

    try {
        window.FB.login(function(response: FBLoginResponse) {
          if (response.authResponse) {
            console.log('Welcome!  Fetching your information.... ');
            setFbStatus('connected');
            // Save token and sync
            saveMetaToken(response.authResponse.accessToken);
          } else {
            console.log('User cancelled login or did not fully authorize.');
          }
        }, {scope: 'ads_read,read_insights,public_profile,email'});
    } catch (error) {
        console.error("FB Login Error:", error);
        toast({
            title: "Erro ao Iniciar Login",
            description: "Não foi possível conectar ao Facebook. Verifique se o bloqueador de pop-ups está desativado.",
            variant: "destructive"
        });
    }
  };

  const fetchCampaigns = () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns', serviceId] })
  }

  const handleSave = async () => {
    if (!currentCampaign.name) {
      toast({
        title: "Erro",
        description: "O nome da campanha é obrigatório.",
        variant: "destructive"
      })
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem("agency_token")
      const url = isEditing 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/${currentCampaign.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/services/${serviceId}/campaigns`
      
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(currentCampaign)
      })

      if (!response.ok) throw new Error("Failed to save campaign")

      toast({
        title: "Sucesso",
        description: `Campanha ${isEditing ? "atualizada" : "criada"} com sucesso.`
      })

      setIsDialogOpen(false)
      fetchCampaigns()
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Falha ao salvar campanha.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta campanha?")) return

    try {
      const token = localStorage.getItem("agency_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/campaigns/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to delete campaign")

      toast({
        title: "Sucesso",
        description: "Campanha removida com sucesso."
      })
      
      fetchCampaigns()
    } catch {
      toast({
        title: "Erro",
        description: "Falha ao excluir campanha.",
        variant: "destructive"
      })
    }
  }

  const openNewDialog = () => {
    setIsEditing(false)
    setCurrentCampaign({ status: "ACTIVE" })
    setIsDialogOpen(true)
  }

  const openEditDialog = (campaign: Campaign) => {
    setIsEditing(true)
    setCurrentCampaign(campaign)
    setIsDialogOpen(true)
  }

  const filteredCampaigns = campaigns.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Campanhas</h2>
          <p className="text-muted-foreground">Gerencie as campanhas vinculadas a este serviço.</p>
        </div>
        <div className="flex gap-2">
          {fbStatus !== 'connected' && (
            <Button 
              onClick={handleFacebookLogin} 
              variant="outline" 
              className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50" 
              disabled={isConnectingMeta || !isSdkReady}
            >
              {isConnectingMeta || !isSdkReady ? <Loader2 className="h-4 w-4 animate-spin" /> : <Facebook className="h-4 w-4" />}
              {isConnectingMeta ? "Conectando..." : (!isSdkReady ? "Carregando SDK..." : "Conectar Facebook")}
            </Button>
          )}
          <Button onClick={openNewDialog}>
            <Plus className="mr-2 h-4 w-4" /> Nova Campanha
          </Button>
        </div>
      </div>

      <IntegrationsPanel />

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campanhas..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="text-center py-12 border-dashed">
          <CardHeader>
            <div className="mx-auto bg-muted rounded-full p-4 mb-4 w-fit">
              <Megaphone className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle>Nenhuma campanha encontrada</CardTitle>
            <CardDescription>Crie sua primeira campanha para começar a acompanhar resultados.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={openNewDialog}>Criar Campanha</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="font-medium">{campaign.name}</div>
                    {campaign.description && (
                      <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                        {campaign.description}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={campaign.status === "ACTIVE" ? "default" : "secondary"}>
                      {campaign.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(campaign)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Campanha" : "Nova Campanha"}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes da campanha abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input
                id="name"
                value={currentCampaign.name || ""}
                onChange={(e) => setCurrentCampaign({ ...currentCampaign, name: e.target.value })}
                placeholder="Ex: Black Friday 2024"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={currentCampaign.description || ""}
                onChange={(e) => setCurrentCampaign({ ...currentCampaign, description: e.target.value })}
                placeholder="Objetivo da campanha..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={currentCampaign.status || "ACTIVE"}
                onChange={(e) => setCurrentCampaign({ ...currentCampaign, status: e.target.value })}
              >
                <option value="ACTIVE">Ativa</option>
                <option value="PAUSED">Pausada</option>
                <option value="COMPLETED">Concluída</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isAdAccountDialogOpen} onOpenChange={setIsAdAccountDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione a Conta de Anúncios</DialogTitle>
            <DialogDescription>
              Escolha qual conta de anúncios do Meta você deseja gerenciar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="adAccount">Conta de Anúncios</Label>
              <select
                id="adAccount"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedAdAccount}
                onChange={(e) => setSelectedAdAccount(e.target.value)}
              >
                <option value="">Selecione uma conta...</option>
                {adAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} (ID: {account.account_id})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdAccountDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveAdAccount} disabled={!selectedAdAccount}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
