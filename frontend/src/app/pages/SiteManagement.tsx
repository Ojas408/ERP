import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { MapPin, Building2, TrendingUp, Upload, Download, Plus, Edit, Trash2, RefreshCw } from "lucide-react"
import { fetchSites, createSite, deleteRecord, updateRecord } from "../services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"

export default function SiteManagement() {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const [newSite, setNewSite] = useState({
    name: "",
    location: "",
    status: "active"
  })

  useEffect(() => {
    loadSites()
  }, [])

  const loadSites = async () => {
    try {
      setLoading(true)
      const data = await fetchSites()
      setSites(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load sites:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSite(newSite)
      setIsAddOpen(false)
      setNewSite({ name: "", location: "", status: "active" })
      loadSites()
    } catch (error) {
      console.error("Failed to add site:", error)
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem(item)
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('sites', editingItem.id, editingItem)
      setIsEditOpen(false)
      setEditingItem(null)
      loadSites()
    } catch (error) {
      console.error("Failed to update site:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      await deleteRecord('sites', id)
      loadSites()
    } catch (error) {
      console.error("Failed to delete site:", error)
    }
  }

  const safeSites = Array.isArray(sites) ? sites : []
  const activeSitesCount = safeSites.filter(s => s.status === "active").length
  
  const resourceAllocation = [
    { name: 'Active', value: safeSites.length > 0 ? (activeSitesCount / safeSites.length) * 100 : 0, color: '#3b82f6' },
    { name: 'Other', value: safeSites.length > 0 ? ((safeSites.length - activeSitesCount) / safeSites.length) * 100 : 0, color: '#e5e7eb' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Site Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage construction sites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadSites}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9"><Download className="h-4 w-4 mr-2" />Export CSV</Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9"><Plus className="h-4 w-4 mr-2" />Add Site</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Site</DialogTitle>
                <DialogDescription>Register a new construction site</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2"><Label>Site Name</Label><Input placeholder="e.g. Skyline Residency" value={newSite.name} onChange={e => setNewSite({...newSite, name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Location</Label><Input placeholder="e.g. Mumbai" value={newSite.location} onChange={e => setNewSite({...newSite, location: e.target.value})} required /></div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={newSite.status} onValueChange={v => setNewSite({...newSite, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button type="submit">Add Site</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Active Sites" value={activeSitesCount.toString()} subtitle={`of ${safeSites.length}`} icon={MapPin} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Total Sites" value={safeSites.length.toString()} icon={Building2} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Completion" value="65%" icon={TrendingUp} colorClass="bg-purple-100 dark:bg-purple-900/30" />
        <KPICard title="Total Revenue" value="₹71.3L" icon={Building2} colorClass="bg-orange-100 dark:bg-orange-900/30" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={resourceAllocation} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value.toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                  {resourceAllocation.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Site Roster</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {safeSites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell className="text-xs font-medium">{site.name}</TableCell>
                      <TableCell className="text-xs">{site.location}</TableCell>
                      <TableCell><Badge variant={site.status === "active" ? "default" : "outline"} className="text-[10px] h-5">{site.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(site)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(site.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
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

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Site</DialogTitle></DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2"><Label>Site Name</Label><Input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Location</Label><Input value={editingItem.location} onChange={e => setEditingItem({...editingItem, location: e.target.value})} required /></div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button type="submit">Update Site</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
