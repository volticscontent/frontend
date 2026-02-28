"use client"

import { useState, useEffect } from "react"
import { 
  Activity, 
  Database, 
  Globe, 
  Server, 
  Shield, 
  Zap,
  AlertCircle,
  MousePointer2,
  Users,
  CreditCard,
  Code,
  Search,
  ArrowRight,
  X,
  CheckCircle2
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

// Mock Data for Services and Resolvers
const SERVICES = {
  client: {
    id: "client",
    name: "Client App",
    type: "Frontend",
    icon: Globe,
    description: "Next.js Frontend Application",
    status: "healthy",
    latency: "45ms",
    version: "v2.4.0",
    resolvers: []
  },
  gateway: {
    id: "gateway",
    name: "API Gateway",
    type: "Middleware",
    icon: Server,
    description: "Centralized API Gateway & Routing",
    status: "healthy",
    latency: "12ms",
    version: "v1.2.0",
    resolvers: [
      { name: "routeRequest", type: "internal", status: "active", latency: "5ms" },
      { name: "rateLimit", type: "middleware", status: "active", latency: "2ms" },
      { name: "authCheck", type: "middleware", status: "active", latency: "8ms" }
    ]
  },
  auth: {
    id: "auth",
    name: "Auth Service",
    type: "Service",
    icon: Shield,
    description: "Authentication & Authorization",
    status: "healthy",
    latency: "25ms",
    version: "v3.1.0",
    resolvers: [
      { name: "login", type: "mutation", status: "active", latency: "120ms" },
      { name: "register", type: "mutation", status: "active", latency: "150ms" },
      { name: "verifyToken", type: "query", status: "active", latency: "10ms" },
      { name: "refreshToken", type: "mutation", status: "active", latency: "45ms" }
    ]
  },
  crm: {
    id: "crm",
    name: "CRM Service",
    type: "Service",
    icon: Users,
    description: "Customer Relationship Management",
    status: "warning",
    latency: "85ms",
    version: "v2.0.1",
    resolvers: [
      { name: "getContacts", type: "query", status: "active", latency: "60ms" },
      { name: "createContact", type: "mutation", status: "active", latency: "90ms" },
      { name: "updateDeal", type: "mutation", status: "degraded", latency: "200ms" },
      { name: "getPipeline", type: "query", status: "active", latency: "55ms" }
    ]
  },
  billing: {
    id: "billing",
    name: "Billing Service",
    type: "Service",
    icon: CreditCard,
    description: "Invoicing & Payments",
    status: "healthy",
    latency: "30ms",
    version: "v1.5.0",
    resolvers: [
      { name: "getInvoices", type: "query", status: "active", latency: "40ms" },
      { name: "createSubscription", type: "mutation", status: "active", latency: "110ms" },
      { name: "processWebhook", type: "webhook", status: "active", latency: "20ms" }
    ]
  },
  db: {
    id: "db",
    name: "Unified DB",
    type: "Database",
    icon: Database,
    description: "PostgreSQL Primary Database",
    status: "healthy",
    latency: "5ms",
    version: "PG 15.4",
    resolvers: []
  }
} as const

export default function DeveloperPage() {
  const [inspectorMode, setInspectorMode] = useState(false)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [logs, setLogs] = useState<{timestamp: string, level: string, message: string, service: string}[]>([])

  // Simulate real-time logs
  useEffect(() => {
    const interval = setInterval(() => {
      const services = ['auth', 'crm', 'billing', 'gateway']
      const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG']
      const messages = [
        'Processing request for /api/v1/data',
        'Database connection pool updated',
        'Cache hit for user_profile_123',
        'Rate limit check passed',
        'Webhook received from Stripe',
        'Token validation successful'
      ]
      
      const newLog = {
        timestamp: new Date().toISOString().split('T')[1].split('.')[0],
        level: levels[Math.floor(Math.random() * levels.length)],
        message: messages[Math.floor(Math.random() * messages.length)],
        service: services[Math.floor(Math.random() * services.length)]
      }
      
      setLogs(prev => [newLog, ...prev].slice(0, 50))
    }, 2500)
    
    return () => clearInterval(interval)
  }, [])

  const handleNodeClick = (nodeId: string) => {
    if (inspectorMode) {
      setSelectedNode(nodeId === selectedNode ? null : nodeId)
    }
  }

  const getServiceDetails = (id: string | null) => {
    if (!id) return null
    return SERVICES[id as keyof typeof SERVICES]
  }

  const selectedService = getServiceDetails(selectedNode)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Developer Console</h2>
          <p className="text-muted-foreground">
            Monitoramento em tempo real, logs e ferramentas de inspeção do sistema.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant={inspectorMode ? "default" : "outline"} onClick={() => setInspectorMode(!inspectorMode)}>
            <MousePointer2 className="mr-2 h-4 w-4" />
            {inspectorMode ? "Inspector Mode: ON" : "Enable Inspector"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connections" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="connections">Connections</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24,389</div>
                <p className="text-xs text-muted-foreground">+20.1% from last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45ms</div>
                <p className="text-xs text-muted-foreground">-2ms from last hour</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Services</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">All systems operational</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0.04%</div>
                <p className="text-xs text-muted-foreground">Within acceptable limits</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="connections" className="h-[calc(100vh-250px)]">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Main Diagram Area */}
            <Card className={cn("col-span-12 h-full relative overflow-hidden transition-all duration-300", selectedNode ? "col-span-8" : "col-span-12")}>
              <CardHeader className="absolute top-0 left-0 z-20 bg-background/80 backdrop-blur-sm w-full border-b px-6 py-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle>System Architecture</CardTitle>
                    <CardDescription>
                        Interactive dependency graph. 
                        {inspectorMode ? <span className="text-primary font-medium ml-1">Select a node to inspect resolvers.</span> : "Enable Inspector Mode to view details."}
                    </CardDescription>
                </div>
                {inspectorMode && (
                    <Badge variant="secondary" className="animate-pulse">
                        Inspector Active
                    </Badge>
                )}
              </CardHeader>
              
              <CardContent className="h-full w-full relative pt-20 overflow-auto bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-center">
                <div className="w-[800px] h-[600px] relative">
                  {/* SVG Connections Layer */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <defs>
                      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                        <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
                      </marker>
                      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                    </defs>
                    
                    {/* Paths */}
                    {/* Client -> Gateway */}
                    <path 
                        d="M400,100 L400,180" 
                        stroke={selectedNode === 'client' || selectedNode === 'gateway' ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={selectedNode === 'client' || selectedNode === 'gateway' ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />
                    
                    {/* Gateway -> Services */}
                    {/* Central Stem */}
                    <path 
                        d="M400,260 L400,300" 
                        stroke={['gateway', 'auth', 'crm', 'billing'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['gateway', 'auth', 'crm', 'billing'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        className="transition-all duration-300"
                    />
                    
                    {/* Branch to Auth (Left) */}
                    <path 
                        d="M400,300 L200,300 L200,340" 
                        stroke={['gateway', 'auth'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['gateway', 'auth'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />
                    
                    {/* Branch to CRM (Center) */}
                    <path 
                        d="M400,300 L400,340" 
                        stroke={['gateway', 'crm'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['gateway', 'crm'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />
                    
                    {/* Branch to Billing (Right) */}
                    <path 
                        d="M400,300 L600,300 L600,340" 
                        stroke={['gateway', 'billing'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['gateway', 'billing'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />

                    {/* Services -> DB */}
                    {/* Auth -> DB */}
                    <path 
                        d="M200,420 L200,460 L400,460 L400,500" 
                        stroke={['auth', 'db'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['auth', 'db'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />
                    
                    {/* CRM -> DB */}
                    <path 
                        d="M400,420 L400,500" 
                        stroke={['crm', 'db'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['crm', 'db'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        markerEnd="url(#arrowhead)" 
                        className="transition-all duration-300"
                    />
                    
                    {/* Billing -> DB */}
                    <path 
                        d="M600,420 L600,460 L400,460" 
                        stroke={['billing', 'db'].includes(selectedNode || '') ? "#3b82f6" : "#cbd5e1"} 
                        strokeWidth={['billing', 'db'].includes(selectedNode || '') ? "3" : "2"}
                        fill="none" 
                        className="transition-all duration-300"
                    />
                  </svg>

                  {/* Nodes */}
                  
                  {/* Client App */}
                  <div className="absolute top-[40px] left-1/2 -translate-x-1/2 z-10">
                    <Node 
                        id="client" 
                        icon={Globe} 
                        label="Client App" 
                        sub="Frontend" 
                        onClick={() => handleNodeClick('client')} 
                        selected={selectedNode === 'client'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                  {/* Gateway */}
                  <div className="absolute top-[180px] left-1/2 -translate-x-1/2 z-10">
                    <Node 
                        id="gateway" 
                        icon={Server} 
                        label="API Gateway" 
                        sub="Router" 
                        onClick={() => handleNodeClick('gateway')} 
                        selected={selectedNode === 'gateway'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                  {/* Auth Service */}
                  <div className="absolute top-[340px] left-[200px] -translate-x-1/2 z-10">
                    <Node 
                        id="auth" 
                        icon={Shield} 
                        label="Auth Service" 
                        sub="Security" 
                        onClick={() => handleNodeClick('auth')} 
                        selected={selectedNode === 'auth'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                  {/* CRM Service */}
                  <div className="absolute top-[340px] left-[400px] -translate-x-1/2 z-10">
                    <Node 
                        id="crm" 
                        icon={Users} 
                        label="CRM Service" 
                        sub="Core" 
                        onClick={() => handleNodeClick('crm')} 
                        selected={selectedNode === 'crm'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                  {/* Billing Service */}
                  <div className="absolute top-[340px] left-[600px] -translate-x-1/2 z-10">
                    <Node 
                        id="billing" 
                        icon={CreditCard} 
                        label="Billing Service" 
                        sub="Payments" 
                        onClick={() => handleNodeClick('billing')} 
                        selected={selectedNode === 'billing'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                  {/* Database */}
                  <div className="absolute top-[500px] left-1/2 -translate-x-1/2 z-10">
                    <Node 
                        id="db" 
                        icon={Database} 
                        label="Unified DB" 
                        sub="PostgreSQL" 
                        onClick={() => handleNodeClick('db')} 
                        selected={selectedNode === 'db'}
                        inspectorMode={inspectorMode}
                    />
                  </div>

                </div>
              </CardContent>
            </Card>

            {/* Inspector Panel - Slide in */}
            {selectedNode && (
                <Card className="col-span-4 h-full flex flex-col animate-in slide-in-from-right-10 duration-300 border-l shadow-xl">
                    <CardHeader className="pb-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-xl flex items-center gap-2">
                                {selectedService?.icon && <selectedService.icon className="h-5 w-5 text-primary" />}
                                {selectedService?.name}
                            </CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => setSelectedNode(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardDescription>{selectedService?.description}</CardDescription>
                        <div className="flex gap-2 mt-2">
                            <Badge variant={selectedService?.status === 'healthy' ? 'default' : 'destructive'}>
                                {selectedService?.status}
                            </Badge>
                            <Badge variant="outline">{selectedService?.version}</Badge>
                            <Badge variant="outline" className="flex gap-1">
                                <Activity className="h-3 w-3" /> {selectedService?.latency}
                            </Badge>
                        </div>
                    </CardHeader>
                    <Separator />
                    <ScrollArea className="flex-1">
                        <div className="p-4 space-y-6">
                            {/* Resolvers Section */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <Code className="h-4 w-4" /> Active Resolvers
                                </h4>
                                {selectedService?.resolvers && selectedService.resolvers.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedService.resolvers.map((resolver, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-2 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-1.5 rounded-md",
                                                        resolver.type === 'query' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                                        resolver.type === 'mutation' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" :
                                                        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
                                                    )}>
                                                        {resolver.type === 'query' ? <Search className="h-3 w-3" /> : 
                                                         resolver.type === 'mutation' ? <Zap className="h-3 w-3" /> : 
                                                         <Activity className="h-3 w-3" />}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{resolver.name}</div>
                                                        <div className="text-xs text-muted-foreground capitalize">{resolver.type}</div>
                                                    </div>
                                                </div>
                                                <div className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                                                    {resolver.latency || 'N/A'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-muted-foreground italic p-4 text-center border border-dashed rounded-lg">
                                        No public resolvers exposed.
                                    </div>
                                )}
                            </div>

                            {/* Connection Details */}
                            <div>
                                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                    <ArrowRight className="h-4 w-4" /> Downstream Dependencies
                                </h4>
                                <div className="space-y-2">
                                    {selectedNode === 'gateway' && (
                                        <>
                                            <DependencyItem name="Auth Service" status="healthy" />
                                            <DependencyItem name="CRM Service" status="warning" />
                                            <DependencyItem name="Billing Service" status="healthy" />
                                        </>
                                    )}
                                    {['auth', 'crm', 'billing'].includes(selectedNode || '') && (
                                        <DependencyItem name="Unified DB" status="healthy" />
                                    )}
                                    {selectedNode === 'client' && (
                                        <DependencyItem name="API Gateway" status="healthy" />
                                    )}
                                    {selectedNode === 'db' && (
                                        <div className="text-sm text-muted-foreground">No downstream dependencies.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ScrollArea>
                </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>System Logs</CardTitle>
              <CardDescription>Real-time stream of system events and errors.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="space-y-2">
                  {logs.map((log, i) => (
                    <div key={i} className="flex items-start space-x-2 text-sm border-b pb-2 last:border-0 last:pb-0 font-mono">
                      <span className="text-muted-foreground w-20 shrink-0">{log.timestamp}</span>
                      <Badge variant={log.level === 'ERROR' ? 'destructive' : log.level === 'WARN' ? 'secondary' : 'outline'} className="w-16 justify-center shrink-0">
                        {log.level}
                      </Badge>
                      <span className="text-blue-500 font-semibold w-24 shrink-0">[{log.service}]</span>
                      <span className="break-all">{log.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface NodeProps {
    id: string
    icon: React.ElementType
    label: string
    sub: string
    onClick: () => void
    selected: boolean
    inspectorMode: boolean
}

function Node({ icon: Icon, label, sub, onClick, selected, inspectorMode }: NodeProps) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "p-4 bg-card border-2 rounded-xl shadow-lg flex items-center gap-3 transition-all duration-200 w-48",
                inspectorMode ? "cursor-pointer hover:scale-105 hover:border-primary hover:shadow-primary/20" : "cursor-default",
                selected ? "border-primary ring-2 ring-primary/20 scale-105" : "border-border"
            )}
        >
            <div className={cn(
                "p-2 rounded-lg transition-colors",
                selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <h3 className="font-bold text-sm leading-none">{label}</h3>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
            </div>
            {selected && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 shadow-sm">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
            )}
        </div>
    )
}

function DependencyItem({ name, status }: { name: string, status: string }) {
    return (
        <div className="flex items-center justify-between p-2 rounded-md border bg-muted/30">
            <span className="text-sm font-medium">{name}</span>
            <Badge variant={status === 'healthy' ? 'outline' : 'destructive'} className="text-[10px] h-5">
                {status}
            </Badge>
        </div>
    )
}
