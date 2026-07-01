import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList
} from "lucide-react"
import { 
  fetchRmcGrades, 
  createRmcGrade, 
  deleteRecord, 
  updateRecord 
} from "../services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog"
import { toast } from "sonner"

export default function RMCGrade() {
  const [grades, setGrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search
  const [searchQuery, setSearchQuery] = useState("")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // Form States
  const [newGrade, setNewGrade] = useState({
    grade: "",
    mixRatio: "",
    cementContent: "",
    waterCementRatio: "",
    admixture: "",
    description: ""
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await fetchRmcGrades()
      setGrades(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load RMC grades:", error)
      toast.error("Failed to load RMC grades")
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createRmcGrade({
        ...newGrade,
        cementContent: newGrade.cementContent ? parseFloat(newGrade.cementContent) : null,
        waterCementRatio: newGrade.waterCementRatio ? parseFloat(newGrade.waterCementRatio) : null
      })
      toast.success("RMC Grade added successfully")
      setIsAddOpen(false)
      setNewGrade({
        grade: "",
        mixRatio: "",
        cementContent: "",
        waterCementRatio: "",
        admixture: "",
        description: ""
      })
      loadData()
    } catch (error) {
      toast.error("Failed to add RMC Grade")
    }
  }

  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      cementContent: item.cementContent ? String(item.cementContent) : "",
      waterCementRatio: item.waterCementRatio ? String(item.waterCementRatio) : "",
      mixRatio: item.mixRatio || "",
      admixture: item.admixture || "",
      description: item.description || ""
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('rmc-grades', editingItem.id, {
        ...editingItem,
        cementContent: editingItem.cementContent ? parseFloat(editingItem.cementContent) : null,
        waterCementRatio: editingItem.waterCementRatio ? parseFloat(editingItem.waterCementRatio) : null
      })
      toast.success("RMC Grade updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update RMC grade")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this RMC Grade?")) return
    try {
      await deleteRecord('rmc-grades', id)
      toast.success("RMC Grade deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete RMC Grade")
    }
  }

  // Filter calculations
  const filteredGrades = grades.filter(item => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (item.grade || "").toLowerCase().includes(searchLower) ||
      (item.mixRatio || "").toLowerCase().includes(searchLower) ||
      (item.description || "").toLowerCase().includes(searchLower)
    )
  })

  // Pagination
  const totalPages = Math.ceil(filteredGrades.length / pageSize)
  const paginatedGrades = filteredGrades.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // KPIs
  const totalGrades = grades.length
  const standardGradesCount = grades.filter(g => ["M20", "M25", "M30"].includes(g.grade.toUpperCase())).length
  const highStrengthGradesCount = grades.filter(g => {
    const num = parseInt(g.grade.replace(/\D/g, ''))
    return num >= 35
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Ready Mix Concrete (RMC) Mix Designs</h1>
          <p className="text-sm text-muted-foreground font-medium">Manage and define RMC grades, design mix proportions, and water-cement strength thresholds</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Mix Design
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add RMC Grade Design Mix</DialogTitle>
                <DialogDescription>Define mix proportions and cement parameters for concrete output</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="rmcGrade">Grade Name * (e.g. M20, M25, M30)</Label>
                    <Input id="rmcGrade" placeholder="M25" value={newGrade.grade} onChange={e => setNewGrade({...newGrade, grade: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rmcRatio">Mix Ratio (e.g. 1:1.5:3)</Label>
                    <Input id="rmcRatio" placeholder="1:1:2" value={newGrade.mixRatio} onChange={e => setNewGrade({...newGrade, mixRatio: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rmcCement">Cement Content (kg/m³)</Label>
                    <Input id="rmcCement" type="number" placeholder="380" value={newGrade.cementContent} onChange={e => setNewGrade({...newGrade, cementContent: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rmcWc">Water-Cement Ratio</Label>
                    <Input id="rmcWc" type="number" step="0.01" placeholder="0.45" value={newGrade.waterCementRatio} onChange={e => setNewGrade({...newGrade, waterCementRatio: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="rmcAdmixture">Chemical Admixture</Label>
                    <Input id="rmcAdmixture" placeholder="Superplasticizer 0.8%" value={newGrade.admixture} onChange={e => setNewGrade({...newGrade, admixture: e.target.value})} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="rmcDesc">Mix Specifications / Description</Label>
                    <Input id="rmcDesc" placeholder="Standard mix design for slab and beams casting. Slump: 100-120mm." value={newGrade.description} onChange={e => setNewGrade({...newGrade, description: e.target.value})} />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Add RMC Grade</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard title="Total RMC Grades" value={totalGrades.toString()} subtitle="defined mix designs" icon={Database} colorClass="bg-slate-50 text-slate-500" />
        <KPICard title="Standard Concrete" value={standardGradesCount.toString()} subtitle="M20, M25, M30 grades" icon={ClipboardList} colorClass="bg-blue-50 text-blue-600" />
        <KPICard title="High Strength Concrete" value={highStrengthGradesCount.toString()} subtitle=">= M35 grades" icon={ClipboardList} colorClass="bg-purple-50 text-purple-600" />
      </div>

      {/* Search */}
      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Grade, Mix Ratio or description..."
            className="pl-9 text-xs h-9 bg-background border-slate-300"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white">Design Mix Registry</CardTitle>
          <CardDescription>RMC Grades and design specifications. Used in production and casting reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Concrete Grade</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Mix Proportion (C:FA:CA)</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Cement Content</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Water-Cement Ratio</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Admixtures</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Mix Description</TableHead>
                  <TableHead className="w-24 text-right font-bold text-slate-700 dark:text-slate-200">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">Loading records...</TableCell></TableRow>
                ) : paginatedGrades.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-xs">No RMC grades logged.</TableCell></TableRow>
                ) : (
                  paginatedGrades.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono text-[13px]">{item.grade}</TableCell>
                      <TableCell className="text-xs font-semibold">{item.mixRatio || "N/A"}</TableCell>
                      <TableCell className="text-xs">{item.cementContent ? `${item.cementContent} kg/m³` : "N/A"}</TableCell>
                      <TableCell className="text-xs font-mono font-medium">{item.waterCementRatio || "N/A"}</TableCell>
                      <TableCell className="text-xs">{item.admixture || "-"}</TableCell>
                      <TableCell className="text-xs max-w-[250px] truncate" title={item.description}>{item.description || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(item)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredGrades.length} total designs)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit RMC Grade Specifications</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 col-span-2">
                  <Label>Grade Name *</Label>
                  <Input value={editingItem.grade} onChange={e => setEditingItem({...editingItem, grade: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Mix Ratio</Label>
                  <Input value={editingItem.mixRatio} onChange={e => setEditingItem({...editingItem, mixRatio: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Cement Content (kg/m³)</Label>
                  <Input type="number" value={editingItem.cementContent} onChange={e => setEditingItem({...editingItem, cementContent: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Water-Cement Ratio</Label>
                  <Input type="number" step="0.01" value={editingItem.waterCementRatio} onChange={e => setEditingItem({...editingItem, waterCementRatio: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <Label>Chemical Admixture</Label>
                  <Input value={editingItem.admixture} onChange={e => setEditingItem({...editingItem, admixture: e.target.value})} />
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Mix Specifications / Description</Label>
                  <Input value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
