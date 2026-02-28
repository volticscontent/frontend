"use client"

import * as React from "react"
import {
  GalleryVerticalEnd,
  PieChart,
  SquareTerminal,
  LayoutDashboard,
  FileText,
  LifeBuoy,
  Globe,
  Box,
  Megaphone,
  Briefcase,
  Settings,
  Database,
  Search,
  PenTool,
  ClipboardList,
  BarChart3,
  Palette,
  TrendingUp,
  Monitor,
  Code,
  Layers,
  Smartphone,
  CreditCard,
  ShoppingBag,
  KanbanSquare,
  Workflow,
  type LucideIcon
} from "lucide-react"
import { useRouter } from "next/navigation"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { api } from "@/lib/api"

// Icon Map
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  SquareTerminal,
  LifeBuoy,
  PieChart,
  Globe,
  Box,
  Megaphone,
  Briefcase,
  Settings,
  FileText,
  Database,
  Search,
  PenTool,
  ClipboardList,
  BarChart3,
  Palette,
  TrendingUp,
  Monitor,
  Code,
  Layers,
  Smartphone,
  CreditCard,
  ShoppingBag,
  KanbanSquare,
  Workflow
}

interface NavItem {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
        title: string
        url: string
    }[]
}

interface User {
    name: string
    email: string
    avatar: string
}

// Initial Base Data (fallback)
const initialData = {
  user: {
    name: "Carregando...",
    email: "...",
    avatar: "",
  },
  teams: [
    {
      name: "Minha Empresa",
      logo: GalleryVerticalEnd,
      plan: "Cliente",
    },
  ],
  navMain: [
    {
      title: "Meu Painel",
      url: "/client",
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: "Visão Geral",
          url: "/client",
        },
        {
          title: "Relatórios",
          url: "/client/reports",
        },
      ],
    },
    {
      title: "Bases de Dados",
      url: "/client/databases",
      icon: Database,
    },
    {
      title: "Serviços",
      url: "/client/services",
      icon: SquareTerminal,
      items: [
        {
          title: "Meus Contratos",
          url: "/client/services",
        },
        {
          title: "Faturas",
          url: "/client/invoices",
        },
      ],
    },
    {
      title: "Suporte",
      url: "/client/support",
      icon: LifeBuoy,
      items: [
        {
          title: "Abrir Ticket",
          url: "/client/support/new",
        },
        {
          title: "Meus Tickets",
          url: "/client/support",
        },
      ],
    },
  ],
}

export function ClientSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const [navItems, setNavItems] = React.useState<NavItem[]>(initialData.navMain)
  const [user, setUser] = React.useState<User>(initialData.user)
  const [teams, setTeams] = React.useState(initialData.teams)

  React.useEffect(() => {
    async function fetchSidebar() {
        const storedUser = localStorage.getItem("agency_user")
        const token = localStorage.getItem("agency_token")
        
        if (!storedUser || !token) return

        const userData = JSON.parse(storedUser)
        setUser({
            name: userData.name,
            email: userData.email,
            avatar: "https://github.com/shadcn.png"
        })

        // Update team name if available in user data
        if (userData.companyName || userData.slug) {
            setTeams([{
                name: userData.companyName || userData.slug,
                logo: GalleryVerticalEnd,
                plan: "Cliente"
            }])
        }

        try {
            const res = await api.get(`/${userData.slug}/sidebar`)
            
            if (res.status === 200) {
                const data = res.data
                // Map icon strings to components
                const mappedData = data.map((item: NavItem & { icon: string }) => ({
                    ...item,
                    icon: iconMap[item.icon] || Box // Fallback icon
                }))
                setNavItems(mappedData)
            }
        } catch (error) {
            console.error("Failed to fetch sidebar", error)
        }
    }
    fetchSidebar()
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher 
            teams={teams} 
            onAddTeam={() => router.push('/login')}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
