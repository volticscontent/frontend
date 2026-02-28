"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Smartphone, Monitor, Loader2, RefreshCw, Save, ImagePlus, AlertCircle, CreditCard, ExternalLink } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useToast } from "@/hooks/use-toast"
import { loadStripe, Stripe } from "@stripe/stripe-js"
import { EmbeddedCheckoutProvider, EmbeddedCheckout, Elements, PaymentElement } from "@stripe/react-stripe-js"

interface CheckoutBuilderTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialLayout?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (layout: any) => void
}

export function CheckoutBuilderTab({}: CheckoutBuilderTabProps) {
  const [brandingColor, setBrandingColor] = useState("#000000")
  const [logoUrl, setLogoUrl] = useState("")
  const [borderRadius, setBorderRadius] = useState("0")
  const [fontFamily, setFontFamily] = useState("System")
  const [checkoutType, setCheckoutType] = useState<'EMBEDDED' | 'ELEMENTS' | 'HOSTED'>('EMBEDDED')
  const [templateName, setTemplateName] = useState('Default Template')
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['card'])
  const [isDefault, setIsDefault] = useState(false)
  const [currentTemplateId, setCurrentTemplateId] = useState<string | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null)
  
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  
  // Get userSlug from localStorage (safe access)
  const [userSlug, setUserSlug] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("agency_user")
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser)
          // eslint-disable-next-line
          setUserSlug(user.slug)
        } catch (e) {
          console.error("Failed to parse user", e)
        }
      }
    }
  }, [])

  // 1. Fetch Settings (Keys & Branding)
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['stripeSettings', userSlug],
    queryFn: async () => {
        if (!userSlug) return null
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/settings`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch settings')
        return res.json()
    },
    enabled: !!userSlug,
  })

  // 1.1 Fetch Templates
  const { data: templates, refetch: refetchTemplates } = useQuery({
    queryKey: ['checkoutTemplates', userSlug],
    queryFn: async () => {
        if (!userSlug) return null
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/templates`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to fetch templates')
        return res.json()
    },
    enabled: !!userSlug,
  })

  // Mutation to save template
  const saveTemplateMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!userSlug) throw new Error("User slug not found")
      const token = localStorage.getItem("agency_token")
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/templates`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to save template')
      return response.json()
    },
    onSuccess: () => {
      toast({ title: "Template salvo", description: "O template foi salvo com sucesso." })
      refetchTemplates()
    },
    onError: () => toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar o template." })
  })

  // Update local state when settings load
  useEffect(() => {
    if (settings) {
      if (settings.branding) {
        // eslint-disable-next-line
        if (settings.branding.primaryColor) setBrandingColor(settings.branding.primaryColor)
        if (settings.branding.logoUrl) setLogoUrl(settings.branding.logoUrl)
        if (settings.branding.borderRadius) setBorderRadius(settings.branding.borderRadius)
        if (settings.branding.fontFamily) setFontFamily(settings.branding.fontFamily)
      }
      if (settings.paymentMethods) setPaymentMethods(settings.paymentMethods)
    }
    
    if (settings?.publishableKey && !stripePromise) {
      if (settings.isConnectAccount && settings.accountId) {
        setStripePromise(loadStripe(settings.publishableKey, { stripeAccount: settings.accountId }))
      } else {
        setStripePromise(loadStripe(settings.publishableKey))
      }
    }
  }, [settings, stripePromise])

  // 2. Fetch Preview Session (Client Secret)
  const { data: previewSession, isLoading: isLoadingPreview, refetch: refetchPreview, error: previewError } = useQuery({
    queryKey: ['preview-session', userSlug, checkoutType],
    queryFn: async () => {
        if (!userSlug) return null
        const token = localStorage.getItem("agency_token")
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/${userSlug}/stripe/preview-session?type=${checkoutType}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })
        if (!res.ok) throw new Error('Failed to create preview session')
        return res.json()
    },
    enabled: !!userSlug && !!stripePromise,
  })

  const handleSave = async () => {
    saveTemplateMutation.mutate({
      id: currentTemplateId,
      name: templateName,
      type: checkoutType,
      isDefault: isDefault,
      config: {
        brandingColor,
        logoUrl,
        borderRadius,
        fontFamily,
        paymentMethods
      }
    })
  }

  const loadTemplate = (template: any) => {
    setCurrentTemplateId(template.id)
    setTemplateName(template.name)
    setCheckoutType(template.type)
    setIsDefault(template.isDefault)
    if (template.config) {
      setBrandingColor(template.config.brandingColor || "#000000")
      setLogoUrl(template.config.logoUrl || "")
      setBorderRadius(template.config.borderRadius || "0")
      setFontFamily(template.config.fontFamily || "System")
      setPaymentMethods(template.config.paymentMethods || ['card'])
    }
  }

  // Define appearance for Elements (only used when checkoutType === 'ELEMENTS')
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: brandingColor,
      borderRadius: `${borderRadius}px`,
      fontFamily: fontFamily === 'System' 
        ? '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        : `${fontFamily}, sans-serif`,
    },
  }

  // Load fonts for Stripe Elements
  const fonts = fontFamily !== 'System' ? [
    {
      cssSrc: `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;700&display=swap`,
    },
  ] : []

  // Load font in main document for preview UI
  useEffect(() => {
    if (fontFamily !== 'System') {
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily}:wght@400;700&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      return () => {
        document.head.removeChild(link)
      }
    }
  }, [fontFamily])

  return (
    <div className="flex flex-col min-h-[850px] h-[calc(100vh-280px)] bg-slate-50 border rounded-xl overflow-hidden shadow-sm">
      {/* Header com Abas e Seletores */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Checkout Builder</h1>
            <p className="text-sm text-slate-500">Personalize a experiência de pagamento</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setCheckoutType('EMBEDDED')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${checkoutType === 'EMBEDDED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Checkout embutido no seu site"
            >
              Stripe Embedded
            </button>
            <button
              onClick={() => setCheckoutType('HOSTED')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${checkoutType === 'HOSTED' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Redireciona para checkout.stripe.com (O 'Real')"
            >
              Stripe Hosted
            </button>
            <button
              onClick={() => setCheckoutType('ELEMENTS')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${checkoutType === 'ELEMENTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Componentes customizáveis"
            >
              Stripe Elements
            </button>
          </div>

          <div className="h-8 w-px bg-slate-200 mx-2" />

          <div className="flex items-center gap-2">
            <Select 
              value={currentTemplateId || "new"} 
              onValueChange={(val) => {
                if (val === "new") {
                  setCurrentTemplateId(null)
                  setTemplateName("Novo Template")
                } else {
                  const t = templates?.find((t: any) => t.id === val)
                  if (t) loadTemplate(t)
                }
              }}
            >
              <SelectTrigger className="w-[200px] h-9 bg-slate-50">
                <SelectValue placeholder="Selecionar Template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new"> Criar Novo Template</SelectItem>
                {templates?.map((t: any) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} {t.isDefault && "(Padrão)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-lg mr-4">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'desktop' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Desktop View"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-1.5 rounded-md transition-all ${previewMode === 'mobile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              title="Mobile View"
            >
              <Smartphone className="w-5 h-5" />
            </button>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saveTemplateMutation.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {saveTemplateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Template
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar de Personalização */}
        <div className="w-80 bg-white border-r overflow-y-auto p-6">
          <Tabs defaultValue="style">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="style" className="flex-1">Estilo</TabsTrigger>
              <TabsTrigger value="payment" className="flex-1">Pagamento</TabsTrigger>
              <TabsTrigger value="info" className="flex-1">Config</TabsTrigger>
            </TabsList>

            <TabsContent value="style" className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 block">Nome do Template</label>
                <Input 
                  value={templateName} 
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ex: Checkout Black Friday"
                />
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold text-slate-700">Template Padrão</label>
                  <p className="text-xs text-slate-500">Usar este template como principal</p>
                </div>
                <Switch 
                  checked={isDefault}
                  onCheckedChange={setIsDefault}
                />
              </div>

              {checkoutType === 'ELEMENTS' && (
                <>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-slate-700">Cor Principal</label>
                      <div 
                        className="w-8 h-8 rounded-full border shadow-sm cursor-pointer" 
                        style={{ backgroundColor: brandingColor }}
                        onClick={() => document.getElementById('color-picker')?.click()}
                      />
                      <input 
                        id="color-picker"
                        type="color" 
                        className="sr-only"
                        value={brandingColor}
                        onChange={(e) => setBrandingColor(e.target.value)}
                      />
                    </div>
                    <Input 
                      value={brandingColor} 
                      onChange={(e) => setBrandingColor(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700 block">Arredondamento ({borderRadius}px)</label>
                    <Slider 
                      value={[parseInt(borderRadius)]} 
                      min={0} 
                      max={24} 
                      step={1}
                      onValueChange={(val) => setBorderRadius(val[0].toString())}
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-700 block">Fonte</label>
                    <Select value={fontFamily} onValueChange={setFontFamily}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="System">Sistema</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {checkoutType === 'EMBEDDED' && (
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Nota:</strong> O Stripe Embedded utiliza as configurações de marca definidas diretamente no seu Dashboard da Stripe.
                  </p>
                  <Button variant="link" className="text-xs text-amber-900 p-0 h-auto mt-2" asChild>
                    <a href="https://dashboard.stripe.com/settings/branding" target="_blank" rel="noreferrer">
                      Abrir Configurações Stripe →
                    </a>
                  </Button>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t">
                <label className="text-sm font-semibold text-slate-700 block">URL do Logo</label>
                <div className="flex gap-2">
                  <Input 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  <Button variant="outline" size="icon">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-slate-700 block">Métodos de Pagamento</label>
                <div className="space-y-3">
                  {['card', 'pix', 'boleto'].map((method) => (
                    <div key={method} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-medium capitalize">{method}</span>
                      <Switch 
                        checked={paymentMethods.includes(method)}
                        onCheckedChange={(checked) => {
                          if (checked) setPaymentMethods([...paymentMethods, method])
                          else setPaymentMethods(paymentMethods.filter(m => m !== method))
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="info">
               {/* Configurações extras aqui */}
               <p className="text-sm text-slate-500">Configurações avançadas em breve...</p>
            </TabsContent>
          </Tabs>
        </div>

        {/* Área de Preview */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col items-center">
          <div className={`w-full h-full pb-10 overflow-y-auto transition-all overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] duration-300 flex justify-center ${previewMode === 'mobile' ? 'max-w-[400px]' : 'w-full'}`}>
            <div className={`bg-white transition-all duration-500 overflow-hidden flex flex-col ${
              previewMode === 'mobile' 
                ? 'w-[375px] h-[730px] border-8 border-black rounded-[3rem] mt-5' 
                : 'w-full max-w-6xl min-h-[800px]'
            }`}>
              {/* Barra de Status Mobile Mockup */}
              {previewMode === 'mobile' && (
                <div className="h-7 bg-black flex items-center justify-between px-8 text-[11px] text-white">
                  <span>9:41</span>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-4 h-1.5 bg-white/30 rounded-full" />
                    <div className="w-2 h-2 bg-white/30 rounded-full" />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-white">
                {isLoadingPreview ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4 p-12">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                    <p className="text-sm font-medium text-slate-500">Iniciando checkout seguro...</p>
                  </div>
                ) : previewError ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-2">Erro ao carregar checkout</h3>
                    <p className="text-sm text-slate-500 mb-6">Verifique se suas chaves da Stripe estão configuradas corretamente no dashboard.</p>
                    <Button onClick={() => refetchPreview()} variant="outline">Tentar novamente</Button>
                  </div>
                ) : previewSession?.clientSecret && stripePromise ? (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 w-full h-full">
                    {checkoutType === 'EMBEDDED' ? (
                      <div className="w-full min-h-full bg-white">
                        <EmbeddedCheckoutProvider
                            stripe={stripePromise}
                            options={{ clientSecret: previewSession.clientSecret }}
                        >
                            <EmbeddedCheckout />
                        </EmbeddedCheckoutProvider>
                      </div>
                    ) : checkoutType === 'HOSTED' ? (
                      <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
                          <ExternalLink className="w-10 h-10 text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">Checkout Hosted (Padrão Stripe)</h3>
                        <p className="text-slate-500 max-w-md mb-8">
                          O Checkout Hosted redireciona o cliente para uma página hospedada pela Stripe (checkout.stripe.com). 
                          Esta é a experiência mais completa e segura.
                        </p>
                        <Button 
                          onClick={() => window.open((previewSession as any).url, '_blank')}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 h-12 text-lg font-medium"
                        >
                          Abrir Checkout de Teste
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </Button>
                        <p className="text-xs text-slate-400 mt-6 uppercase tracking-widest">
                          Recomendado para máxima conversão
                        </p>
                      </div>
                    ) : (
                      <Elements 
                        stripe={stripePromise} 
                        options={{ 
                          clientSecret: previewSession.clientSecret,
                          appearance,
                          fonts 
                        }}
                      >
                        <div 
                          className={`space-y-6 mx-auto py-12 px-6 ${previewMode === 'mobile' ? 'max-w-full' : 'max-w-xl'}`}
                          style={{ fontFamily: fontFamily === 'System' ? 'inherit' : `${fontFamily}, sans-serif` }}
                        >
                          <div className="flex items-center gap-4 mb-10">
                            {logoUrl ? (
                              <img src={logoUrl} alt="Logo" className="h-10 object-contain" />
                            ) : (
                              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                                {templateName.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h2 className="font-bold text-xl text-slate-900">Pagamento Seguro</h2>
                              <p className="text-sm text-slate-500">Complete sua reserva abaixo</p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                            <PaymentElement />
                          </div>

                          <Button 
                            className="w-full h-14 text-lg font-bold shadow-lg shadow-indigo-200 transition-transform active:scale-[0.98]" 
                            style={{ backgroundColor: brandingColor }}
                          >
                            Finalizar Pagamento
                          </Button>
                          
                          <div className="flex items-center justify-center gap-2 pt-4">
                            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Powered by</span>
                            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4 opacity-40 grayscale" />
                          </div>
                        </div>
                      </Elements>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <CreditCard className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Nenhuma sessão de checkout ativa</p>
                    <p className="text-sm text-slate-400 mt-1">Selecione um template ou configure suas chaves para visualizar.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
