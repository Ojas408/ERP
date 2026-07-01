import { Bell, Search, User, ChevronDown, Calendar, MapPin, Moon, Sun, LogOut } from "lucide-react"
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
import { useTheme } from "next-themes"
import { useAuth } from "../../contexts/AuthContext"
import { useDateRange, dateRangePresets, formatDateRange } from "../../contexts/DateRangeContext"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const { user, logout } = useAuth()
  const { dateRange, setDateRange } = useDateRange()

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex h-16 items-center gap-4 px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 mr-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <span className="font-bold">CE</span>
          </div>
          <div className="hidden md:block">
            <h1 className="text-sm">Construction ERP</h1>
            <p className="text-xs text-muted-foreground">Management System</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search modules, reports, vehicles..."
              className="pl-8 bg-muted/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden lg:flex">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{formatDateRange(dateRange.from, dateRange.to)}</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Date Range</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setDateRange(dateRangePresets.today())}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange(dateRangePresets.thisWeek())}>
                This Week
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange(dateRangePresets.thisMonth())}>
                This Month
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateRange(dateRangePresets.lastMonth())}>
                Last Month
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Plant/Site Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 hidden lg:flex">
                <MapPin className="h-4 w-4" />
                <span className="text-xs">Plant A - Mumbai</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Plant/Site</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Plant A - Mumbai</DropdownMenuItem>
              <DropdownMenuItem>Plant B - Pune</DropdownMenuItem>
              <DropdownMenuItem>Plant C - Bangalore</DropdownMenuItem>
              <DropdownMenuItem>Site D - Delhi NCR</DropdownMenuItem>
              <DropdownMenuItem>Crusher Unit - Nagpur</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
                  5
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-medium">Vehicle VH-101 breakdown</span>
                  <span className="text-xs text-muted-foreground">2m ago</span>
                </div>
                <span className="text-xs text-muted-foreground">Maintenance required at Plant A</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-medium">Production target achieved</span>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <span className="text-xs text-muted-foreground">Plant B reached 105% of daily target</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
                <div className="flex w-full items-center justify-between">
                  <span className="text-xs font-medium">Fuel consumption alert</span>
                  <span className="text-xs text-muted-foreground">3h ago</span>
                </div>
                <span className="text-xs text-muted-foreground">Above normal consumption detected</span>
              </DropdownMenuItem>
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
