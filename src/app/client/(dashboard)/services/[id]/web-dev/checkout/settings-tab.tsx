"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, ExternalLink, Key, Loader2, CreditCard } from "lucide-react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export function SettingsTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [userSlug, setUserSlug] = useState<string | null>(null)
  
  // Local form state
  const [pk, setPk] = useState("")
  const [sk, setSk] = useState("")
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card'])

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem("agency_user")
        if (storedUser) {
            const user = JSON.parse(storedUser)
            // eslint-disable-next-line
            setUserSlug(user.slug)
        }
    }
  }, [])

  const { data: settings, isLoading } = useQuery({
    queryKey: ['stripeSettings', userSlug],
    queryFn: async () => {
        if (!userSlug) return null
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userSlug}/stripe/settings`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        if (!res.ok) throw new Error("Failed to fetch settings")
        return res.json()
    },
    enabled: !!userSlug
  })

  // Sync state with data
  useEffect(() => {
    if (settings) {
        // eslint-disable-next-line
        if (settings.publishableKey && settings.publishableKey !== pk) setPk(settings.publishableKey)
        if (settings.paymentMethods) {
             const isSame = JSON.stringify(settings.paymentMethods) === JSON.stringify(paymentMethods);
             if (!isSame) setPaymentMethods(settings.paymentMethods);
        }
    }
  }, [settings, pk, paymentMethods])

  const saveMutation = useMutation({
    mutationFn: async () => {
        if (!userSlug) throw new Error("User not found")
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userSlug}/stripe/settings`, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                publishableKey: pk, 
                secretKey: sk,
                paymentMethods 
            })
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to save settings")
        }
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['stripeSettings'] })
        toast({ title: "Configurações salvas", description: "Suas credenciais foram atualizadas." })
    },
    onError: (err) => {
        toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" })
    }
  })

  const disconnectMutation = useMutation({
    mutationFn: async () => {
        if (!userSlug) throw new Error("User not found")
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userSlug}/stripe/disconnect`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${token}` 
            }
        })
        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.error || "Failed to disconnect")
        }
        return res.json()
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['stripeSettings'] })
        setPk("")
        setSk("")
        toast({ title: "Desconectado", description: "Sua conta Stripe foi desconectada." })
    },
    onError: (err) => {
        toast({ title: "Erro ao desconectar", description: err.message, variant: "destructive" })
    }
  })

  const toggleMethod = (method: string) => {
    setPaymentMethods(prev => 
        prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    )
  }

  if (isLoading) return <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

  const handleConnect = async () => {
    if (!userSlug) return
    const token = localStorage.getItem("agency_token")
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${userSlug}/stripe/connect`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
        const data = await res.json()
        if (data.url) {
            window.location.href = data.url
        }
    } catch (e) {
        console.error(e)
        toast({ title: "Erro ao conectar", description: "Tente novamente mais tarde.", variant: "destructive" })
    }
  }

  const isConnected = settings?.isConnected || (settings?.publishableKey && settings?.hasSecret)
  const isConnectAccount = settings?.isConnectAccount

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Status da Integração</CardTitle>
          <CardDescription>Conecte sua conta Stripe para começar a processar pagamentos.</CardDescription>
        </CardHeader>
        <CardContent>
          {isConnected ? (
            <Alert className="bg-purple-50 border-purple-200 text-purple-800">
              <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 mt-1" />
                    <div>
                        <AlertTitle>Conectado com Sucesso {isConnectAccount && "(via Stripe Connect)"}</AlertTitle>
                        <AlertDescription>
                            Sua conta Stripe está ativa e pronta para receber pagamentos.
                            {isConnectAccount && settings?.accountId && (
                            <div className="mt-2 text-xs font-mono pl-4 p-1 bg-white">
                                Account ID: {settings.accountId}
                            </div>
                            )}
                        </AlertDescription>
                    </div>
                  </div>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800">
                            Desconectar
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Isso irá remover as credenciais da Stripe deste serviço. O checkout deixará de funcionar até que você conecte novamente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => disconnectMutation.mutate()} 
                                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                disabled={disconnectMutation.isPending}
                            >
                                {disconnectMutation.isPending ? "Desconectando..." : "Sim, desconectar"}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </div>
            </Alert>
          ) : (
            <div className="space-y-4">
                <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle>Não Conectado</AlertTitle>
                <AlertDescription>
                    Você precisa conectar sua conta Stripe para ativar o checkout.
                </AlertDescription>
                </Alert>
                <Button onClick={handleConnect} className="w-full bg-[#635BFF] hover:bg-[#635BFF]/90 text-white">
                    Conectar com Stripe
                    <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {!isConnectAccount && (
        <Card>
            <CardHeader>
            <CardTitle>Configuração Manual (Avançado)</CardTitle>
            <CardDescription>
                Alternativamente, insira suas chaves de API manualmente.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="pk">Chave Publicável (Publishable Key)</Label>
                <div className="relative">
                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="pk" 
                    placeholder="pk_live_..." 
                    className="pl-9 font-mono" 
                    value={pk}
                    onChange={(e) => setPk(e.target.value)}
                />
                </div>
                <p className="text-xs text-muted-foreground">Começa com <code>pk_</code></p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="sk">Chave Secreta (Secret Key)</Label>
                <div className="relative">
                <Key className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    id="sk" 
                    type="password" 
                    placeholder={settings?.hasSecret ? "••••••••••••••••" : "sk_live_..."}
                    className="pl-9 font-mono" 
                    value={sk}
                    onChange={(e) => setSk(e.target.value)}
                />
                </div>
                <p className="text-xs text-muted-foreground">Começa com <code>sk_</code>. Nunca compartilhe esta chave.</p>
            </div>

            <div className="pt-4 flex justify-end">
                <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Salvando..." : "Salvar Credenciais"}
                </Button>
            </div>
            </CardContent>
        </Card>
      )}
      </div>
    </div>
  )
}
