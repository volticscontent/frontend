"use client"

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react"
import { LucideIcon, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// =========================================
// Public Types
// =========================================

export interface GraphNode {
    id: string
    label: string
    sub: string
    icon: LucideIcon
    color: string
    radius: number
    initialX: number
    initialY: number
    isModule?: boolean
}

export interface GraphEdge {
    id: string
    source: string
    target: string
    color: string
    dashed: boolean
}

interface ForceGraphCanvasProps {
    nodes: GraphNode[]
    edges: GraphEdge[]
    selectedNodeIds: string[]
    hoveredNodeId: string | null
    onNodeClick: (nodeId: string, e: React.MouseEvent) => void
    onNodeHover: (nodeId: string | null) => void
    onBackgroundClick: () => void
    toolbar?: React.ReactNode
    className?: string
}

// =========================================
// Physics Constants
// =========================================

const REPULSION = 5000
const SPRING_K = 0.008
const SPRING_LEN = 160
const GRAVITY = 0.008
const DAMPING = 0.62
const ALPHA_DECAY = 1
const ALPHA_REHEAT = 0.35
const ALPHA_DRAG = 0.12

// =========================================
// Physics Node
// =========================================

interface PNode {
    id: string
    x: number; y: number
    vx: number; vy: number
    fx: number | null; fy: number | null
    radius: number
}

// =========================================
// Component
// =========================================

export function ForceGraphCanvas({
    nodes, edges, selectedNodeIds, hoveredNodeId,
    onNodeClick, onNodeHover, onBackgroundClick, toolbar, className,
}: ForceGraphCanvasProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const pNodesRef = useRef<PNode[]>([])
    const edgesRef = useRef<GraphEdge[]>(edges)
    const alphaRef = useRef(1)
    const frameRef = useRef(0)
    const renderCounterRef = useRef(0)

    const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({})
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const [dragNodeId, setDragNodeId] = useState<string | null>(null)
    const dragClickRef = useRef<{ x: number; y: number } | null>(null)

    // Node lookup for rendering
    const nodeMap = useMemo(() => {
        const m: Record<string, GraphNode> = {}
        nodes.forEach(n => { m[n.id] = n })
        return m
    }, [nodes])

    // ---- Sync physics nodes with props ----
    useEffect(() => {
        const prev = pNodesRef.current
        const validIds = new Set(nodes.map(n => n.id))
        const next: PNode[] = nodes.map(n => {
            const existing = prev.find(p => p.id === n.id)
            if (existing) return { ...existing, radius: n.radius }
            return {
                id: n.id,
                x: n.initialX + (Math.random() - 0.5) * 30,
                y: n.initialY + (Math.random() - 0.5) * 30,
                vx: 0, vy: 0, fx: null, fy: null, radius: n.radius,
            }
        })
        pNodesRef.current = next
        edgesRef.current = edges
        if (prev.length !== next.length) alphaRef.current = Math.max(alphaRef.current, 0.5)
    }, [nodes, edges])

    // ---- Simulation loop ----
    useEffect(() => {
        let lastRender = 0
        const tick = () => {
            const pn = pNodesRef.current
            const pe = edgesRef.current
            const alpha = alphaRef.current
            if (pn.length === 0 || alpha < 0.001) {
                frameRef.current = requestAnimationFrame(tick)
                return
            }

            // Repulsion
            for (let i = 0; i < pn.length; i++) {
                for (let j = i + 1; j < pn.length; j++) {
                    const a = pn[i], b = pn[j]
                    const dx = b.x - a.x || 0.1
                    const dy = b.y - a.y || 0.1
                    const d2 = dx * dx + dy * dy
                    const d = Math.sqrt(d2)
                    const f = (REPULSION * alpha) / d2
                    const fx = (dx / d) * f, fy = (dy / d) * f
                    if (a.fx === null) { a.vx -= fx; a.vy -= fy }
                    if (b.fx === null) { b.vx += fx; b.vy += fy }
                }
            }

            // Springs
            for (const e of pe) {
                const s = pn.find(n => n.id === e.source)
                const t = pn.find(n => n.id === e.target)
                if (!s || !t) continue
                const dx = t.x - s.x, dy = t.y - s.y
                const d = Math.sqrt(dx * dx + dy * dy) || 1
                const f = SPRING_K * (d - SPRING_LEN) * alpha
                const fx = (dx / d) * f, fy = (dy / d) * f
                if (s.fx === null) { s.vx += fx; s.vy += fy }
                if (t.fx === null) { t.vx -= fx; t.vy -= fy }
            }

            // Gravity
            for (const n of pn) {
                if (n.fx === null) n.vx -= n.x * GRAVITY * alpha
                if (n.fy === null) n.vy -= n.y * GRAVITY * alpha
            }

            // Integrate
            for (const n of pn) {
                if (n.fx !== null) { n.x = n.fx; n.vx = 0 }
                else { n.vx *= DAMPING; n.x += n.vx }
                if (n.fy !== null) { n.y = n.fy; n.vy = 0 }
                else { n.vy *= DAMPING; n.y += n.vy }
            }

            alphaRef.current *= ALPHA_DECAY

            // Throttled render (~60fps)
            const now = performance.now()
            if (now - lastRender > 16) {
                lastRender = now
                const p: Record<string, { x: number; y: number }> = {}
                for (const n of pn) p[n.id] = { x: n.x, y: n.y }
                setPositions(p)
            }

            frameRef.current = requestAnimationFrame(tick)
        }
        frameRef.current = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frameRef.current)
    }, [])

    // ---- Coordinate conversion ----
    const screenToGraph = useCallback((sx: number, sy: number) => {
        const r = containerRef.current?.getBoundingClientRect()
        if (!r) return { x: 0, y: 0 }
        return {
            x: (sx - r.left - r.width / 2 - pan.x) / zoom,
            y: (sy - r.top - r.height / 2 - pan.y) / zoom,
        }
    }, [zoom, pan])

    // ---- Node drag ----
    const handleNodeMouseDown = useCallback((nodeId: string, e: React.MouseEvent) => {
        e.stopPropagation(); e.preventDefault()
        const node = pNodesRef.current.find(n => n.id === nodeId)
        if (node) { node.fx = node.x; node.fy = node.y; alphaRef.current = ALPHA_REHEAT }
        setDragNodeId(nodeId)
        dragClickRef.current = { x: e.clientX, y: e.clientY }
    }, [])

    useEffect(() => {
        if (!dragNodeId) return
        const onMove = (e: MouseEvent) => {
            const g = screenToGraph(e.clientX, e.clientY)
            const node = pNodesRef.current.find(n => n.id === dragNodeId)
            if (node) { node.fx = g.x; node.fy = g.y; alphaRef.current = Math.max(alphaRef.current, ALPHA_DRAG) }
        }
        const onUp = (e: MouseEvent) => {
            const node = pNodesRef.current.find(n => n.id === dragNodeId)
            if (node) { node.fx = null; node.fy = null; alphaRef.current = ALPHA_REHEAT }
            // Detect click vs drag
            const start = dragClickRef.current
            if (start && Math.abs(e.clientX - start.x) < 5 && Math.abs(e.clientY - start.y) < 5) {
                onNodeClick(dragNodeId, e as unknown as React.MouseEvent)
            }
            setDragNodeId(null); dragClickRef.current = null
        }
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [dragNodeId, screenToGraph, onNodeClick])

    // ---- Canvas pan ----
    const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
        const t = e.target as HTMLElement
        if (t.closest('.graph-node') || t.closest('button')) return
        setIsPanning(true)
    }, [])

    useEffect(() => {
        if (!isPanning) return
        const onMove = (e: MouseEvent) => setPan(p => ({ x: p.x + e.movementX, y: p.y + e.movementY }))
        const onUp = () => setIsPanning(false)
        window.addEventListener('mousemove', onMove)
        window.addEventListener('mouseup', onUp)
        return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    }, [isPanning])

    // ---- Zoom via wheel ----
    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const onWheel = (e: WheelEvent) => {
            e.preventDefault(); e.stopPropagation()
            if (e.ctrlKey || e.metaKey) {
                const s = e.deltaY > 0 ? 0.92 : 1.08
                setZoom(z => Math.min(Math.max(z * s, 0.3), 3))
            } else {
                setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }))
            }
        }
        el.addEventListener('wheel', onWheel, { passive: false })
        return () => el.removeEventListener('wheel', onWheel)
    }, [])

    // ---- Edge path calculation ----
    const edgePath = useCallback((srcId: string, tgtId: string) => {
        const s = positions[srcId], t = positions[tgtId]
        if (!s || !t) return ""
        const sn = nodeMap[srcId], tn = nodeMap[tgtId]
        const sr = sn?.radius || 20, tr = tn?.radius || 20
        const dx = t.x - s.x, dy = t.y - s.y
        const d = Math.sqrt(dx * dx + dy * dy) || 1
        // Points on circle boundaries
        const x1 = s.x + (dx / d) * sr, y1 = s.y + (dy / d) * sr
        const x2 = t.x - (dx / d) * tr, y2 = t.y - (dy / d) * tr
        // Slight cubic curve
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
        const perpX = -(y2 - y1) * 0.09, perpY = (x2 - x1) * 0.09
        return `M${x1},${y1} Q${mx + perpX},${my + perpY} ${x2},${y2}`
    }, [positions, nodeMap])

    // ---- Connected edges for highlighting ----
    const connectedEdgeIds = useMemo(() => {
        if (!hoveredNodeId && selectedNodeIds.length === 0) return new Set<string>()
        const ids = hoveredNodeId ? [hoveredNodeId] : selectedNodeIds
        const s = new Set<string>()
        edges.forEach(e => {
            if (ids.includes(e.source) || ids.includes(e.target)) s.add(e.id)
        })
        return s
    }, [hoveredNodeId, selectedNodeIds, edges])

    const reheat = useCallback(() => { alphaRef.current = 1 }, [])
    const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative w-full h-full overflow-hidden select-none",
                isPanning ? "cursor-grabbing" : dragNodeId ? "cursor-grabbing" : "cursor-grab",
                className
            )}
            style={{ background: "radial-gradient(circle at 50% 50%, hsl(var(--muted)/0.3) 0%, hsl(var(--background)) 70%)" }}
            onMouseDown={handleBgMouseDown}
            onClick={(e) => { if (!isPanning && !(e.target as HTMLElement).closest('.graph-node')) onBackgroundClick() }}
        >
            {/* Grid dots pattern */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15]">
                <defs>
                    <pattern id="force-grid" width="30" height="30" patternUnits="userSpaceOnUse"
                        patternTransform={`translate(${pan.x % 30},${pan.y % 30}) scale(${zoom})`}>
                        <circle cx="15" cy="15" r="1" fill="currentColor" className="text-muted-foreground" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#force-grid)" />
            </svg>

            {/* Toolbar */}
            <div className="absolute top-3 right-3 z-20 flex gap-2">
                <div className="bg-background/80 backdrop-blur-sm p-1 rounded-md border shadow-sm flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.max(z * 0.9, 0.3))}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>
                    <span className="text-xs w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(z => Math.min(z * 1.1, 3))}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>
                    <div className="w-px h-4 bg-border mx-0.5" />
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={resetView}>
                        <Maximize className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reheat} title="Re-organizar">
                        <RotateCcw className="h-4 w-4" />
                    </Button>
                </div>
                {toolbar}
            </div>

            {/* Transform container */}
            <div
                className="absolute inset-0"
                style={{
                    transform: `translate(${(containerRef.current?.clientWidth || 800) / 2 + pan.x}px, ${(containerRef.current?.clientHeight || 400) / 2 + pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* SVG edges */}
                <svg
                    className="absolute pointer-events-none"
                    style={{ left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible' }}
                >
                    <defs>
                        <marker id="fg-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                            <polygon points="0 0, 8 3, 0 6" fill="currentColor" />
                        </marker>
                    </defs>
                    {edges.map(edge => {
                        const path = edgePath(edge.source, edge.target)
                        if (!path) return null
                        const isHighlighted = connectedEdgeIds.has(edge.id)
                        const hasActiveSelection = hoveredNodeId || selectedNodeIds.length > 0
                        return (
                            <g key={edge.id}>
                                {/* Glow behind */}
                                {isHighlighted && (
                                    <path
                                        d={path} fill="none" stroke={edge.color}
                                        strokeWidth={4} strokeOpacity={0.2}
                                        strokeDasharray={edge.dashed ? "6 4" : undefined}
                                    />
                                )}
                                <path
                                    d={path} fill="none" stroke={edge.color}
                                    strokeWidth={isHighlighted ? 2.5 : 1.5}
                                    strokeOpacity={hasActiveSelection ? (isHighlighted ? 1 : 0.12) : 0.5}
                                    strokeDasharray={edge.dashed ? "6 4" : undefined}
                                    markerEnd="url(#fg-arrow)"
                                    className={isHighlighted ? "force-edge-animated" : ""}
                                    style={{ transition: "stroke-opacity 0.3s, stroke-width 0.3s" }}
                                />
                            </g>
                        )
                    })}
                </svg>

                {/* HTML Nodes */}
                {nodes.map(n => {
                    const pos = positions[n.id]
                    if (!pos) return null
                    const Icon = n.icon
                    const isSelected = selectedNodeIds.includes(n.id)
                    const isHovered = hoveredNodeId === n.id
                    const hasActive = hoveredNodeId || selectedNodeIds.length > 0
                    const isRelated = connectedEdgeIds.size > 0 && edges.some(e =>
                        connectedEdgeIds.has(e.id) && (e.source === n.id || e.target === n.id)
                    )
                    const dimmed = hasActive && !isSelected && !isHovered && !isRelated

                    return (
                        <div
                            key={n.id}
                            className="graph-node absolute"
                            style={{
                                left: pos.x, top: pos.y,
                                transform: `translate(-50%, -50%) scale(${isSelected ? 1.15 : isHovered ? 1.08 : 1})`,
                                zIndex: isSelected ? 30 : isHovered ? 25 : 10,
                                transition: dragNodeId === n.id ? 'none' : 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                                opacity: dimmed ? 0.25 : 1,
                                filter: dimmed ? 'grayscale(0.5)' : 'none',
                            }}
                            onMouseDown={(e) => handleNodeMouseDown(n.id, e)}
                            onMouseEnter={() => onNodeHover(n.id)}
                            onMouseLeave={() => onNodeHover(null)}
                        >
                            <div
                                className="relative rounded-full flex items-center justify-center shadow-lg border"
                                style={{
                                    width: n.radius * 2, height: n.radius * 2,
                                    background: `linear-gradient(135deg, ${n.color}, ${n.color}cc)`,
                                    borderColor: isSelected ? 'white' : `${n.color}60`,
                                    cursor: dragNodeId === n.id ? 'grabbing' : 'grab',
                                }}
                            >
                                <Icon className={cn("drop-shadow", n.isModule ? "text-slate-900" : "text-white")} style={{ width: n.radius * 0.7, height: n.radius * 0.7 }} />
                            </div>
                            {/* Label */}
                            <div
                                className="absolute left-1/2 -translate-x-1/2 text-center whitespace-nowrap pointer-events-none"
                                style={{ top: n.radius + 6 }}
                            >
                                <div className={cn("text-[12px] mt-5 font-semibold leading-tight", dimmed ? "text-muted-foreground/50" : "text-foreground")}>
                                    {n.label}
                                </div>
                                <div className={cn("text-[9px] leading-tight", dimmed ? "text-muted-foreground/30" : "text-muted-foreground")}>
                                    {n.sub}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* CSS for edge animation */}
            <style jsx global>{`
        @keyframes force-dash-flow {
          to { stroke-dashoffset: -20px; }
        }
        .force-edge-animated {
          animation: force-dash-flow 0.8s linear infinite;
        }
      `}</style>
        </div>
    )
}
