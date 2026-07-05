import { useEffect, useState } from "react"
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
import { FileText, RefreshCw } from "lucide-react"
import { fetchTimeMotionReport } from "../../services/api"

const COLORS = ["#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#6b7280", "#10b981"]

export function VehicleTimeMotionStudy() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadReport = async () => {
    try {
      setLoading(true)
      const data = await fetchTimeMotionReport()
      setReport(data)
    } catch (error) {
      console.error("Failed to load time motion report:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReport()
  }, [])

  const vehicleTimeData = report?.vehicleTimeData || []
  const delayReasonData = (report?.delayReasonData || []).map((item: any, index: number) => ({
    ...item,
    color: item.color || COLORS[index % COLORS.length],
  }))

  const avgEfficiency = vehicleTimeData.length
    ? Math.round(vehicleTimeData.reduce((sum: number, v: any) => sum + v.efficiency, 0) / vehicleTimeData.length)
    : 0

  const delaysReported = vehicleTimeData.filter((v: any) => v.delayReason && v.delayReason !== "None").length

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="text-xs h-8" onClick={loadReport} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

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
              <p className="text-xs text-muted-foreground mb-2">Active Trips</p>
              <p className="text-3xl">{vehicleTimeData.filter((v: any) => v.exitTime === "-").length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-2">Delays Reported</p>
              <p className="text-3xl">{delaysReported}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Delay Reasons</CardTitle>
            <CardDescription>Distribution of delay causes</CardDescription>
          </CardHeader>
          <CardContent>
            {delayReasonData.length > 0 ? (
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
                    {delayReasonData.map((entry: any) => (
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
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No movement data yet</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vehicle Efficiency Breakdown</CardTitle>
            <CardDescription>Performance by vehicle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleTimeData.map((vehicle: any) => (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicleTimeData.map((vehicle: any) => (
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
                        <Badge variant="outline" className="text-xs">None</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">{vehicle.delayReason}</Badge>
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
