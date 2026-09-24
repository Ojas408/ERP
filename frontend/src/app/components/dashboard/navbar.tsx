import { useState, useEffect } from "react"
import {
  Bell,
  Search,
  User,
  ChevronDown,
  Calendar,
  MapPin,
  Moon,
  Sun,
  LogOut,
  Menu,
  AlertTriangle,
  Wrench,
  Truck,
  Coins,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  RefreshCw
} from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet"
import { useTheme } from "next-themes"
import { useAuth } from "../../contexts/AuthContext"
import { useDateRange, dateRangePresets, formatDateRange } from "../../contexts/DateRangeContext"
import { useSiteFilter } from "../../contexts/SiteFilterContext"
import { SidebarNav } from "./sidebar-nav"
import { fetchStats } from "../../services/api"

interface NavbarProps {
  activeModule: string
  onModuleChange: (moduleId: string) => void
}

interface NotificationItem {
  id: string
  type: 'low_stock' | 'maintenance' | 'challan' | 'expense'
  title: string
  message: string
  module: string
  severity: 'high' | 'medium' | 'info' | 'warning'
  createdAt: string
}

export function Navbar({ activeModule, onModuleChange }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout, isAuthenticated } = useAuth()
  const { dateRange, setDateRange } = useDateRange()
  const { sites, selectedSiteId, selectedSiteName, setSelectedSiteId } = useSiteFilter()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    loadNotifications()
    // Poll notifications every 45 seconds for real-time telemetry updates
    const interval = setInterval(loadNotifications, 45000)
    return () => clearInterval(interval)
  }, [isAuthenticated])

  const loadNotifications = async () => {
    try {
      setLoadingNotifications(true)
      const stats = await fetchStats()
      if (stats?.notifications && Array.isArray(stats.notifications)) {
        setNotifications(stats.notifications)
      } else {
        setNotifications([])
      }
    } catch {
      // Keep existing state if offline/error
    } finally {
      setLoadingNotifications(false)
    }
  }

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Just now'
    const diffMs = Date.now() - new Date(dateString).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }

  const getNotificationTheme = (type: string) => {
    switch (type) {
      case 'low_stock':
        return {
          dotColor: 'bg-red-500',
          badgeText: '🔴 Low Stock',
          badgeClass: 'bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border-red-200',
          icon: AlertTriangle,
        }
      case 'maintenance':
        return {
          dotColor: 'bg-orange-500',
          badgeText: '🟠 Maintenance Due',
          badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200',
          icon: Wrench,
        }
      case 'challan':
        return {
          dotColor: 'bg-blue-500',
          badgeText: '🔵 Pending Challan',
          badgeClass: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200',
          icon: Truck,
        }
      case 'expense':
        return {
          dotColor: 'bg-yellow-500',
          badgeText: '🟡 Expense Pending',
          badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/80 dark:text-yellow-300 border-yellow-200',
          icon: Coins,
        }
      default:
        return {
          dotColor: 'bg-slate-500',
          badgeText: 'System Alert',
          badgeClass: 'bg-slate-100 text-slate-700',
          icon: Bell,
        }
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarNav activeModule={activeModule} onModuleChange={onModuleChange} mobile />
          </SheetContent>
        </Sheet>
        
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4 hidden md:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <span className="font-bold">CE</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold">Construction ERP</h1>
            <p className="text-xs text-muted-foreground">Operations Control Center</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search modules, reports, vehicles..."
              className="pl-8 bg-muted/50 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Centralized Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1 rounded-full p-0 flex items-center justify-center bg-red-600 text-white text-[10px] font-bold animate-pulse">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-88 p-0 shadow-lg border border-slate-200 dark:border-slate-800">
              <div className="p-3 bg-muted/40 flex items-center justify-between border-b">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    Notifications
                  </span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                    {notifications.length} Active
                  </Badge>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadNotifications}>
                  <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${loadingNotifications ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto opacity-80" />
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">All Operations Clear</p>
                    <p className="text-[11px] text-muted-foreground">No active low stock, pending challan, or maintenance alerts.</p>
                  </div>
                ) : (
                  notifications.map((item) => {
                    const themeObj = getNotificationTheme(item.type)
                    const IconComp = themeObj.icon

                    return (
                      <DropdownMenuItem
                        key={item.id}
                        className="p-3 flex flex-col items-start gap-1 cursor-pointer hover:bg-accent/60 transition-colors focus:bg-accent/60"
                        onClick={() => {
                          onModuleChange(item.module)
                        }}
                      >
                        <div className="w-full flex items-center justify-between">
                          <Badge variant="outline" className={`text-[10px] font-semibold px-2 py-0.5 ${themeObj.badgeClass}`}>
                            {themeObj.badgeText}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {formatTimeAgo(item.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5 mt-1 w-full">
                          <IconComp className="h-4 w-4 shrink-0 mt-0.5 text-slate-600 dark:text-slate-400" />
                          <div className="flex-1 space-y-0.5">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
                              {item.message}
                            </p>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 self-center opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t text-center bg-muted/20">
                  <p className="text-[10px] text-muted-foreground">
                    Click any alert above to jump directly to its management module.
                  </p>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-9 px-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src="/placeholder-avatar.jpg" />
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs">
                    {user ? getInitials(user.email) : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-xs font-medium">{user?.email || "User"}</span>
                  <span className="text-xs text-muted-foreground">{user?.role || "Role"}</span>
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
