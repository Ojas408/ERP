import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import {
  MapPin,
  Building2,
  TrendingUp,
  DollarSign,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  Briefcase,
  Eye,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  Activity,
  Truck,
  Factory,
  Package,
  LayoutGrid,
  List,
  Check,
  ArrowUpRight,
  Filter,
} from "lucide-react"
import { fetchSites, fetchSiteById, createSite, deleteRecord, updateRecord } from "../services/api"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { exportToExcel, downloadExcelTemplate, parseExcelFile, printReport } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { useSiteFilter } from "../contexts/SiteFilterContext"
import { toast } from "sonner"

interface ProjectsProps {
  onNavigate?: (moduleId: string) => void
}

export default function Projects({ onNavigate }: ProjectsProps) {
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  
  const [editingItem, setEditingItem] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [projectDetailsLoading, setProjectDetailsLoading] = useState(false)

  // Excel import
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  // Active site context
  const { selectedSiteId, setSelectedSiteId } = useSiteFilter()

  const [newProject, setNewProject] = useState({
    name: "",
    location: "",
    status: "active",
    budget: "5000000",
    spent: "0",
    clientName: "",
    managerName: "",
    progress: "0",
    startDate: "",
    endDate: "",
    description: "",
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
      toast.error("Failed to load projects list")
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = async (project: any) => {
    setSelectedProject(project)
    setIsDetailOpen(true)
    try {
      setProjectDetailsLoading(true)
      const detailed = await fetchSiteById(project.id)
      if (detailed) {
        setSelectedProject(detailed)
      }
    } catch (error) {
      console.error("Failed to fetch project details:", error)
    } finally {
      setProjectDetailsLoading(false)
    }
  }

  const handleSetActiveSite = (project: any) => {
    setSelectedSiteId(project.id)
    toast.success(`Active ERP Workspace site set to "${project.name}"`)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createSite({
        name: newProject.name,
        location: newProject.location,
        status: newProject.status,
        clientName: newProject.clientName,
        managerName: newProject.managerName,
        budget: newProject.budget,
        spent: newProject.spent,
        progress: newProject.progress,
        startDate: newProject.startDate || null,
        endDate: newProject.endDate || null,
        description: newProject.description,
      })
      toast.success("Project created successfully")
      setIsAddOpen(false)
      setNewProject({
        name: "",
        location: "",
        status: "active",
        budget: "5000000",
        spent: "0",
        clientName: "",
        managerName: "",
        progress: "0",
        startDate: "",
        endDate: "",
        description: "",
      })
      loadProjects()
    } catch (error) {
      console.error("Failed to add project:", error)
      toast.error("Failed to create project")
    }
  }

  const handleEdit = (project: any) => {
    setEditingItem({
      ...project,
      budget: project.budget !== undefined && project.budget !== null ? String(project.budget) : "5000000",
      spent: project.spent !== undefined && project.spent !== null ? String(project.spent) : "0",
      clientName: project.clientName || "",
      managerName: project.managerName || "",
      progress: project.progress !== undefined && project.progress !== null ? String(project.progress) : "0",
      startDate: project.startDate ? project.startDate.substring(0, 10) : "",
      endDate: project.endDate ? project.endDate.substring(0, 10) : "",
      description: project.description || "",
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord("sites", editingItem.id, {
        name: editingItem.name,
        location: editingItem.location,
        status: editingItem.status,
        clientName: editingItem.clientName,
        managerName: editingItem.managerName,
        budget: editingItem.budget,
        spent: editingItem.spent,
        progress: editingItem.progress,
        startDate: editingItem.startDate || null,
        endDate: editingItem.endDate || null,
        description: editingItem.description,
      })
      toast.success("Project updated successfully")
      setIsEditOpen(false)
      if (selectedProject && selectedProject.id === editingItem.id) {
        setSelectedProject({ ...selectedProject, ...editingItem })
      }
      setEditingItem(null)
      loadProjects()
    } catch (error) {
      console.error("Failed to update project:", error)
      toast.error("Failed to update project")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      await deleteRecord("sites", id)
      toast.success("Project deleted successfully")
      if (selectedProject?.id === id) {
        setIsDetailOpen(false)
        setSelectedProject(null)
      }
      loadProjects()
    } catch (error) {
      console.error("Failed to delete project:", error)
      toast.error("Failed to delete project")
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(["name", "location", "status", "clientName", "managerName", "budget", "progress"], "projects_template")
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
          clientName: row.clientName || "",
          managerName: row.managerName || "",
          budget: row.budget ? String(row.budget) : "5000000",
          progress: row.progress ? String(row.progress) : "0",
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
      "Client": p.clientName || "N/A",
      "Manager": p.managerName || "N/A",
      "Budget ($)": p.budget || 5000000,
      "Progress (%)": p.progress || 0,
    }))
    exportToExcel(dataToExport, "projects_directory")
  }

  const handlePrint = () => {
    const headers = ["Project Name", "Location", "Client", "Manager", "Budget ($)", "Progress", "Status"]
    const rows = safeProjects.map((p) => [
      p.name,
      p.location || "N/A",
      p.clientName || "N/A",
      p.managerName || "N/A",
      Number(p.budget || 5000000).toLocaleString(),
      `${p.progress || 0}%`,
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
  const filteredProjects = safeProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.managerName || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const activeCount = safeProjects.filter((s) => s.status === "active").length
  const completedCount = safeProjects.filter((s) => s.status === "completed").length
  const holdCount = safeProjects.filter((s) => s.status === "on-hold").length

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Projects Directory</h1>
          <p className="text-sm text-muted-foreground">
            Manage construction sites, inspect project details, track budgets and milestone progress
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={loadProjects}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {/* View mode toggle */}
          <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List className="h-4 w-4 mr-1" />
              Table
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs"
              onClick={() => setViewMode("grid")}
              title="Grid Cards View"
            >
              <LayoutGrid className="h-4 w-4 mr-1" />
              Cards
            </Button>
          </div>

          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleDownloadTemplate}>
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

          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handleExportExcel}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" className="text-xs h-9" onClick={handlePrint}>
            Print
          </Button>

          {/* Add Project Dialog */}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="h-4 w-4 mr-1.5" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Construction Project</DialogTitle>
                <DialogDescription>
                  Register a new project site with full details, budget estimations, and management team
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Skyline Heights Tower A & B"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="location">Site Location / Address *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. Sector 62, Metro Corridor, Pune"
                      value={newProject.location}
                      onChange={(e) => setNewProject({ ...newProject, location: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="client">Client / Developer Name</Label>
                    <Input
                      id="client"
                      placeholder="e.g. Prestige Estates Pvt Ltd"
                      value={newProject.clientName}
                      onChange={(e) => setNewProject({ ...newProject, clientName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Project Manager In-Charge</Label>
                    <Input
                      id="manager"
                      placeholder="e.g. Er. Rajesh Verma"
                      value={newProject.managerName}
                      onChange={(e) => setNewProject({ ...newProject, managerName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Estimated Budget ($)</Label>
                    <Input
                      id="budget"
                      type="number"
                      placeholder="5000000"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="spent">Spent to Date ($)</Label>
                    <Input
                      id="spent"
                      type="number"
                      placeholder="0"
                      value={newProject.spent}
                      onChange={(e) => setNewProject({ ...newProject, spent: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progress">Current Progress (%)</Label>
                    <Input
                      id="progress"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0"
                      value={newProject.progress}
                      onChange={(e) => setNewProject({ ...newProject, progress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Project Status</Label>
                    <Select
                      value={newProject.status}
                      onValueChange={(v) => setNewProject({ ...newProject, status: v })}
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active (Under Construction)</SelectItem>
                        <SelectItem value="completed">Completed / Handed Over</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Target Handover Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="description">Scope / Project Description</Label>
                    <Input
                      id="description"
                      placeholder="Brief summary of construction scope, total towers, slabs, etc."
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create Project
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Projects"
          value={safeProjects.length.toString()}
          subtitle="registered sites"
          icon={Briefcase}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Active Sites"
          value={activeCount.toString()}
          subtitle="under active operations"
          icon={MapPin}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Completed"
          value={completedCount.toString()}
          subtitle="delivered successfully"
          icon={TrendingUp}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
        />
        <KPICard
          title="On Hold"
          value={holdCount.toString()}
          subtitle="awaiting review or permit"
          icon={DollarSign}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
        />
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by project name, location, client, or manager..."
              className="pl-9 text-xs"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <span className="text-xs text-muted-foreground hidden sm:inline">Filter by:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] text-xs h-9">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="completed">Completed Only</SelectItem>
                <SelectItem value="on-hold">On Hold Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Grid Cards View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              Loading projects...
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground">
              No projects found matching the criteria.
            </div>
          ) : (
            filteredProjects.map((project) => {
              const budgetVal = Number(project.budget || 5000000)
              const spentVal = Number(project.spent || 0)
              const progressVal = Number(
                project.progress !== undefined && project.progress !== null
                  ? project.progress
                  : project.status === "completed"
                  ? 100
                  : project.status === "on-hold"
                  ? 30
                  : 65
              )
              const isCurrentActive = selectedSiteId === project.id

              return (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-shadow cursor-pointer border flex flex-col justify-between"
                  onClick={() => handleViewDetails(project)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline break-words break-all [overflow-wrap:anywhere]">
                          <span>{project.name}</span>
                          <ArrowUpRight className="h-4 w-4 opacity-70 shrink-0" />
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs mt-1">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="truncate">{project.location || "Location not set"}</span>
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === "active"
                            ? "default"
                            : project.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] uppercase font-semibold h-5"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 p-2.5 rounded-lg border">
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Client</span>
                        <span className="font-medium truncate block">
                          {project.clientName || "Direct Owner"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] uppercase">Manager</span>
                        <span className="font-medium truncate block">
                          {project.managerName || "Site Lead"}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-muted-foreground block text-[10px] uppercase">Budget</span>
                        <span className="font-semibold block font-mono text-emerald-600 dark:text-emerald-400">
                          ${budgetVal.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1">
                        <span className="text-muted-foreground block text-[10px] uppercase">Spent</span>
                        <span className="font-semibold block font-mono">
                          ${spentVal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Completion Progress</span>
                        <span className="font-bold font-mono">{progressVal}%</span>
                      </div>
                      <Progress value={progressVal} className="h-2" />
                    </div>

                    {project._count && (
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1 border-t">
                        <span className="flex items-center gap-1" title="Production Batches">
                          <Factory className="h-3 w-3 text-blue-500" />
                          {project._count.productions || 0} Pours
                        </span>
                        <span className="flex items-center gap-1" title="Raw Materials Inward">
                          <Package className="h-3 w-3 text-amber-500" />
                          {project._count.materialInwards || 0} Inward
                        </span>
                        <span className="flex items-center gap-1" title="Assigned Fleet">
                          <Truck className="h-3 w-3 text-emerald-500" />
                          {project._count.vehicles || 0} Vehicles
                        </span>
                      </div>
                    )}
                  </CardContent>

                  <div className="p-3 border-t bg-muted/10 flex items-center justify-between gap-2">
                    <Button
                      variant={isCurrentActive ? "secondary" : "outline"}
                      size="sm"
                      className="text-xs h-7 px-2.5"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetActiveSite(project)
                      }}
                    >
                      {isCurrentActive ? (
                        <>
                          <Check className="h-3 w-3 mr-1 text-green-600" /> Active Workspace
                        </>
                      ) : (
                        <>
                          <Filter className="h-3 w-3 mr-1" /> Set Active
                        </>
                      )}
                    </Button>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-blue-600"
                        title="View Project Details"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(project)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        title="Edit Project"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(project)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        title="Delete Project"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(project.id)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      ) : (
        /* Table View */
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Project Directory Table</CardTitle>
                <CardDescription>
                  Click on any project row or click the <Eye className="inline h-3 w-3 mx-0.5 text-blue-600" /> icon to view complete details, financials, and operational telemetry
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {filteredProjects.length} Projects Listed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Project Manager</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Loading projects...
                      </TableCell>
                    </TableRow>
                  ) : filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No projects found matching the criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => {
                      const budgetVal = Number(project.budget || 5000000)
                      const progressVal = Number(
                        project.progress !== undefined && project.progress !== null
                          ? project.progress
                          : project.status === "completed"
                          ? 100
                          : project.status === "on-hold"
                          ? 30
                          : 65
                      )
                      const isCurrentActive = selectedSiteId === project.id

                      return (
                        <TableRow
                          key={project.id}
                          className="cursor-pointer hover:bg-muted/60 transition-colors"
                          onClick={() => handleViewDetails(project)}
                        >
                          <TableCell className="text-xs font-semibold text-blue-600 dark:text-blue-400 max-w-[240px]">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="hover:underline truncate block" title={project.name}>{project.name}</span>
                              {isCurrentActive && (
                                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-normal shrink-0">
                                  Active Site
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[180px] truncate" title={project.location || "N/A"}>
                            {project.location || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">{project.clientName || "Direct Owner"}</TableCell>
                          <TableCell className="text-xs">{project.managerName || "Site Lead"}</TableCell>
                          <TableCell className="text-xs font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                            ${budgetVal.toLocaleString()}
                          </TableCell>
                          <TableCell className="w-[180px]">
                            <div className="flex items-center gap-2">
                              <Progress value={progressVal} className="h-2 w-24" />
                              <span className="text-xs text-muted-foreground font-mono">
                                {progressVal}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                project.status === "active"
                                  ? "default"
                                  : project.status === "completed"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="text-[10px] h-5 uppercase font-medium"
                            >
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50"
                                title="View Complete Project Details"
                                onClick={() => handleViewDetails(project)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Edit Project"
                                onClick={() => handleEdit(project)}
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                title="Delete Project"
                                onClick={() => handleDelete(project.id)}
                              >
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
      )}

      {/* ================================================================= */}
      {/* ============ PROJECT DETAILS MODAL / DRAWER (POPUP) ============== */}
      {/* ================================================================= */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="w-[96vw] max-w-[96vw] sm:max-w-3xl md:max-w-4xl lg:max-w-5xl xl:max-w-6xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl rounded-xl border">
          {selectedProject && (
            <div className="flex flex-col h-full max-h-[92vh] overflow-hidden">
              {/* Top Banner Header - dynamically scales, wraps, and leaves room for Radix close X */}
              <div className="p-5 sm:p-6 pr-14 sm:pr-16 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 text-white shrink-0">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shrink-0 mt-0.5">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-lg sm:text-2xl font-bold tracking-tight text-white break-words break-all [overflow-wrap:anywhere] leading-snug">
                          {selectedProject.name}
                        </h2>
                        <Badge className="bg-white/20 hover:bg-white/30 text-white uppercase text-[10px] font-bold border-0 shrink-0">
                          {selectedProject.status}
                        </Badge>
                        {selectedSiteId === selectedProject.id && (
                          <Badge className="bg-emerald-500 text-white text-[10px] font-bold border-0 shrink-0">
                            Active ERP Filter
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-blue-200 flex items-start gap-1 break-words break-all [overflow-wrap:anywhere] leading-relaxed">
                        <MapPin className="h-3.5 w-3.5 text-blue-300 shrink-0 mt-0.5" />
                        <span>{selectedProject.location || "No site location specified"}</span>
                      </p>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-8 bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={() => handleSetActiveSite(selectedProject)}
                    >
                      <Filter className="h-3.5 w-3.5 mr-1" />
                      Set Active ERP Site
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="text-xs h-8 bg-white text-blue-900 hover:bg-white/90"
                      onClick={() => handleEdit(selectedProject)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit Details
                    </Button>
                  </div>
                </div>
              </div>

              {/* Scrollable Body - overflow-y-auto overflow-x-hidden ensures NO horizontal scrollbar */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                {/* Quick KPI Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 sm:p-6 bg-muted/30 border-b">
                  <div className="p-3.5 rounded-lg bg-card border shadow-xs min-w-0 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase block font-medium truncate">
                      Total Budget
                    </span>
                    <span className="text-base sm:text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 break-words truncate">
                      ${Number(selectedProject.budget || 5000000).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-card border shadow-xs min-w-0 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase block font-medium truncate">
                      Spent to Date
                    </span>
                    <span className="text-base sm:text-xl font-bold font-mono break-words truncate">
                      ${Number(selectedProject.spent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-card border shadow-xs min-w-0 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase block font-medium truncate">
                      Milestone Progress
                    </span>
                    <div className="flex items-center gap-2 mt-1 min-w-0">
                      <Progress
                        value={Number(selectedProject.progress || 0)}
                        className="h-2 flex-1 min-w-0"
                      />
                      <span className="text-xs font-bold font-mono shrink-0">
                        {selectedProject.progress || 0}%
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-lg bg-card border shadow-xs min-w-0 flex flex-col justify-between">
                    <span className="text-[11px] text-muted-foreground uppercase block font-medium truncate">
                      Operations Logged
                    </span>
                    <span className="text-base sm:text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
                      {selectedProject._count
                        ? (selectedProject._count.productions || 0) +
                          (selectedProject._count.materialInwards || 0) +
                          (selectedProject._count.vehicles || 0)
                        : "Telemetry ready"}
                    </span>
                  </div>
                </div>

                {/* Tabs Section */}
                <div className="p-4 sm:p-6">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid grid-cols-1 sm:grid-cols-3 h-auto p-1 gap-1 mb-6">
                      <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 px-3 text-center">
                        Project Overview
                      </TabsTrigger>
                      <TabsTrigger value="operations" className="text-xs sm:text-sm py-2 px-3 text-center truncate">
                        Site Operations & Fleet
                      </TabsTrigger>
                      <TabsTrigger value="actions" className="text-xs sm:text-sm py-2 px-3 text-center truncate">
                        Linked ERP Navigation
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Project Overview */}
                    <TabsContent value="overview" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project Metadata Details */}
                        <Card className="min-w-0">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <Briefcase className="h-4 w-4 text-blue-600 shrink-0" />
                              General Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-xs">
                            <div className="flex items-start justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Project Name</span>
                              <span className="font-semibold text-xs sm:text-sm text-right break-words break-all [overflow-wrap:anywhere] max-w-[68%]">
                                {selectedProject.name}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Site Location</span>
                              <span className="font-medium text-xs sm:text-sm text-right break-words break-all [overflow-wrap:anywhere] max-w-[68%]">
                                {selectedProject.location || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Client / Developer</span>
                              <span className="font-semibold text-xs sm:text-sm text-right text-blue-600 dark:text-blue-400 break-words break-all [overflow-wrap:anywhere] max-w-[68%]">
                                {selectedProject.clientName || "Direct Owner / Self"}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Project Manager</span>
                              <span className="font-medium text-xs sm:text-sm text-right break-words break-all [overflow-wrap:anywhere] max-w-[68%]">
                                {selectedProject.managerName || "Site In-Charge Engineer"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Operational Status</span>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold shrink-0">
                                {selectedProject.status}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-2.5">
                              <span className="text-muted-foreground shrink-0 text-xs">Unique Site ID</span>
                              <span className="font-mono text-[11px] text-muted-foreground break-all truncate max-w-[65%]">
                                {selectedProject.id}
                              </span>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Timeline & Budget Breakdown */}
                        <Card className="min-w-0">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                              Schedule & Financial Standing
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-1 text-xs">
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Project Start Date</span>
                              <span className="font-mono text-xs sm:text-sm">
                                {selectedProject.startDate
                                  ? new Date(selectedProject.startDate).toLocaleDateString()
                                  : "Scheduled / Ongoing"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Target Handover Date</span>
                              <span className="font-mono text-xs sm:text-sm">
                                {selectedProject.endDate
                                  ? new Date(selectedProject.endDate).toLocaleDateString()
                                  : "Phase Wise Completion"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Remaining Budget</span>
                              <span className="font-mono font-bold text-xs sm:text-sm text-emerald-600 dark:text-emerald-400">
                                $
                                {(
                                  Number(selectedProject.budget || 5000000) -
                                  Number(selectedProject.spent || 0)
                                ).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-4 py-2.5 border-b">
                              <span className="text-muted-foreground shrink-0 text-xs">Budget Burn Rate</span>
                              <span className="font-mono font-medium text-xs sm:text-sm">
                                {Number(selectedProject.budget || 0) > 0
                                  ? (
                                      (Number(selectedProject.spent || 0) /
                                        Number(selectedProject.budget || 5000000)) *
                                      100
                                    ).toFixed(1) + "%"
                                  : "0%"}
                              </span>
                            </div>
                            <div className="pt-2">
                              <span className="text-muted-foreground block text-[11px] mb-1">
                                Project Scope & Objectives:
                              </span>
                              <p className="p-3 rounded bg-muted/40 text-muted-foreground text-xs italic break-words break-all [overflow-wrap:anywhere] leading-relaxed">
                                {selectedProject.description ||
                                  "Full turn-key construction project covering civil structural works, RCC framing, and finishing."}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Operations & Telemetry */}
                    <TabsContent value="operations" className="space-y-4">
                      {projectDetailsLoading ? (
                        <div className="py-8 text-center text-xs text-muted-foreground">
                          <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-2 text-blue-600" />
                          Fetching site operations data...
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Concrete Production Summary */}
                          <Card className="min-w-0">
                            <CardHeader className="py-3 px-4">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                                  <Factory className="h-4 w-4 text-blue-600 shrink-0" />
                                  Recent Concrete & RMC Production Pours
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px]">
                                  {selectedProject.productions?.length || 0} Batches Logged
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto w-full">
                                {selectedProject.productions && selectedProject.productions.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs whitespace-nowrap">Date</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Grade</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Volume</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Structure / Tower</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedProject.productions.map((prod: any) => (
                                        <TableRow key={prod.id}>
                                          <TableCell className="text-xs font-mono whitespace-nowrap">
                                            {new Date(prod.date || prod.createdAt).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell className="text-xs font-semibold text-blue-600 whitespace-nowrap">
                                            {prod.grade || "Standard Mix"}
                                          </TableCell>
                                          <TableCell className="text-xs font-mono font-bold whitespace-nowrap">
                                            {prod.amount} {prod.unit || "cum"}
                                          </TableCell>
                                          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                            {prod.towerName || prod.notes || "General Pour"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <div className="p-4 text-center text-xs text-muted-foreground">
                                    No direct concrete batch records linked to this site yet.
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Raw Material Inward */}
                          <Card className="min-w-0">
                            <CardHeader className="py-3 px-4">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <CardTitle className="text-xs font-semibold flex items-center gap-2">
                                  <Package className="h-4 w-4 text-amber-600 shrink-0" />
                                  Material Inward & Delivery Log
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px]">
                                  {selectedProject.materialInwards?.length || 0} Inward Shipments
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="p-0">
                              <div className="overflow-x-auto w-full">
                                {selectedProject.materialInwards &&
                                selectedProject.materialInwards.length > 0 ? (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs whitespace-nowrap">Date</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Material</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Quantity</TableHead>
                                        <TableHead className="text-xs whitespace-nowrap">Challan / Ref</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {selectedProject.materialInwards.map((inw: any) => (
                                        <TableRow key={inw.id}>
                                          <TableCell className="text-xs font-mono whitespace-nowrap">
                                            {new Date(inw.date || inw.createdAt).toLocaleDateString()}
                                          </TableCell>
                                          <TableCell className="text-xs font-semibold whitespace-nowrap">
                                            {inw.materialType || inw.itemName || "Raw Material"}
                                          </TableCell>
                                          <TableCell className="text-xs font-mono font-bold whitespace-nowrap">
                                            {inw.netWeight || inw.quantity} {inw.unit || "Tons"}
                                          </TableCell>
                                          <TableCell className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                                            {inw.challanNo || inw.vehicleNo || "N/A"}
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <div className="p-4 text-center text-xs text-muted-foreground">
                                    No inward material dispatches registered specifically for this site.
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 3: Linked ERP Navigation */}
                    <TabsContent value="actions" className="space-y-4">
                      <p className="text-xs text-muted-foreground">
                        Jump directly to related operational modules pre-filtered for{" "}
                        <strong className="text-foreground break-words">{selectedProject.name}</strong>:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button
                          variant="outline"
                          className="h-auto min-h-[4.5rem] justify-start gap-3.5 p-4 text-left w-full hover:border-blue-500/50 hover:bg-accent/50 transition-all"
                          onClick={() => {
                            handleSetActiveSite(selectedProject)
                            setIsDetailOpen(false)
                            onNavigate?.("production")
                          }}
                        >
                          <Factory className="h-6 w-6 text-blue-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold truncate">View Site Production</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              Batching records & RMC grades
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto min-h-[4.5rem] justify-start gap-3.5 p-4 text-left w-full hover:border-amber-500/50 hover:bg-accent/50 transition-all"
                          onClick={() => {
                            handleSetActiveSite(selectedProject)
                            setIsDetailOpen(false)
                            onNavigate?.("material-inward")
                          }}
                        >
                          <Package className="h-6 w-6 text-amber-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold truncate">Material Inward Gate</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              Cement, aggregate, steel weighbridge
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto min-h-[4.5rem] justify-start gap-3.5 p-4 text-left w-full hover:border-emerald-500/50 hover:bg-accent/50 transition-all"
                          onClick={() => {
                            handleSetActiveSite(selectedProject)
                            setIsDetailOpen(false)
                            onNavigate?.("equipment")
                          }}
                        >
                          <Truck className="h-6 w-6 text-emerald-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold truncate">Assigned Equipment & Fleet</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              Transit mixers, pumps & cranes
                            </div>
                          </div>
                        </Button>

                        <Button
                          variant="outline"
                          className="h-auto min-h-[4.5rem] justify-start gap-3.5 p-4 text-left w-full hover:border-purple-500/50 hover:bg-accent/50 transition-all"
                          onClick={() => {
                            handleSetActiveSite(selectedProject)
                            setIsDetailOpen(false)
                            onNavigate?.("challan")
                          }}
                        >
                          <Activity className="h-6 w-6 text-purple-600 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-bold truncate">Delivery Challans</div>
                            <div className="text-[11px] text-muted-foreground truncate">
                              Generate & print site dispatch slips
                            </div>
                          </div>
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Bottom Footer Actions */}
              <div className="p-4 bg-muted/20 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs order-2 sm:order-1"
                  onClick={() => setIsDetailOpen(false)}
                >
                  Close Window
                </Button>
                <div className="flex items-center gap-2 order-1 sm:order-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => {
                      const dataToExport = [
                        {
                          "Project Name": selectedProject.name,
                          "Location": selectedProject.location,
                          "Status": selectedProject.status,
                          "Client": selectedProject.clientName,
                          "Manager": selectedProject.managerName,
                          "Budget": selectedProject.budget,
                          "Spent": selectedProject.spent,
                          "Progress": `${selectedProject.progress}%`,
                        },
                      ]
                      exportToExcel(dataToExport, `${selectedProject.name}_summary`)
                    }}
                  >
                    Export Project Sheet
                  </Button>
                  <Button
                    size="sm"
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleEdit(selectedProject)}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1" />
                    Modify Project
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================================================================= */}
      {/* ======================= EDIT PROJECT MODAL ======================= */}
      {/* ================================================================= */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Project Details</DialogTitle>
            <DialogDescription>
              Update site specifications, budget allocations, and milestone achievements
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-name">Project Name *</Label>
                  <Input
                    id="edit-name"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-location">Location / Address *</Label>
                  <Input
                    id="edit-location"
                    value={editingItem.location}
                    onChange={(e) => setEditingItem({ ...editingItem, location: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client">Client / Developer Name</Label>
                  <Input
                    id="edit-client"
                    value={editingItem.clientName}
                    onChange={(e) => setEditingItem({ ...editingItem, clientName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-manager">Project Manager</Label>
                  <Input
                    id="edit-manager"
                    value={editingItem.managerName}
                    onChange={(e) => setEditingItem({ ...editingItem, managerName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-budget">Estimated Budget ($)</Label>
                  <Input
                    id="edit-budget"
                    type="number"
                    value={editingItem.budget}
                    onChange={(e) => setEditingItem({ ...editingItem, budget: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-spent">Spent to Date ($)</Label>
                  <Input
                    id="edit-spent"
                    type="number"
                    value={editingItem.spent}
                    onChange={(e) => setEditingItem({ ...editingItem, spent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-progress">Progress (%)</Label>
                  <Input
                    id="edit-progress"
                    type="number"
                    min="0"
                    max="100"
                    value={editingItem.progress}
                    onChange={(e) => setEditingItem({ ...editingItem, progress: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editingItem.status}
                    onValueChange={(v) => setEditingItem({ ...editingItem, status: v })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editingItem.startDate}
                    onChange={(e) => setEditingItem({ ...editingItem, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-endDate">Target Handover Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={editingItem.endDate}
                    onChange={(e) => setEditingItem({ ...editingItem, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-description">Scope / Description</Label>
                  <Input
                    id="edit-description"
                    value={editingItem.description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["name", "location", "status", "clientName", "managerName", "budget", "progress"]}
        validationRules={validateRecord}
        onConfirm={handleConfirmImport}
        title="Import Projects Preview"
      />
    </div>
  )
}
