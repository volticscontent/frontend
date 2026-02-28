"use client"

import React, { useState, useEffect, useMemo } from "react"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { getDataSources, DataSource } from "@/services/datasource"
import {
    Terminal, ChevronDown, ChevronUp, Activity, Zap,
    Server, Globe, Search, Database,
    CreditCard, FileText, BarChart3, LayoutTemplate, ShoppingBag, Plug,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"

// Modular tab import
import { ConnectionsTab } from "@/components/dock/connections-tab"

// =========================================
// Developer Dock — Main Shell
// =========================================

export function DeveloperDock() {
    const [isOpen, setIsOpen] = useState(false)
    const [height, setHeight] = useState(600)
    const [isResizing, setIsResizing] = useState(false)
    const [activeTab, setActiveTab] = useState("logs")
    const pathname = usePathname()

    // ---- Slug detection ----
    const urlSlug = useMemo(() => {
        const match = pathname?.match(/\/client\/([^\/]+)/)
        const potentialSlug = match ? match[1] : null
        const reserved = [
            'dashboard', 'products', 'cms', 'databases', 'settings',
            'team', 'campaigns', 'invoices', 'marketing', 'tracking',
            'services', 'seo', 'support', 'integrations', 'reports',
            'developer', 'test-pixel', 'forms',
        ]
        if (potentialSlug && !reserved.includes(potentialSlug)) return potentialSlug
        return null
    }, [pathname])

    const [slug, setSlug] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            const match = window.location.pathname.match(/\/client\/([^\/]+)/)
            const potentialSlug = match ? match[1] : null
            const reserved = ['dashboard', 'products', 'cms', 'databases', 'settings', 'team', 'campaigns', 'invoices', 'marketing', 'tracking', 'services', 'seo', 'support', 'integrations', 'reports', 'developer', 'test-pixel', 'forms']
            if (potentialSlug && !reserved.includes(potentialSlug)) return potentialSlug
            try {
                const userStr = localStorage.getItem("agency_user")
                if (userStr) { const user = JSON.parse(userStr); return user.slug || null }
            } catch (e) { console.error("Failed to parse user from localStorage", e) }
        }
        return null
    })

    const [prevUrlSlug, setPrevUrlSlug] = useState(urlSlug)
    if (urlSlug !== prevUrlSlug) {
        setPrevUrlSlug(urlSlug)
        if (urlSlug) setSlug(urlSlug)
    }

    // ---- Services ----
    const { data: services } = useQuery({
        queryKey: ['services', slug],
        queryFn: () => import('@/services/service').then(m => m.getServices(slug!)),
        enabled: !!slug,
    })

    // ---- Connections tab state ----
    const [inspectorMode, setInspectorMode] = useState(false)
    const [manualSelectedNodes, setManualSelectedNodes] = useState<string[]>([])
    const [autoSync, setAutoSync] = useState(true)

    // ---- Resize ----
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return
            const newH = window.innerHeight - e.clientY
            if (newH > 100 && newH < window.innerHeight - 50) setHeight(newH)
        }
        const handleMouseUp = () => setIsResizing(false)
        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleMouseUp)
        }
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp) }
    }, [isResizing])

    // ---- Route-based selection (auto-sync) ----
    const routeBasedNodes = useMemo(() => {
        if (!pathname) return []
        if (pathname.includes('/products')) return ['source-product']
        if (pathname.includes('/crm')) return ['crm']
        if (pathname.includes('/settings')) return ['auth']
        if (pathname.includes('/billing') || pathname.includes('/invoices')) return ['billing']
        return []
    }, [pathname])

    const selectedNodes = useMemo(() => {
        if (autoSync && routeBasedNodes.length > 0) {
            // Logica antiga de datasource removida temporariamente pois route-based selection precisará ser focada
            // nos fluxos dos serviços
            return routeBasedNodes
        }
        return manualSelectedNodes
    }, [autoSync, routeBasedNodes, manualSelectedNodes, services])

    const setSelectedNodes = (nodes: string[]) => {
        const isSame = nodes.length === manualSelectedNodes.length && nodes.every((val, i) => val === manualSelectedNodes[i])
        if (!isSame) {
            setManualSelectedNodes(nodes)
            if (nodes.length > 0) setAutoSync(false)
        }
    }

    // ---- Mock logs ----
    const logs = [
        { id: 1, timestamp: '10:42:01', service: 'API Gateway', message: 'Incoming request POST /api/v1/leads', status: 200, duration: '45ms' },
        { id: 2, timestamp: '10:42:02', service: 'Auth Service', message: 'Verifying JWT token', status: 200, duration: '12ms' },
        { id: 3, timestamp: '10:42:02', service: 'CRM Service', message: 'Creating new contact entry', status: 201, duration: '120ms' },
        { id: 4, timestamp: '10:42:03', service: 'Unified DB', message: 'INSERT INTO contacts (...)', status: 200, duration: '5ms' },
        { id: 5, timestamp: '10:42:05', service: 'Tracking', message: 'Event: page_view captured', status: 200, duration: '8ms' },
    ]

    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-[100] bg-background border-t shadow-2xl flex flex-col transition-all duration-200 ease-in-out"
            style={{ height: isOpen ? `${height}px` : '41px' }}
        >
            {/* Resize Handle */}
            {isOpen && (
                <div
                    className="w-full h-1 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 cursor-ns-resize flex justify-center items-center group transition-colors"
                    onMouseDown={() => setIsResizing(true)}
                >
                    <div className="w-12 h-1 bg-slate-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}

            {/* Header / Toolbar */}
            <div
                className="flex items-center justify-between px-4 py-2 border-b bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 font-semibold text-sm">
                        <Terminal className="h-4 w-4" />
                        Developer Dock
                    </div>
                    <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />
                    <TooltipProvider delayDuration={300}>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-8" onClick={(e) => e.stopPropagation()}>
                            <TabsList className="h-8">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="logs" className="text-xs h-7 px-3">Live Logs</TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-slate-800 z-[110]">
                                        <p>Logs do sistema em tempo real</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="connections" className="text-xs h-7 px-3">Connections</TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-slate-800 z-[110]">
                                        <p>Mapa de dependências e fluxo de dados</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="overview" className="text-xs h-7 px-3">System Overview</TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-slate-800 z-[110]">
                                        <p>Visão geral da saúde do sistema</p>
                                    </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <TabsTrigger value="settings" className="text-xs h-7 px-3">Settings</TabsTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-xs bg-slate-900 text-white border-slate-800 z-[110]">
                                        <p>Configurações de desenvolvedor e chaves de API</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TabsList>
                        </Tabs>
                    </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-mono">env: production</Badge>
                    <Badge variant="secondary" className="text-xs font-mono">v2.4.0</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen) }}>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <Tabs value={activeTab} className="h-full">
                    <TabsContent value="logs" className="h-full m-0 p-0">
                        <LogsTab logs={logs} />
                    </TabsContent>
                    <TabsContent value="connections" className="h-full m-0 p-0">
                        <ConnectionsTab
                            inspectorMode={inspectorMode}
                            setInspectorMode={setInspectorMode}
                            selectedNodes={selectedNodes}
                            setSelectedNodes={setSelectedNodes}
                            autoSync={autoSync}
                            setAutoSync={setAutoSync}
                            services={services || []}
                        />
                    </TabsContent>
                    <TabsContent value="overview" className="h-full m-0 p-4 overflow-auto">
                        <OverviewTab />
                    </TabsContent>
                    <TabsContent value="settings" className="h-full m-0 p-4 overflow-auto">
                        <SettingsTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

