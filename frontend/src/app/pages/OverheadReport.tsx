import { useEffect, useMemo, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog"
import { DollarSign, RefreshCw, Factory, Fuel, Plus, Trash2, Layers, Download, Upload, FileSpreadsheet, Save } from "lucide-react"
import { fetchOverheadEntries, fetchOverheadSummary, fetchSites, createOverheadEntry, deleteOverheadEntry } from "../services/api"
import { toast } from "sonner"
import { exportToExcel, downloadExcelTemplate, parseExcelFile } from "../lib/excel-helper"
import * as XLSX from "xlsx"
import { ImportPreviewModal } from "../components/ImportPreviewModal"

const OVERHEAD_CATEGORIES = [
  { value: "Machinery", unit: "nos", qtyLabel: "Qty (nos)", rateLabel: "Rate / Month (₹)" },
  { value: "Fuel", unit: "Litres", qtyLabel: "Consumption (Litres)", rateLabel: "Rate ₹ / Litre" },
  { value: "Raw Material", unit: "MT", qtyLabel: "Qty Consumed (MT)", rateLabel: "Avg Cost ₹ / MT" },
  { value: "Manpower", unit: "persons", qtyLabel: "No. of Persons", rateLabel: "—" },
  { value: "Electricity", unit: "kWh", qtyLabel: "Units (kWh)", rateLabel: "Rate ₹ / Unit" },
  { value: "Maintenance", unit: "ls", qtyLabel: "—", rateLabel: "—" },
  { value: "Scrap", unit: "tons", qtyLabel: "Qty (tons)", rateLabel: "—" },
] as const

const UNIT_BY_CATEGORY: Record<string, string> = Object.fromEntries(
  OVERHEAD_CATEGORIES.map((c) => [c.value, c.unit])
)

const MONTHS = [
  { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
  { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
  { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
  { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
]

const inr = (n: number) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`

function fmtQty(qty: number | null | undefined, unit: string | null | undefined) {
  if (qty == null) return "—"
  const q = Number(qty).toLocaleString("en-IN", { maximumFractionDigits: 3 })
  return unit ? `${q} ${unit}` : q
}

function SectionTable({
  title,
  category,
  qtyHeader,
  rateHeader,
  costHeader,
  rows,
  totalLabel,
  totalAmount,
  totalCostPerCuM,
}: {
  title: string
  category: string
  qtyHeader: string
  rateHeader: string
  costHeader: string
  rows: any[]
  totalLabel: string
  totalAmount: number
  totalCostPerCuM: number
}) {
  if (!rows?.length) return null
  const canonicalUnit = UNIT_BY_CATEGORY[category] || rows[0]?.unit || ""
  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">
          Unit for this section: <strong>{canonicalUnit || "₹"}</strong> · Cost / CuM = Total Cost ÷ Monthly Production CuM
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Description</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{qtyHeader}</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{rateHeader}</TableHead>
                <TableHead className="text-xs">Total Cost (₹)</TableHead>
                <TableHead className="text-xs whitespace-nowrap">{costHeader}</TableHead>
                <TableHead className="text-xs">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.id || `${category}-${idx}`}>
                  <TableCell className="text-xs font-medium">{row.description}</TableCell>
                  <TableCell className="text-xs">
                    {fmtQty(row.quantity, row.unit || canonicalUnit)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {row.rate != null ? inr(row.rate) : "—"}
                  </TableCell>
                  <TableCell className="text-xs font-semibold">{inr(row.amount)}</TableCell>
                  <TableCell className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {inr(row.costPerCuM)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {[
                      row.avgFuelConsumption != null ? `${row.avgFuelConsumption} L/CuM` : null,
                      row.personnelDetails,
                      row.remarks,
                    ]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/40">
                <TableCell className="text-xs font-bold" colSpan={3}>
                  {totalLabel}
                </TableCell>
                <TableCell className="text-xs font-bold">{inr(totalAmount)}</TableCell>
                <TableCell className="text-xs font-bold text-blue-700 dark:text-blue-400">
                  {inr(totalCostPerCuM)}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

export default function OverheadReport() {
  const [entries, setEntries] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [month, setMonth] = useState("6")
  const [year, setYear] = useState("2026")
  const [siteId, setSiteId] = useState("all")
  const [plantName, setPlantName] = useState("ALL PLANTS COMBINED (KRH & GDI)")
  const [preparedBy, setPreparedBy] = useState("Reetesh Sharma, Manager - Quality")
  const [submittedTo, setSubmittedTo] = useState("Jitendra Sir, Mukesh Mokha Sir")
  const [newEntry, setNewEntry] = useState({
    category: "Machinery",
    description: "",
    quantity: "",
    unit: "nos",
    amount: "",
    rate: "",
    remarks: "",
    siteId: "",
    date: "2026-06-15T10:00",
  })

  const query = useMemo(
    () => ({
      month,
      year,
      siteId: siteId !== "all" ? siteId : undefined,
    }),
    [month, year, siteId]
  )

  const catMeta = OVERHEAD_CATEGORIES.find((c) => c.value === newEntry.category) || OVERHEAD_CATEGORIES[0]

  const loadData = async () => {
    try {
      setLoading(true)
      const [entryData, summaryData, siteData] = await Promise.all([
        fetchOverheadEntries(query),
        fetchOverheadSummary(query),
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
  }, [month, year, siteId])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const quantity = newEntry.quantity ? parseFloat(newEntry.quantity) : null
      const rate = newEntry.rate ? parseFloat(newEntry.rate) : null
      let amount = parseFloat(newEntry.amount) || 0
      if ((!newEntry.amount || amount === 0) && quantity != null && rate != null) {
        amount = quantity * rate
      }
      const unit = UNIT_BY_CATEGORY[newEntry.category] || newEntry.unit
      await createOverheadEntry({
        category: newEntry.category,
        description: newEntry.description,
        quantity,
        unit,
        amount,
        siteId: newEntry.siteId || null,
        date: new Date(newEntry.date).toISOString(),
        customData: {
          rate,
          remarks: newEntry.remarks || null,
        },
      })
      toast.success("Overhead entry added")
      setIsAddOpen(false)
      setNewEntry({
        category: "Machinery",
        description: "",
        quantity: "",
        unit: "nos",
        amount: "",
        rate: "",
        remarks: "",
        siteId: "",
        date: "2026-06-15T10:00",
      })
      loadData()
    } catch {
      toast.error("Failed to add overhead entry")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this overhead entry?")) return
    try {
      await deleteOverheadEntry(id)
      toast.success("Entry deleted")
      loadData()
    } catch {
      toast.error("Failed to delete entry")
    }
  }

  const handleDownloadTemplate = () => {
    const headers = [
      "category",
      "description",
      "quantity",
      "unit",
      "amount",
      "rate",
      "remarks",
      "siteId",
      "date",
      "avgFuelConsumption",
      "personnelDetails",
    ]
    downloadExcelTemplate(headers, "overhead_report_import")
  }

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    parseExcelFile(file)
      .then((data) => {
        setImportData(data)
        setIsImportOpen(true)
      })
      .catch((err) => {
        toast.error(err.message || "Failed to parse excel file")
      })
    e.target.value = ""
  }

  const handleConfirmImport = async (parsedRows: any[]) => {
    try {
      const formatted = parsedRows.map((row) => ({
        category: row.category || "Machinery",
        description: row.description || "",
        quantity: row.quantity ? parseFloat(row.quantity) : null,
        unit: row.unit || UNIT_BY_CATEGORY[row.category || "Machinery"],
        amount: parseFloat(row.amount) || 0,
        siteId: row.siteId || null,
        date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
        customData: {
          rate: row.rate ? parseFloat(row.rate) : null,
          remarks: row.remarks || null,
          avgFuelConsumption: row.avgFuelConsumption ? parseFloat(row.avgFuelConsumption) : null,
          personnelDetails: row.personnelDetails || null,
        },
      }))
      for (const entry of formatted) {
        await createOverheadEntry(entry)
      }
      toast.success(`Successfully imported ${formatted.length} overhead entries`)
      setIsImportOpen(false)
      loadData()
    } catch (err: any) {
      toast.error(err.message || "Import failed")
    }
  }

  const handleExportExcel = () => {
    if (!summary) return
     const totalCuM = summary?.totalProductionCuM || 0
    const grandTotal = summary?.grandTotal || 0
    const overallPerCuM = summary?.overallCostPerCuM || 0
    const sections = summary?.sections || []
    const sectionMap = Object.fromEntries(sections.map((s: any) => [s.category, s]))
    const monthLabel = summary?.monthLabel || `${MONTHS.find(m => m.value === month)?.label} ${year}`
    
    const exportData: any[][] = []
    
    // Title rows
    exportData.push(["RMC Batching Plant Jaypee Wish Town – Monthly Overheads Report"])
    exportData.push([plantName, "", "", `Month & Year: ${monthLabel}`])
    exportData.push([`Prepared by: ${preparedBy}`, "", "", `Submitted to (for review): ${submittedTo}`])
    exportData.push(["Total monthly Concrete Production done from in-house Batching Plants (KRH & GDI):", "", "", "", "", totalCuM, "CuM"])
    
    // Section 1: Machinery Overhead
    exportData.push(["1. Machinery Overhead"])
    exportData.push(["Equipment", "Qty", "Rate/Month (₹)", "Total Cost (₹)", "Machinery Cost Per CuM.", "Remarks"])
    const machineryRows = sectionMap.Machinery?.rows || []
    machineryRows.forEach((row: any) => {
      exportData.push([
        row.description,
        row.quantity ?? "",
        row.rate ?? "",
        row.amount,
        row.costPerCuM,
        row.remarks || ""
      ])
    })
    exportData.push(["Total Machinery Overhead", "", "", sectionMap.Machinery?.totalAmount || 0, ""])
    exportData.push([])
    
    // Section 2: Fuel and Lubricant Overheads
    exportData.push(["2. Fuel and Lubricant Overheads"])
    exportData.push([
      "Description",
      "Consumption (Litres)",
      "TOTAL PRODUCTION (IN CuM.)",
      "AVERAGE FUEL CONSUMPTION (IN LITRES PER CuM.)",
      "Rate of Fuel (₹/Litre)",
      "Total Cost (₹)",
      "Fuel Cost per CuM. (₹)"
    ])
    const fuelRows = sectionMap.Fuel?.rows || []
    fuelRows.forEach((row: any) => {
      exportData.push([
        row.description,
        row.quantity ?? "",
        totalCuM,
        row.avgFuelConsumption ?? "",
        row.rate ?? "",
        row.amount,
        row.costPerCuM
      ])
    })
    exportData.push(["Total Fuel Overhead", sectionMap.Fuel?.totalQuantity || 0, "", "", "", sectionMap.Fuel?.totalAmount || 0, ""])
    exportData.push([])
    
    // Section 3: Raw Material Overheads
    exportData.push(["3. Raw Material Overheads"])
    exportData.push([
      "Material",
      "Avg. Cost per MT (₹)",
      "Monthly Quantity Consumed (MT)",
      "Total Cost (₹)",
      "Raw Material Cost Per CuM. (₹)",
      "Remarks"
    ])
    const rawMaterialRows = sectionMap["Raw Material"]?.rows || []
    rawMaterialRows.forEach((row: any) => {
      exportData.push([
        row.description,
        row.rate ?? "",
        row.quantity ?? "",
        row.amount,
        row.costPerCuM,
        row.remarks || ""
      ])
    })
    exportData.push(["Total Raw Material Overhead", "", "", sectionMap["Raw Material"]?.totalAmount || 0, ""])
    exportData.push([])
    
    // Section 4: Manpower Overhead
    exportData.push(["4. Manpower Overhead (Labour Expenses)"])
    exportData.push([
      "Category",
      "",
      "No. of Persons",
      "Total Cost (₹)",
      "Details of Personnel Deployed",
      "Manpower Cost Per CuM. (₹)"
    ])
    const manpowerRows = sectionMap.Manpower?.rows || []
    manpowerRows.forEach((row: any) => {
      exportData.push([
        row.description,
        "",
        row.quantity ?? "",
        row.amount,
        row.personnelDetails || "",
        row.costPerCuM
      ])
    })
    exportData.push(["Total Manpower Overhead", "", "", sectionMap.Manpower?.totalAmount || 0, ""])
    exportData.push([])
    
    // Section 5: Electricity and Power Overheads
    exportData.push(["5. Electricity and Power Overheads"])
    exportData.push([
      "Description",
      "Units Consumed (kWh)",
      "Rate (₹/Unit)",
      "Total Cost (₹)",
      "Electricity Cost Per CuM. (₹)",
      "",
      "Remarks"
    ])
    const electricityRows = sectionMap.Electricity?.rows || []
    electricityRows.forEach((row: any) => {
      exportData.push([
        row.description,
        row.quantity ?? "",
        row.rate ?? "",
        row.amount,
        row.costPerCuM,
        "",
        row.remarks || ""
      ])
    })
    exportData.push([])
    
    // Section 6: Maintenance and Miscellaneous Overheads
    exportData.push(["6. Maintenance and Miscellaneous Overheads"])
    exportData.push([
      "Description",
      "",
      "",
      "Total Cost (₹)",
      "Miscellaneous Cost Per CuM. (₹)",
      "Remarks"
    ])
    const maintenanceRows = [...(sectionMap.Maintenance?.rows || []), ...(sectionMap.Scrap?.rows || [])]
    maintenanceRows.forEach((row: any) => {
      exportData.push([
        row.description,
        "",
        "",
        row.amount,
        row.costPerCuM,
        row.remarks || ""
      ])
    })
    exportData.push(["Total Miscellaneous Overhead", "", "", (sectionMap.Maintenance?.totalAmount || 0) + (sectionMap.Scrap?.totalAmount || 0), ""])
    exportData.push([])
    
    // Overall Summary
    exportData.push(["Overall Monthly Overheads Summary"])
    exportData.push([
      "Overhead Category",
      "",
      "Total Monthly Cost (₹)",
      "% of Total Overhead",
      "Overall All-Inclusive Cost Per CuM. (₹)",
      "Remarks"
    ])
    const summaryEntries = summary?.entries || []
    summaryEntries.forEach((row: any) => {
      exportData.push([
        row.category,
        "",
        row.amount,
        Number(row.percentOfTotal || 0).toFixed(2),
        row.costPerCuM,
        ""
      ])
    })
    exportData.push([
      "Total Monthly Overhead (₹)",
      "",
      grandTotal,
      "",
      "",
      "FINAL PRODUCTION FOR BOTH THE PLANTS TO BE INCLUDED IN IT"
    ])
    exportData.push(["Suggestions/Recommendations (if any):"])
    
    // Export using sheetjs
    const ws = XLSX.utils.aoa_to_sheet(exportData)
    ws["!cols"] = [
      { wch: 48 },
      { wch: 16 },
      { wch: 22 },
      { wch: 24 },
      { wch: 26 },
      { wch: 58 },
      { wch: 24 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 18 },
    ]
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
      { s: { r: 4, c: 0 }, e: { r: 4, c: 6 } },
      { s: { r: 15, c: 0 }, e: { r: 15, c: 6 } },
      { s: { r: 25, c: 0 }, e: { r: 25, c: 6 } },
      { s: { r: 36, c: 0 }, e: { r: 36, c: 6 } },
      { s: { r: 47, c: 0 }, e: { r: 47, c: 6 } },
      { s: { r: 51, c: 0 }, e: { r: 51, c: 6 } },
      { s: { r: 58, c: 0 }, e: { r: 58, c: 6 } },
    ]
    const setFormula = (cell: string, formula: string) => {
      ws[cell] = ws[cell] || { t: "n", v: 0 }
      ws[cell].f = formula
    }
    ;[
      ["E7", "D7/$F$4"],
      ["D8", "B8*C8"], ["E8", "D8/$F$4"],
      ["D9", "B9*C9"], ["E9", "D9/$F$4"],
      ["D10", "B10*C10"], ["E10", "D10/$F$4"],
      ["D11", "B11*C11"], ["E11", "D11/$F$4"],
      ["D12", "B12*C12"], ["E12", "D12/$F$4"],
      ["D13", "B13*C13"], ["E13", "D13/$F$4"],
      ["D14", "SUM(D7:D13)"], ["E14", "SUM(E7:E13)"],
      ["C18", "$F$4"], ["D18", "B18/C18"], ["F18", "E18*B24"], ["G18", "F18/C18"],
      ["D19", "B19/C18"], ["D20", "B20/C18"], ["D21", "B21/C18"], ["D22", "B22/C18"], ["D23", "B23/C18"],
      ["B24", "SUM(B18:B23)"], ["D24", "B24/C18"],
      ["D28", "B28*C28"], ["E28", "D28/$F$4"],
      ["D29", "B29*C29"], ["E29", "D29/$F$4"],
      ["D30", "B30*C30"], ["E30", "D30/$F$4"],
      ["D31", "B31*C31"], ["E31", "D31/$F$4"],
      ["D32", "B32*C32"], ["E32", "D32/$F$4"],
      ["D33", "B33*C33"], ["E33", "D33/$F$4"],
      ["D34", "B34*C34"], ["E34", "D34/$F$4"],
      ["D35", "SUM(D28:D34)"], ["E35", "D35/$F$4"],
      ["D46", "SUM(D39:D45)"],
      ["E50", "D50/$F$4"],
      ["E54", "D57/$F$4"], ["D57", "SUM(D54:D56)"],
      ["C61", "D14"], ["D61", "C61/C67%"], ["E61", "C67/C18"],
      ["C62", "F18"], ["D62", "C62/C67%"],
      ["C63", "D35"], ["D63", "C63/C67%"],
      ["C64", "D46"], ["D64", "C64/C67%"],
      ["C65", "D50"], ["D65", "C65/C67%"],
      ["C66", "D57"], ["D66", "C66/C67%"],
      ["C67", "SUM(C61:C66)"],
    ].forEach(([cell, formula]) => setFormula(cell, formula))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Combined - JUNE 2026")
    XLSX.writeFile(wb, `Overhead_Report_${monthLabel.replace(" ", "_")}.xlsx`)
  }

  const totalCuM = summary?.totalProductionCuM || 0
  const grandTotal = summary?.grandTotal || 0
  const overallPerCuM = summary?.overallCostPerCuM || 0
  const sections = summary?.sections || []
  const sectionMap = Object.fromEntries(sections.map((s: any) => [s.category, s]))

  const years = ["2024", "2025", "2026", "2027"]
  const monthLabel = MONTHS.find(m => m.value === month)?.label || "June"

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight">Monthly Overheads Report</h1>
          <p className="text-sm text-muted-foreground">
            Plant costs with correct units (nos / Litres / MT / persons) — average ₹ per CuM
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="h-9 w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">Site / Plant</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger className="h-9 w-[180px]"><SelectValue placeholder="All sites" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sites / Plants</SelectItem>
                {sites.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          
          {/* Import/Export Buttons */}
          <div className="flex items-center gap-2 border-l pl-4 ml-2">
            <Button variant="outline" className="text-xs h-9" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Template
            </Button>
            <label className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-background text-xs font-semibold px-3 h-9 cursor-pointer hover:bg-muted">
              <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
              Import Sheet Data
              <input type="file" onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls,.csv" />
            </label>
            <Button variant="outline" className="text-xs h-9" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              Export Sheet Data
            </Button>
          </div>
          
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
                <DialogDescription>
                  Unit is set automatically from category (Fuel→Litres, Raw Material→MT, Machinery→nos…)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label>Category *</Label>
                    <Select
                      value={newEntry.category}
                      onValueChange={(v) =>
                        setNewEntry({
                          ...newEntry,
                          category: v,
                          unit: UNIT_BY_CATEGORY[v] || "nos",
                        })
                      }
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {OVERHEAD_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.value} ({c.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Description *</Label>
                    <Input
                      placeholder="e.g. Transit Mixers (TMs) / Cement / Diesel - TMs"
                      value={newEntry.description}
                      onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input
                      type="datetime-local"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Site</Label>
                    <Select value={newEntry.siteId} onValueChange={(v) => setNewEntry({ ...newEntry, siteId: v })}>
                      <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                      <SelectContent>
                        {sites.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>{catMeta.qtyLabel}</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder={newEntry.unit}
                      value={newEntry.quantity}
                      onChange={(e) => setNewEntry({ ...newEntry, quantity: e.target.value })}
                      disabled={newEntry.category === "Maintenance"}
                    />
                    <p className="text-[10px] text-muted-foreground">Unit locked: {newEntry.unit}</p>
                  </div>
                  <div className="space-y-1">
                    <Label>{catMeta.rateLabel}</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Rate"
                      value={newEntry.rate}
                      onChange={(e) => setNewEntry({ ...newEntry, rate: e.target.value })}
                      disabled={newEntry.category === "Manpower" || newEntry.category === "Maintenance"}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Total Cost (₹) *</Label>
                    <Input
                      type="number"
                      step="any"
                      placeholder="Auto if qty × rate"
                      value={newEntry.amount}
                      onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label>Remarks</Label>
                    <Input
                      value={newEntry.remarks}
                      onChange={(e) => setNewEntry({ ...newEntry, remarks: e.target.value })}
                    />
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

      {/* Report Header with Plant Info */}
      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20">
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Plant Name</label>
                  <Input value={plantName} onChange={(e) => setPlantName(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Month & Year</label>
                  <Input value={`${monthLabel} ${year}`} className="h-8 text-sm" readOnly />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <label className="text-xs text-muted-foreground">Prepared By</label>
                  <Input value={preparedBy} onChange={(e) => setPreparedBy(e.target.value)} className="h-8 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Submitted To</label>
                  <Input value={submittedTo} onChange={(e) => setSubmittedTo(e.target.value)} className="h-8 text-sm" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">
                RMC Batching Plant — {monthLabel} {year} Overheads
              </p>
              <p className="text-lg font-bold mt-1">
                Total monthly Concrete Production:{" "}
                <span className="text-blue-700 dark:text-blue-400">{totalCuM.toLocaleString("en-IN")} CuM</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Denominator is CuM only. Fuel stays in Litres, raw materials in MT, machinery in nos.
              </p>
              {(summary?.productionByGrade || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {summary.productionByGrade.map((g: any) => (
                    <span key={g.grade} className="text-xs px-2 py-1 rounded bg-white dark:bg-slate-900 border">
                      {g.grade}: <strong>{g.cum}</strong> CuM
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Overhead" value={inr(grandTotal)} subtitle={monthLabel} icon={DollarSign} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="All-inclusive ₹/CuM" value={inr(overallPerCuM)} subtitle="average of everything used" icon={Layers} colorClass="bg-indigo-100 dark:bg-indigo-900/30" />
        <KPICard title="Production Volume" value={`${totalCuM.toLocaleString("en-IN")} CuM`} subtitle="denominator" icon={Factory} colorClass="bg-amber-100 dark:bg-amber-900/30" />
        <KPICard title="Fuel Cost / CuM" value={inr(sectionMap.Fuel?.totalCostPerCuM || 0)} subtitle={`${(sectionMap.Fuel?.rows || []).reduce((s: number, r: any) => s + (r.quantity || 0), 0).toLocaleString("en-IN")} Litres`} icon={Fuel} colorClass="bg-orange-100 dark:bg-orange-900/30" />
      </div>

      <SectionTable
        title="1. Machinery Overhead"
        category="Machinery"
        qtyHeader="Qty (nos)"
        rateHeader="Rate / Month (₹)"
        costHeader="Machinery Cost / CuM"
        rows={sectionMap.Machinery?.rows || []}
        totalLabel="Total Machinery Overhead"
        totalAmount={sectionMap.Machinery?.totalAmount || 0}
        totalCostPerCuM={sectionMap.Machinery?.totalCostPerCuM || 0}
      />

      <SectionTable
        title="2. Fuel and Lubricant Overheads"
        category="Fuel"
        qtyHeader="Consumption (Litres)"
        rateHeader="Rate ₹ / Litre"
        costHeader="Fuel Cost / CuM"
        rows={sectionMap.Fuel?.rows || []}
        totalLabel="Total Fuel & Lubricant Overhead"
        totalAmount={sectionMap.Fuel?.totalAmount || 0}
        totalCostPerCuM={sectionMap.Fuel?.totalCostPerCuM || 0}
      />

      <SectionTable
        title="3. Raw Material Overheads"
        category="Raw Material"
        qtyHeader="Monthly Qty (MT)"
        rateHeader="Avg Cost ₹ / MT"
        costHeader="Raw Material Cost / CuM"
        rows={sectionMap["Raw Material"]?.rows || []}
        totalLabel="Total Raw Material Overhead"
        totalAmount={sectionMap["Raw Material"]?.totalAmount || 0}
        totalCostPerCuM={sectionMap["Raw Material"]?.totalCostPerCuM || 0}
      />

      <SectionTable
        title="4. Manpower Overhead (Labour)"
        category="Manpower"
        qtyHeader="No. of Persons"
        rateHeader="—"
        costHeader="Manpower Cost / CuM"
        rows={sectionMap.Manpower?.rows || []}
        totalLabel="Total Manpower Overhead"
        totalAmount={sectionMap.Manpower?.totalAmount || 0}
        totalCostPerCuM={sectionMap.Manpower?.totalCostPerCuM || 0}
      />

      <SectionTable
        title="5. Electricity and Power Overheads"
        category="Electricity"
        qtyHeader="Units (kWh)"
        rateHeader="Rate ₹ / Unit"
        costHeader="Electricity Cost / CuM"
        rows={sectionMap.Electricity?.rows || []}
        totalLabel="Total Electricity Overhead"
        totalAmount={sectionMap.Electricity?.totalAmount || 0}
        totalCostPerCuM={sectionMap.Electricity?.totalCostPerCuM || 0}
      />

      <SectionTable
        title="6. Maintenance & Miscellaneous"
        category="Maintenance"
        qtyHeader="—"
        rateHeader="—"
        costHeader="Misc Cost / CuM"
        rows={[...(sectionMap.Maintenance?.rows || []), ...(sectionMap.Scrap?.rows || [])]}
        totalLabel="Total Maintenance / Misc"
        totalAmount={(sectionMap.Maintenance?.totalAmount || 0) + (sectionMap.Scrap?.totalAmount || 0)}
        totalCostPerCuM={(sectionMap.Maintenance?.totalCostPerCuM || 0) + (sectionMap.Scrap?.totalCostPerCuM || 0)}
      />

      <Card>
        <CardHeader>
          <CardTitle>Overall Monthly Overheads Summary</CardTitle>
          <CardDescription>All-inclusive cost per cubic meter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Overhead Category</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Total Monthly Cost (₹)</TableHead>
                  <TableHead>% of Total</TableHead>
                  <TableHead>Cost Per CuM (₹)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(summary?.entries || []).map((row: any) => (
                  <TableRow key={row.category}>
                    <TableCell className="text-xs font-medium">{row.category}</TableCell>
                    <TableCell className="text-xs">{row.unit || UNIT_BY_CATEGORY[row.category] || "—"}</TableCell>
                    <TableCell className="text-xs">{inr(row.amount)}</TableCell>
                    <TableCell className="text-xs">{Number(row.percentOfTotal || 0).toFixed(2)}%</TableCell>
                    <TableCell className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      {inr(row.costPerCuM)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-blue-50 dark:bg-blue-950/40">
                  <TableCell className="text-sm font-bold" colSpan={2}>Total / All-inclusive</TableCell>
                  <TableCell className="text-sm font-bold">{inr(grandTotal)}</TableCell>
                  <TableCell className="text-sm font-bold">100%</TableCell>
                  <TableCell className="text-sm font-bold text-blue-700 dark:text-blue-400">
                    {inr(overallPerCuM)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Entry Log</CardTitle>
          <CardDescription>Raw lines for this month (with locked units)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Qty + Unit</TableHead>
                  <TableHead>Amount (₹)</TableHead>
                  <TableHead>₹ / CuM</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No overhead entries for this filter — run fresh seed or pick June 2026
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs">{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-medium">{entry.category}</TableCell>
                      <TableCell className="text-xs">{entry.description || "—"}</TableCell>
                      <TableCell className="text-xs">
                        {fmtQty(entry.quantity, entry.unit || UNIT_BY_CATEGORY[entry.category])}
                      </TableCell>
                      <TableCell className="text-xs font-semibold">{inr(entry.amount || 0)}</TableCell>
                      <TableCell className="text-xs">{inr(totalCuM > 0 ? (entry.amount || 0) / totalCuM : 0)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive"
                          onClick={() => handleDelete(entry.id)}
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

      {/* Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["category", "description", "quantity", "unit", "amount", "rate", "remarks", "siteId", "date"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.category) errs.push(`Row ${i + 1}: category is required`)
          if (!row.description) errs.push(`Row ${i + 1}: description is required`)
          if (!row.amount) errs.push(`Row ${i + 1}: amount is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Overhead Entries Preview"
      />
    </div>
  )
}
