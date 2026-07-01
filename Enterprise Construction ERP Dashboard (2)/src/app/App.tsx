import { useState } from "react"
import { ThemeProvider } from "./components/theme-provider"
import { AuthProvider, useAuth } from "./contexts/AuthContext"
import { DateRangeProvider } from "./contexts/DateRangeContext"
import { Navbar } from "./components/dashboard/navbar"
import { SidebarNav } from "./components/dashboard/sidebar-nav"
import LoginPage from "./pages/Login"
import DashboardPage from "./pages/Dashboard"
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
import PayrollPage from "./pages/Payroll"
import AccountsPage from "./pages/Accounts"
import SiteManagementPage from "./pages/SiteManagement"
import EmployeeManagementPage from "./pages/EmployeeManagement"
import VendorManagementPage from "./pages/VendorManagement"
import BusinessReportPage from "./pages/BusinessReport"
import SettingsPage from "./pages/Settings"

function AppContent() {
  const [activeModule, setActiveModule] = useState("dashboard")
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Sidebar */}
        <SidebarNav activeModule={activeModule} onModuleChange={setActiveModule} />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Navbar */}
          <Navbar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto p-6 space-y-6">
              {activeModule === "dashboard" && <DashboardPage />}
              {activeModule === "production" && <ProductionPage />}
              {activeModule === "consumption" && <ConsumptionPage />}
              {activeModule === "work-hour" && <WorkHoursPage />}
              {activeModule === "maintenance" && <MaintenancePage />}
              {activeModule === "expense" && <ExpensesPage />}
              {activeModule === "analytics" && <BusinessReportPage />}
              {activeModule === "efficiency" && <EfficiencyPage />}
              {activeModule === "target" && <TargetAchievementPage />}
              {activeModule === "vehicle-io" && <VehicleMovementPage />}
              {activeModule === "time-motion" && <TimeMotionPage />}
              {activeModule === "challan" && <ChallanPage />}
              {activeModule === "inventory" && <InventoryPage />}
              {activeModule === "purchase-order" && <PurchaseOrderPage />}
              {activeModule === "payroll" && <PayrollPage />}
              {activeModule === "accounts" && <AccountsPage />}
              {activeModule === "site" && <SiteManagementPage />}
              {activeModule === "employee" && <EmployeeManagementPage />}
              {activeModule === "vendor" && <VendorManagementPage />}
              {activeModule === "settings" && <SettingsPage />}

              {![
                "dashboard", "production", "consumption", "work-hour", "maintenance",
                "expense", "analytics", "efficiency", "target", "vehicle-io",
                "time-motion", "challan", "inventory", "purchase-order", "payroll",
                "accounts", "site", "employee", "vendor", "settings"
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
    </ThemeProvider>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <DateRangeProvider>
        <AppContent />
      </DateRangeProvider>
    </AuthProvider>
  )
}