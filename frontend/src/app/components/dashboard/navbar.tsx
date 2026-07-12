import { Bell, Search, User, ChevronDown, Moon, Sun, LogOut, Menu } from "lucide-react"
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
import { useSiteFilter } from "../../contexts/SiteFilterContext"
import { SidebarNav } from "./sidebar-nav"

interface NavbarProps {
  activeModule: string
  onModuleChange: (moduleId: string) => void
}

export function Navbar({ activeModule, onModuleChange }: NavbarProps) {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { lowStockCount } = useSiteFilter()

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
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
            <h1 className="text-sm">Construction ERP</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative hidden sm:block">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search modules, reports, vehicles..."
              className="pl-8 bg-muted/50"
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

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-9 w-9">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-orange-600 text-[10px]">
                  {lowStockCount > 0 ? lowStockCount : 0}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Alerts {lowStockCount > 0 ? `(${lowStockCount} low stock)` : ''}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {lowStockCount > 0 ? (
                <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                  <span className="text-xs font-medium text-orange-600">Low stock alert</span>
                  <span className="text-xs text-muted-foreground">{lowStockCount} material(s) below minimum threshold — check Inventory</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className="text-xs text-muted-foreground py-3">No active alerts</DropdownMenuItem>
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
                  <span className="text-xs">{user?.email || "User"}</span>
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
