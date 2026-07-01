import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { FileText, CheckCircle, Clock, XCircle, Upload, Download, Plus, Eye, Edit, Trash2, Printer } from "lucide-react"

const challansOverview = [
  { id: "co1", month: "Jan", generated: 234, verified: 230, rejected: 4 },
  { id: "co2", month: "Feb", generated: 256, verified: 252, rejected: 4 },
  { id: "co3", month: "Mar", generated: 278, verified: 272, rejected: 6 },
  { id: "co4", month: "Apr", generated: 265, verified: 260, rejected: 5 },
  { id: "co5", month: "May", generated: 289, verified: 280, rejected: 9 },
]

const recentChallans = [
  { id: "ch1", challanNo: "CH-2026-001245", date: "May 24", vehicleNo: "MH-12-AB-1234", material: "Aggregates", quantity: "15 T", amount: "₹45,000", status: "verified" },
  { id: "ch2", challanNo: "CH-2026-001244", date: "May 24", vehicleNo: "MH-12-CD-5678", material: "Crushed Stone", quantity: "12 T", amount: "₹38,400", status: "pending" },
  { id: "ch3", challanNo: "CH-2026-001243", date: "May 24", vehicleNo: "MH-12-EF-9012", material: "Sand", quantity: "14 T", amount: "₹28,000", status: "verified" },
  { id: "ch4", challanNo: "CH-2026-001242", date: "May 23", vehicleNo: "MH-12-GH-3456", material: "Cement", quantity: "200 Bags", amount: "₹80,000", status: "verified" },
  { id: "ch5", challanNo: "CH-2026-001241", date: "May 23", vehicleNo: "MH-12-IJ-7890", material: "Steel Rods", quantity: "8 T", amount: "₹64,000", status: "rejected" },
  { id: "ch6", challanNo: "CH-2026-001240", date: "May 23", vehicleNo: "MH-12-KL-2345", material: "Gravel", quantity: "16 T", amount: "₹32,000", status: "verified" },
  { id: "ch7", challanNo: "CH-2026-001239", date: "May 22", vehicleNo: "MH-12-MN-6789", material: "Soil", quantity: "13 T", amount: "₹19,500", status: "pending" },
  { id: "ch8", challanNo: "CH-2026-001238", date: "May 22", vehicleNo: "MH-12-OP-4567", material: "Aggregates", quantity: "15 T", amount: "₹45,000", status: "verified" },
]

const materialSummary = [
  { id: "ms1", material: "Aggregates", challans: 45, quantity: "675 T", value: "₹20.25L" },
  { id: "ms2", material: "Crushed Stone", challans: 38, quantity: "456 T", value: "₹14.59L" },
  { id: "ms3", material: "Sand", challans: 52, quantity: "728 T", value: "₹14.56L" },
  { id: "ms4", material: "Cement", challans: 28, quantity: "5600 Bags", value: "₹22.40L" },
  { id: "ms5", material: "Steel Rods", challans: 22, quantity: "176 T", value: "₹14.08L" },
]

export default function Challan() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Challan Management</h1>
          <p className="text-sm text-muted-foreground">
            Generate and manage challans
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Generate Challan
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Challans"
          value="289"
          subtitle="this month"
          icon={FileText}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 9.1, isPositive: true }}
        />
        <KPICard
          title="Verified"
          value="280"
          subtitle="96.9% success rate"
          icon={CheckCircle}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Pending"
          value="2"
          subtitle="awaiting verification"
          icon={Clock}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
        <KPICard
          title="Rejected"
          value="9"
          subtitle="3.1% rejection rate"
          icon={XCircle}
          colorClass="bg-red-100 dark:bg-red-900/30"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Challan Generation Trend</CardTitle>
            <CardDescription>Monthly challan generation and verification</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={challansOverview}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="generated" stroke="#3b82f6" strokeWidth={2} name="Generated" />
                <Line type="monotone" dataKey="verified" stroke="#10b981" strokeWidth={2} name="Verified" />
                <Line type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={2} name="Rejected" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material-wise Challan Summary</CardTitle>
            <CardDescription>Challan count by material type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={materialSummary}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="material" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="challans" fill="#3b82f6" name="Challans" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Challans Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Challans</CardTitle>
          <CardDescription>Latest challan records and verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Challan No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vehicle No.</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentChallans.map((challan) => (
                  <TableRow key={challan.id}>
                    <TableCell className="text-xs">{challan.challanNo}</TableCell>
                    <TableCell className="text-xs">{challan.date}</TableCell>
                    <TableCell className="text-xs">{challan.vehicleNo}</TableCell>
                    <TableCell className="text-xs">{challan.material}</TableCell>
                    <TableCell className="text-xs">{challan.quantity}</TableCell>
                    <TableCell className="text-xs">{challan.amount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          challan.status === "verified" ? "secondary" :
                          challan.status === "pending" ? "outline" :
                          "destructive"
                        }
                        className="text-xs"
                      >
                        {challan.status.charAt(0).toUpperCase() + challan.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive">
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
