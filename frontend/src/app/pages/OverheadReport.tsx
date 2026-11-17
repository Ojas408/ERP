import { useEffect, useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import {
  DollarSign,
  IndianRupee,
  RefreshCw,
  Factory,
  Fuel,
  Plus,
  Trash2,
  Layers,
  FileSpreadsheet,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Info,
  Truck,
  Zap,
  Users,
  HardHat,
  Wrench,
  TrendingDown,
  TrendingUp,
  Calculator,
  ChevronDown,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import {
  fetchOverheadSummary,
  fetchOverheadEntries,
  createOverheadEntry,
  deleteOverheadEntry,
  fetchSites
} from "../services/api"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { cn } from "../../lib/utils"

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
]

const inr = (n: number) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

interface OverheadReportProps {
  onNavigate?: (module: string) => void
}

interface OverheadKPICardProps {
  title: string
  value: string | number
  subtitle: string
  icon: any
  colorClass?: string
  onClick?: () => void
  highlight?: boolean
  destinationLabel?: string
}

function OverheadKPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass,
  onClick,
  highlight,
  destinationLabel,
}: OverheadKPICardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      title={destinationLabel ? `Click to open ${destinationLabel}` : undefined}
      className={cn(
        "group relative flex flex-col justify-between h-[118px] min-h-[118px] max-h-[118px] w-full min-w-0 rounded-xl border p-3 select-none overflow-hidden box-border",
        "bg-card text-card-foreground shadow-sm transition-all duration-150",
        onClick && "cursor-pointer hover:border-blue-500 hover:ring-2 hover:ring-blue-500/25 hover:shadow-md",
        highlight && "ring-1 ring-blue-500/40 border-blue-400 bg-blue-50/20 dark:bg-blue-950/20"
      )}
    >
      {/* Top row: Title and Icon badge */}
      <div className="flex items-center justify-between gap-1.5 min-w-0 h-6">
        <span className="text-[11px] font-semibold text-muted-foreground truncate min-w-0 flex-1 leading-none" title={title}>
          {title}
        </span>
        <div
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition-colors",
            colorClass || "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
          )}
        >
          <Icon className="h-3 w-3" />
        </div>
      </div>

      {/* Middle: Big Value (strictly auto-fitting and truncated so card height/width NEVER shifts) */}
      <div className="flex-1 flex items-center min-w-0 py-0.5">
        <div
          className="text-[16px] font-bold tracking-tight text-foreground font-mono truncate min-w-0 w-full"
          title={String(value)}
        >
          {value}
        </div>
      </div>

      {/* Bottom row: Subtitle + Action Indicator */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50 min-w-0 h-5">
        <span className="truncate max-w-[85%] font-medium min-w-0" title={subtitle}>
          {subtitle}
        </span>
        {onClick && (
          <span className="flex items-center gap-0.5 text-blue-600 dark:text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
            <ExternalLink className="h-2.5 w-2.5" />
          </span>
        )}
      </div>
    </div>
  )
}

