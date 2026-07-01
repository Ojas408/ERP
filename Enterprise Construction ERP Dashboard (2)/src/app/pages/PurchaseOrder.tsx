import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"
import { ShoppingCart, Upload, Download, Eye, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import { useDateRange } from "../contexts/DateRangeContext"

const initialPOs = [
  { id: "po1", poNumber: "PO-2024-001", date: "May 22", vendor: "Supreme Cement Ltd", material: "Cement", quantity: 500, unit: "Bags", totalValue: "₹2.5L", status: "approved" },
  { id: "po2", poNumber: "PO-2024-002", date: "May 23", vendor: "JSW Steel", material: "Steel Rods", quantity: 25, unit: "Tons", totalValue: "₹3.2L", status: "pending" },
  { id: "po3", poNumber: "PO-2024-003", date: "May 23", vendor: "Bharat Petroleum", material: "Diesel", quantity: 2000, unit: "Liters", totalValue: "₹1.8L", status: "approved" },
  { id: "po4", poNumber: "PO-2024-004", date: "May 24", vendor: "Local Quarry", material: "Aggregates", quantity: 50, unit: "Tons", totalValue: "₹1.5L", status: "grn-done" },
  { id: "po5", poNumber: "PO-2024-005", date: "May 25", vendor: "Safety First Supplies", material: "Safety Equipment", quantity: 200, unit: "Units", totalValue: "₹0.8L", status: "draft" },
  { id: "po6", poNumber: "PO-2024-006", date: "May 24", vendor: "Caterpillar India", material: "Spare Parts", quantity: 15, unit: "Units", totalValue: "₹4.2L", status: "rejected" },
]

const monthlyData = [
  { id: "md1", month: "Dec", poValue: 185, actualSpend: 178 },
  { id: "md2", month: "Jan", poValue: 195, actualSpend: 192 },
  { id: "md3", month: "Feb", poValue: 205, actualSpend: 198 },
  { id: "md4", month: "Mar", poValue: 220, actualSpend: 215 },
  { id: "md5", month: "Apr", poValue: 210, actualSpend: 205 },
  { id: "md6", month: "May", poValue: 230, actualSpend: 220 },
]

const vendors = ["Supreme Cement Ltd", "JSW Steel", "Bharat Petroleum", "Local Quarry", "Caterpillar India", "Safety First Supplies"]

export default function PurchaseOrder() {
  const [purchaseOrders, setPurchaseOrders] = useState(initialPOs)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newPO, setNewPO] = useState({
    vendor: "",
    material: "",
    quantity: "",
    unit: "Bags",
    expectedDelivery: "",
    remarks: ""
  })
  const { dateRange } = useDateRange()

  const totalPOs = purchaseOrders.length
  const pendingApproval = purchaseOrders.filter(po => po.status === "pending").length
  const todayPOs = purchaseOrders.filter(po => po.date === "May 25").length

  const handleCreatePO = () => {
    if (!newPO.vendor || !newPO.material || !newPO.quantity) {
      toast.error("Please fill in all required fields")
      return
    }

    const po = {
      id: `po${purchaseOrders.length + 1}`,
      poNumber: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      date: "May 25",
      vendor: newPO.vendor,
      material: newPO.material,
      quantity: parseInt(newPO.quantity),
      unit: newPO.unit,
      totalValue: `₹${(parseInt(newPO.quantity) * 0.5).toFixed(1)}L`,
      status: "draft"
    }

    setPurchaseOrders([po, ...purchaseOrders])
    setIsDialogOpen(false)
    setNewPO({ vendor: "", material: "", quantity: "", unit: "Bags", expectedDelivery: "", remarks: "" })
    toast.success("Purchase Order created successfully")
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { variant: "outline" as const, label: "Draft", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
      pending: { variant: "outline" as const, label: "Pending Approval", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
      approved: { variant: "default" as const, label: "Approved", className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
      rejected: { variant: "destructive" as const, label: "Rejected", className: "" },
      "grn-done": { variant: "default" as const, label: "GRN Done", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" }
    }
    const config = variants[status as keyof typeof variants] || variants.draft
    return <Badge variant={config.variant} className={`text-xs ${config.className}`}>{config.label}</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Purchase Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage procurement and vendor orders · {dateRange.label}
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Create PO
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Purchase Order</DialogTitle>
                <DialogDescription>Fill in the details to create a new purchase order</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="vendor">Vendor *</Label>
                  <Select value={newPO.vendor} onValueChange={(value) => setNewPO({...newPO, vendor: value})}>
                    <SelectTrigger id="vendor">
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="material">Material Name *</Label>
                  <Input id="material" value={newPO.material} onChange={(e) => setNewPO({...newPO, material: e.target.value})} placeholder="e.g., Cement, Steel Rods" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input id="quantity" type="number" value={newPO.quantity} onChange={(e) => setNewPO({...newPO, quantity: e.target.value})} placeholder="0" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="unit">Unit</Label>
                    <Select value={newPO.unit} onValueChange={(value) => setNewPO({...newPO, unit: value})}>
                      <SelectTrigger id="unit">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bags">Bags</SelectItem>
                        <SelectItem value="Tons">Tons</SelectItem>
                        <SelectItem value="Liters">Liters</SelectItem>
                        <SelectItem value="Units">Units</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="delivery">Expected Delivery Date</Label>
                  <Input id="delivery" type="date" value={newPO.expectedDelivery} onChange={(e) => setNewPO({...newPO, expectedDelivery: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="remarks">Remarks</Label>
                  <Textarea id="remarks" value={newPO.remarks} onChange={(e) => setNewPO({...newPO, remarks: e.target.value})} placeholder="Additional notes..." rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePO}>Create PO</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total POs This Month"
          value={totalPOs.toString()}
          subtitle="purchase orders"
          icon={ShoppingCart}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Pending Approval"
          value={pendingApproval.toString()}
          subtitle="awaiting review"
          icon={CheckCircle}
          colorClass="bg-amber-100 dark:bg-amber-900/30"
        />
        <KPICard
          title="POs Raised Today"
          value={todayPOs.toString()}
          subtitle="new orders"
          icon={Upload}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Total PO Value"
          value="₹14.0L"
          subtitle="this month"
          icon={Download}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 8.3, isPositive: true }}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly PO Value vs Actual Spend</CardTitle>
          <CardDescription>Last 6 months comparison (in ₹L)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
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
              <Bar dataKey="poValue" fill="#3b82f6" name="PO Value (₹L)" />
              <Bar dataKey="actualSpend" fill="#10b981" name="Actual Spend (₹L)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* PO Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Orders</CardTitle>
          <CardDescription>All purchase orders with status tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor Name</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="text-xs">{po.poNumber}</TableCell>
                    <TableCell className="text-xs">{po.date}</TableCell>
                    <TableCell className="text-xs">{po.vendor}</TableCell>
                    <TableCell className="text-xs">{po.material}</TableCell>
                    <TableCell className="text-xs">{po.quantity}</TableCell>
                    <TableCell className="text-xs">{po.unit}</TableCell>
                    <TableCell className="text-xs">{po.totalValue}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        {po.status === "pending" && (
                          <>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <XCircle className="h-3.5 w-3.5 text-red-600" />
                            </Button>
                          </>
                        )}
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
