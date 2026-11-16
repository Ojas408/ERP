import { useState, useEffect, useCallback } from "react"
import { ThemeProvider } from "./components/theme-provider"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { DateRangeProvider } from "./contexts/DateRangeContext"
import { SiteFilterProvider } from "./contexts/SiteFilterContext"
import { Navbar } from "./components/dashboard/navbar"
import { SidebarNav } from "./components/dashboard/sidebar-nav"
import LoginPage from "./pages/Login"
import DashboardPage from "./pages/Dashboard"
import ProjectsPage from "./pages/Projects"
import WorkersPage from "./pages/Workers"
import EquipmentPage from "./pages/Equipment"
import ProductionPage from "./pages/Production"
import ConsumptionPage from "./pages/Consumption"
import ExpensesPage from "./pages/Expenses"
import MaintenancePage from "./pages/Maintenance"
import WorkHoursPage from "./pages/WorkHours"
import EfficiencyPage from "./pages/Efficiency"
import TargetAchievementPage from "./pages/TargetAchievement"
import VehicleMovementPage from "./pages/VehicleMovement"
import TimeMotionPage from "./pages/TimeMotion"
import ChallanPage from "./pages/Challan"
import InventoryPage from "./pages/Inventory"
import PurchaseOrderPage from "./pages/PurchaseOrder"
import SiteManagementPage from "./pages/SiteManagement"
import EmployeeManagementPage from "./pages/EmployeeManagement"
import VendorManagementPage from "./pages/VendorManagement"
import SettingsPage from "./pages/Settings"
import MaterialInwardPage from "./pages/MaterialInward"
import RMCGradePage from "./pages/RMCGrade"
import ScrapManagementPage from "./pages/ScrapManagement"
import OverheadReportPage from "./pages/OverheadReport"
import BOMPage from "./pages/BOM"

const MODULE_NAMES: Record<string, string> = {
  "dashboard": "Dashboard",
  "overhead-report": "Total Overhead Report",
  "production": "Production",
  "consumption": "Consumption",
  "equipment": "Equipment & Fleet",
  "expense": "Expenses",
  "maintenance": "Plant Maintenance",
  "work-hour": "Work Hours & Payroll",
  "workers": "Workers & Labour",
  "bom": "Bill of Materials (BOM)",
  "projects": "Projects",
  "efficiency": "Efficiency Report",
  "target": "Target Achievement",
  "vehicle-io": "Vehicle Movement",
  "time-motion": "Time Motion Study",
  "challan": "Challan Management",
  "inventory": "Inventory & Materials",
  "material-inward": "Material Inward",
  "rmc-grade": "RMC Mix Grades",
  "scrap-management": "Scrap Management",
  "purchase-order": "Purchase Orders",
  "site": "Site Management",
  "employee": "Employee Management",
  "vendor": "Vendor Management",
  "settings": "Settings",
}

function getModuleName(id: string): string {
  return MODULE_NAMES[id] || id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <LoginPage />
  }
  return <>{children}</>
}

