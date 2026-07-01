import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { Progress } from "../ui/progress"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { Eye, Edit, Trash2, FileText } from "lucide-react"

const vehicleTimeData = [
  {
    id: "v1",
    vehicleNo: "MH-12-AB-1234",
    driver: "Rajesh Kumar",
    challanNo: "CH-2026-001234",
    entryTime: "06:30 AM",
    exitTime: "02:45 PM",
    stopTime: "45 min",
    travelTime: "6h 30m",
    idleTime: "55 min",
    siteWaitTime: "20 min",
    delayReason: "Traffic",
    efficiency: 78,
  },
  {
    id: "v2",
    vehicleNo: "MH-12-CD-5678",
    driver: "Amit Sharma",
    challanNo: "CH-2026-001235",
    entryTime: "07:00 AM",
    exitTime: "03:15 PM",
    stopTime: "30 min",
    travelTime: "7h 15m",
    idleTime: "30 min",
    siteWaitTime: "10 min",
    delayReason: "None",
    efficiency: 92,
  },
  {
    id: "v3",
    vehicleNo: "MH-12-EF-9012",
    driver: "Suresh Patil",
    challanNo: "CH-2026-001236",
    entryTime: "06:45 AM",
    exitTime: "02:30 PM",
    stopTime: "1h 15m",
    travelTime: "5h 45m",
    idleTime: "1h 15m",
    siteWaitTime: "45 min",
    delayReason: "Loading Delay",
    efficiency: 65,
  },
  {
    id: "v4",
    vehicleNo: "MH-12-GH-3456",
    driver: "Vikram Singh",
    challanNo: "CH-2026-001237",
    entryTime: "08:00 AM",
    exitTime: "04:30 PM",
    stopTime: "20 min",
    travelTime: "7h 50m",
    idleTime: "20 min",
    siteWaitTime: "5 min",
    delayReason: "None",
    efficiency: 95,
  },
  {
    id: "v5",
    vehicleNo: "MH-12-IJ-7890",
    driver: "Prakash Naik",
    challanNo: "CH-2026-001238",
    entryTime: "07:30 AM",
    exitTime: "03:00 PM",
    stopTime: "50 min",
    travelTime: "6h 20m",
    idleTime: "40 min",
    siteWaitTime: "30 min",
    delayReason: "Mechanical Issue",
    efficiency: 72,
  },
]

const delayReasonData = [
  { id: "dr1", name: "Traffic", value: 35, color: "#3b82f6" },
  { id: "dr2", name: "Loading Delay", value: 25, color: "#f59e0b" },
  { id: "dr3", name: "Mechanical Issue", value: 20, color: "#ef4444" },
  { id: "dr4", name: "Site Waiting", value: 15, color: "#8b5cf6" },
  { id: "dr5", name: "Other", value: 5, color: "#6b7280" },
]

export function VehicleTimeMotionStudy() {
  const avgEfficiency = Math.round(
    vehicleTimeData.reduce((sum, v) => sum + v.efficiency, 0) / vehicleTimeData.length
  )

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Total Vehicles</p>
              <p className="text-3xl">{vehicleTimeData.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Avg Efficiency</p>
              <p className="text-3xl">{avgEfficiency}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Total Idle Time</p>
              <p className="text-3xl">4.6h</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Delays Reported</p>
              <p className="text-3xl">3</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Delay Reasons Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Delay Reasons</CardTitle>
            <CardDescription>Distribution of delay causes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={delayReasonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {delayReasonData.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Efficiency Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Efficiency Breakdown</CardTitle>
            <CardDescription>Performance by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleTimeData.map((vehicle) => (
                <div key={vehicle.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs">{vehicle.vehicleNo}</span>
                    <span className="text-xs">{vehicle.efficiency}%</span>
                  </div>
                  <Progress value={vehicle.efficiency} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Vehicle Time Motion Details</CardTitle>
              <CardDescription>Complete timeline and performance data</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="text-xs h-8">
              <FileText className="h-4 w-4 mr-2" />
              Export Table
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Challan</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Travel Time</TableHead>
                  <TableHead>Idle Time</TableHead>
                  <TableHead>Site Wait</TableHead>
                  <TableHead>Delay Reason</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTimeData.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="text-xs">{vehicle.vehicleNo}</TableCell>
                    <TableCell className="text-xs">{vehicle.driver}</TableCell>
                    <TableCell className="text-xs">{vehicle.challanNo}</TableCell>
                    <TableCell className="text-xs">{vehicle.entryTime}</TableCell>
                    <TableCell className="text-xs">{vehicle.exitTime}</TableCell>
                    <TableCell className="text-xs">{vehicle.travelTime}</TableCell>
                    <TableCell className="text-xs">{vehicle.idleTime}</TableCell>
                    <TableCell className="text-xs">{vehicle.siteWaitTime}</TableCell>
                    <TableCell className="text-xs">
                      {vehicle.delayReason === "None" ? (
                        <Badge variant="outline" className="text-xs">
                          None
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {vehicle.delayReason}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{vehicle.efficiency}%</span>
                        <div className="w-16">
                          <Progress value={vehicle.efficiency} className="h-1.5" />
                        </div>
                      </div>
                    </TableCell>
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
