
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { DashboardWidget, WidgetSize } from "./types"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { GripHorizontal, Settings2 } from "lucide-react"

interface SortableWidgetProps {
  id: string
  widget: DashboardWidget
  children: ReactNode
  onEdit?: (id: string) => void
}

export function SortableWidget({ id, widget, children, onEdit }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 1,
  }

  const getColSpan = (size: WidgetSize) => {
    switch (size) {
      case 'quarter': return 'col-span-1'
      case 'half': return 'col-span-1 md:col-span-2'
      case 'full': return 'col-span-1 md:col-span-2 lg:col-span-4'
      case 'third': return 'col-span-1 md:col-span-2 lg:col-span-3'
      default: return 'col-span-1'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(getColSpan(widget.size), "relative group touch-none")}
    >
      {/* Drag Handle - Visible on hover */}
      <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
            <div 
                onClick={(e) => {
                    e.stopPropagation() // Prevent drag start
                    onEdit(id)
                }}
                className={cn(
                    "p-1.5 rounded-md cursor-pointer",
                    "text-muted-foreground/50 hover:text-foreground hover:bg-muted"
                )}
            >
                <Settings2 className="h-4 w-4" />
            </div>
        )}
        <div 
            ref={setActivatorNodeRef}
            {...attributes}
            {...listeners}
            className={cn(
                "p-1.5 rounded-md cursor-grab active:cursor-grabbing",
                "text-muted-foreground/50 hover:text-foreground hover:bg-muted",
                isDragging && "opacity-100 cursor-grabbing"
            )}
        >
            <GripHorizontal className="h-4 w-4" />
        </div>
      </div>

      {/* Visual cue for dragging */}
      <div className={cn(
        "absolute inset-0 rounded-lg ring-2 ring-primary/0 transition-all pointer-events-none z-10",
        isDragging && "ring-primary/50 bg-primary/5"
      )} />
      
      {children}
    </div>
  )
}
