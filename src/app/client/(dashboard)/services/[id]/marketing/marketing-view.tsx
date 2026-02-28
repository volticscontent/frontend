"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PieChart, ArrowRight, BarChart3, User, Users } from "lucide-react"

interface Collaborator {
    name: string
    role?: string
    email?: string
}

interface ServiceModule {
    key: string
    collaborators: Collaborator[]
}

interface Service {
    id: string;
    title: string;
    description: string;
    status: string;
    features?: string[];
    head?: Collaborator;
    modules?: ServiceModule[];
}

interface MarketingServicePageProps {
    service?: Service;
}

export default function MarketingServicePage({ service }: MarketingServicePageProps) {
    const params = useParams()
    const serviceId = params.id

    // Feature Check
    const features = service?.features || []
    const modules = service?.modules || []
    const moduleKeys = modules.map(m => m.key)

    // Only show if explicitly enabled in features OR modules
    // Removed legacy fallback that showed everything when features was empty

    const hasTracking = features.includes('TRACKING') || moduleKeys.includes('TRACKING')
    const hasCampaigns = features.includes('CAMPAIGNS') || moduleKeys.includes('CAMPAIGNS')

    const getModuleCollaborators = (key: string) => {
        const mod = service?.modules?.find(m => m.key === key)
        return mod?.collaborators || []
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{service?.title || "Marketing & Dados"}</h2>
                    <p className="text-muted-foreground">Gerencie suas campanhas e dados de performance.</p>
                </div>
                {service?.head && (
                    <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border">
                        <User className="h-8 w-8 p-1.5 bg-primary/10 text-primary rounded-full" />
                        <div className="text-xs">
                            <span className="block font-semibold text-muted-foreground">Head Responsável</span>
                            <span className="font-medium">{service.head.name}</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {hasTracking && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tracking & Pixel</CardTitle>
                            <PieChart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Fontes de dados</div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Integrações e coleta de dados.
                            </p>

                            {getModuleCollaborators('TRACKING').length > 0 && (
                                <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                        <Users className="h-3 w-3" />
                                        <span>Equipe Técnica:</span>
                                    </div>
                                    <div className="font-medium">
                                        {getModuleCollaborators('TRACKING').map(c => c.name.split(' ')[0]).join(', ')}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto">
                                <Link href={`/client/services/${serviceId}/integrations`}>
                                    <Button className="w-full">
                                        Acessar Integrações <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {hasCampaigns && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Gestão de Campanhas</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Campanhas</div>
                            <p className="text-xs text-muted-foreground mb-4">
                                Visualize e gerencie seus anúncios.
                            </p>

                            {getModuleCollaborators('CAMPAIGNS').length > 0 && (
                                <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                                        <Users className="h-3 w-3" />
                                        <span>Equipe Técnica:</span>
                                    </div>
                                    <div className="font-medium">
                                        {getModuleCollaborators('CAMPAIGNS').map(c => c.name.split(' ')[0]).join(', ')}
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto">
                                <Link href={`/client/services/${serviceId}/campaigns`}>
                                    <Button className="w-full" variant="outline">
                                        Acessar Campanhas <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
