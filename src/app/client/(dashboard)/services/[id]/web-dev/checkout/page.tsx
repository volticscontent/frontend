"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductsTab } from "./products-tab"
import { CheckoutBuilderTab } from "./builder-tab"
import { SettingsTab } from "./settings-tab"
import { ConfigTab } from "./config-tab"

export default function CheckoutPage() {
  return (
    <div className="container mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Checkout Personalizado</h1>
        <p className="text-muted-foreground">
          Gerencie seus produtos, personalize seu checkout e configure sua integração com a Stripe.
        </p>
      </div>

      <Tabs defaultValue="config" className="w-full space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 h-auto">
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="builder">Checkout Builder</TabsTrigger>
          <TabsTrigger value="settings">Integração Stripe</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <ConfigTab />
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <ProductsTab />
        </TabsContent>

        <TabsContent value="builder" className="space-y-4">
          <CheckoutBuilderTab />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
