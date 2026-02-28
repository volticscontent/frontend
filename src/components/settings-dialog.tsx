
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Bell, Share2, Users } from "lucide-react"
import { cn } from "@/lib/utils"

import { TeamSettings } from "@/components/team/team-settings"
import { IntegrationsPanel } from "@/components/marketing/IntegrationsPanel"

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTab?: string
}

export function SettingsDialog({ open, onOpenChange, initialTab = "account" }: SettingsDialogProps) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [prevOpen, setPrevOpen] = useState(open)

  if (open && !prevOpen) {
    setPrevOpen(true)
    setActiveTab(initialTab)
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const tabs = [
    { id: "account", label: "Minha Conta", icon: User },
    { id: "team", label: "Equipe", icon: Users },
    { id: "billing", label: "Assinatura", icon: CreditCard },
    { id: "integrations", label: "Integrações", icon: Share2 },
    { id: "notifications", label: "Notificações", icon: Bell },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full sm:max-w-7xl h-[90vh] p-0 overflow-hidden flex flex-col md:flex-row gap-0">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-muted/30 border-r p-4 space-y-2 overflow-y-auto">
          <div className="mb-6 px-2">
            <h2 className="text-lg font-semibold tracking-tight">Configurações</h2>
            <p className="text-sm text-muted-foreground">Gerencie suas preferências</p>
          </div>
          
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  activeTab === tab.id ? "bg-muted font-medium" : ""
                )}
                onClick={() => setActiveTab(tab.id)}
              >
                <tab.icon className="mr-2 h-4 w-4" />
                {tab.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <DialogHeader className="mb-6">
            <DialogTitle>{tabs.find(t => t.id === activeTab)?.label}</DialogTitle>
            <DialogDescription>
              {activeTab === "account" && "Gerencie suas informações pessoais e de login."}
              {activeTab === "team" && "Gerencie membros, times e permissões."}
              {activeTab === "billing" && "Gerencie sua assinatura e métodos de pagamento."}
              {activeTab === "integrations" && "Conecte ferramentas externas como Meta e Google Ads."}
              {activeTab === "notifications" && "Configure como você deseja ser notificado."}
            </DialogDescription>
          </DialogHeader>

          {activeTab === "account" && (
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted/10">
                <h3 className="font-medium mb-2">Perfil do Usuário</h3>
                <p className="text-sm text-muted-foreground">Funcionalidade em desenvolvimento.</p>
              </div>
            </div>
          )}

          {activeTab === "team" && <TeamSettings />}

          {activeTab === "billing" && (
            <div className="space-y-4">
               <div className="p-4 border rounded-md bg-muted/10">
                <h3 className="font-medium mb-2">Plano Atual</h3>
                <p className="text-sm text-muted-foreground">Funcionalidade em desenvolvimento.</p>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="space-y-4">
                <IntegrationsPanel embedded={true} />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
               <div className="p-4 border rounded-md bg-muted/10">
                <h3 className="font-medium mb-2">Preferências de Email</h3>
                <p className="text-sm text-muted-foreground">Funcionalidade em desenvolvimento.</p>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  )
}
