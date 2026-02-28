"use client";

import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ArrowRight, Search, LayoutTemplate, User, Users, CreditCard } from "lucide-react"

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

interface WebDevServicePageProps {
  service?: Service;
}

export default function WebDevServicePage({ service }: WebDevServicePageProps) {
  const params = useParams()
  const serviceId = params.id
  
  // Feature Check
  const features = service?.features || []
  const modules = service?.modules || []
  const moduleKeys = modules.map(m => m.key)
  
  // Only show if explicitly enabled in features OR modules
  // Removed legacy fallback that showed everything when features was empty
  
  const hasForms = features.includes('FORMS') || moduleKeys.includes('FORMS')
  const hasSEO = features.includes('SEO') || moduleKeys.includes('SEO')
  const hasCMS = features.includes('CMS') || moduleKeys.includes('CMS')
  const hasCheckout = features.includes('CHECKOUT') || moduleKeys.includes('CHECKOUT')

  const getModuleCollaborators = (key: string) => {
      const mod = service?.modules?.find(m => m.key === key)
      return mod?.collaborators || []
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">{service?.title || "Desenvolvimento Web"}</h2>
            <p className="text-muted-foreground">Gerencie as ferramentas e recursos do seu projeto web.</p>
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
        {hasForms && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Formulários</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Construtor</div>
                <p className="text-xs text-muted-foreground mb-4">
                Crie e edite formulários personalizados.
                </p>
                
                {getModuleCollaborators('FORMS').length > 0 && (
                    <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Equipe Técnica:</span>
                        </div>
                        <div className="font-medium">
                            {getModuleCollaborators('FORMS').map(c => c.name.split(' ')[0]).join(', ')}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                <Link href={`/client/services/${serviceId}/web-dev/forms/builder`}>
                    <Button className="w-full">
                    Acessar Construtor <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                </div>
            </CardContent>
            </Card>
        )}

        {hasSEO && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SEO & Visibilidade</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Otimização</div>
                <p className="text-xs text-muted-foreground mb-4">
                Gerencie meta tags e performance.
                </p>

                {getModuleCollaborators('SEO').length > 0 && (
                    <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Equipe Técnica:</span>
                        </div>
                        <div className="font-medium">
                            {getModuleCollaborators('SEO').map(c => c.name.split(' ')[0]).join(', ')}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                <Link href={`/client/services/${serviceId}/seo`}>
                    <Button className="w-full" variant="outline">
                    Acessar Painel SEO <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                </div>
            </CardContent>
            </Card>
        )}

        {hasCMS && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conteúdo (CMS)</CardTitle>
                <LayoutTemplate className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Gerenciador</div>
                <p className="text-xs text-muted-foreground mb-4">
                Edite o conteúdo do seu site.
                </p>

                {getModuleCollaborators('CMS').length > 0 && (
                    <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Equipe Técnica:</span>
                        </div>
                        <div className="font-medium">
                            {getModuleCollaborators('CMS').map(c => c.name.split(' ')[0]).join(', ')}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                <Link href={`/client/services/${serviceId}/cms`}>
                    <Button className="w-full" variant="outline">
                    Acessar CMS <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
                </div>
            </CardContent>
            </Card>
        )}

        {hasCheckout && (
            <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Checkout</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">Vendas</div>
                <p className="text-xs text-muted-foreground mb-4">
                Gerencie produtos e pagamentos.
                </p>

                {getModuleCollaborators('CHECKOUT').length > 0 && (
                    <div className="mb-4 text-xs bg-muted/30 p-2 rounded">
                        <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Users className="h-3 w-3" />
                            <span>Equipe Técnica:</span>
                        </div>
                        <div className="font-medium">
                            {getModuleCollaborators('CHECKOUT').map(c => c.name.split(' ')[0]).join(', ')}
                        </div>
                    </div>
                )}

                <div className="mt-auto">
                <Link href={`/client/services/${serviceId}/web-dev/checkout`}>
                    <Button className="w-full" variant="outline">
                    Acessar Checkout <ArrowRight className="ml-2 h-4 w-4" />
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
