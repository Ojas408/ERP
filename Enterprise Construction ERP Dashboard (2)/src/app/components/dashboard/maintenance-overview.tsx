import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { CheckCircle2, XCircle, Wrench, Edit, Eye, Calendar, Trash2 } from "lucide-react"
import { Progress } from "../ui/progress"

const equipmentData = [
  {
    id: "EQ-001",
    name: "Crusher Machine A",
    status: "running",
    health: 92,
    lastMaintenance: "2 days ago",
  },
  {
    id: "EQ-002",
    name: "Excavator B-12",
    status: "running",
    health: 88,
    lastMaintenance: "5 days ago",
  },
  {
    id: "EQ-003",
    name: "Conveyor Belt C",
    status: "maintenance",
    health: 65,
    lastMaintenance: "Today",
  },
  {
    id: "EQ-004",
    name: "Loader D-45",
    status: "running",
    health: 95,
    lastMaintenance: "1 day ago",
  },
  {
    id: "EQ-005",
    name: "Crane E-78",
    status: "breakdown",
    health: 45,
    lastMaintenance: "15 days ago",
  },
  {
    id: "EQ-006",
    name: "Generator F-23",
    status: "running",
    health: 90,
    lastMaintenance: "3 days ago",
  },
]

const statusConfig = {
  running: {
    label: "Running",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    badgeVariant: "default" as const,
  },
  maintenance: {
    label: "Under Maintenance",
    icon: Wrench,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    badgeVariant: "secondary" as const,
  },
  breakdown: {
    label: "Breakdown",
    icon: XCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    badgeVariant: "destructive" as const,
  },
}

export function MaintenanceOverview() {
  const runningCount = equipmentData.filter((eq) => eq.status === "running").length
  const maintenanceCount = equipmentData.filter((eq) => eq.status === "maintenance").length
  const breakdownCount = equipmentData.filter((eq) => eq.status === "breakdown").length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-xs text-muted-foreground">Running</p>
              <p className="text-xl">{runningCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <Wrench className="h-8 w-8 text-orange-600" />
            <div>
              <p className="text-xs text-muted-foreground">Maintenance</p>
              <p className="text-xl">{maintenanceCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-xs text-muted-foreground">Breakdown</p>
              <p className="text-xl">{breakdownCount}</p>
            </div>
          </div>
        </div>

        {/* Equipment List */}
        <div className="space-y-4">
          {equipmentData.map((equipment) => {
            const config = statusConfig[equipment.status as keyof typeof statusConfig]
            const StatusIcon = config.icon

            return (
              <div
                key={equipment.id}
                className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <StatusIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs">{equipment.name}</p>
                      <Badge variant={config.badgeVariant} className="text-xs">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{equipment.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">Health</span>
                      <span className="text-xs">{equipment.health}%</span>
                    </div>
                    <Progress value={equipment.health} className="h-2" />
                  </div>

                  <div className="text-right min-w-[120px]">
                    <p className="text-xs text-muted-foreground">Last Maintenance</p>
                    <p className="text-xs">{equipment.lastMaintenance}</p>
                  </div>

                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <Calendar className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
