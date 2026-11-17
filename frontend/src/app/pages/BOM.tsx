import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { KPICard } from "../components/dashboard/kpi-card"
import {
  Layers,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  FileSpreadsheet,
  Trash2,
  Eye,
  TrendingDown,
  TrendingUp,
  FileCheck
} from "lucide-react"
import {
  fetchBOMs,
  fetchBOMById,
  createBOM,
  createBOMRevision,
  submitBOMForApproval,
  approveBOM,
  deleteBOM,
  fetchBOMComparison,
  fetchSites,
  fetchRecords
} from "../services/api"
import { useAuth } from "../contexts/AuthContext"
import { toast } from "sonner"

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

const DEFAULT_MATERIALS = [
  { name: "OPC 53 Cement", category: "Cementitious", unit: "kg", defaultQty: 340, rate: 6.5, wastage: 1.0 },
  { name: "Fly Ash (Class F)", category: "Pozzolanic", unit: "kg", defaultQty: 80, rate: 2.2, wastage: 1.0 },
  { name: "20mm Coarse Aggregate", category: "Coarse Aggregate", unit: "kg", defaultQty: 680, rate: 0.85, wastage: 1.5 },
  { name: "10mm Coarse Aggregate", category: "Coarse Aggregate", unit: "kg", defaultQty: 450, rate: 0.88, wastage: 1.5 },
  { name: "Zone II River Sand", category: "Fine Aggregate", unit: "kg", defaultQty: 740, rate: 0.95, wastage: 2.0 },
  { name: "Admixture (Superplasticizer)", category: "Chemical Admixture", unit: "L", defaultQty: 2.5, rate: 65, wastage: 0.5 },
  { name: "Water", category: "Water", unit: "L", defaultQty: 160, rate: 0.15, wastage: 0 },
]

