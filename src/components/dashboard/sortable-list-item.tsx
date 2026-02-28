
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { GripVertical } from "lucide-react"

interface SortableListItemProps {
  id: string
  children: ReactNode
}

export function SortableListItem({ id, children }: SortableListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative group bg-card border rounded-lg shadow-sm transition-all", isDragging && "shadow-lg scale-[1.02]")}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="absolute left-2 top-4 p-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground z-10"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="pl-8">
        {children}
      </div>
    </div>
  )
}
