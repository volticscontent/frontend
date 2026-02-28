"use client"

import React, { useState, useMemo } from "react"
import {
    Database, Globe, Server, Shield, MousePointer2, Users,
    CreditCard, FileText, BarChart3, LayoutTemplate, ShoppingBag,
    Plug, LucideIcon, Activity, Search, Zap, Code, ArrowRight,
    Box, Info, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip"
import { ForceGraphCanvas, GraphNode, GraphEdge } from "@/components/force-graph-canvas"
import { Service } from "@/services/service"

// =========================================
// Service Types
// =========================================

interface StaticService {
    name: string
    type: string
    status: 'healthy' | 'degraded' | 'down'
    latency: string
    version: string
    icon: LucideIcon
    description: string
    resolvers?: Resolver[]
    connectedSources?: { name: string; type: string; status: string }[]
}

interface Resolver {
    name: string
    type: 'query' | 'mutation' | 'subscription'
    status: 'active' | 'deprecated'
    latency?: string
}

// =========================================
// Static Data
// =========================================

const SERVICES: Record<string, StaticService> = {
    client: { name: 'Client App', type: 'Frontend', status: 'healthy', latency: '45ms', version: 'v2.4.0', icon: Globe, description: 'Next.js Frontend Application serving the client dashboard.' },
    gateway: {
        name: 'API Gateway', type: 'Middleware', status: 'healthy', latency: '12ms', version: 'v1.2.0', icon: Server,
        description: 'Central API Gateway handling routing, auth, and rate limiting.',
        resolvers: [
            { name: 'proxyRequest', type: 'query', status: 'active', latency: '15ms' },
            { name: 'validateSession', type: 'query', status: 'active', latency: '8ms' },
        ],
    },
    auth: {
        name: 'Auth Service', type: 'Service', status: 'healthy', latency: '25ms', version: 'v1.1.0', icon: Shield,
        description: 'Authentication and Authorization service (JWT/OAuth).',
        resolvers: [
            { name: 'login', type: 'mutation', status: 'active', latency: '45ms' },
            { name: 'refreshToken', type: 'mutation', status: 'active', latency: '30ms' },
            { name: 'verifyToken', type: 'query', status: 'active', latency: '10ms' },
        ],
    },
    billing: {
        name: 'Billing Service', type: 'Service', status: 'healthy', latency: '85ms', version: 'v1.0.5', icon: CreditCard,
        description: 'Handles subscriptions, invoices, and payment processing.',
        resolvers: [
            { name: 'createSubscription', type: 'mutation', status: 'active', latency: '120ms' },
            { name: 'getInvoices', type: 'query', status: 'active', latency: '60ms' },
        ],
    },
    crm: {
        name: 'CRM Service', type: 'Service', status: 'degraded', latency: '150ms', version: 'v1.3.2', icon: Users,
        description: 'Manages contacts, deals, and customer interactions.',
        resolvers: [
            { name: 'getContacts', type: 'query', status: 'active', latency: '180ms' },
            { name: 'updateDeal', type: 'mutation', status: 'active', latency: '140ms' },
        ],
    },
    db: {
        name: 'Bases de Dados', type: 'Resolver', status: 'healthy', latency: '5ms', version: 'PostgreSQL 15', icon: Database,
        description: 'Primary relational database for all services.',
        resolvers: [
            { name: 'getLeads', type: 'query', status: 'active', latency: 'Pending' },
            { name: 'getClients', type: 'query', status: 'active', latency: 'Pending' },
        ],
    },
}


// =========================================
// Node & Edge Colors
// =========================================

const NODE_COLORS: Record<string, string> = {
    client: '#000000ff', gateway: '#a78bfa', auth: '#fb923c',
    billing: '#4ade80', crm: '#38bdf8', db: '#22d3ee',
    TRACKING: '#c084fc', FORM: '#f472b6', STRIPE: '#34d399',
    CMS: '#fbbf24', PRODUCT: '#f87171', CHECKOUT: '#fb923c',
}

const EDGE_COLORS: Record<string, string> = {
    core: '#4ade80', tracking: '#c084fc', stripe: '#34d399',
    form: '#f472b6', cms: '#fbbf24', product: '#f87171',
}

// =========================================
// Component Props
// =========================================

const getIconForName = (name: string, fallback: LucideIcon): LucideIcon => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('checkout') || lowerName.includes('pay') || lowerName.includes('billing')) return CreditCard
    if (lowerName.includes('product') || lowerName.includes('produto') || lowerName.includes('store')) return ShoppingBag
    if (lowerName.includes('crm') || lowerName.includes('client') || lowerName.includes('user') || lowerName.includes('cliente')) return Users
    if (lowerName.includes('auth') || lowerName.includes('security') || lowerName.includes('shield')) return Shield
    if (lowerName.includes('cms') || lowerName.includes('content') || lowerName.includes('layout')) return LayoutTemplate
    if (lowerName.includes('analytics') || lowerName.includes('metric') || lowerName.includes('chart') || lowerName.includes('pixel') || lowerName.includes('tracking')) return BarChart3
    if (lowerName.includes('market') || lowerName.includes('funnel') || lowerName.includes('campaign')) return Globe
    if (lowerName.includes('db') || lowerName.includes('data') || lowerName.includes('storage')) return Database
    if (lowerName.includes('api') || lowerName.includes('gateway') || lowerName.includes('server')) return Server
    if (lowerName.includes('plugin') || lowerName.includes('integration') || lowerName.includes('webhook') || lowerName.includes('utmify')) return Plug
    if (lowerName.includes('lightning') || lowerName.includes('quick') || lowerName.includes('fast')) return Zap
    if (lowerName.includes('search') || lowerName.includes('query') || lowerName.includes('find')) return Search
    if (lowerName.includes('doc') || lowerName.includes('file') || lowerName.includes('report')) return FileText
    return fallback
}

