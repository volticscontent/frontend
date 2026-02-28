import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarketingSettings {
  metaPixelId?: string;
  metaApiToken?: string;
  tiktokPixelId?: string;
  tiktokAccessToken?: string;
  googleConversionId?: string;
  googleConversionLabel?: string;
  googleAccessToken?: string;
  googleCustomerId?: string;
}

interface AdAccount {
  id: string
  name: string
  account_id?: string
  advertiser_id?: string
  advertiser_name?: string
}

export function IntegrationsPanel({ embedded = false }: { embedded?: boolean }) {
  const [settings, setSettings] = useState<MarketingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Meta Dialog State
  const [isMetaOpen, setIsMetaOpen] = useState(false);
  const [metaData, setMetaData] = useState({ pixelId: "", apiToken: "", adAccountId: "" });
  const [savingMeta, setSavingMeta] = useState(false);

  // TikTok Dialog State
  const [isTikTokOpen, setIsTikTokOpen] = useState(false);
  const [tiktokData, setTiktokData] = useState({ pixelId: "", accessToken: "", advertiserId: "" });
  const [savingTikTok, setSavingTikTok] = useState(false);

  // Google Dialog State
  const [isGoogleOpen, setIsGoogleOpen] = useState(false);
  const [googleData, setGoogleData] = useState({ conversionId: "", conversionLabel: "", accessToken: "", customerId: "" });
  const [savingGoogle, setSavingGoogle] = useState(false);

  // Account Fetching State
  const [adAccounts, setAdAccounts] = useState<AdAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const fetchAccounts = async (platform: string, token: string) => {
    if (!token) {
        toast({ title: "Erro", description: "Insira o token de acesso primeiro.", variant: "destructive" });
        return;
    }
    setLoadingAccounts(true);
    setAdAccounts([]);
    try {
        const authToken = localStorage.getItem("agency_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/ad-accounts?platform=${platform}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'x-platform-token': token
            }
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        // Normalize data for UI
        let formatted: AdAccount[] = [];
        if (platform === 'meta') {
             formatted = data.map((a: any) => ({ id: a.account_id, name: `${a.name} (${a.account_id})` })); // eslint-disable-line @typescript-eslint/no-explicit-any
        } else if (platform === 'tiktok') {
             formatted = data.map((a: any) => ({ id: a.advertiser_id, name: `${a.advertiser_name} (${a.advertiser_id})` })); // eslint-disable-line @typescript-eslint/no-explicit-any
        } else if (platform === 'google') {
             formatted = data.map((a: any) => ({ id: a.id, name: a.name })); // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        setAdAccounts(formatted);
        if (formatted.length === 0) {
             toast({ title: "Aviso", description: "Nenhuma conta encontrada." });
        }
    } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
        toast({ title: "Erro", description: error.message || "Falha ao buscar contas.", variant: "destructive" });
    } finally {
        setLoadingAccounts(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("agency_token");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/marketing/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        // Pre-fill forms
        if (data) {
            setMetaData({
                pixelId: data.metaPixelId || "",
                apiToken: data.metaApiToken || "",
                adAccountId: data.metaAdAccountId || ""
            });
            setTiktokData({
                pixelId: data.tiktokPixelId || "",
                accessToken: data.tiktokAccessToken || "",
                advertiserId: data.tiktokAdvertiserId || ""
            });
            setGoogleData({
                conversionId: data.googleConversionId || "",
                conversionLabel: data.googleConversionLabel || "",
                accessToken: data.googleAccessToken || "",
                customerId: data.googleCustomerId || ""
            });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    
    // Check for success param in URL (from callback redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connection') === 'success') {
        toast({
            title: "Conectado com sucesso!",
            description: "A plataforma foi vinculada à sua conta.",
            variant: "default", // success variant if available
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleSaveMeta = async () => {
    setSavingMeta(true);
    try {
        const token = localStorage.getItem("agency_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                metaPixelId: metaData.pixelId,
                metaApiToken: metaData.apiToken,
                metaAdAccountId: metaData.adAccountId
            })
        });

        if (!response.ok) throw new Error('Failed to save Meta settings');
        
        toast({ title: "Sucesso", description: "Configurações do Meta Ads salvas." });
        setIsMetaOpen(false);
        fetchSettings();
    } catch {
        toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
    } finally {
        setSavingMeta(false);
    }
  };

  const handleSaveTikTok = async () => {
    setSavingTikTok(true);
    try {
        const token = localStorage.getItem("agency_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                tiktokPixelId: tiktokData.pixelId,
                tiktokAccessToken: tiktokData.accessToken,
                tiktokAdvertiserId: tiktokData.advertiserId
            })
        });

        if (!response.ok) throw new Error('Failed to save TikTok settings');
        
        toast({ title: "Sucesso", description: "Configurações do TikTok salvas." });
        setIsTikTokOpen(false);
        fetchSettings();
    } catch {
        toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
    } finally {
        setSavingTikTok(false);
    }
  };

  const handleSaveGoogle = async () => {
    setSavingGoogle(true);
    try {
        const token = localStorage.getItem("agency_token");
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                googleConversionId: googleData.conversionId,
                googleConversionLabel: googleData.conversionLabel,
                googleAccessToken: googleData.accessToken,
                googleCustomerId: googleData.customerId
            })
        });

        if (!response.ok) throw new Error('Failed to save Google settings');
        
        toast({ title: "Sucesso", description: "Configurações do Google salvas." });
        setIsGoogleOpen(false);
        fetchSettings();
    } catch (error) {
        console.error(error);
        toast({ title: "Erro", description: "Falha ao salvar configurações.", variant: "destructive" });
    } finally {
        setSavingGoogle(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  const isMetaConnected = !!settings?.metaApiToken;
  const isTikTokConnected = !!settings?.tiktokPixelId; // Simple check
  const isGoogleConnected = !!settings?.googleConversionId; // Simple check

  const content = (
      <div className="grid gap-6">
        {/* Meta Ads */}
        <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 p-2 rounded-full">
                <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Meta Ads (Facebook & Instagram)</p>
              <p className="text-sm text-muted-foreground">Importe campanhas e sincronize o Pixel.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isMetaConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                </Badge>
            ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1">
                    <XCircle className="h-3 w-3" /> Desconectado
                </Badge>
            )}
             <Dialog open={isMetaOpen} onOpenChange={setIsMetaOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        {isMetaConnected ? <Settings2 className="h-4 w-4" /> : "Conectar"}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuração Meta Ads</DialogTitle>
                        <DialogDescription>Insira o Pixel ID e o Access Token (CAPI).</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>API Access Token</Label>
                            <div className="flex gap-2">
                                <Input value={metaData.apiToken} onChange={(e) => setMetaData({...metaData, apiToken: e.target.value})} placeholder="EAA..." type="password" />
                                <Button variant="outline" onClick={() => fetchAccounts('meta', metaData.apiToken)} disabled={loadingAccounts}>
                                    {loadingAccounts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar Contas"}
                                </Button>
                            </div>
                        </div>
                        {adAccounts.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Conta de Anúncio</Label>
                                <Select value={metaData.adAccountId} onValueChange={(val) => setMetaData({...metaData, adAccountId: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a conta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {adAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Pixel ID</Label>
                            <Input value={metaData.pixelId} onChange={(e) => setMetaData({...metaData, pixelId: e.target.value})} placeholder="XXXXXXXXXXXXXXX" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveMeta} disabled={savingMeta}>
                            {savingMeta && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* TikTok Ads */}
        <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-black p-2 rounded-full">
                 <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.65-1.58-1.09v8.32c0 .41.01.82-.07 1.23-.98 4.57-5.27 7.23-9.59 5.95-3.08-.91-5.28-3.79-5.32-7.01-.03-3.72 2.72-6.94 6.38-7.41.67-.09 1.34-.09 2.01-.03v4.2c-.32-.12-.66-.19-1-.2-.93.01-1.78.43-2.33 1.15-.81 1.05-.72 2.6.21 3.55.93.96 2.45.96 3.38 0 .6-.62.91-1.47.88-2.34v-15.3z"/>
                </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">TikTok Ads</p>
              <p className="text-sm text-muted-foreground">Rastreamento de eventos via API.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isTikTokConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                </Badge>
            ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1">
                    <XCircle className="h-3 w-3" /> Desconectado
                </Badge>
            )}
            <Dialog open={isTikTokOpen} onOpenChange={setIsTikTokOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        {isTikTokConnected ? <Settings2 className="h-4 w-4" /> : "Conectar"}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuração TikTok Ads</DialogTitle>
                        <DialogDescription>Insira o Pixel ID e o Access Token da API de Conversões.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Access Token</Label>
                            <div className="flex gap-2">
                                <Input value={tiktokData.accessToken} onChange={(e) => setTiktokData({...tiktokData, accessToken: e.target.value})} placeholder="Token de acesso da API..." type="password" />
                                <Button variant="outline" onClick={() => fetchAccounts('tiktok', tiktokData.accessToken)} disabled={loadingAccounts}>
                                    {loadingAccounts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar Contas"}
                                </Button>
                            </div>
                        </div>
                         {adAccounts.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Conta de Anúncio (Advertiser ID)</Label>
                                <Select value={tiktokData.advertiserId} onValueChange={(val) => setTiktokData({...tiktokData, advertiserId: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a conta" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {adAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Pixel ID</Label>
                            <Input value={tiktokData.pixelId} onChange={(e) => setTiktokData({...tiktokData, pixelId: e.target.value})} placeholder="CXXXXXXXXXXXXXXXXXXX" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveTikTok} disabled={savingTikTok}>
                            {savingTikTok && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Google Ads */}
        <div className="flex items-center justify-between space-x-4 rounded-md border p-4">
          <div className="flex items-center space-x-4">
            <div className="bg-white border p-2 rounded-full">
                 <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">Google Ads</p>
              <p className="text-sm text-muted-foreground">Conversões otimizadas via API.</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
             {isGoogleConnected ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Conectado
                </Badge>
            ) : (
                <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 gap-1">
                    <XCircle className="h-3 w-3" /> Desconectado
                </Badge>
            )}
            <Dialog open={isGoogleOpen} onOpenChange={setIsGoogleOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        {isGoogleConnected ? <Settings2 className="h-4 w-4" /> : "Conectar"}
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configuração Google Ads</DialogTitle>
                        <DialogDescription>Insira o ID e Label de conversão.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Access Token (OAuth)</Label>
                             <div className="flex gap-2">
                                <Input value={googleData.accessToken} onChange={(e) => setGoogleData({...googleData, accessToken: e.target.value})} placeholder="ya29..." type="password" />
                                <Button variant="outline" onClick={() => fetchAccounts('google', googleData.accessToken)} disabled={loadingAccounts}>
                                    {loadingAccounts ? <Loader2 className="h-4 w-4 animate-spin" /> : "Carregar Clientes"}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">Requer um token OAuth válido com escopo do Google Ads API.</p>
                        </div>
                         {adAccounts.length > 0 && (
                            <div className="grid gap-2">
                                <Label>Customer ID (Cliente)</Label>
                                <Select value={googleData.customerId} onValueChange={(val) => setGoogleData({...googleData, customerId: val})}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione o cliente" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {adAccounts.map(account => (
                                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Customer ID (Manual)</Label>
                            <Input value={googleData.customerId} onChange={(e) => setGoogleData({...googleData, customerId: e.target.value})} placeholder="XXX-XXX-XXXX" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Conversion ID</Label>
                            <Input value={googleData.conversionId} onChange={(e) => setGoogleData({...googleData, conversionId: e.target.value})} placeholder="AW-XXXXXXXXX" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Conversion Label</Label>
                            <Input value={googleData.conversionLabel} onChange={(e) => setGoogleData({...googleData, conversionLabel: e.target.value})} placeholder="AbC_xYz..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveGoogle} disabled={savingGoogle}>
                            {savingGoogle && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrações</CardTitle>
        <CardDescription>
          Conecte suas contas de anúncios para gerenciar campanhas e rastrear eventos.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
