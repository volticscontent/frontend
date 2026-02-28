"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { useParams, useRouter } from "next/navigation"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCheckoutSettings, updateCheckoutSettings, CheckoutSettings } from "@/services/checkout"
import { Loader2, Database } from "lucide-react"

interface Dataset {
    id: string
    name: string
    description?: string
}

export function ConfigTab() {
    const { toast } = useToast()
    const params = useParams()
    const router = useRouter()
    const serviceId = params.id as string
    const queryClient = useQueryClient()

    const [pixels, setPixels] = useState({
        facebook: "",
        google: "",
        tiktok: ""
    })

    const [settings, setSettings] = useState({
        collectPhone: true,
        collectAddress: true,
        onePageCheckout: false
    })

    const [selectedDataSourceId, setSelectedDataSourceId] = useState<string | undefined>(undefined)

    // Fetch available data sources
    const { data: dataSources } = useQuery<Dataset[]>({
        queryKey: ['trackingDatasets'],
        queryFn: async () => {
            const token = localStorage.getItem("agency_token")
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracking/datasets`, {
                headers: { "Authorization": `Bearer ${token}` }
            })
            if (res.status === 401) {
                router.push("/client/login")
                throw new Error("Sessão expirada")
            }
            if (!res.ok) throw new Error("Falha ao carregar fontes de dados")
            return res.json()
        }
    })

    const { data: checkoutConfig, isLoading: isFetching } = useQuery({
        queryKey: ['checkoutSettings', serviceId],
        queryFn: () => getCheckoutSettings(serviceId),
        enabled: !!serviceId
    })

    useEffect(() => {
        if (checkoutConfig) {
            setPixels({
                facebook: checkoutConfig.pixels?.facebook || "",
                google: checkoutConfig.pixels?.google || "",
                tiktok: checkoutConfig.pixels?.tiktok || ""
            })
            setSettings({
                collectPhone: checkoutConfig.config?.collectPhone ?? true,
                collectAddress: checkoutConfig.config?.collectAddress ?? true,
                onePageCheckout: checkoutConfig.config?.onePageCheckout ?? false
            })
            if (checkoutConfig.dataSource?.id) {
                setSelectedDataSourceId(checkoutConfig.dataSource.id)
            }
        }
    }, [checkoutConfig])

    const mutation = useMutation({
        mutationFn: (data: CheckoutSettings) => updateCheckoutSettings(serviceId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['checkoutSettings', serviceId] })
            toast({
                title: "Configurações salvas",
                description: "As configurações de checkout e tagueamento foram atualizadas."
            })
        },
        onError: (error) => {
            toast({
                title: "Erro ao salvar",
                description: "Ocorreu um erro ao salvar as configurações.",
                variant: "destructive"
            })
            console.error(error)
        }
    })

    const handleSave = () => {
        mutation.mutate({
            pixels,
            config: settings,
            dataSourceId: selectedDataSourceId
        })
    }

    if (isFetching) {
        return (
            <div className="flex justify-center items-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Tagueamento (Pixels)</CardTitle>
                        <CardDescription>Configure os pixels de rastreamento para seu checkout.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col gap-2 p-4 border border-dashed rounded-lg bg-muted/30">
                            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                <Database className="h-4 w-4" />
                                <span>Fonte de Dados</span>
                            </div>
                            <Select
                                value={selectedDataSourceId || ""}
                                onValueChange={(value) => setSelectedDataSourceId(value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma fonte de dados" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dataSources?.map((ds) => (
                                        <SelectItem key={ds.id} value={ds.id}>
                                            {ds.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Todos os eventos de compra serão registrados automaticamente nesta fonte de dados.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fb-pixel">Meta Pixel (Facebook)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="fb-pixel"
                                    placeholder="Ex: 1234567890"
                                    value={pixels.facebook}
                                    onChange={(e) => setPixels({ ...pixels, facebook: e.target.value })}
                                />
                                {pixels.facebook && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ga-pixel">Google Analytics / Ads</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="ga-pixel"
                                    placeholder="Ex: G-XXXXXXXXXX"
                                    value={pixels.google}
                                    onChange={(e) => setPixels({ ...pixels, google: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tt-pixel">TikTok Pixel</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="tt-pixel"
                                    placeholder="Ex: CXXXXXXXXXXXXX"
                                    value={pixels.tiktok}
                                    onChange={(e) => setPixels({ ...pixels, tiktok: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Configurações de Checkout</CardTitle>
                        <CardDescription>Personalize o comportamento do seu checkout.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Coletar Telefone</Label>
                                <p className="text-sm text-muted-foreground">Exigir número de telefone no checkout</p>
                            </div>
                            <Switch
                                checked={settings.collectPhone}
                                onCheckedChange={(c) => setSettings({ ...settings, collectPhone: c })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Coletar Endereço</Label>
                                <p className="text-sm text-muted-foreground">Exigir endereço completo de cobrança</p>
                            </div>
                            <Switch
                                checked={settings.collectAddress}
                                onCheckedChange={(c) => setSettings({ ...settings, collectAddress: c })}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between space-x-2">
                            <div className="space-y-0.5">
                                <Label className="text-base">Checkout em uma etapa</Label>
                                <p className="text-sm text-muted-foreground">Simplificar o processo de compra</p>
                            </div>
                            <Switch
                                checked={settings.onePageCheckout}
                                onCheckedChange={(c) => setSettings({ ...settings, onePageCheckout: c })}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={mutation.isPending}>
                    {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
            </div>
        </div>
    )
}