export default function BOMPage() {
  const { user } = useAuth()
  const canApprove = user?.role === "Super Admin" || user?.role === "Admin" || user?.role === "Manager"
  const canEdit = user?.role === "Super Admin" || user?.role === "Admin" || user?.role === "Site Engineer" || user?.role === "Purchase"

  const [boms, setBoms] = useState<any[]>([])
  const [sites, setSites] = useState<any[]>([])
  const [selectedBOM, setSelectedBOM] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isRevisionOpen, setIsRevisionOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filterGrade, setFilterGrade] = useState("all")
  const [filterSite, setFilterSite] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  // Comparison State
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [compMonth, setCompMonth] = useState("6")
  const [compYear, setCompYear] = useState("2026")
  const [compSite, setCompSite] = useState("all")
  const [compLoading, setCompLoading] = useState(false)

  // Form State for New BOM
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    gradeName: "M25",
    siteId: "",
    targetSlump: "120-150 mm",
    density: 2420,
    remarks: "",
    items: DEFAULT_MATERIALS.map(m => ({
      materialName: m.name,
      materialCategory: m.category,
      standardQty: m.defaultQty,
      unit: m.unit,
      wastagePercent: m.wastage,
      standardRate: m.rate,
    }))
  })

  // Revision Form State
  const [revisionReason, setRevisionReason] = useState("")
  const [revisionItems, setRevisionItems] = useState<any[]>([])

  const loadBOMs = async () => {
    try {
      setLoading(true)
      const data = await fetchBOMs({
        gradeName: filterGrade !== "all" ? filterGrade : undefined,
        siteId: filterSite !== "all" ? filterSite : undefined,
        status: filterStatus !== "all" ? filterStatus : undefined,
      })
      setBoms(Array.isArray(data) ? data : [])
    } catch (err: any) {
      toast.error("Failed to load Bill of Materials")
    } finally {
      setLoading(false)
    }
  }

  const loadSites = async () => {
    try {
      const data = await fetchSites()
      setSites(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    }
  }

  const loadComparison = async () => {
    try {
      setCompLoading(true)
      const data = await fetchBOMComparison({
        month: compMonth,
        year: compYear,
        siteId: compSite !== "all" ? compSite : undefined,
      })
      setComparisonData(data)
    } catch (err: any) {
      toast.error("Failed to load BOM variance analysis")
    } finally {
      setCompLoading(false)
    }
  }

  useEffect(() => {
    loadBOMs()
    loadSites()
  }, [filterGrade, filterSite, filterStatus])

  useEffect(() => {
    loadComparison()
  }, [compMonth, compYear, compSite])

  const calculatedCost = useMemo(() => {
    return formData.items.reduce((sum, item) => {
      const effective = (item.standardQty || 0) * (1 + (item.wastagePercent || 0) / 100)
      return sum + effective * (item.standardRate || 0)
    }, 0)
  }, [formData.items])

  const handleCreateBOM = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createBOM(formData)
      toast.success("BOM created successfully in Draft status")
      setIsCreateOpen(false)
      loadBOMs()
    } catch (err: any) {
      toast.error(err.message || "Failed to create BOM")
    }
  }

  const handleOpenRevision = (bom: any) => {
    setSelectedBOM(bom)
    setRevisionReason("")
    setRevisionItems(bom.items.map((it: any) => ({
      materialName: it.materialName,
      materialCategory: it.materialCategory,
      standardQty: it.standardQty,
      unit: it.unit,
      wastagePercent: it.wastagePercent,
      standardRate: it.standardRate,
    })))
    setIsRevisionOpen(true)
  }

  const handleSaveRevision = async () => {
    if (!selectedBOM) return
    try {
      await createBOMRevision(selectedBOM.id, {
        changeReason: revisionReason,
        items: revisionItems,
      })
      toast.success(`Created Revision v${selectedBOM.version + 1}`)
      setIsRevisionOpen(false)
      loadBOMs()
    } catch (err: any) {
      toast.error(err.message || "Failed to revise BOM")
    }
  }

  const handleSubmitApproval = async (id: string) => {
    try {
      await submitBOMForApproval(id)
      toast.success("BOM submitted for approval")
      loadBOMs()
    } catch (err: any) {
      toast.error("Failed to submit for approval")
    }
  }

  const handleApprove = async (id: string) => {
    try {
      await approveBOM(id)
      toast.success("BOM approved and marked active for production")
      loadBOMs()
    } catch (err: any) {
      toast.error("Failed to approve BOM")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this BOM?")) return
    try {
      await deleteBOM(id)
      toast.success("BOM deleted")
      loadBOMs()
    } catch (err: any) {
      toast.error("Failed to delete BOM")
    }
  }

  const handleViewDetails = async (id: string) => {
    try {
      const data = await fetchBOMById(id)
      setSelectedBOM(data)
      setIsDetailOpen(true)
    } catch (err) {
      toast.error("Failed to load BOM details")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bill of Materials (BOM)</h1>
          <p className="text-sm text-muted-foreground">
            Standard mix designs per CuM, version revisions, approval workflows, and actual consumption variance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadBOMs}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {canEdit && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Mix Design
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Standard Bill of Materials (Mix Design)</DialogTitle>
                  <DialogDescription>
                    Define the theoretical standard recipe and material rates for 1 CuM of concrete.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateBOM} className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label>Grade *</Label>
                      <Select
                        value={formData.gradeName}
                        onValueChange={(v) => setFormData({ ...formData, gradeName: v, name: `${v} Standard Mix Design` })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["M10", "M15", "M20", "M25", "M30", "M35", "M40", "M45", "M50"].map(g => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <Label>BOM Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="e.g. M25 Standard Commercial Mix"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>BOM Code</Label>
                      <Input
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g. BOM-M25-01"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Plant / Site (Optional)</Label>
                      <Select
                        value={formData.siteId}
                        onValueChange={(v) => setFormData({ ...formData, siteId: v === "all" ? "" : v })}
                      >
                        <SelectTrigger><SelectValue placeholder="All Sites (Standard)" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Sites / Universal</SelectItem>
                          {sites.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>Target Slump</Label>
                      <Input
                        value={formData.targetSlump}
                        onChange={(e) => setFormData({ ...formData, targetSlump: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="border rounded-md p-3 space-y-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Standard Material Quantities (per 1 CuM)</h4>
                      <div className="text-xs font-bold text-blue-700 dark:text-blue-400">
                        Total Std Cost: {inr(calculatedCost)} / CuM
                      </div>
                    </div>
                    <div className="rounded-md border overflow-x-auto bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Material Name</TableHead>
                            <TableHead className="text-xs">Category</TableHead>
                            <TableHead className="text-xs">Qty / CuM</TableHead>
                            <TableHead className="text-xs">Unit</TableHead>
                            <TableHead className="text-xs">Wastage %</TableHead>
                            <TableHead className="text-xs">Std Rate (₹)</TableHead>
                            <TableHead className="text-xs">Line Cost (₹)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.items.map((it, idx) => {
                            const lineCost = (it.standardQty || 0) * (1 + (it.wastagePercent || 0) / 100) * (it.standardRate || 0)
                            return (
                              <TableRow key={idx}>
                                <TableCell className="text-xs font-medium">{it.materialName}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{it.materialCategory}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="any"
                                    className="h-7 w-20 text-xs"
                                    value={it.standardQty}
                                    onChange={(e) => {
                                      const next = [...formData.items]
                                      next[idx].standardQty = parseFloat(e.target.value) || 0
                                      setFormData({ ...formData, items: next })
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-xs">{it.unit}</TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="any"
                                    className="h-7 w-16 text-xs"
                                    value={it.wastagePercent}
                                    onChange={(e) => {
                                      const next = [...formData.items]
                                      next[idx].wastagePercent = parseFloat(e.target.value) || 0
                                      setFormData({ ...formData, items: next })
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="any"
                                    className="h-7 w-20 text-xs"
                                    value={it.standardRate}
                                    onChange={(e) => {
                                      const next = [...formData.items]
                                      next[idx].standardRate = parseFloat(e.target.value) || 0
                                      setFormData({ ...formData, items: next })
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-xs font-semibold">{inr(lineCost)}</TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button type="submit">Save Mix Design</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mixes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="mixes" className="gap-2">
            <Layers className="h-4 w-4" />
            Standard Mix Designs
          </TabsTrigger>
          <TabsTrigger value="variance" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Standard vs Actual Variance
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Mix Designs */}
        <TabsContent value="mixes" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Grade</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {["M10", "M15", "M20", "M25", "M30", "M35", "M40"].map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending_approval">Pending Approval</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boms.map((bom) => {
              const isApproved = bom.status === "approved"
              const isPending = bom.status === "pending_approval"

              return (
                <Card key={bom.id} className="relative overflow-hidden flex flex-col justify-between">
                  <div className={`h-1.5 w-full ${isApproved ? "bg-emerald-500" : isPending ? "bg-amber-500" : "bg-slate-300"}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <Badge variant="outline" className="font-mono text-xs bg-muted">
                          {bom.gradeName}
                        </Badge>
                        <CardTitle className="text-base mt-1">{bom.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {bom.code || "No Code"} · v{bom.version}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={isApproved ? "default" : isPending ? "secondary" : "outline"}
                        className={isApproved ? "bg-emerald-600 text-white" : isPending ? "bg-amber-100 text-amber-800" : ""}
                      >
                        {isApproved ? "Active Approved" : isPending ? "Under Review" : bom.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded bg-muted/40">
                      <div>
                        <span className="text-muted-foreground">Standard Cost:</span>
                        <p className="font-bold text-sm text-blue-700 dark:text-blue-400">
                          {inr(bom.standardCostPerCuM)} / CuM
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Target Slump:</span>
                        <p className="font-medium">{bom.targetSlump || "120-150 mm"}</p>
                      </div>
                    </div>

                    <div className="text-xs space-y-1">
                      <span className="text-muted-foreground font-semibold">Key Mix Ingredients (per CuM):</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(bom.items || []).slice(0, 4).map((it: any) => (
                          <span key={it.id} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                            {it.materialName.split(" ")[0]}: {it.standardQty}{it.unit}
                          </span>
                        ))}
                        {(bom.items || []).length > 4 && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] text-muted-foreground">
                            +{bom.items.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                      <span>{bom.site?.name || "All Plants"}</span>
                      {bom.approvedBy && <span>Approved by {bom.approvedBy.split("@")[0]}</span>}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 pt-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs flex-1" onClick={() => handleViewDetails(bom.id)}>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>

                      {isApproved && canEdit && (
                        <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => handleOpenRevision(bom)}>
                          <History className="h-3.5 w-3.5 mr-1" />
                          Revise (v{bom.version + 1})
                        </Button>
                      )}

                      {!isApproved && !isPending && canEdit && (
                        <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={() => handleSubmitApproval(bom.id)}>
                          Submit
                        </Button>
                      )}

                      {isPending && canApprove && (
                        <Button size="sm" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(bom.id)}>
                          <FileCheck className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                      )}

                      {!isApproved && canEdit && (
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDelete(bom.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* TAB 2: Standard vs Actual Consumption Variance */}
        <TabsContent value="variance" className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Month</Label>
              <Select value={compMonth} onValueChange={setCompMonth}>
                <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].map(m => (
                    <SelectItem key={m} value={m}>Month {m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Year</Label>
              <Select value={compYear} onValueChange={setCompYear}>
                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["2025", "2026", "2027"].map(y => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-muted-foreground">Plant</Label>
              <Select value={compSite} onValueChange={setCompSite}>
                <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batching Plants</SelectItem>
                  {sites.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" className="h-8 mt-4 text-xs" onClick={loadComparison}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1 ${compLoading ? "animate-spin" : ""}`} />
              Re-calculate
            </Button>
          </div>

          {comparisonData && (
            <div className="space-y-4">
              {/* Warnings */}
              {(comparisonData.warnings || []).length > 0 && (
                <div className="p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4" />
                    BOM Variance Traceability Warnings:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {comparisonData.warnings.map((w: string, i: number) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                  title="Total Production"
                  value={`${(comparisonData.totalProductionCuM || 0).toLocaleString("en-IN")} CuM`}
                  subtitle="Volume analyzed"
                  icon={Layers}
                  colorClass="bg-blue-100 dark:bg-blue-900/30"
                />
                <KPICard
                  title="Total Standard Cost"
                  value={inr((comparisonData.comparison || []).reduce((s: number, r: any) => s + (r.standardCost || 0), 0))}
                  subtitle="Theoretical BOM requirement"
                  icon={FileSpreadsheet}
                  colorClass="bg-indigo-100 dark:bg-indigo-900/30"
                />
                <KPICard
                  title="Actual Recorded Cost"
                  value={inr((comparisonData.comparison || []).reduce((s: number, r: any) => s + (r.actualCost || 0), 0))}
                  subtitle="From Consumption records"
                  icon={CheckCircle2}
                  colorClass="bg-emerald-100 dark:bg-emerald-900/30"
                />
              </div>

              {/* Comparison Table */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Material-wise Standard vs Actual Consumption & Variance</CardTitle>
                  <CardDescription className="text-xs">
                    Standard requirement is calculated as <code>Production CuM × Approved BOM Qty/CuM</code>. Actual is pulled from ERP consumption logs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Material</TableHead>
                          <TableHead className="text-xs">Unit</TableHead>
                          <TableHead className="text-xs text-right">Standard Qty</TableHead>
                          <TableHead className="text-xs text-right">Actual Consumed</TableHead>
                          <TableHead className="text-xs text-right">Variance Qty</TableHead>
                          <TableHead className="text-xs text-right">Variance %</TableHead>
                          <TableHead className="text-xs text-right">Std Cost (₹)</TableHead>
                          <TableHead className="text-xs text-right">Actual Cost (₹)</TableHead>
                          <TableHead className="text-xs text-right">Cost Variance (₹)</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(comparisonData.comparison || []).map((row: any, i: number) => {
                          const isOver = row.variancePercent > 5
                          const isUnder = row.variancePercent < -5

                          return (
                            <TableRow key={i}>
                              <TableCell className="text-xs font-medium">{row.material}</TableCell>
                              <TableCell className="text-xs">{row.unit}</TableCell>
                              <TableCell className="text-xs text-right">{row.standardQty.toLocaleString("en-IN")}</TableCell>
                              <TableCell className="text-xs text-right font-semibold">{row.actualQty.toLocaleString("en-IN")}</TableCell>
                              <TableCell className={`text-xs text-right font-semibold ${isOver ? "text-rose-600" : isUnder ? "text-emerald-600" : ""}`}>
                                {row.qtyVariance > 0 ? `+${row.qtyVariance.toLocaleString("en-IN")}` : row.qtyVariance.toLocaleString("en-IN")}
                              </TableCell>
                              <TableCell className="text-xs text-right">
                                <span className={`inline-flex items-center gap-0.5 ${isOver ? "text-rose-600 font-bold" : isUnder ? "text-emerald-600 font-bold" : ""}`}>
                                  {isOver && <TrendingUp className="h-3 w-3" />}
                                  {isUnder && <TrendingDown className="h-3 w-3" />}
                                  {row.variancePercent > 0 ? `+${row.variancePercent}%` : `${row.variancePercent}%`}
                                </span>
                              </TableCell>
                              <TableCell className="text-xs text-right">{inr(row.standardCost)}</TableCell>
                              <TableCell className="text-xs text-right font-semibold">{inr(row.actualCost)}</TableCell>
                              <TableCell className={`text-xs text-right font-semibold ${row.costVariance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                {row.costVariance > 0 ? `+${inr(row.costVariance)}` : inr(row.costVariance)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={`text-[10px] ${isOver ? "border-rose-400 text-rose-700 bg-rose-50" : isUnder ? "border-emerald-400 text-emerald-700 bg-emerald-50" : "border-slate-300"}`}>
                                  {isOver ? "Over-consumed" : isUnder ? "Savings" : "Normal (±5%)"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* BOM Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedBOM && (
            <div className="space-y-4">
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>{selectedBOM.name}</DialogTitle>
                  <Badge>{selectedBOM.gradeName} · v{selectedBOM.version}</Badge>
                </div>
                <DialogDescription>
                  Code: {selectedBOM.code || "None"} · Status: {selectedBOM.status} · Slump: {selectedBOM.targetSlump}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Material</TableHead>
                      <TableHead className="text-xs">Category</TableHead>
                      <TableHead className="text-xs text-right">Standard Qty</TableHead>
                      <TableHead className="text-xs">Unit</TableHead>
                      <TableHead className="text-xs text-right">Rate (₹)</TableHead>
                      <TableHead className="text-xs text-right">Cost (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(selectedBOM.items || []).map((it: any) => (
                      <TableRow key={it.id}>
                        <TableCell className="text-xs font-medium">{it.materialName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{it.materialCategory || "—"}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{it.standardQty}</TableCell>
                        <TableCell className="text-xs">{it.unit}</TableCell>
                        <TableCell className="text-xs text-right font-mono">{inr(it.standardRate)}</TableCell>
                        <TableCell className="text-xs text-right font-semibold">{inr(it.standardCost)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/40 font-bold">
                      <TableCell colSpan={5} className="text-xs">Total Standard Cost / CuM</TableCell>
                      <TableCell className="text-xs text-right text-blue-700 dark:text-blue-400">
                        {inr(selectedBOM.standardCostPerCuM)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Revision History */}
              {(selectedBOM.revisions || []).length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-xs font-semibold flex items-center gap-1.5">
                    <History className="h-3.5 w-3.5" />
                    Revision History
                  </h4>
                  <div className="space-y-1 text-xs">
                    {selectedBOM.revisions.map((rev: any) => (
                      <div key={rev.id} className="p-2 rounded bg-muted/40 flex justify-between items-center">
                        <div>
                          <span className="font-semibold">Revision {rev.revisionNumber}</span>: {rev.changeReason || "No reason logged"}
                          <span className="text-muted-foreground block text-[10px]">By {rev.changedBy || "System"} on {new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="font-mono text-muted-foreground">Previous: {inr(rev.previousCost)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Revise Dialog */}
      <Dialog open={isRevisionOpen} onOpenChange={setIsRevisionOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Revision v{selectedBOM?.version + 1}</DialogTitle>
            <DialogDescription>
              Adjust material quantities or rates for {selectedBOM?.gradeName}. Previous version will be archived.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Reason for Revision *</Label>
              <Input
                placeholder="e.g. Rate revision for Cement & Admixture / Mix ratio optimization"
                value={revisionReason}
                onChange={(e) => setRevisionReason(e.target.value)}
              />
            </div>

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Material</TableHead>
                    <TableHead className="text-xs">Qty</TableHead>
                    <TableHead className="text-xs">Rate (₹)</TableHead>
                    <TableHead className="text-xs">Cost (₹)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revisionItems.map((it, idx) => {
                    const line = (it.standardQty || 0) * (1 + (it.wastagePercent || 0) / 100) * (it.standardRate || 0)
                    return (
                      <TableRow key={idx}>
                        <TableCell className="text-xs font-medium">{it.materialName}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="any"
                            className="h-7 w-20 text-xs"
                            value={it.standardQty}
                            onChange={(e) => {
                              const next = [...revisionItems]
                              next[idx].standardQty = parseFloat(e.target.value) || 0
                              setRevisionItems(next)
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="any"
                            className="h-7 w-20 text-xs"
                            value={it.standardRate}
                            onChange={(e) => {
                              const next = [...revisionItems]
                              next[idx].standardRate = parseFloat(e.target.value) || 0
                              setRevisionItems(next)
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{inr(line)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveRevision} disabled={!revisionReason}>Save Revision</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
