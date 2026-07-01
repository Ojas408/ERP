import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { MapPin, Building2, TrendingUp, DollarSign, Plus, Edit, Trash2, RefreshCw, Search, Briefcase } from "lucide-react"
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
import { exportToExcel, downloadExcelTemplate, parseExcelFile, printReport } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    status: "active",
    budget: "5000000",
    clientName: "",
    managerName: "",
    progress: "0"
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const data = await fetchSites()
      setProjects(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // Create new project mapping to sites backend API
      await createSite({
        name: newProject.name,
        location: newProject.location,
        status: newProject.status,
        // Send extra metadata fields if needed, or stick to backend model
      })
      setIsAddOpen(false)
      setNewProject({
        name: "",
        location: "",
        status: "active",
        budget: "5000000",
        clientName: "",
        managerName: "",
        progress: "0"
      })
      loadProjects()
    } catch (error) {
      console.error("Failed to add project:", error)
    }
  }

  const handleEdit = (project: any) => {
    setEditingItem({
      ...project,
      budget: project.budget || "5000000",
      clientName: project.clientName || "",
      managerName: project.managerName || "",
      progress: project.progress || "0"
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('sites', editingItem.id, {
        name: editingItem.name,
        location: editingItem.location,
        status: editingItem.status
      })
      setIsEditOpen(false)
      setEditingItem(null)
      loadProjects()
    } catch (error) {
      console.error("Failed to update project:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      await deleteRecord('sites', id)
      loadProjects()
    } catch (error) {
      console.error("Failed to delete project:", error)
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(["name", "location", "status"], "projects_template")
  }

  const handleExcelImport = (file: File) => {
    parseExcelFile(file)
      .then((data) => {
        setImportData(data)
        setIsImportOpen(true)
      })
      .catch((error) => {
        toast.error(error.message || "Failed to parse excel file")
      })
  }

  const handleConfirmImport = async (validData: any[]) => {
    try {
      for (const row of validData) {
        await createSite({
          name: row.name || "",
          location: row.location || "",
          status: row.status || "active",
        })
      }
      toast.success("Successfully imported projects")
      loadProjects()
    } catch (error) {
      toast.error("Failed to import some projects")
    }
  }

  const handleExportExcel = () => {
    const dataToExport = safeProjects.map((p) => ({
      "Project Name": p.name,
      "Location": p.location || "N/A",
      "Status": p.status,
    }))
    exportToExcel(dataToExport, "projects")
  }

  const handlePrint = () => {
    const headers = ["Project Name", "Location", "Status"]
    const rows = safeProjects.map((p) => [
      p.name,
      p.location || "N/A",
      p.status,
    ])
    printReport("Projects Directory", headers, rows)
  }

  const validateRecord = (row: any) => {
    const errors: string[] = []
    if (!row.name) errors.push("Name is required")
    if (!row.location) errors.push("Location is required")
    return errors
  }

  const safeProjects = Array.isArray(projects) ? projects : []

  // Client-side search and filters
  const filteredProjects = safeProjects.filter(project => {
    const matchesSearch = 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.location || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = safeProjects.filter(s => s.status === "active").length
  const completedCount = safeProjects.filter(s => s.status === "completed").length
  const holdCount = safeProjects.filter(s => s.status === "on-hold").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2 font-bold tracking-tight">Projects Directory</h1>
          <p className="text-sm text-muted-foreground">Manage and track construction projects and budgets</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" className="text-xs h-9" onClick={loadProjects}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9" onClick={handleDownloadTemplate}>
            Template
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2">
              Import Excel
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleExcelImport(file)
                }
                e.target.value = ""
              }}
            />
          </label>
          <Button variant="outline" className="text-xs h-9" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="outline" className="text-xs h-9" onClick={handlePrint}>
            Print
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9">
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Project</DialogTitle>
                <DialogDescription>Register a new project site on the platform</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" placeholder="e.g. Skyline Residency" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} required />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="location">Location / Address</Label>
                    <Input id="location" placeholder="e.g. Seattle, WA" value={newProject.location} onChange={e => setNewProject({...newProject, location: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="budget">Estimated Budget ($)</Label>
                    <Input id="budget" type="number" placeholder="5000000" value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={newProject.status} onValueChange={v => setNewProject({...newProject, status: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client Name</Label>
                    <Input id="client" placeholder="Acme Corp" value={newProject.clientName} onChange={e => setNewProject({...newProject, clientName: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manager">Project Manager</Label>
                    <Input id="manager" placeholder="Sarah Connor" value={newProject.managerName} onChange={e => setNewProject({...newProject, managerName: e.target.value})} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Create Project</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Projects" value={safeProjects.length.toString()} subtitle="registered sites" icon={Briefcase} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Active" value={activeCount.toString()} subtitle="in progress" icon={MapPin} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="Completed" value={completedCount.toString()} subtitle="closed out" icon={TrendingUp} colorClass="bg-purple-100 dark:bg-purple-900/30" />
        <KPICard title="On Hold" value={holdCount.toString()} subtitle="waiting review" icon={DollarSign} colorClass="bg-orange-100 dark:bg-orange-900/30" />
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name or location..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] text-xs h-9">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Project Directory Table</CardTitle>
          <CardDescription>Click actions to edit or delete site allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Budget</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading projects...
                    </TableCell>
                  </TableRow>
                ) : filteredProjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No projects found matching the criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProjects.map((project) => {
                    const mockBudget = Number(project.budget || 5000000).toLocaleString();
                    const mockProgress = Number(project.progress || (project.status === 'completed' ? 100 : project.status === 'on-hold' ? 30 : 65));
                    
                    return (
                      <TableRow key={project.id}>
                        <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400">{project.name}</TableCell>
                        <TableCell className="text-xs">{project.location || 'N/A'}</TableCell>
                        <TableCell className="text-xs">{project.clientName || 'Acme Construction'}</TableCell>
                        <TableCell className="text-xs font-semibold">₹{mockBudget}</TableCell>
                        <TableCell className="w-[180px]">
                          <div className="flex items-center gap-2">
                            <Progress value={mockProgress} className="h-2 w-24" />
                            <span className="text-xs text-muted-foreground font-mono">{mockProgress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={project.status === "active" ? "default" : project.status === "completed" ? "secondary" : "outline"} className="text-[10px] h-5 uppercase">
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(project)}>
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive" onClick={() => handleDelete(project.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project details</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Project Name</Label>
                  <Input id="edit-name" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input id="edit-location" value={editingItem.location} onChange={e => setEditingItem({...editingItem, location: e.target.value})} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editingItem.status} onValueChange={v => setEditingItem({...editingItem, status: v})}>
                    <SelectTrigger id="edit-status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Update Project</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["name", "location", "status"]}
        validationRules={validateRecord}
        onConfirm={handleConfirmImport}
        title="Import Projects Preview"
      />
    </div>
  )
}