export default function OverheadReportPage({ onNavigate }: OverheadReportProps = {}) {
  const [data, setData] = useState<any>(null)
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState("6")
  const [year, setYear] = useState("2026")
  const [siteId, setSiteId] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [showFormulas, setShowFormulas] = useState(false)

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" })
      el.classList.add("ring-2", "ring-blue-500", "ring-offset-2")
      setTimeout(() => {
        el.classList.remove("ring-2", "ring-blue-500", "ring-offset-2")
      }, 2200)
    }
  }

  // Manual entry modal state
  const [newEntry, setNewEntry] = useState({
    category: "Machinery & Equipment",
    description: "",
    quantity: "",
    unit: "nos",
    amount: "",
    siteId: "",
    date: "2026-06-15T10:00",
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [summaryRes, sitesRes] = await Promise.all([
        fetchOverheadSummary({
          month,
          year,
          siteId: siteId !== "all" ? siteId : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
        fetchSites(),
      ])
      setData(summaryRes)
      setSites(Array.isArray(sitesRes) ? sitesRes : [])
    } catch (err: any) {
      console.error("Failed to load overhead report:", err)
      toast.error("Failed to load automated overhead report")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [month, year, siteId])

  const exec = data?.executiveSummary || {}
  const totalCuM = exec.totalProductionCuM || 0
  const pureOverhead = exec.pureTotalOverhead || 0
  const directMaterial = exec.totalDirectMaterialCost || 0
  const totalOperating = exec.totalOperatingCost || 0
  const overheadPerCuM = exec.overheadCostPerCuM || 0
  const operatingPerCuM = exec.totalOperatingCostPerCuM || 0

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createOverheadEntry({
        category: newEntry.category,
        description: newEntry.description,
        quantity: newEntry.quantity ? parseFloat(newEntry.quantity) : null,
        unit: newEntry.unit,
        amount: parseFloat(newEntry.amount) || 0,
        siteId: newEntry.siteId || null,
        date: new Date(newEntry.date).toISOString(),
      })
      toast.success("Manual overhead adjustment saved")
      setIsAddOpen(false)
    } catch (err: any) {
      toast.error("Failed to save entry")
    }
  }

  // Electricity & Power state & handlers
  const [isAddElectricityOpen, setIsAddElectricityOpen] = useState(false)
  const [newElecBill, setNewElecBill] = useState({
    siteId: "",
    billDate: "2026-06-15T10:00",
    billNumber: "",
    provider: "UPPCL State Power Grid",
    powerType: "Grid Power (HT Supply)",
    unitsKWh: "",
    amount: "",
    remarks: "",
  })

  const handleAddElectricityBill = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const units = parseFloat(newElecBill.unitsKWh) || 0
      const amt = parseFloat(newElecBill.amount) || 0
      await createOverheadEntry({
        category: "Electricity & Power",
        description: `${newElecBill.provider} Bill ${newElecBill.billNumber ? '#' + newElecBill.billNumber : ''} (${units.toLocaleString('en-IN')} kWh)`.trim(),
        quantity: units,
        unit: "kWh",
        amount: amt,
        siteId: newElecBill.siteId && newElecBill.siteId !== "all" ? newElecBill.siteId : null,
        date: new Date(newElecBill.billDate).toISOString(),
        customData: {
          billNumber: newElecBill.billNumber,
          provider: newElecBill.provider,
          powerType: newElecBill.powerType,
          unitsKWh: units,
          remarks: newElecBill.remarks,
          monthYearStr: `${month.toUpperCase()} ${year}`,
        },
      })
      toast.success(`Electricity bill of ₹${amt.toLocaleString('en-IN')} (${units.toLocaleString('en-IN')} kWh) recorded!`)
      setIsAddElectricityOpen(false)
      setNewElecBill({
        siteId: "",
        billDate: "2026-06-15T10:00",
        billNumber: "",
        provider: "UPPCL State Power Grid",
        powerType: "Grid Power (HT Supply)",
        unitsKWh: "",
        amount: "",
        remarks: "",
      })
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to record electricity bill")
    }
  }

  const handleDeleteBill = async (id: string, desc: string) => {
    if (!window.confirm(`Are you sure you want to delete electricity record "${desc}"?`)) return
    try {
      await deleteOverheadEntry(id)
      toast.success("Electricity record deleted successfully")
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete record")
    }
  }

  // Multi-sheet Excel Export with live Excel formulas
  const handleExportExcel = () => {
    if (!data) return
    const wb = XLSX.utils.book_new()
    const monthLabel = data.reportingPeriod?.monthLabel || "Report"

    // Sheet 1: Executive Summary & Plant Comparison
    const s1Data: any[][] = [
      ["ASKSHREE RMC ERP — TOTAL OVERHEAD & OPERATING COST REPORT"],
      [`Reporting Period: ${monthLabel}`, `Plant Filter: ${siteId === "all" ? "All Plants Combined" : sites.find(s => s.id === siteId)?.name || siteId}`],
      [`Generated At: ${new Date().toLocaleString("en-IN")}`],
      [],
      ["1. EXECUTIVE FINANCIAL SUMMARY"],
      ["Metric", "Value", "Unit / Formula"],
      ["Total Concrete Production", totalCuM, "CuM (Denominator)"],
      ["Machinery & Equipment Cost", exec.totalMachineryCost || 0, "₹"],
      ["Fuel & Lubricant Cost", exec.totalFuelCost || 0, "₹"],
      ["Electricity & Power Cost", exec.totalElectricityCost || 0, "₹"],
      ["Employee Payroll Cost", exec.totalEmployeeCost || 0, "₹"],
      ["Contract Labour Cost", exec.totalContractLabourCost || 0, "₹"],
      ["Maintenance & Repairs Cost", exec.totalMaintenanceCost || 0, "₹"],
      ["Equipment Rental Cost", exec.totalEquipmentRentalCost || 0, "₹"],
      ["Other Operational Expenses", exec.totalOtherExpenses || 0, "₹"],
      ["Less: Scrap Recovery", exec.totalScrapRecovery || 0, "₹"],
      ["PURE TOTAL OVERHEAD (A)", pureOverhead, "₹ =SUM(B8:B15)-B16"],
      ["Direct Raw Material Cost (B)", directMaterial, "₹ (Segregated Concrete Materials)"],
      ["TOTAL OPERATING COST (A + B)", totalOperating, "₹ =B17+B18"],
      ["OVERHEAD COST PER CuM", overheadPerCuM, "₹ / CuM =B17/B7"],
      ["TOTAL OPERATING COST PER CuM", operatingPerCuM, "₹ / CuM =B19/B7"],
      [],
      ["2. PLANT-WISE OVERHEAD COMPARISON"],
      ["Plant / Site", "Production (CuM)", "Machinery (₹)", "Fuel (₹)", "Power (₹)", "Manpower (₹)", "Other (₹)", "Total Overhead (₹)", "Overhead ₹/CuM"]
    ]

    ;(data.plantComparison || []).forEach((p: any) => {
      s1Data.push([
        p.siteName,
        p.productionCuM,
        p.machineryCost,
        p.fuelCost,
        p.electricityCost,
        p.manpowerCost,
        p.otherExpenses,
        p.totalOverhead,
        p.overheadCostPerCuM
      ])
    })

    const ws1 = XLSX.utils.aoa_to_sheet(s1Data)
    ws1["!cols"] = [{ wch: 36 }, { wch: 20 }, { wch: 28 }]
    XLSX.utils.book_append_sheet(wb, ws1, "Executive Summary")

    // Sheet 2: Category Details
    const s2Data: any[][] = [
      ["CATEGORY-WISE OVERHEAD BREAKDOWN"],
      ["Sr. No.", "Cost Category", "Source Module", "Amount (₹)", "Cost per CuM (₹)", "% Contribution", "Record Count"]
    ]
    ;(data.categoryTable || []).forEach((c: any) => {
      s2Data.push([c.srNo, c.category, c.source, c.amount, c.costPerCuM, `${c.contribution}%`, c.records])
    })
    const ws2 = XLSX.utils.aoa_to_sheet(s2Data)
    XLSX.utils.book_append_sheet(wb, ws2, "Category Details")

    // Sheet 3: Machinery & Equipment
    const s3Data: any[][] = [
      ["MACHINERY & EQUIPMENT COST ANALYSIS"],
      ["Plate Number", "Model / Asset", "Type", "Assigned Plant", "Maintenance Cost (₹)", "Rental Cost (₹)", "Total Cost (₹)", "Status"]
    ]
    ;(data.equipmentAnalysis || []).forEach((e: any) => {
      s3Data.push([e.plateNumber, e.model, e.type, e.plant, e.maintenanceCost, e.rentalCost, e.totalCost, e.isRented ? "Rented" : "Owned"])
    })
    const ws3 = XLSX.utils.aoa_to_sheet(s3Data)
    XLSX.utils.book_append_sheet(wb, ws3, "Equipment Analysis")

    // Sheet 4: Direct Raw Materials (BOM)
    const s4Data: any[][] = [
      ["DIRECT RAW MATERIAL CONSUMPTION (SEGREGATED)"],
      ["Material", "Consumed Qty", "Unit", "Average Rate (₹)", "Total Cost (₹)"]
    ]
    ;(data.directMaterialAnalysis?.materials || []).forEach((m: any) => {
      s4Data.push([m.material, m.qty, m.unit, m.avgRate, m.totalCost])
    })
    const ws4 = XLSX.utils.aoa_to_sheet(s4Data)
    XLSX.utils.book_append_sheet(wb, ws4, "Direct Materials")

    XLSX.writeFile(wb, `Total_Overhead_Report_${monthLabel.replace(/\s+/g, "_")}.xlsx`)
    toast.success("Excel audit workbook exported successfully")
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 print:space-y-4 print:p-0">
      {/* SECTION 1: Report Filters Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Total Overhead Report</h1>
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              ERP-Integrated Automated
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Automated financial & operational overhead consolidation across plant machinery, fuel, manpower, maintenance & power.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-28 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-24 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["2025", "2026", "2027"].map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Plant / Batching Site</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="h-9 w-44 text-xs"><SelectValue placeholder="All Plants" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants Combined</SelectItem>
                {sites.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button variant="default" className="h-9 text-xs" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Generate Report
          </Button>

          <Button variant="outline" className="h-9 text-xs" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-1.5 text-emerald-600" />
            Excel Export
          </Button>

          <Button variant="outline" className="h-9 text-xs" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1.5 text-blue-600" />
            Print / PDF
          </Button>

          <Button
            variant="outline"
            className="h-9 text-xs border-amber-500/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-semibold"
            onClick={() => setIsAddElectricityOpen(true)}
          >
            <Zap className="h-4 w-4 mr-1 text-amber-500 fill-amber-500" />
            + Electricity Bill
          </Button>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="secondary" className="h-9 text-xs">
                <Plus className="h-4 w-4 mr-1" />
                Adjustment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Manual Overhead Adjustment</DialogTitle>
                <DialogDescription>
                  Record an extraordinary or unmapped overhead transaction for this reporting period.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleManualAdd} className="space-y-3">
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Machinery & Equipment">Machinery & Equipment</SelectItem>
                      <SelectItem value="Fuel & Lubricants">Fuel & Lubricants</SelectItem>
                      <SelectItem value="Electricity & Power">Electricity & Power</SelectItem>
                      <SelectItem value="Employee Cost">Employee Cost</SelectItem>
                      <SelectItem value="Contract Labour">Contract Labour</SelectItem>
                      <SelectItem value="Maintenance & Repairs">Maintenance & Repairs</SelectItem>
                      <SelectItem value="Equipment Rental">Equipment Rental</SelectItem>
                      <SelectItem value="Other Operational Expenses">Other Operational Expenses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Description *</Label>
                  <Input
                    required
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                    placeholder="e.g. Emergency DG set hiring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Amount (₹) *</Label>
                    <Input
                      type="number"
                      required
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Plant (Optional)</Label>
                    <Select value={newEntry.siteId} onValueChange={(v) => setNewEntry({ ...newEntry, siteId: v })}>
                      <SelectTrigger><SelectValue placeholder="Shared" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Shared / Unallocated</SelectItem>
                        {sites.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Save Adjustment</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Print-Only Header */}
      <div className="hidden print:block border-b pb-4">
        <h2 className="text-xl font-bold uppercase">ASKSHREE RMC ERP — TOTAL OVERHEAD REPORT</h2>
        <div className="grid grid-cols-3 gap-2 text-xs mt-2 text-muted-foreground">
          <div>Reporting Period: <strong>{data?.reportingPeriod?.monthLabel || "June 2026"}</strong></div>
          <div>Plant Scope: <strong>{siteId === "all" ? "All Plants Combined" : sites.find(s => s.id === siteId)?.name}</strong></div>
          <div>Generated Date: <strong>{new Date().toLocaleDateString("en-IN")}</strong></div>
        </div>
      </div>

      {/* SECTION 12: Data Verification & Completeness Engine */}
      {data?.verification && (
        <Card className={`border ${data.verification.status === "Fully Verified" ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"}`}>
          <CardContent className="py-3 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className={`h-4 w-4 ${data.verification.status === "Fully Verified" ? "text-emerald-600" : "text-amber-600"}`} />
              <span className="font-semibold">Audit Completeness Status:</span>
              <Badge variant="outline" className={`font-mono ${data.verification.status === "Fully Verified" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                {data.verification.status} ({data.verification.completenessScore}% score)
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2">
              {(data.verification.warnings || []).map((w: any, idx: number) => (
                <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white dark:bg-slate-900 border text-[11px] text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  {w.message}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: Executive Summary Dashboard (14 KPI Cards) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Section 2: Executive Summary Dashboard
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <OverheadKPICard
            title="Total Production"
            value={`${totalCuM.toLocaleString("en-IN")} CuM`}
            subtitle="Denominator"
            icon={Factory}
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300"
            onClick={() => onNavigate ? onNavigate("production") : scrollToSection("section-3-category-table")}
            destinationLabel="Production Module ↗"
          />
          <OverheadKPICard
            title="Machinery Overhead"
            value={inr(exec.totalMachineryCost || 0)}
            subtitle={`${(data?.equipmentAnalysis || []).length} Vehicles`}
            icon={Truck}
            colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={() => onNavigate ? onNavigate("equipment") : scrollToSection("section-5-machinery")}
            destinationLabel="Equipment & Fleet ↗"
          />
          <OverheadKPICard
            title="Fuel & Lubricant"
            value={inr(exec.totalFuelCost || 0)}
            subtitle={`${(data?.fuelAnalysis?.fuelConsumedQty || 0).toLocaleString("en-IN")} Litres`}
            icon={Fuel}
            colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-300"
            onClick={() => onNavigate ? onNavigate("consumption") : scrollToSection("section-6-fuel-electricity")}
            destinationLabel="Consumption Module ↗"
          />
          <OverheadKPICard
            title="Electricity & Power"
            value={inr(exec.totalElectricityCost || 0)}
            subtitle="Plant Power Bills"
            icon={Zap}
            colorClass="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
            onClick={() => onNavigate ? onNavigate("expense") : scrollToSection("section-6-fuel-electricity")}
            destinationLabel="Expenses Module ↗"
          />
          <OverheadKPICard
            title="Employee Payroll"
            value={inr(exec.totalEmployeeCost || 0)}
            subtitle={`${data?.manpowerAnalysis?.activeEmployees || 0} Staff`}
            icon={Users}
            colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300"
            onClick={() => onNavigate ? onNavigate("work-hour") : scrollToSection("section-3-category-table")}
            destinationLabel="Work Hours & Payroll ↗"
          />
          <OverheadKPICard
            title="Contract Labour"
            value={inr(exec.totalContractLabourCost || 0)}
            subtitle="Contractor Bills"
            icon={HardHat}
            colorClass="bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300"
            onClick={() => onNavigate ? onNavigate("workers") : scrollToSection("section-3-category-table")}
            destinationLabel="Workers & Labour ↗"
          />
          <OverheadKPICard
            title="Plant Maintenance"
            value={inr(exec.totalMaintenanceCost || 0)}
            subtitle="Repairs & Spares"
            icon={Wrench}
            colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300"
            onClick={() => onNavigate ? onNavigate("maintenance") : scrollToSection("section-5-machinery")}
            destinationLabel="Maintenance Module ↗"
          />

          <OverheadKPICard
            title="Equipment Rental"
            value={inr(exec.totalEquipmentRentalCost || 0)}
            subtitle="Hired Pumps/TMs"
            icon={Layers}
            colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300"
            onClick={() => onNavigate ? onNavigate("equipment") : scrollToSection("section-5-machinery")}
            destinationLabel="Equipment Rentals ↗"
          />
          <OverheadKPICard
            title="Other Expenses"
            value={inr(exec.totalOtherExpenses || 0)}
            subtitle="Admin & Misc"
            icon={IndianRupee}
            colorClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            onClick={() => onNavigate ? onNavigate("expense") : scrollToSection("section-3-category-table")}
            destinationLabel="Expenses Module ↗"
          />
          <OverheadKPICard
            title="PURE TOTAL OVERHEAD"
            value={inr(pureOverhead)}
            subtitle="Total Overhead (A)"
            icon={IndianRupee}
            colorClass="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            onClick={() => scrollToSection("section-3-category-table")}
            destinationLabel="Category Cost Table (Sec 3) ↓"
          />
          <OverheadKPICard
            title="Direct Material Cost"
            value={inr(directMaterial)}
            subtitle="Segregated (B)"
            icon={Factory}
            colorClass="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
            onClick={() => onNavigate ? onNavigate("bom") : scrollToSection("section-9-direct-materials")}
            destinationLabel="BOM Module ↗"
          />
          <OverheadKPICard
            title="TOTAL OPERATING COST"
            value={inr(totalOperating)}
            subtitle="Overhead + Material"
            icon={Calculator}
            colorClass="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
            onClick={() => scrollToSection("section-3-category-table")}
            destinationLabel="Operating Cost Table (Sec 3) ↓"
          />
          <OverheadKPICard
            title="OVERHEAD ₹ / CuM"
            value={inr(overheadPerCuM)}
            subtitle="Pure Overhead ÷ CuM"
            icon={TrendingDown}
            colorClass="bg-blue-100 text-blue-900 dark:bg-blue-900/50 dark:text-blue-200"
            onClick={() => scrollToSection("section-4-plant-comparison")}
            destinationLabel="Plant ₹/CuM Benchmark (Sec 4) ↓"
          />
          <OverheadKPICard
            title="TOTAL COST ₹ / CuM"
            value={inr(operatingPerCuM)}
            subtitle="Full Cost ÷ CuM"
            icon={TrendingUp}
            colorClass="bg-indigo-100 text-indigo-900 dark:bg-indigo-900/50 dark:text-indigo-200"
            onClick={() => { setShowFormulas(true); scrollToSection("section-10-methodology"); }}
            destinationLabel="Financial Formulas (Sec 10) ↓"
          />
        </div>
      </div>

      {/* SECTION 3: Detailed Category-wise Cost Report */}
      <Card id="section-3-category-table">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Section 3: Detailed Category-wise Cost Report</span>
            <span className="text-xs font-normal text-muted-foreground">
              Direct concrete materials are strictly separated from pure operating overhead.
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs w-14">Sr. No.</TableHead>
                  <TableHead className="text-xs">Cost Category</TableHead>
                  <TableHead className="text-xs">Authoritative ERP Source</TableHead>
                  <TableHead className="text-xs text-right">Total Cost (₹)</TableHead>
                  <TableHead className="text-xs text-right">Cost per CuM (₹)</TableHead>
                  <TableHead className="text-xs text-right">Contribution %</TableHead>
                  <TableHead className="text-xs text-right">Records Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.categoryTable || []).map((row: any) => (
                  <TableRow key={row.srNo}>
                    <TableCell className="text-xs font-mono">{row.srNo}</TableCell>
                    <TableCell className="text-xs font-semibold">{row.category}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{row.source}</TableCell>
                    <TableCell className="text-xs text-right font-medium">{inr(row.amount)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-blue-700 dark:text-blue-400">
                      {inr(row.costPerCuM)}
                    </TableCell>
                    <TableCell className="text-xs text-right">{row.contribution}%</TableCell>
                    <TableCell className="text-xs text-right font-mono">{row.records}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow className="bg-blue-50/70 dark:bg-blue-950/40 font-bold border-t-2">
                  <TableCell className="text-xs" colSpan={3}>
                    PURE TOTAL OVERHEAD (Operating Costs Only)
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold text-blue-700 dark:text-blue-400">
                    {inr(pureOverhead)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-bold text-blue-700 dark:text-blue-400">
                    {inr(overheadPerCuM)}
                  </TableCell>
                  <TableCell className="text-xs text-right">100.00%</TableCell>
                  <TableCell className="text-xs text-right font-mono">
                    {(data?.categoryTable || []).reduce((s: number, r: any) => s + (r.records || 0), 0)}
                  </TableCell>
                </TableRow>
                {/* Direct Raw Materials Row */}
                <TableRow className="bg-amber-50/40 dark:bg-amber-950/20 italic">
                  <TableCell className="text-xs" colSpan={3}>
                    * Direct Concrete Raw Materials (Cement, Aggregates, Sand, Admixture — Segregated)
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium text-amber-800 dark:text-amber-300">
                    {inr(directMaterial)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-medium text-amber-800 dark:text-amber-300">
                    {inr(exec.materialCostPerCuM || 0)}
                  </TableCell>
                  <TableCell className="text-xs text-right">—</TableCell>
                  <TableCell className="text-xs text-right">—</TableCell>
                </TableRow>
                {/* Grand Total Operating Cost */}
                <TableRow className="bg-indigo-50/50 dark:bg-indigo-950/30 font-extrabold">
                  <TableCell className="text-xs" colSpan={3}>
                    TOTAL COMPREHENSIVE OPERATING COST (Overhead + Direct Raw Materials)
                  </TableCell>
                  <TableCell className="text-xs text-right font-extrabold text-indigo-700 dark:text-indigo-400">
                    {inr(totalOperating)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-extrabold text-indigo-700 dark:text-indigo-400">
                    {inr(operatingPerCuM)}
                  </TableCell>
                  <TableCell className="text-xs text-right">—</TableCell>
                  <TableCell className="text-xs text-right">—</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 4: Plant-wise Overhead Comparison */}
      <Card id="section-4-plant-comparison">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Section 4: Plant-wise Overhead Comparison Report</span>
            <Badge variant="outline" className="text-xs">
              {siteId === "all" ? "Comparing All Active Plants" : "Single Plant Filtered"}
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Cross-plant performance benchmark showing total production, plant-specific costs, shared overhead distribution, and ₹/CuM efficiency.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Plant / Batching Site</TableHead>
                  <TableHead className="text-xs text-right">Production (CuM)</TableHead>
                  <TableHead className="text-xs text-right">Machinery Cost</TableHead>
                  <TableHead className="text-xs text-right">Fuel Cost</TableHead>
                  <TableHead className="text-xs text-right">Electricity Cost</TableHead>
                  <TableHead className="text-xs text-right">Manpower Cost</TableHead>
                  <TableHead className="text-xs text-right">Shared / Other</TableHead>
                  <TableHead className="text-xs text-right font-bold">Total Overhead</TableHead>
                  <TableHead className="text-xs text-right font-bold text-blue-700 dark:text-blue-400">Overhead ₹/CuM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.plantComparison || []).map((p: any) => (
                  <TableRow key={p.siteId}>
                    <TableCell className="text-xs font-semibold">{p.siteName}</TableCell>
                    <TableCell className="text-xs text-right font-mono font-medium">{p.productionCuM.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs text-right">{inr(p.machineryCost)}</TableCell>
                    <TableCell className="text-xs text-right">{inr(p.fuelCost)}</TableCell>
                    <TableCell className="text-xs text-right">{inr(p.electricityCost)}</TableCell>
                    <TableCell className="text-xs text-right">{inr(p.manpowerCost)}</TableCell>
                    <TableCell className="text-xs text-right">{inr(p.otherExpenses)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">{inr(p.totalOverhead)}</TableCell>
                    <TableCell className="text-xs text-right font-bold text-blue-700 dark:text-blue-400">
                      {inr(p.overheadCostPerCuM)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid for Section 5 (Equipment) & Section 6 (Fuel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* SECTION 5: Machinery & Equipment Cost Analysis */}
        <Card id="section-5-machinery">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Section 5: Machinery & Equipment Analysis</CardTitle>
            <CardDescription className="text-xs">
              Vehicle-wise maintenance slips, repair costs, and asset allocations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto max-h-72">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Plate No / Asset</TableHead>
                    <TableHead className="text-xs">Type</TableHead>
                    <TableHead className="text-xs">Plant</TableHead>
                    <TableHead className="text-xs text-right">Maintenance Cost</TableHead>
                    <TableHead className="text-xs text-right">Rental Amount</TableHead>
                    <TableHead className="text-xs text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.equipmentAnalysis || []).map((e: any) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs font-medium font-mono">{e.plateNumber}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.type}</TableCell>
                      <TableCell className="text-xs">{e.plant}</TableCell>
                      <TableCell className="text-xs text-right">{inr(e.maintenanceCost)}</TableCell>
                      <TableCell className="text-xs text-right font-medium font-mono">
                        {e.rentalCost > 0 ? inr(e.rentalCost) : "₹0"}
                      </TableCell>
                      <TableCell className="text-xs text-right font-semibold">{inr(e.totalCost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* SECTION 6: Fuel & Electricity Reconciliation */}
        <div id="section-6-fuel-electricity" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Section 6A: Fuel Reconciliation</CardTitle>
              <CardDescription className="text-xs">
                Stock movement: purchases vs consumption, with average efficiency per CuM.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Fuel Received (Inward):</span>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    {(data?.fuelAnalysis?.fuelPurchasedQty || 0).toLocaleString("en-IN")} L
                  </p>
                  <p className="text-[11px] text-muted-foreground">Valuation: {inr(data?.fuelAnalysis?.fuelPurchasedVal || 0)}</p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Fuel Consumed in Operations:</span>
                  <p className="text-base font-bold text-orange-700 dark:text-orange-400">
                    {(data?.fuelAnalysis?.fuelConsumedQty || 0).toLocaleString("en-IN")} L
                  </p>
                  <p className="text-[11px] text-muted-foreground">Cost: {inr(data?.fuelAnalysis?.fuelConsumedVal || 0)}</p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Closing Fuel Balance:</span>
                  <p className="text-base font-bold">
                    {(data?.fuelAnalysis?.closingStockQty || 0).toLocaleString("en-IN")} Litres
                  </p>
                  <p className="text-[11px] text-muted-foreground">Warehouse & site tanks</p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Fuel Efficiency:</span>
                  <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                    {data?.fuelAnalysis?.avgFuelEfficiencyLPerCuM || 0} L / CuM
                  </p>
                  <p className="text-[11px] text-muted-foreground">Diesel consumed per CuM concrete</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card id="section-6b-electricity" className="border-amber-300/60 dark:border-amber-800/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    Section 6B: Electricity & Power Supply Reconciliation
                  </CardTitle>
                  <CardDescription className="text-xs">
                    HT/LT grid power meter readings, generator supply, and specific energy efficiency (kWh/CuM).
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs border-amber-500 text-amber-700 dark:text-amber-300"
                  onClick={() => setIsAddElectricityOpen(true)}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Power Bill
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 space-y-1">
                  <span className="text-muted-foreground font-semibold">Total Power Consumed:</span>
                  <p className="text-base font-bold text-amber-800 dark:text-amber-300">
                    {(data?.electricityAnalysis?.totalUnitsKWh || 0).toLocaleString("en-IN")} kWh
                  </p>
                  <p className="text-[11px] text-muted-foreground">Grid + Generator backup</p>
                </div>

                <div className="p-3 rounded-md bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 space-y-1">
                  <span className="text-muted-foreground font-semibold">Total Power Cost:</span>
                  <p className="text-base font-bold text-amber-800 dark:text-amber-300">
                    {inr(data?.electricityAnalysis?.totalElectricityCost || exec.totalElectricityCost || 0)}
                  </p>
                  <p className="text-[11px] text-muted-foreground">All plant power bills</p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Effective Tariff Rate:</span>
                  <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                    ₹{data?.electricityAnalysis?.avgRatePerKWh || 0} / kWh
                  </p>
                  <p className="text-[11px] text-muted-foreground">Average bill cost per unit</p>
                </div>

                <div className="p-3 rounded-md bg-muted/40 space-y-1">
                  <span className="text-muted-foreground font-semibold">Specific Power Consumption:</span>
                  <p className="text-base font-bold text-blue-700 dark:text-blue-400">
                    {data?.electricityAnalysis?.specificPowerConsumptionKWhPerCuM || 0} kWh / CuM
                  </p>
                  <p className="text-[11px] text-muted-foreground">Power consumed per CuM concrete</p>
                </div>
              </div>

              {/* Bills List Table */}
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Date</TableHead>
                      <TableHead className="text-xs">Batching Plant</TableHead>
                      <TableHead className="text-xs">Bill / Meter No</TableHead>
                      <TableHead className="text-xs">Provider / Source</TableHead>
                      <TableHead className="text-xs text-right">Units (kWh)</TableHead>
                      <TableHead className="text-xs text-right">Amount (₹)</TableHead>
                      <TableHead className="text-xs text-right">Rate (₹/unit)</TableHead>
                      <TableHead className="text-xs text-center w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.electricityAnalysis?.bills || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-4">
                          No electricity bills found for this period. Click "+ Add Power Bill" to record meter readings.
                        </TableCell>
                      </TableRow>
                    ) : (
                      (data?.electricityAnalysis?.bills || []).map((b: any) => (
                        <TableRow key={b.id}>
                          <TableCell className="text-xs font-mono">{new Date(b.date).toLocaleDateString("en-IN")}</TableCell>
                          <TableCell className="text-xs font-medium">{b.plant}</TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{b.billNumber}</TableCell>
                          <TableCell className="text-xs">{b.provider || b.powerType}</TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {b.unitsKWh > 0 ? b.unitsKWh.toLocaleString("en-IN") : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-right font-bold text-amber-700 dark:text-amber-400">
                            {inr(b.amount)}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">
                            {b.ratePerUnit > 0 ? `₹${b.ratePerUnit}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteBill(b.id, b.billNumber || b.remarks)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SECTION 9: Direct Concrete Raw Material (BOM) Breakdown */}
      <Card id="section-9-direct-materials" className="border-amber-200 dark:border-amber-900/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Section 9: Direct Material & Concrete Consumption (Segregated)</span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Total Raw Material Cost: {inr(directMaterial)} ({inr(exec.materialCostPerCuM || 0)} / CuM)
            </span>
          </CardTitle>
          <CardDescription className="text-xs">
            Direct production materials consumed in batching (Cement, Fly Ash, Aggregates, Sand, Admixtures) derived from ERP consumption logs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Raw Material Name</TableHead>
                  <TableHead className="text-xs text-right">Quantity Consumed</TableHead>
                  <TableHead className="text-xs">Unit</TableHead>
                  <TableHead className="text-xs text-right">Avg Rate (₹)</TableHead>
                  <TableHead className="text-xs text-right">Total Material Cost (₹)</TableHead>
                  <TableHead className="text-xs text-right">Cost per CuM (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.directMaterialAnalysis?.materials || []).map((m: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="text-xs font-semibold">{m.material}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{m.qty.toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-xs">{m.unit}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{inr(m.avgRate)}</TableCell>
                    <TableCell className="text-xs text-right font-bold">{inr(m.totalCost)}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-muted-foreground">
                      {inr(totalCuM > 0 ? m.totalCost / totalCuM : 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SECTION 10: Mathematical Formulas & Safeguards */}
      <Card id="section-10-methodology">
        <CardHeader
          className="pb-2 cursor-pointer flex flex-row items-center justify-between"
          onClick={() => setShowFormulas(!showFormulas)}
        >
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-blue-600" />
              Section 10: Financial Calculation Methodology & Mathematical Formulas
            </CardTitle>
            <CardDescription className="text-xs">
              Transparent, audit-compliant financial logic used to calculate overheads and operating cost per CuM.
            </CardDescription>
          </div>
          {showFormulas ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </CardHeader>
        {showFormulas && (
          <CardContent className="pt-2 text-xs space-y-2 border-t font-mono bg-muted/20">
            <div>
              <strong>1. Pure Total Overhead (A):</strong>
              <p className="text-muted-foreground">
                = Machinery Cost + Fuel Cost + Power Cost + Employee Cost + Contract Labour + Maintenance + Rentals + Other Expenses - Scrap Recovery
              </p>
            </div>
            <div>
              <strong>2. Overhead Cost per CuM:</strong>
              <p className="text-muted-foreground">
                = Pure Total Overhead (₹{pureOverhead.toLocaleString("en-IN")}) ÷ Total Production ({totalCuM.toLocaleString("en-IN")} CuM) = <strong>{inr(overheadPerCuM)} / CuM</strong>
              </p>
            </div>
            <div>
              <strong>3. Direct Material Cost per CuM (B):</strong>
              <p className="text-muted-foreground">
                = Actual Raw Material Cost (₹{directMaterial.toLocaleString("en-IN")}) ÷ Total Production ({totalCuM.toLocaleString("en-IN")} CuM) = <strong>{inr(exec.materialCostPerCuM || 0)} / CuM</strong>
              </p>
            </div>
            <div>
              <strong>4. Total Operating Cost per CuM:</strong>
              <p className="text-muted-foreground">
                = (Pure Total Overhead + Direct Raw Material Cost) ÷ Total Production = <strong>{inr(operatingPerCuM)} / CuM</strong>
              </p>
            </div>
            <div>
              <strong>5. Power Consumption & Tariff Metrics:</strong>
              <p className="text-muted-foreground">
                • Specific Power Consumption (kWh/CuM) = Total kWh Consumed ÷ Total Production CuM
                <br />
                • Effective Electricity Tariff (₹/kWh) = Total Power Bill ÷ Total Units Consumed
              </p>
            </div>
            <div className="text-[11px] text-amber-700 dark:text-amber-400 font-sans pt-1">
              * Note: Safe zero-division handling is enforced. If monthly production is 0 CuM, ₹/CuM safely reports ₹0.00 without throwing errors.
            </div>
          </CardContent>
        )}
      </Card>

      {/* Dialog for Recording Electricity Bill & Meter Reading */}
      <Dialog open={isAddElectricityOpen} onOpenChange={setIsAddElectricityOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500 fill-amber-500" />
              Record Electricity Bill & Meter Reading
            </DialogTitle>
            <DialogDescription>
              Enter monthly power consumption, grid electricity bills, or DG set generator power costs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddElectricityBill} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Batching Plant / Site *</Label>
                <Select
                  value={newElecBill.siteId}
                  onValueChange={(v) => setNewElecBill({ ...newElecBill, siteId: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select Plant" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plants / Shared</SelectItem>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Bill Date *</Label>
                <Input
                  type="datetime-local"
                  required
                  className="text-xs"
                  value={newElecBill.billDate}
                  onChange={(e) => setNewElecBill({ ...newElecBill, billDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Bill / Meter No.</Label>
                <Input
                  className="text-xs font-mono"
                  placeholder="e.g. UPPCL-60921"
                  value={newElecBill.billNumber}
                  onChange={(e) => setNewElecBill({ ...newElecBill, billNumber: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Power Supply Source</Label>
                <Select
                  value={newElecBill.powerType}
                  onValueChange={(v) => setNewElecBill({ ...newElecBill, powerType: v })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Grid Power (HT Supply)">Grid Power (HT Supply)</SelectItem>
                    <SelectItem value="State Electricity Board (LT)">State Electricity Board (LT)</SelectItem>
                    <SelectItem value="Diesel Generator (DG Backup)">Diesel Generator (DG Backup)</SelectItem>
                    <SelectItem value="Solar / Renewable Power">Solar / Renewable Power</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Electricity Board / Provider</Label>
              <Input
                className="text-xs"
                placeholder="e.g. UPPCL Noida Power / Tata Power / Generator DG-1"
                value={newElecBill.provider}
                onChange={(e) => setNewElecBill({ ...newElecBill, provider: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Units Consumed (kWh) *</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  className="text-xs"
                  placeholder="e.g. 26737"
                  value={newElecBill.unitsKWh}
                  onChange={(e) => setNewElecBill({ ...newElecBill, unitsKWh: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Total Bill Amount (₹) *</Label>
                <Input
                  type="number"
                  step="any"
                  required
                  className="text-xs"
                  placeholder="e.g. 218619"
                  value={newElecBill.amount}
                  onChange={(e) => setNewElecBill({ ...newElecBill, amount: e.target.value })}
                />
              </div>
            </div>

            {/* Live Tariff & Efficiency Calculations */}
            {parseFloat(newElecBill.unitsKWh) > 0 && parseFloat(newElecBill.amount) > 0 && (
              <div className="p-2.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Effective Tariff:</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">
                    ₹{(parseFloat(newElecBill.amount) / parseFloat(newElecBill.unitsKWh)).toFixed(2)} / kWh
                  </span>
                </div>
                {totalCuM > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estimated Power Efficiency:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {(parseFloat(newElecBill.unitsKWh) / totalCuM).toFixed(2)} kWh / CuM
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1">
              <Label>Remarks / Meter Notes</Label>
              <Input
                className="text-xs"
                placeholder="e.g. Main plant meter monthly billing"
                value={newElecBill.remarks}
                onChange={(e) => setNewElecBill({ ...newElecBill, remarks: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsAddElectricityOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
                <Zap className="h-4 w-4 mr-1" />
                Save Electricity Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
