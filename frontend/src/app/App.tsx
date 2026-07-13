import { useState } from "react"
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <LoginPage />
  }
  return <>{children}</>
}

function AppContent() {
  const [activeModule, setActiveModule] = useState("dashboard")

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ProtectedRoute>
        <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <SidebarNav activeModule={activeModule} onModuleChange={setActiveModule} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar activeModule={activeModule} onModuleChange={setActiveModule} />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6">
              {activeModule === "dashboard" && <DashboardPage />}
              {activeModule === "projects" && <ProjectsPage />}
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
              {activeModule === "payroll" && <div className="text-center py-12 text-muted-foreground">Payroll module - coming soon</div>}
              {activeModule === "accounts" && <div className="text-center py-12 text-muted-foreground">Accounts & Finance module - coming soon</div>}
              {activeModule === "overhead-report" && <OverheadReportPage />}
              {activeModule === "site" && <SiteManagementPage />}
              {activeModule === "employee" && <EmployeeManagementPage />}
              {activeModule === "vendor" && <VendorManagementPage />}
              {activeModule === "settings" && <SettingsPage />}
              {activeModule === "master-data" && <div className="text-center py-12 text-muted-foreground">Master Data module - coming soon</div>}

              {![
                "dashboard", "projects", "workers", "equipment", "production", "consumption", 
                "work-hour", "maintenance", "expense", "efficiency", "target", 
                "vehicle-io", "time-motion", "challan", "inventory", "material-inward", 
                "rmc-grade", "scrap-management", "purchase-order", "payroll", "accounts", 
                "overhead-report", "site", "employee", "vendor", "settings", "master-data"
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