// =========================================
// Logs Tab
// =========================================

interface LogEntry {
    id: number
    timestamp: string
    service: string
    message: string
    status: number
    duration: string
}

function LogsTab({ logs }: { logs: LogEntry[] }) {
    return (
        <div className="h-full flex flex-col font-mono text-xs">
            <div className="flex items-center gap-2 p-2 border-b bg-slate-50 dark:bg-slate-900/50">
                <Search className="h-3 w-3 text-muted-foreground" />
                <input
                    className="bg-transparent border-none outline-none flex-1 placeholder:text-muted-foreground"
                    placeholder="Filter logs (e.g. status:500 or service:auth)..."
                />
                <Button variant="ghost" size="sm" className="h-6 text-[10px]">Clear</Button>
            </div>
            <ScrollArea className="flex-1">
                <Table>
                    <TableHeader>
                        <TableRow className="h-8 hover:bg-transparent">
                            <TableHead className="w-[100px]">Time</TableHead>
                            <TableHead className="w-[120px]">Service</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead className="w-[80px]">Status</TableHead>
                            <TableHead className="w-[80px] text-right">Duration</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className="h-8 group hover:bg-muted/50">
                                <TableCell className="py-1 text-muted-foreground">{log.timestamp}</TableCell>
                                <TableCell className="py-1 font-medium text-foreground">{log.service}</TableCell>
                                <TableCell className="py-1">{log.message}</TableCell>
                                <TableCell className="py-1">
                                    <span className={cn(
                                        "font-medium",
                                        log.status >= 500 && "text-red-600 dark:text-red-400",
                                        log.status >= 400 && log.status < 500 && "text-orange-600 dark:text-orange-400",
                                        log.status < 400 && "text-green-600 dark:text-green-400"
                                    )}>
                                        {log.status}
                                    </span>
                                </TableCell>
                                <TableCell className="py-1 text-right text-muted-foreground">{log.duration}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </ScrollArea>
        </div>
    )
}

// =========================================
// Overview Tab (placeholder — will be modularized later)
// =========================================

function OverviewTab() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Requisições</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">2,350</div>
                    <p className="text-xs text-muted-foreground">+20.1% desde a última hora</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">45ms</div>
                    <p className="text-xs text-muted-foreground">-5ms média geral</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
                    <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">0.12%</div>
                    <p className="text-xs text-muted-foreground">Estável</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Status do Sistema</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-green-500">Operacional</div>
                    <p className="text-xs text-muted-foreground">Todos os serviços online</p>
                </CardContent>
            </Card>
        </div>
    )
}

// =========================================
// Settings Tab (placeholder — will be modularized later)
// =========================================

function SettingsTab() {
    return (
        <div className="grid gap-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Chaves de API</CardTitle>
                    <CardDescription>Gerencie as chaves de acesso para integração externa.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Chave Pública</label>
                        <div className="flex">
                            <input
                                className="flex-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                readOnly
                                value="pk_live_51M3..."
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
