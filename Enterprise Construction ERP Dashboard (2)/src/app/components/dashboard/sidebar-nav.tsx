import { useState } from "react"
import {
  LayoutDashboard,
  Factory,
  Fuel,
  Users,
  Wrench,
  DollarSign,
  BarChart3,
  TrendingUp,
  Target,
  Truck,
  Clock,
  FileText,
  Package,
  MapPin,
  UserCheck,
  UsersRound,
  Settings,
  ChevronRight,
  ShoppingCart,
  Banknote,
  Landmark,
} from "lucide-react"
import { cn } from "../../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { useAuth, UserRole } from "../../contexts/AuthContext"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Factory, label: "Production Report", id: "production" },
  { icon: Fuel, label: "Consumption Report", id: "consumption" },
  { icon: Users, label: "Man Work Hour Report", id: "work-hour" },
  { icon: Wrench, label: "Maintenance Report", id: "maintenance" },
  { icon: DollarSign, label: "Expense Report", id: "expense" },
  { icon: BarChart3, label: "Business Analytics", id: "analytics" },
  { icon: TrendingUp, label: "Efficiency Report", id: "efficiency" },
  { icon: Target, label: "Monthly Target Achievement", id: "target" },
  { icon: Truck, label: "Vehicle Incoming/Outgoing", id: "vehicle-io" },
  { icon: Clock, label: "Vehicle Time Motion Study", id: "time-motion" },
  { icon: FileText, label: "Challan Management", id: "challan" },
  { icon: Package, label: "Inventory & Materials", id: "inventory" },
  { icon: ShoppingCart, label: "Purchase Orders", id: "purchase-order" },
  { icon: Banknote, label: "Payroll", id: "payroll" },
  { icon: Landmark, label: "Accounts & Finance", id: "accounts" },
  { icon: MapPin, label: "Site Management", id: "site" },
  { icon: UserCheck, label: "Employee Management", id: "employee" },
  { icon: UsersRound, label: "Vendor Management", id: "vendor" },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface SidebarNavProps {
  activeModule: string
  onModuleChange: (moduleId: string) => void
}

const rolePermissions: Record<UserRole, string[]> = {
  "Viewer": ["dashboard", "production", "efficiency"],
  "Operator": ["dashboard", "production", "efficiency", "consumption", "work-hour", "vehicle-io"],
  "Site Manager": ["dashboard", "production", "efficiency", "consumption", "work-hour", "vehicle-io", "site", "employee", "maintenance"],
  "Finance": ["dashboard", "production", "efficiency", "expense", "analytics", "vendor", "challan", "purchase-order", "payroll", "accounts"],
  "Admin": ["dashboard", "production", "consumption", "work-hour", "maintenance", "expense", "analytics", "efficiency", "target", "vehicle-io", "time-motion", "challan", "inventory", "purchase-order", "payroll", "accounts", "site", "employee", "vendor", "settings"]
}

export function SidebarNav({ activeModule, onModuleChange }: SidebarNavProps) {
  const { user } = useAuth()

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false
    return rolePermissions[user.role]?.includes(item.id)
  })

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-sidebar">
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-3">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeModule === item.id

            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 text-xs h-10",
                  isActive && "bg-sidebar-accent text-sidebar-accent-foreground"
                )}
                onClick={() => onModuleChange(item.id)}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
              </Button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="border-t p-4">
        <div className="rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 p-4 text-white">
          <p className="text-xs mb-2">Need Help?</p>
          <p className="text-xs mb-3 opacity-90">Contact support team</p>
          <Button size="sm" variant="secondary" className="w-full text-xs h-8">
            Get Support
          </Button>
        </div>
      </div>
    </aside>
  )
}
