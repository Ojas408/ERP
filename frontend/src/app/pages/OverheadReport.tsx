import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { DollarSign, RefreshCw, BarChart2, Truck, Layers, Plus, Trash2, Edit } from "lucide-react"
import { fetchOverheadEntries, fetchOverheadSummary, createOverheadEntry, fetchSites, deleteRecord } from "../services/api"
import { toast } from "sonner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ef4444', '#14b8a6']

const OVERHEAD_CATEGORIES = [
  "Transit Mixture",
  "Slabs",
  "Cement",
  "Aggregate",
  "Labour",
  "Fuel",
  "Maintenance",
  "Equipment Hire",
  "Other",
]

export default function OverheadReport() {
  const [entries, setEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newEntry, setNewEntry] = useState({
    category: "Transit Mixture",
    description: "",
    quantity: "",
    unit: "cum",
    amount: "",
    siteId: "",
    date: new Date().toISOString().slice(0, 16),
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [entryData, summaryData, siteData] = await Promise.all([
        fetchOverheadEntries(),
        fetchOverheadSummary(),
        fetchSites(),
      ])
      setEntries(Array.isArray(entryData) ? entryData : [])
      setSummary(summaryData)
      setSites(Array.isArray(siteData) ? siteData : [])
    } catch (error) {
      console.error("Failed to load overhead data:", error)
      toast.error("Failed to load overhead report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOverheadEntry({
        ...newEntry,
        quantity: newEntry.quantity ? parseFloat(newEntry.quantity) : null,
        amount: parseFloat(newEntry.amount) || 0,
        siteId: newEntry.siteId || null,
        date: new Date(newEntry.date).toISOString(),
      })
      toast.success("Overhead entry added")
      setIsAddOpen(false)
      setNewEntry({
        category: "Transit Mixture",
        description: "",
        quantity: "",
        unit: "cum",
        amount: "",
        siteId: "",
        date: new Date().toISOString().slice(0, 16),
      })
      loadData()
    } catch {
      toast.error("Failed to add overhead entry")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this overhead entry?")) return
    try {
      await deleteRecord("overhead", id)
      toast.success("Entry deleted")
      loadData()
    } catch {
      toast.error("Failed to delete entry")
    }
  }

  const overheadData = summary?.entries?.map((e: any) => ({
    name: e.category,
    amount: e.amount,
    quantity: e.quantity,
    unit: e.unit,
  })) || []

  const pieData = overheadData.filter((i: any) => i.amount > 0)
  const grandTotal = summary?.grandTotal || 0
  const transitMix = summary?.transitMixture || { quantity: 0, amount: 0, unit: 'cum' }
  const slabs = summary?.slabs || { quantity: 0, amount: 0, unit: 'sqm' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight">Total Overhead Report</h1>
          <p className="text-sm text-muted-foreground">Transit mixture, slabs, cement, aggregate, labour, fuel and all site overheads</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Overhead Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Overhead Entry</DialogTitle>
                <DialogDescription>Record transit mixture, slabs, or other overhead costs</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label>Category *</Label>
                    <Select value={newEntry.category} onValueChange={v => setNewEntry({ ...newEntry, category: v, unit: v === 'Slabs' ? 'sqm' : v === 'Transit Mixture' ? 'cum' : newEntry.unit })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OVERHEAD_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input type="datetime-local" value={newEntry.date} onChange={e => setNewEntry({ ...newEntry, date: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Site</Label>
                    <Select value={newEntry.siteId} onValueChange={v => setNewEntry({ ...newEntry, siteId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Quantity</Label>
                    <Input type="number" placeholder="150" value={newEntry.quantity} onChange={e => setNewEntry({ ...newEntry, quantity: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label>Unit</Label>
                    <Select value={newEntry.unit} onValueChange={v => setNewEntry({ ...newEntry, unit: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cum">Cu.M (cum)</SelectItem>
                        <SelectItem value="sqm">Sq.M</SelectItem>
                        <SelectItem value="bags">Bags</SelectItem>
                        <SelectItem value="tons">Tons</SelectItem>
                        <SelectItem value="trips">Trips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Amount (₹) *</Label>
                    <Input type="number" placeholder="50000" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Description</Label>
                    <Input placeholder="RMC batch / slab casting / etc." value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Entry</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Overhead" value={`₹${grandTotal.toLocaleString()}`} subtitle="all categories combined" icon={DollarSign} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Transit Mixture" value={`${transitMix.quantity} ${transitMix.unit}`} subtitle={`₹${transitMix.amount.toLocaleString()} cost`} icon={Truck} colorClass="bg-indigo-100 dark:bg-indigo-900/30" />
        <KPICard title="Slabs" value={`${slabs.quantity} ${slabs.unit}`} subtitle={`₹${slabs.amount.toLocaleString()} cost`} icon={Layers} colorClass="bg-amber-100 dark:bg-amber-900/30" />
        <KPICard title="Labour Wages" value={`₹${(summary?.totalSalaries || 0).toLocaleString()}`} subtitle="monthly salary overhead" icon={BarChart2} colorClass="bg-green-100 dark:bg-green-900/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overhead by Category</CardTitle>
            <CardDescription>Transit mixture, slabs, cement, aggregate and more</CardDescription>
          </CardHeader>
          <CardContent>
            {overheadData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No overhead data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={overheadData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cost Share</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="amount" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {pieData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overhead Details</CardTitle>
          <CardDescription>All overhead entries — transit mixture, slabs, materials, labour and more</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-medium">{entry.category}</TableCell>
                    <TableCell className="text-xs">{entry.description || "-"}</TableCell>
                    <TableCell className="text-xs">{entry.site?.name || "-"}</TableCell>
                    <TableCell className="text-xs">{entry.quantity ? `${entry.quantity} ${entry.unit || ''}` : "-"}</TableCell>
                    <TableCell className="text-xs font-semibold">₹{(entry.amount || 0).toLocaleString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(entry.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
