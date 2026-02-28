"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Users, 
  Building2, 
  CreditCard, 
} from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export default function BusinessSettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast({
      title: "Configurações salvas",
      description: "As alterações foram aplicadas com sucesso.",
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Negócio</h1>
        <p className="text-muted-foreground">
          Gerencie as informações da sua empresa, equipe e preferências gerais.
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Equipe
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Faturamento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Empresa</CardTitle>
              <CardDescription>
                Atualize os dados principais do seu negócio visíveis para clientes e parceiros.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Nome da Empresa</Label>
                  <Input id="company-name" defaultValue="Minha Empresa" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-slug">Slug (URL)</Label>
                  <Input id="company-slug" defaultValue="minha-empresa" disabled />
                  <p className="text-xs text-muted-foreground">O slug é usado para gerar links públicos e não pode ser alterado.</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="company-description">Descrição</Label>
                <Input id="company-description" defaultValue="Soluções digitais para o seu negócio." />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Equipe</CardTitle>
              <CardDescription>
                Gerencie quem tem acesso ao painel e suas permissões.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Para gerenciar convites e permissões detalhadas, acesse a área dedicada de equipe.
              </p>
              <Link href="/client/team">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Membros da Equipe
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Assinatura e Faturas</CardTitle>
              <CardDescription>
                Visualize seu plano atual e histórico de pagamentos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Acesse o portal de faturamento para ver detalhes completos.
              </p>
              <Link href="/client/invoices">
                <Button variant="outline" className="w-full sm:w-auto">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Ver Faturas e Pagamentos
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
