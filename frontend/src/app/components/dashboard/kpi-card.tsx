import { Card, CardContent } from "../ui/card"
import { cn } from "../../../lib/utils"
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  subtitle?: string
  colorClass?: string
  onClick?: () => void
}

export function KPICard({ title, value, icon: Icon, trend, subtitle, colorClass, onClick }: KPICardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200",
        onClick ? "cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700" : "hover:shadow-lg"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <h3 className="text-2xl mb-1">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 text-green-600" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600" />
                )}
                <span
                  className={cn(
                    "text-xs",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-xs text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-lg",
            colorClass || "bg-blue-100 dark:bg-blue-900/30"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              colorClass?.includes("blue") ? "text-blue-600 dark:text-blue-400" :
              colorClass?.includes("orange") ? "text-orange-600 dark:text-orange-400" :
              colorClass?.includes("green") ? "text-green-600 dark:text-green-400" :
              colorClass?.includes("red") ? "text-red-600 dark:text-red-400" :
              "text-blue-600 dark:text-blue-400"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
