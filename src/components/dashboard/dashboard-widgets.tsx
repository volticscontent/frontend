
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, BarChart3, Calendar as CalendarIcon, Layers, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DashboardWidget, ChartType } from "./types"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// --- Generic Props Interfaces ---

export interface MetricData {
  value: string | number
  label?: string
  trend?: string
  trendDirection?: 'up' | 'down' | 'neutral'
  footer?: string
  link?: { href: string, label: string }
}

export interface ListData {
  items: {
    id: string | number
    title: string
    subtitle?: string
    value?: string | number
    date?: string
  }[]
}

export interface ChartData {
  data: { name: string; value: number }[]
  type: ChartType
}

export interface CarouselData {
  slides: {
    title: string
    content: string
  }[]
}

export interface CalendarData {
  events: {
    date: Date
    title: string
    type?: 'meeting' | 'deadline' | 'other'
  }[]
}

export interface GenericWidgetProps {
  widget: DashboardWidget
  data: MetricData | ListData | ChartData | CarouselData | CalendarData | null
  loading?: boolean
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// --- 1. Metric Widget ---
// Shows a single key value, optional trend, and footer action.
export function MetricWidget({ widget, data, loading }: GenericWidgetProps) {
  const metric = data as MetricData
  
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-20 bg-muted animate-pulse rounded" />
        ) : (
          <>
            <div className="text-2xl font-bold">{metric?.value || 0}</div>
            <p className="text-xs text-muted-foreground">
              {widget.config.description || metric?.label || ''}
            </p>
            {metric?.link && (
                <div className="mt-4">
                    <Button variant="outline" size="sm" asChild className="w-full">
                        <Link href={metric.link.href}>{metric.link.label}</Link>
                    </Button>
                </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

// --- 2. Chart Widget ---
// Shows a chart (Pie or Bar) based on config.
export function ChartWidget({ widget, data }: GenericWidgetProps) {
  const chartData = (data as ChartData)?.data || []
  const chartType = widget.config.chartType || (data as ChartData)?.type || 'bar'

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )
      case 'line':
        return (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} dot={false} />
          </LineChart>
        )
      case 'area':
        return (
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          </AreaChart>
        )
      case 'bar':
      default:
        return (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        )
    }
  }

  return (
    <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </CardContent>
    </Card>
  )
}

// --- 3. List Widget ---
// Shows a list of items with title, subtitle, value/date.
export function ListWidget({ widget, data, loading }: GenericWidgetProps) {
  const listData = (data as ListData)?.items || []

  return (
      <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? (
                  <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                           <div key={i} className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                              <div className="space-y-2 flex-1">
                                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                                  <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
                              </div>
                           </div>
                      ))}
                  </div>
              ) : (
                <div className="space-y-4">
                    {listData.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum item para exibir.</p>
                    ) : (
                        listData.map((item, i) => (
                            <div key={i} className="flex items-center border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">{item.title}</p>
                                    {item.subtitle && (
                                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                                    )}
                                </div>
                                <div className="ml-auto text-right">
                                    {item.value && <div className="font-medium text-sm">{item.value}</div>}
                                    {item.date && <div className="text-xs text-muted-foreground">{item.date}</div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
              )}
          </CardContent>
      </Card>
  )
}

// --- 4. Carousel Widget ---
// Shows generic content in slides.
export function CarouselWidget({ widget, data }: GenericWidgetProps) {
  const items = (data as CarouselData)?.slides || [
    { title: "Bem-vindo", content: "Configure este widget para exibir informações." }
  ]

  return (
      <Card className="h-full">
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-4">
              <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                  <div className="flex w-max space-x-4 p-4">
                      {items.map((item, i) => (
                          <div key={i} className="shrink-0 w-[150px] md:w-[200px] p-4 rounded-lg bg-muted/50 border">
                              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                              <p className="text-xs text-muted-foreground text-wrap">{item.content}</p>
                          </div>
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
              </ScrollArea>
          </CardContent>
      </Card>
  )
}

// --- 5. Calendar Widget ---
// Shows generic events in a monthly view.
export function CalendarWidget({ widget, data }: GenericWidgetProps) {
  const events = (data as CalendarData)?.events || []
  const today = new Date()
  const currentMonth = today.toLocaleString('pt-BR', { month: 'long' })
  const days = Array.from({length: 30}, (_, i) => i + 1)

  const hasEvent = (day: number) => {
    // Simple check (assuming current month/year for simplicity in this placeholder)
    return events.some(e => e.date.getDate() === day)
  }

  return (
       <Card className="h-full flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex-1">
              <div className="text-center mb-4 font-semibold capitalize">{currentMonth}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {['D','S','T','Q','Q','S','S'].map(d => (
                      <div key={d} className="text-muted-foreground font-medium py-1">{d}</div>
                  ))}
                  {days.map(d => {
                      const isToday = d === today.getDate()
                      const event = hasEvent(d)
                      return (
                        <div key={d} className={`py-1 rounded-md ${isToday ? 'bg-primary text-primary-foreground' : event ? 'bg-muted font-bold' : 'hover:bg-muted'}`}>
                            {d}
                        </div>
                      )
                  })}
              </div>
              <div className="mt-4 space-y-2">
                   <p className="text-xs font-medium text-muted-foreground">Próximos eventos:</p>
                   {events.length > 0 ? (
                       events.slice(0, 3).map((e, i) => (
                           <div key={i} className="text-xs border-l-2 border-primary pl-2">
                               <span className="font-bold">{e.date.getDate()}/{e.date.getMonth() + 1}:</span> {e.title}
                           </div>
                       ))
                   ) : (
                       <div className="text-xs text-muted-foreground">Nenhum evento próximo.</div>
                   )}
              </div>
          </CardContent>
      </Card>
  )
}
