"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import WebDevServicePage from "./web-dev/web-dev-view"
import MarketingServicePage from "./marketing/marketing-view"

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

export default function ServiceDetailsPage() {
  const params = useParams()
  const serviceId = params.id as string
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchService() {
      try {
        const storedUser = localStorage.getItem("agency_user")
        const token = localStorage.getItem("agency_token")
        
        if (!storedUser || !token) {
           setError("Usuário não autenticado")
           setLoading(false)
           return
        }

        const user = JSON.parse(storedUser)
        const headers = { "Authorization": `Bearer ${token}` }

        // Como não temos endpoint de serviço único ainda, buscamos todos e filtramos
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/${user.slug}/services/dashboard`, { headers })

        if (!response.ok) throw new Error("Falha ao carregar dados do serviço")
        
        const data = await response.json()
        const foundService = data.services?.find((s: Service) => s.id === serviceId)

        if (foundService) {
            setService(foundService)
        } else {
            setError("Serviço não encontrado")
        }

      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }

    fetchService()
  }, [serviceId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Erro</h3>
          <p className="text-muted-foreground mb-6">{error || "Serviço não encontrado"}</p>
          <Button onClick={() => window.history.back()}>Voltar</Button>
      </div>
    )
  }

  // Router de visualização baseado no tipo de serviço
  const titleLower = service.title.toLowerCase()

  if (titleLower === "desenvolvimento web" || titleLower.includes("web") || titleLower.includes("site")) {
      return <WebDevServicePage service={service} />
  }

  if (titleLower.includes("marketing") || titleLower.includes("tráfego") || titleLower.includes("social")) {
      return <MarketingServicePage service={service} />
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{service.title}</h2>
        <p className="text-muted-foreground">ID do Serviço: {serviceId}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Visão Geral</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {service.description}
          </p>
          
          <div className="grid gap-2">
            <h4 className="font-semibold">Recursos Inclusos:</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
                {service.features?.map((feature, i) => (
                    <li key={i}>{feature}</li>
                ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