export interface ConnectionsTabProps {
    inspectorMode: boolean
    setInspectorMode: (mode: boolean) => void
    selectedNodes: string[]
    setSelectedNodes: (nodes: string[]) => void
    autoSync: boolean
    setAutoSync: (sync: boolean) => void
    services: Service[]
}

// =========================================
// ConnectionsTab Component
// =========================================

export function ConnectionsTab({
    inspectorMode, setInspectorMode,
    selectedNodes, setSelectedNodes,
    autoSync, setAutoSync,
    services,
}: ConnectionsTabProps) {
    const [hoveredNode, setHoveredNode] = useState<string | null>(null)

    // ---- Filter relevant Services/Modules ----
    const activeServices = useMemo(() => {
        return (services || []).filter(s => s.status === 'ACTIVE')
    }, [services])

    // ---- Build Graph Nodes ----
    const graphNodes = useMemo<GraphNode[]>(() => {
        const core: GraphNode[] = [
            { id: 'unified-products', label: 'Produtos Unificados', sub: 'Resolver', icon: ShoppingBag, color: '#f59e0b', radius: 30, initialX: 0, initialY: 0 },
        ]

        const serviceNodes: GraphNode[] = []
        const moduleNodes: GraphNode[] = []

        activeServices.forEach((srv, i) => {
            const icon = getIconForName(srv.title, ShoppingBag)
            const color = NODE_COLORS[srv.id] || '#94a3b8'
            // Base angle for this service around the central DB
            const angle = (i * (Math.PI * 2)) / Math.max(activeServices.length, 1)
            const dist = 180
            const srvX = Math.cos(angle) * dist
            const srvY = Math.sin(angle) * dist

            serviceNodes.push({
                id: `service-${srv.id}`,
                label: srv.title,
                sub: 'Serviço',
                icon,
                color,
                radius: 24,
                initialX: srvX,
                initialY: srvY
            })

            // Map modules for this service
            if (srv.modules && srv.modules.length > 0) {
                srv.modules.forEach((mod, j) => {
                    // Spread modules around their parent service
                    const modAngle = angle + ((j - (srv.modules.length - 1) / 2) * 0.4)
                    const modDist = dist + 100
                    moduleNodes.push({
                        id: `module-${mod.id}`,
                        label: mod.name,
                        sub: 'Sub-serviço (Módulo)',
                        icon: getIconForName(mod.name, Code),
                        color: `${color}ee`,
                        radius: 18,
                        initialX: Math.cos(modAngle) * modDist,
                        initialY: Math.sin(modAngle) * modDist,
                        isModule: true
                    })
                })
            }
        })

        return [...core, ...serviceNodes, ...moduleNodes]
    }, [activeServices])

    // ---- Build Graph Edges ----
    const graphEdges = useMemo<GraphEdge[]>(() => {
        const edges: GraphEdge[] = []

        for (const srv of activeServices) {
            const srvNodeId = `service-${srv.id}`
            const edgeColor = NODE_COLORS[srv.id] || EDGE_COLORS.core

            // Connect modules to their parent service
            if (srv.modules) {
                for (const mod of srv.modules) {
                    const modNodeId = `module-${mod.id}`
                    edges.push({
                        id: `e-srv-mod-${mod.id}`,
                        source: modNodeId,
                        target: srvNodeId,
                        color: `${edgeColor}80`,
                        dashed: false
                    })

                    // Resolvers connect sub-services (modules) to the Unified Products frontend. 
                    if (mod.name.toLowerCase().includes('checkout') ||
                        mod.name.toLowerCase().includes('produto') ||
                        mod.name.toLowerCase().includes('store') ||
                        mod.name.toLowerCase().includes('cms') ||
                        srv.title.toLowerCase().includes('cms') ||
                        srv.title.toLowerCase().includes('checkout')) {
                        edges.push({
                            id: `resolver-${mod.id}-up`,
                            source: modNodeId,
                            target: 'unified-products',
                            color: '#fbbf24', // Amber/Yellow for resolver sync
                            dashed: true
                        })
                    }
                }
            } else {
                // If service has no modules but still manages products, connect directly
                if (srv.title.toLowerCase().includes('cms') || srv.title.toLowerCase().includes('checkout')) {
                    edges.push({ id: `resolver-srv-${srv.id}-up`, source: srvNodeId, target: 'unified-products', color: '#fbbf24', dashed: true })
                }
            }
        }

        return edges
    }, [activeServices])

    // ---- Node Click (inspector logic) ----
    const handleNodeClick = (nodeId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation()
        if (!inspectorMode) setInspectorMode(true)

        if (e && (e.ctrlKey || e.metaKey || e.shiftKey)) {
            setSelectedNodes(selectedNodes.includes(nodeId) ? selectedNodes.filter(id => id !== nodeId) : [...selectedNodes, nodeId])
            return
        }

        let related: string[] = [nodeId]

        if (nodeId.startsWith('service-')) {
            const srvId = nodeId.replace('service-', '')
            const srv = services.find(s => s.id === srvId)
            if (srv && srv.modules) {
                srv.modules.forEach(m => {
                    related.push(`module-${m.id}`)
                    // Highlight the resolver path if this module syncs to unified products
                    if (m.name.toLowerCase().includes('checkout') || m.name.toLowerCase().includes('cms') || m.name.toLowerCase().includes('produto')) {
                        related.push('unified-products')
                    }
                })
            }
        } else if (nodeId.startsWith('module-')) {
            const modId = nodeId.replace('module-', '')
            const parentSrv = services.find(s => s.modules?.some(m => m.id === modId))
            const mod = parentSrv?.modules?.find(m => m.id === modId)

            if (parentSrv) {
                related.push(`service-${parentSrv.id}`)
            }
            if (mod && (mod.name.toLowerCase().includes('checkout') || mod.name.toLowerCase().includes('cms') || mod.name.toLowerCase().includes('produto') || parentSrv?.title.toLowerCase().includes('cms'))) {
                related.push('unified-products')
            }
        } else if (nodeId === 'unified-products') {
            // Find all modules that act as resolvers to unified products
            services.forEach(s => {
                let connected = false
                s.modules?.forEach(m => {
                    if (m.name.toLowerCase().includes('checkout') || m.name.toLowerCase().includes('cms') || m.name.toLowerCase().includes('produto')) {
                        related.push(`module-${m.id}`)
                        connected = true
                    }
                })
                if (connected || s.title.toLowerCase().includes('cms') || s.title.toLowerCase().includes('checkout')) {
                    related.push(`service-${s.id}`)
                }
            })
        }

        setSelectedNodes([...new Set(related)])
    }

    // ---- Build inspector data ----
    const selectedServices = selectedNodes.map(nodeId => {
        if (nodeId.startsWith('service-')) {
            const srv = services.find(s => `service-${s.id}` === nodeId)
            if (!srv) return null
            return {
                name: srv.title, type: 'Service Component', icon: getIconForName(srv.title, ShoppingBag),
                description: srv.description || `Platform Service`,
                status: srv.status === 'ACTIVE' ? 'healthy' : 'degraded',
                latency: 'N/A', version: 'v1.0',
                resolvers: srv.modules?.map(m => ({
                    name: `Resolver Sync: ${m.name} ↔ Produtos Unificados`,
                    type: 'query' as const,
                    status: m.status === 'ACTIVE' ? 'active' : 'deprecated' as const
                })).filter(r => r.name.toLowerCase().includes('checkout') || r.name.toLowerCase().includes('cms') || r.name.toLowerCase().includes('produto')),
            } as StaticService
        } else if (nodeId.startsWith('module-')) {
            const parentSrv = services.find(s => s.modules?.some(m => `module-${m.id}` === nodeId))
            const mod = parentSrv?.modules?.find(m => `module-${m.id}` === nodeId)
            if (!mod) return null

            return {
                name: mod.name, type: 'Sub-serviço (Módulo)', icon: getIconForName(mod.name, Code),
                description: mod.description || `Module of ${parentSrv?.title}`,
                status: mod.status === 'ACTIVE' ? 'healthy' : 'degraded',
                latency: 'N/A', version: 'v1.0',
                resolvers: (mod.name.toLowerCase().includes('checkout') || mod.name.toLowerCase().includes('cms') || mod.name.toLowerCase().includes('produto')) ? [
                    { name: `Sincronização com Produtos Unificados`, type: 'mutation' as const, status: 'active' as const }
                ] : []
            } as StaticService
        } else if (nodeId === 'unified-products') {
            // Find resolvers (connections from modules to this hub)
            const activeResolvers = services.flatMap(s => s.modules || [])
                .filter(m => m.name.toLowerCase().includes('checkout') || m.name.toLowerCase().includes('cms') || m.name.toLowerCase().includes('produto'))
                .map(m => ({ name: `Sync from ${m.name}`, type: 'Service', status: 'active' }))

            return {
                name: 'Produtos Unificados',
                type: 'Resolver',
                icon: ShoppingBag,
                description: 'Unifica e gerencia exibição de produtos a partir de sub-serviços como CMS e Checkout.',
                status: 'healthy',
                latency: '15ms',
                version: 'v2.0',
                connectedSources: activeResolvers
            } as StaticService
        }
        return null // Removed hardcoded fallback to SERVICES since they were wiped except 'db'
    }).filter(Boolean) as StaticService[]

    // ---- Toolbar ----
    const toolbar = (
        <div className="bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm flex items-center gap-1">
            <Button variant={autoSync ? "secondary" : "ghost"} size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setAutoSync(!autoSync); if (!autoSync) setSelectedNodes([]) }}>
                <RefreshCw className={cn("mr-1 h-3 w-3", autoSync ? "text-green-500" : "text-muted-foreground")} /> Sync
            </Button>
            <Button variant={inspectorMode ? "default" : "ghost"} size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setInspectorMode(!inspectorMode) }}>
                <MousePointer2 className="mr-1 h-3 w-3" /> Inspector
            </Button>
        </div>
    )

    // ---- Render ----
    const inspectorOpen = selectedNodes.length > 0

    return (
        <TooltipProvider delayDuration={300}>
            <div className="h-full w-full relative flex overflow-hidden">
                {/* Force Graph Canvas */}
                <ForceGraphCanvas
                    nodes={graphNodes}
                    edges={graphEdges}
                    selectedNodeIds={selectedNodes}
                    hoveredNodeId={hoveredNode}
                    onNodeClick={(id, e) => handleNodeClick(id, e)}
                    onNodeHover={setHoveredNode}
                    onBackgroundClick={() => { if (inspectorMode) setSelectedNodes([]) }}
                    toolbar={toolbar}
                    className="flex-1 min-w-0"
                />

                {/* Inspector Sidebar */}
                <div className={cn(
                    "border-l bg-background transition-all duration-300 overflow-hidden flex flex-col h-full flex-shrink-0",
                    inspectorOpen ? "w-80" : "w-0 border-l-0"
                )}>
                    {inspectorOpen && (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Header */}
                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between flex-shrink-0">
                                <h3 className="font-bold text-sm">Inspector ({selectedNodes.length} selected)</h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNodes([])}>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {/* Service Cards */}
                            <ScrollArea className="flex-1 h-full">
                                <div className="flex flex-col gap-6 p-4 pb-20">
                                    {selectedServices.map((service, index) => (
                                        <div key={service.name + index} className="space-y-4 border-b pb-6 last:border-0">
                                            {/* Service Header */}
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                                    {service.icon ? <service.icon className="h-5 w-5" /> : <Box className="h-5 w-5" />}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-bold">{service.name}</h3>
                                                    <div className="flex items-center gap-1">
                                                        <p className="text-xs text-muted-foreground">{service.type}</p>
                                                        <Tooltip>
                                                            <TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/50 hover:text-primary cursor-help" /></TooltipTrigger>
                                                            <TooltipContent side="right" className="text-xs max-w-[200px] z-[110]">O papel arquitetural deste serviço no sistema.</TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                                                    <div className="flex gap-2 mt-2">
                                                        <Badge variant={service.status === 'healthy' ? 'default' : 'destructive'} className="text-[10px]">{service.status}</Badge>
                                                        <Badge variant="outline" className="text-[10px]">{service.version}</Badge>
                                                        <Badge variant="outline" className="flex gap-1 text-[10px]"><Activity className="h-3 w-3" /> {service.latency}</Badge>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Connected Sources */}
                                            {service.connectedSources && service.connectedSources.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                        <Database className="h-3 w-3" /> Fontes de Dados
                                                    </h4>
                                                    <div className="space-y-1">
                                                        {service.connectedSources.map((source, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs border-dashed">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 rounded-md bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                                        <Activity className="h-3 w-3" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{source.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground uppercase">{source.type}</span>
                                                                    </div>
                                                                </div>
                                                                <Badge variant="outline" className="text-[10px] h-5">Synced</Badge>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Resolvers / Operations */}
                                            <div>
                                                <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2 flex items-center gap-2">
                                                    <Code className="h-3 w-3" /> Operações
                                                </h4>
                                                {service.resolvers && service.resolvers.length > 0 ? (
                                                    <div className="space-y-1">
                                                        {service.resolvers.map((resolver, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-card text-xs">
                                                                <div className="flex items-center gap-2">
                                                                    <div className={cn("p-1 rounded-md",
                                                                        resolver.type === 'query' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                                            resolver.type === 'mutation' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                                                "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                                    )}>
                                                                        {resolver.type === 'query' ? <Search className="h-3 w-3" /> :
                                                                            resolver.type === 'mutation' ? <Zap className="h-3 w-3" /> :
                                                                                <Activity className="h-3 w-3" />}
                                                                    </div>
                                                                    <span>{resolver.name}</span>
                                                                </div>
                                                                <span className="text-muted-foreground">{resolver.latency || 'N/A'}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground italic">No public operations.</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    )
}
