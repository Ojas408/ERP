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
  Briefcase,
  HardHat,
  Trash2,
  Recycle,
} from "lucide-react"
import { cn } from "../../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import { useAuth, UserRole } from "../../contexts/AuthContext"

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
  { icon: Briefcase, label: "Projects", id: "projects" },
  { icon: Users, label: "Workers", id: "workers" },
  { icon: HardHat, label: "Equipment", id: "equipment" },
  { icon: Factory, label: "Production Report", id: "production" },
  { icon: Fuel, label: "Consumption Report", id: "consumption" },
  { icon: Database, label: "Grade of RMC", id: "rmc-grade" },
  { icon: Users, label: "Man Work Hour Report", id: "work-hour" },
  { icon: Wrench, label: "Maintenance Report", id: "maintenance" },
  { icon: DollarSign, label: "Expense Report", id: "expense" },
  { icon: TrendingUp, label: "Efficiency Report", id: "efficiency" },
  { icon: Target, label: "Monthly Target Achievement", id: "target" },
  { icon: Truck, label: "Vehicle Incoming/Outgoing", id: "vehicle-io" },
  { icon: Clock, label: "Vehicle Time Motion Study", id: "time-motion" },
  { icon: FileText, label: "Challan Management", id: "challan" },
  { icon: Package, label: "Inventory & Materials", id: "inventory" },
  { icon: Package, label: "Material Inward", id: "material-inward" },
  { icon: Recycle, label: "Scrap Management", id: "scrap-management" },
  { icon: ShoppingCart, label: "Purchase Orders", id: "purchase-order" },
  { icon: BarChart3, label: "Monthly Overheads Report", id: "overhead-report" },
  { icon: MapPin, label: "Site Management", id: "site" },
  { icon: UserCheck, label: "Employee Management", id: "employee" },
  { icon: UsersRound, label: "Vendor Management", id: "vendor" },
  { icon: Settings, label: "Settings", id: "settings" },
]

interface SidebarNavProps {
  activeModule: string
  onModuleChange: (moduleId: string) => void
  mobile?: boolean
}

const allModules = menuItems.map(m => m.id);

const rolePermissions: Record<UserRole, string[]> = {
  "Super Admin": allModules,
  "Admin": allModules.filter(m => m !== "settings"),
  "HR": ["dashboard", "workers", "employee", "work-hour"],
  "Accounts": ["dashboard", "projects", "workers", "equipment", "expense", "purchase-order", "vendor", "challan", "overhead-report", "material-inward", "scrap-management"],
  "Purchase": ["dashboard", "projects", "equipment", "vendor", "purchase-order", "inventory", "challan", "material-inward", "scrap-management", "rmc-grade"],
  "Site Engineer": ["dashboard", "projects", "workers", "equipment", "production", "consumption", "site", "inventory", "challan", "vehicle-io", "maintenance", "material-inward", "scrap-management", "rmc-grade"],
  "Manager": ["dashboard", "projects", "workers", "equipment", "efficiency", "target", "time-motion", "production", "expense", "overhead-report"],
  "Viewer": ["dashboard", "projects", "production", "efficiency"]
}

export function SidebarNav({ activeModule, onModuleChange, mobile }: SidebarNavProps) {
  const { user } = useAuth()

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false
    return rolePermissions[user.role]?.includes(item.id)
  })

  return (
    <aside className={mobile ? "flex h-full w-full flex-col bg-sidebar" : "hidden md:flex h-screen w-64 flex-col border-r bg-sidebar"}>
      <ScrollArea className="flex-1 min-h-0 py-4">
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
