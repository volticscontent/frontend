"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { Copy, Check, Activity, BarChart3, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

const marketingFormSchema = z.object({
  // Meta
  metaPixelId: z.string().optional(),
  metaApiToken: z.string().optional(),
  
  // TikTok
  tiktokPixelId: z.string().optional(),
  tiktokAccessToken: z.string().optional(),
  
  // Google
  googleConversionId: z.string().optional(),
  googleConversionLabel: z.string().optional(),
  googleAccessToken: z.string().optional(),
})

export function MarketingSettingsForm() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [platformTab, setPlatformTab] = useState("meta")

  // Fetch current settings
  const { data: settings } = useQuery({
    queryKey: ['marketingSettings'],
    queryFn: async () => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error("Falha ao carregar configurações")
      return res.json()
    }
  })

  const form = useForm<z.infer<typeof marketingFormSchema>>({
    resolver: zodResolver(marketingFormSchema),
    defaultValues: {
      metaPixelId: "",
      metaApiToken: "",
      tiktokPixelId: "",
      tiktokAccessToken: "",
      googleConversionId: "",
      googleConversionLabel: "",
      googleAccessToken: "",
    },
  })

  useEffect(() => {
    if (settings) {
      form.reset({
        metaPixelId: settings.metaPixelId || "",
        metaApiToken: settings.metaApiToken || "",
        tiktokPixelId: settings.tiktokPixelId || "",
        tiktokAccessToken: settings.tiktokAccessToken || "",
        googleConversionId: settings.googleConversionId || "",
        googleConversionLabel: settings.googleConversionLabel || "",
        googleAccessToken: settings.googleAccessToken || "",
      })
    }
  }, [settings, form])

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof marketingFormSchema>) => {
      const token = localStorage.getItem("agency_token")
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(values),
      })
      
      if (!res.ok) throw new Error("Falha ao salvar configurações")
      return res.json()
    },
    onSuccess: () => {
      alert("Configurações salvas com sucesso!")
      queryClient.invalidateQueries({ queryKey: ['marketingSettings'] })
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`)
    }
  })

  const testEventMutation = useMutation({
    mutationFn: async () => {
      if (!settings?.userId) throw new Error("ID do usuário não encontrado")
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketing/events/${settings.userId}?sync=true`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              eventName: "TestEvent",
              eventData: { source: "dashboard_test", value: 1.00, currency: "BRL" },
              url: window.location.href,
              userAgent: navigator.userAgent,
              timestamp: Math.floor(Date.now() / 1000)
          })
      })
      
      if (!res.ok) {
          const err = await res.json()
          throw new Error(err.details || "Falha ao enviar evento")
      }
      return res.json()
    },
    onSuccess: () => {
      alert("Evento de teste enviado com sucesso para as APIs conectadas!")
    },
    onError: (error) => {
      alert(`Erro no teste: ${error.message}`)
    }
  })

  function onSubmit(values: z.infer<typeof marketingFormSchema>) {
    mutation.mutate(values)
  }

  const scriptCode = settings?.userId 
    ? `<script src="${process.env.NEXT_PUBLIC_API_URL}/api/marketing/pixel.js/${settings.userId}"></script>`
    : "Carregando..."

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scriptCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const hasConfig = !!(settings?.metaPixelId || settings?.tiktokPixelId || settings?.googleConversionId);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Sidebar / List of Sources */}
         <div className="md:col-span-1 space-y-4">
            <Card className="h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Fontes de Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 px-2">
                    {/* Meta Status */}
                    <div className="flex items-center gap-3 p-3 rounded-md bg-accent text-accent-foreground cursor-pointer" onClick={() => { setActiveTab("settings"); setPlatformTab("meta"); }}>
                        <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">f</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">Meta (Facebook)</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {settings?.metaPixelId ? "Conectado" : "Não configurado"}
                            </p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${settings?.metaPixelId ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>

                    {/* TikTok Status */}
                    <div className="flex items-center gap-3 p-3 rounded-md bg-accent text-accent-foreground cursor-pointer" onClick={() => { setActiveTab("settings"); setPlatformTab("tiktok"); }}>
                         <div className="h-8 w-8 bg-black rounded flex items-center justify-center text-white font-bold text-xs">t</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">TikTok Ads</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {settings?.tiktokPixelId ? "Conectado" : "Não configurado"}
                            </p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${settings?.tiktokPixelId ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>

                    {/* Google Status */}
                    <div className="flex items-center gap-3 p-3 rounded-md bg-accent text-accent-foreground cursor-pointer" onClick={() => { setActiveTab("settings"); setPlatformTab("google"); }}>
                        <div className="h-8 w-8 bg-green-600 rounded flex items-center justify-center text-white font-bold text-xs">G</div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-medium truncate">Google Ads</p>
                            <p className="text-xs text-muted-foreground truncate">
                                {settings?.googleConversionId ? "Conectado" : "Não configurado"}
                            </p>
                        </div>
                        <div className={`h-2 w-2 rounded-full ${settings?.googleConversionId ? 'bg-green-500' : 'bg-slate-300'}`} />
                    </div>
                </CardContent>
            </Card>
         </div>

         {/* Main Content Area */}
         <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                    <TabsTrigger value="settings">Configurações</TabsTrigger>
                    <TabsTrigger value="test-events">Eventos de Teste</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Visão Geral</CardTitle>
                                    <CardDescription>Status das integrações e instalação.</CardDescription>
                                </div>
                                {hasConfig && <Badge variant="default" className="bg-green-600">Ativo</Badge>}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {!hasConfig ? (
                                <div className="text-center py-10 space-y-4">
                                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Nenhuma fonte de dados conectada</h3>
                                        <p className="text-muted-foreground">Conecte suas plataformas para começar o rastreamento unificado.</p>
                                    </div>
                                    <Button onClick={() => setActiveTab("settings")}>Configurar Integrações</Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="border rounded-md p-4 bg-muted/20">
                                        <h4 className="font-semibold mb-2 text-sm">Script de Rastreamento Unificado</h4>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Instale este script único no head do seu site. Ele carregará automaticamente os pixels configurados e enviará eventos para a API de Conversões.
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-slate-950 text-slate-50 p-2 rounded text-xs truncate">
                                                {scriptCode}
                                            </code>
                                            <Button size="sm" variant="outline" onClick={copyToClipboard}>
                                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configurações de Integração</CardTitle>
                            <CardDescription>
                                Gerencie as credenciais de cada plataforma.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={platformTab} onValueChange={setPlatformTab} className="w-full">
                                <TabsList className="w-full justify-start mb-4">
                                    <TabsTrigger value="meta">Meta (Facebook)</TabsTrigger>
                                    <TabsTrigger value="tiktok">TikTok Ads</TabsTrigger>
                                    <TabsTrigger value="google">Google Ads</TabsTrigger>
                                </TabsList>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        
                                        <TabsContent value="meta" className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="metaPixelId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Meta Pixel ID</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="1234567890" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="metaApiToken"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Token da API de Conversões (CAPI)</FormLabel>
                                                    <FormControl>
                                                    <Input type="password" placeholder="EAAB..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Gerado no Gerenciador de Eventos do Facebook</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </TabsContent>

                                        <TabsContent value="tiktok" className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="tiktokPixelId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>TikTok Pixel ID</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="C..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="tiktokAccessToken"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Access Token (Events API)</FormLabel>
                                                    <FormControl>
                                                    <Input type="password" placeholder="..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Gerado no TikTok Events Manager</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </TabsContent>

                                        <TabsContent value="google" className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="googleConversionId"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Google Conversion ID</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="AW-123456789" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="googleConversionLabel"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Conversion Label (Opcional)</FormLabel>
                                                    <FormControl>
                                                    <Input placeholder="..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Usado para eventos de conversão específicos</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="googleAccessToken"
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Access Token (Opcional)</FormLabel>
                                                    <FormControl>
                                                    <Input type="password" placeholder="..." {...field} />
                                                    </FormControl>
                                                    <FormDescription>Para integrações avançadas server-side</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                                )}
                                            />
                                        </TabsContent>

                                        <div className="flex justify-end pt-4 border-t">
                                            <Button type="submit" disabled={mutation.isPending}>
                                            {mutation.isPending ? "Salvando..." : "Salvar Configurações"}
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            </Tabs>
                        </CardContent>
                    </Card>
                </TabsContent>
                
                <TabsContent value="test-events" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Testar Eventos</CardTitle>
                            <CardDescription>
                                Envie um evento de teste para todas as plataformas conectadas simultaneamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="text-center py-8 space-y-4">
                                <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                                    <Activity className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-lg">Disparar Evento de Teste</h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        Isso enviará um evento para Meta CAPI, TikTok Events API e Google (se configurado).
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => testEventMutation.mutate()} 
                                    disabled={testEventMutation.isPending || !hasConfig}
                                    className="min-w-[200px]"
                                >
                                    {testEventMutation.isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        "Enviar Evento de Teste"
                                    )}
                                </Button>
                             </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
         </div>
      </div>
    </div>
  )
}
