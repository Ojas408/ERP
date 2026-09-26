import { useEffect, useState } from "react"
import { KPICard } from "../components/dashboard/kpi-card"
import {
  ProductionTrendChart,
  ConsumptionChart,
  ExpenseBreakdownChart,
  VehicleMovementChart,
  TargetAchievementChart,
  EfficiencyGauges,
} from "../components/dashboard/charts"
import { MaintenanceOverview } from "../components/dashboard/maintenance-overview"
import { VehicleTimeMotionStudy } from "../components/dashboard/vehicle-time-motion"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog"
import {
  Factory,
  DollarSign,
  TrendingUp,
  Truck,
  Target,
  Gauge,
  Activity,
  Download,
  RefreshCw,
  FileText,
  AlertTriangle,
  ClipboardList,
  Wrench,
  Clock,
  Coins,
  Package,
  ArrowRight,
  ShieldAlert,
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { fetchStats } from "../services/api"
import { toast } from "sonner"

interface DashboardProps {
  onNavigate?: (module: string) => void
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const data = await fetchStats()
      setStats(data)
    } catch (error) {
      console.error("Failed to load dashboard stats:", error)
      toast.error("Failed to load operations telemetry")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Operations Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Real-time multi-tenant telemetry for production, fleet machinery, inventory stock, and payroll costs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={loadStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Telemetry
          </Button>
        </div>
      </div>

      {/* Core Financial & Production KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Production"
          value={stats?.totalProduction ? `${Number(stats.totalProduction).toLocaleString()} t` : "0 t"}
          subtitle="aggregated raw outputs"
          icon={Factory}
          colorClass="bg-blue-50 text-blue-600 border border-blue-100"
          onClick={() => onNavigate?.('production')}
        />
        <KPICard
          title="Inventory Count"
          value={stats?.inventoryCount?.toString() || "0"}
          subtitle="unique stock SKUs"
          icon={TrendingUp}
          colorClass="bg-emerald-50 text-emerald-600 border border-emerald-100"
          onClick={() => onNavigate?.('inventory')}
        />
        <KPICard
          title="Disbursed Expenses"
          value={stats ? `₹${(stats.totalExpenses || 0).toLocaleString()}` : "₹0"}
          subtitle="settled cash outflows"
          icon={DollarSign}
          colorClass="bg-orange-50 text-orange-600 border border-orange-100"
          onClick={() => onNavigate?.('expense')}
        />
        <KPICard
          title="Available Fleet Vehicles"
          value={stats?.activeVehicles?.toString() || "0"}
          subtitle="idle/ready units in yard"
          icon={Truck}
          colorClass="bg-purple-50 text-purple-600 border border-purple-100"
          onClick={() => onNavigate?.('equipment')}
        />
      </div>

      {/* Operational Health Checklist Row */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold tracking-wider text-slate-500 uppercase">Operational Health Watchlist</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          
          <Card 
            className={`relative overflow-hidden shadow-sm transition-all duration-200 border cursor-pointer hover:shadow-md ${stats?.lowStockMaterials > 0 ? "border-red-300 bg-red-50/40 hover:border-red-400" : "border-slate-200 hover:border-slate-300"}`}
            onClick={() => onNavigate?.('inventory')}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Low Stock Materials</span>
              <AlertTriangle className={`h-4.5 w-4.5 ${stats?.lowStockMaterials > 0 ? "text-red-500 animate-pulse" : "text-slate-400"}`} />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center justify-between">
                <span>{stats?.lowStockMaterials ?? 0}</span>
                <span className="text-[10px] text-red-600 dark:text-red-400 font-sans font-semibold flex items-center gap-0.5">
                  Check <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">items below minThreshold</p>
              {/* {stats?.lowStockMaterials > 0 && (
                <Badge variant="destructive" className="text-[8px] h-4 mt-2 px-1.5 py-0 uppercase tracking-wider font-semibold">
                  Attention Required
                </Badge>
              )} */}
            </CardContent>
          </Card>

          <Card 
            className="border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-blue-400 transition-all duration-200"
            onClick={() => onNavigate?.('challan')}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Pending Challans</span>
              <Clock className="h-4.5 w-4.5 text-blue-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center justify-between">
                <span>{stats?.pendingChallans ?? 0}</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-sans font-semibold flex items-center gap-0.5">
                  Open <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">slips in draft/transit</p>
            </CardContent>
          </Card>

          <Card 
            className={`relative overflow-hidden shadow-sm transition-all duration-200 border cursor-pointer hover:shadow-md ${stats?.maintenanceDue > 0 ? "border-orange-300 bg-orange-50/30 hover:border-orange-400" : "border-slate-200 hover:border-slate-300"}`}
            onClick={() => onNavigate?.('maintenance')}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Maintenance Due</span>
              <Wrench className="h-4.5 w-4.5 text-orange-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center justify-between">
                <span>{stats?.maintenanceDue ?? 0}</span>
                <span className="text-[10px] text-orange-600 dark:text-orange-400 font-sans font-semibold flex items-center gap-0.5">
                  View <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">machinery service pending</p>
            </CardContent>
          </Card>

          <Card 
            className="border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-indigo-400 transition-all duration-200"
            onClick={() => onNavigate?.('work-hour')}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Attendance Today</span>
              <ClipboardList className="h-4.5 w-4.5 text-indigo-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center justify-between">
                <span>{stats?.attendanceToday ?? 0}</span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-sans font-semibold flex items-center gap-0.5">
                  Logs <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">labor logs clocked today</p>
            </CardContent>
          </Card>

          <Card 
            className="border border-slate-200 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-md hover:border-yellow-400 transition-all duration-200"
            onClick={() => onNavigate?.('expense')}
          >
            <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Open Expenses</span>
              <Coins className="h-4.5 w-4.5 text-yellow-500" />
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="text-2xl font-bold font-mono text-slate-800 dark:text-white flex items-center justify-between">
                <span>{stats?.openExpensesCount ?? 0}</span>
                <span className="text-[10px] text-yellow-600 dark:text-yellow-400 font-sans font-semibold flex items-center gap-0.5">
                  Pay <ArrowRight className="h-3 w-3" />
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">vouchers awaiting payout</p>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Charts section tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-grid">
          <TabsTrigger value="overview">Production & Spending</TabsTrigger>
          <TabsTrigger value="vehicles">Logistics & Movements</TabsTrigger>
          <TabsTrigger value="maintenance">Fleet Breakdowns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Production & Consumption Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductionTrendChart data={stats?.productionTrend} />
            <ConsumptionChart data={stats?.consumptionStats} />
          </div>

          {/* Expense & Target Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseBreakdownChart data={stats?.expenseStats} />
            <TargetAchievementChart />
          </div>

          {/* Efficiency Gauges */}
          <EfficiencyGauges />
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-6 mt-6">
          {/* Vehicle Movement Chart */}
          <VehicleMovementChart />

          {/* Vehicle Time Motion Study */}
          <VehicleTimeMotionStudy />
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6 mt-6">
          {/* Maintenance Overview */}
          <MaintenanceOverview />
        </TabsContent>
      </Tabs>
    </div>
  )
}