function AppContent() {
  const [history, setHistory] = useState<string[]>(() => {
    const hash = window.location.hash.replace("#", "")
    return hash && MODULE_NAMES[hash] ? [hash] : ["dashboard"]
  })
  const [historyIndex, setHistoryIndex] = useState(0)

  const activeModule = history[historyIndex] || "dashboard"

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1

  const prevModule = canGoBack ? history[historyIndex - 1] : undefined
  const nextModule = canGoForward ? history[historyIndex + 1] : undefined

  const navigateTo = useCallback((newModule: string) => {
    setHistory((prev) => {
      if (prev[historyIndex] === newModule) return prev
      const nextHistory = prev.slice(0, historyIndex + 1)
      nextHistory.push(newModule)
      return nextHistory
    })
    setHistoryIndex((prev) => prev + 1)
    try {
      window.history.pushState({ module: newModule }, "", `#${newModule}`)
    } catch {}
  }, [historyIndex])

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      const target = history[historyIndex - 1]
      try {
        window.history.pushState({ module: target }, "", `#${target}`)
      } catch {}
    }
  }, [historyIndex, history])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      const target = history[historyIndex + 1]
      try {
        window.history.pushState({ module: target }, "", `#${target}`)
      } catch {}
    }
  }, [historyIndex, history])

  // Global Keyboard Shortcuts (Alt + Left Arrow / Alt + Right Arrow) & Mouse Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + ArrowLeft (Standard Windows Browser Back)
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault()
        goBack()
      }
      // Alt + ArrowRight (Standard Windows Browser Forward)
      else if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault()
        goForward()
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      // Mouse 4th button (Back) and 5th button (Forward)
      if (e.button === 3) {
        e.preventDefault()
        goBack()
      } else if (e.button === 4) {
        e.preventDefault()
        goForward()
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      const hash = window.location.hash.replace("#", "")
      if (hash && MODULE_NAMES[hash]) {
        setHistory((prev) => {
          const idx = prev.lastIndexOf(hash)
          if (idx !== -1) {
            setHistoryIndex(idx)
            return prev
          } else {
            const next = [...prev, hash]
            setHistoryIndex(next.length - 1)
            return next
          }
        })
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("mouseup", handleMouseUp)
    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("mouseup", handleMouseUp)
      window.removeEventListener("popstate", handlePopState)
    }
  }, [goBack, goForward])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ProtectedRoute>
        <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <SidebarNav activeModule={activeModule} onModuleChange={navigateTo} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar with Back and Forward Navigation */}
          <Navbar
            activeModule={activeModule}
            onModuleChange={navigateTo}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onGoBack={goBack}
            onGoForward={goForward}
            prevModuleTitle={prevModule ? getModuleName(prevModule) : undefined}
            nextModuleTitle={nextModule ? getModuleName(nextModule) : undefined}
            currentModuleTitle={getModuleName(activeModule)}
          />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6">
              {activeModule === "dashboard" && <DashboardPage onNavigate={navigateTo} />}
              {activeModule === "projects" && <ProjectsPage onNavigate={navigateTo} />}
              {activeModule === "workers" && <WorkersPage />}
              {activeModule === "equipment" && <EquipmentPage />}
              {activeModule === "production" && <ProductionPage />}
              {activeModule === "consumption" && <ConsumptionPage />}
              {activeModule === "work-hour" && <WorkHoursPage />}
              {activeModule === "maintenance" && <MaintenancePage />}
              {activeModule === "expense" && <ExpensesPage />}
              {activeModule === "efficiency" && <EfficiencyPage />}
              {activeModule === "target" && <TargetAchievementPage />}
              {activeModule === "vehicle-io" && <VehicleMovementPage />}
              {activeModule === "time-motion" && <TimeMotionPage />}
              {activeModule === "challan" && <ChallanPage />}
              {activeModule === "inventory" && <InventoryPage />}
              {activeModule === "material-inward" && <MaterialInwardPage />}
              {activeModule === "rmc-grade" && <RMCGradePage />}
              {activeModule === "scrap-management" && <ScrapManagementPage />}
              {activeModule === "purchase-order" && <PurchaseOrderPage />}
              {activeModule === "bom" && <BOMPage onNavigate={navigateTo} />}
              {activeModule === "overhead-report" && <OverheadReportPage onNavigate={navigateTo} />}
              {activeModule === "site" && <SiteManagementPage />}
              {activeModule === "employee" && <EmployeeManagementPage />}
              {activeModule === "vendor" && <VendorManagementPage />}
              {activeModule === "settings" && <SettingsPage />}

              {![
                "dashboard", "projects", "workers", "equipment", "production", "consumption", 
                "work-hour", "maintenance", "expense", "efficiency", "target", 
                "vehicle-io", "time-motion", "challan", "inventory", "material-inward", 
                "rmc-grade", "scrap-management", "purchase-order", "bom",
                "overhead-report", "site", "employee", "vendor", "settings"
              ].includes(activeModule) && (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <div className="p-8 rounded-lg bg-muted/50">
                    <h2 className="text-xl mb-2">Module Under Development</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      The {activeModule.replace("-", " ")} module is currently being built.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Please check back soon or explore other available modules.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
        </div>
      </ProtectedRoute>
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DateRangeProvider>
        <SiteFilterProvider>
          <AppContent />
        </SiteFilterProvider>
      </DateRangeProvider>
    </AuthProvider>
  )
}
