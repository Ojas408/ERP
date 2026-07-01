import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Truck, TruckIcon, Activity, Clock, Upload, Download, Plus, Eye, Edit, Trash2, FileText } from "lucide-react"

const hourlyMovement = [
  { id: "hm1", time: "6 AM", incoming: 12, outgoing: 5, waiting: 3 },
  { id: "hm2", time: "8 AM", incoming: 25, outgoing: 18, waiting: 7 },
  { id: "hm3", time: "10 AM", incoming: 18, outgoing: 22, waiting: 4 },
  { id: "hm4", time: "12 PM", incoming: 15, outgoing: 20, waiting: 5 },
  { id: "hm5", time: "2 PM", incoming: 20, outgoing: 16, waiting: 8 },
  { id: "hm6", time: "4 PM", incoming: 22, outgoing: 25, waiting: 6 },
  { id: "hm7", time: "6 PM", incoming: 10, outgoing: 15, waiting: 2 },
]

const dailyMovement = [
  { id: "dm1", date: "May 20", incoming: 115, outgoing: 112, materialsIn: 890, materialsOut: 865 },
  { id: "dm2", date: "May 21", incoming: 122, outgoing: 118, materialsIn: 925, materialsOut: 880 },
  { id: "dm3", date: "May 22", incoming: 108, outgoing: 105, materialsIn: 840, materialsOut: 820 },
  { id: "dm4", date: "May 23", incoming: 128, outgoing: 125, materialsIn: 980, materialsOut: 950 },
  { id: "dm5", date: "May 24", incoming: 112, outgoing: 110, materialsIn: 870, materialsOut: 845 },
]

const activeVehicles = [
  { id: "av1", vehicleNo: "MH-12-AB-1234", type: "Dumper", status: "incoming", time: "10:45 AM", material: "Aggregates", weight: "15T" },
  { id: "av2", vehicleNo: "MH-12-CD-5678", type: "Tipper", status: "outgoing", time: "10:42 AM", material: "Crushed Stone", weight: "12T" },
  { id: "av3", vehicleNo: "MH-12-EF-9012", type: "Dumper", status: "waiting", time: "10:35 AM", material: "Sand", weight: "14T" },
  { id: "av4", vehicleNo: "MH-12-GH-3456", type: "Mixer", status: "incoming", time: "10:50 AM", material: "Cement Mix", weight: "10T" },
  { id: "av5", vehicleNo: "MH-12-IJ-7890", type: "Truck", status: "outgoing", time: "10:48 AM", material: "Steel Rods", weight: "8T" },
  { id: "av6", vehicleNo: "MH-12-KL-2345", type: "Dumper", status: "incoming", time: "10:52 AM", material: "Gravel", weight: "16T" },
  { id: "av7", vehicleNo: "MH-12-MN-6789", type: "Tipper", status: "waiting", time: "10:40 AM", material: "Soil", weight: "13T" },
]

export default function VehicleMovement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Vehicle Movement</h1>
          <p className="text-sm text-muted-foreground">
            Incoming and outgoing vehicle tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Incoming Today"
          value="112"
          subtitle="vehicles entered"
          icon={Truck}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 8.7, isPositive: true }}
        />
        <KPICard
          title="Outgoing Today"
          value="110"
          subtitle="vehicles exited"
          icon={TruckIcon}
          colorClass="bg-green-100 dark:bg-green-900/30"
          trend={{ value: 5.2, isPositive: true }}
        />
        <KPICard
          title="Currently Waiting"
          value="6"
          subtitle="in queue"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Avg Wait Time"
          value="18 min"
          subtitle="per vehicle"
          icon={Activity}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Hourly Vehicle Movement</CardTitle>
            <CardDescription>Real-time vehicle tracking throughout the day</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyMovement}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="time" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="incoming" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Incoming" />
                <Area type="monotone" dataKey="outgoing" stackId="2" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Outgoing" />
                <Area type="monotone" dataKey="waiting" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Waiting" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Movement Trend</CardTitle>
            <CardDescription>Last 5 days vehicle and material movement</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyMovement}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="incoming" fill="#3b82f6" name="Incoming" />
                <Bar dataKey="outgoing" fill="#10b981" name="Outgoing" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Vehicles Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Active Vehicle Log</CardTitle>
              <CardDescription>Real-time vehicle status and movement tracking</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileText className="h-4 w-4 mr-2" />
              Export Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeVehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="text-xs">{vehicle.vehicleNo}</TableCell>
                    <TableCell className="text-xs">{vehicle.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          vehicle.status === "incoming" ? "default" :
                          vehicle.status === "outgoing" ? "secondary" :
                          "outline"
                        }
                        className="text-xs"
                      >
                        {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{vehicle.time}</TableCell>
                    <TableCell className="text-xs">{vehicle.material}</TableCell>
                    <TableCell className="text-xs">{vehicle.weight}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
