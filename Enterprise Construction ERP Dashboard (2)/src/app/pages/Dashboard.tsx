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
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Construction ERP Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Real-time overview of production, operations, and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Production Today"
          value="640"
          subtitle="tons"
          icon={Factory}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Monthly Production"
          value="6,240"
          subtitle="tons"
          icon={TrendingUp}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 8.3, isPositive: true }}
        />
        <KPICard
          title="Total Expenses"
          value="₹12.5L"
          subtitle="this month"
          icon={DollarSign}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 3.2, isPositive: false }}
        />
        <KPICard
          title="Revenue"
          value="₹45.8L"
          subtitle="this month"
          icon={DollarSign}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 15.7, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Vehicles"
          value="42"
          subtitle="of 50 total"
          icon={Truck}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Idle Vehicles"
          value="5"
          subtitle="maintenance + waiting"
          icon={Activity}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Efficiency"
          value="85%"
          subtitle="overall performance"
          icon={Gauge}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Target Achievement"
          value="98.6%"
          subtitle="monthly target"
          icon={Target}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 2.1, isPositive: true }}
        />
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full md:w-auto grid-cols-3 md:inline-grid">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Production & Consumption Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ProductionTrendChart />
            <ConsumptionChart />
          </div>

          {/* Expense & Target Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ExpenseBreakdownChart />
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
