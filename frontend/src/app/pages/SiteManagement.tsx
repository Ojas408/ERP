import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { MapPin, Building2, TrendingUp, Upload, Download, Plus, Edit, Trash2, RefreshCw, Printer } from "lucide-react"
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
import { downloadExcelTemplate, parseExcelFile } from "../lib/excel-helper"

const escapeHTML = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;")

const buildStatusChartSvg = (activeSiteCount: number, totalSites: number) => {
  const activeFraction = totalSites > 0 ? activeSiteCount / totalSites : 0
  const otherFraction = 1 - activeFraction
  const pieSlice = (startFraction: number, fraction: number, color: string) => {
    if (fraction <= 0) return ""
    if (fraction >= 1) return `<circle cx="150" cy="130" r="88" fill="${color}" />`

    const startAngle = (startFraction * 2 * Math.PI) - Math.PI / 2
    const endAngle = startAngle + (fraction * 2 * Math.PI)
    const x1 = 150 + 88 * Math.cos(startAngle)
    const y1 = 130 + 88 * Math.sin(startAngle)
    const x2 = 150 + 88 * Math.cos(endAngle)
    const y2 = 130 + 88 * Math.sin(endAngle)
    const largeArc = fraction > 0.5 ? 1 : 0
    return `<path d="M 150 130 L ${x1} ${y1} A 88 88 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${color}" />`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="300" viewBox="0 0 420 300" role="img" aria-label="Site status distribution">
    <rect width="100%" height="100%" fill="#ffffff" />
    <text x="24" y="30" font-family="Arial, sans-serif" font-size="18" font-weight="600" fill="#111827">Status Distribution</text>
    ${pieSlice(0, activeFraction, "#3b82f6")}${pieSlice(activeFraction, otherFraction, "#e5e7eb")}
    <rect x="278" y="95" width="12" height="12" fill="#3b82f6" />
    <text x="298" y="106" font-family="Arial, sans-serif" font-size="13" fill="#111827">Active: ${(activeFraction * 100).toFixed(0)}%</text>
    <rect x="278" y="125" width="12" height="12" fill="#e5e7eb" />
    <text x="298" y="136" font-family="Arial, sans-serif" font-size="13" fill="#111827">Other: ${(otherFraction * 100).toFixed(0)}%</text>
    <text x="278" y="170" font-family="Arial, sans-serif" font-size="12" fill="#6b7280">Sites: ${totalSites}</text>
  </svg>`
}

export default function SiteManagement() {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)
  const importFileInputRef = useRef<HTMLInputElement>(null)
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

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(["Site Name", "Location", "Status"], "site_management")
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    let importedCount = 0
    try {
      const rows = await parseExcelFile(file)
      if (rows.length === 0) throw new Error("The selected file has no sites to import.")

      const importedSites = rows.map((row, index) => {
        const rowNumber = index + 2
        const name = String(row["Site Name"] ?? "").trim()
        const location = String(row.Location ?? "").trim()
        const status = String(row.Status ?? "").trim().toLowerCase().replace(/\s+/g, "-")

        if (!name) throw new Error(`Row ${rowNumber}: Site Name is required.`)
        if (!location) throw new Error(`Row ${rowNumber}: Location is required.`)
        if (!["active", "completed", "on-hold"].includes(status)) {
          throw new Error(`Row ${rowNumber}: Status must be active, completed, or on-hold.`)
        }
        return { name, location, status }
      })

      for (const site of importedSites) {
        await createSite(site)
        importedCount += 1
      }
      await loadSites()
      window.alert(`Imported ${importedCount} site${importedCount === 1 ? "" : "s"}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please check the file format and try again."
      window.alert(importedCount > 0
        ? `Import stopped after ${importedCount} site${importedCount === 1 ? "" : "s"}. ${message}`
        : message)
    } finally {
      e.target.value = ""
    }
  }

  const handleExport = () => {
    const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`
    const csv = [
      ["Site Name", "Location", "Status"],
      ...safeSites.map(site => [site.name, site.location, site.status]),
    ].map(row => row.map(csvCell).join(",")).join("\r\n")

    const downloadFile = (content: BlobPart, fileName: string, type: string) => {
      const url = URL.createObjectURL(new Blob([content], { type }))
      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    }

    const chartSvg = buildStatusChartSvg(activeSitesCount, safeSites.length)
    const fileSuffix = new Date().toISOString().slice(0, 10)
    downloadFile(`\uFEFF${csv}`, `site_management_${fileSuffix}.csv`, "text/csv;charset=utf-8")
    downloadFile(chartSvg, `site_status_distribution_${fileSuffix}.svg`, "image/svg+xml;charset=utf-8")
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      window.alert("Please allow popups to print the Site Management report.")
      return
    }

    const siteRows = safeSites.map(site => `
      <tr>
        <td>${escapeHTML(site.name)}</td>
        <td>${escapeHTML(site.location || "N/A")}</td>
        <td><span class="status">${escapeHTML(site.status)}</span></td>
      </tr>
    `).join("")
    const chartSvg = buildStatusChartSvg(activeSitesCount, safeSites.length)
    const printedAt = new Date().toLocaleString()
    const reportHTML = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Site Management Report</title>
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 40px; color: #1f2937; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 24px; }
            h1 { font-size: 22px; font-weight: 700; color: #1e3a8a; margin: 0; }
            .brand { font-size: 11px; color: #4b5563; margin-top: 5px; }
            .meta { font-size: 12px; line-height: 1.6; color: #6b7280; text-align: right; }
            .summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 20px; }
            .metric { border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; background: #f9fafb; }
            .metric-label { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; }
            .metric-value { color: #111827; font-size: 22px; font-weight: 700; margin-top: 5px; }
            .section-title { font-size: 14px; color: #111827; font-weight: 700; margin: 0 0 10px; }
            .chart-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 22px; break-inside: avoid; }
            .chart { display: flex; justify-content: center; }
            .chart svg { max-width: 100%; height: auto; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            th, td { border: 1px solid #e5e7eb; padding: 9px 12px; text-align: left; font-size: 11px; }
            th { background: #eff6ff; color: #1e3a8a; font-weight: 600; text-transform: uppercase; font-size: 10px; letter-spacing: .04em; }
            tbody tr:nth-child(even) { background: #f9fafb; }
            .status { display: inline-block; text-transform: capitalize; }
            .empty { color: #6b7280; text-align: center; padding: 18px; }
            @page { size: A4 portrait; margin: 16mm; }
            @media print { body { margin: 0; } .chart-card, .metric { break-inside: avoid; } }
          </style>
        </head>
        <body>
          <header class="header">
            <div><h1>Site Management</h1><div class="brand">ASKSHREE MixFlow SaaS Platform</div></div>
            <div class="meta"><div>Printed: ${escapeHTML(printedAt)}</div><div>Tenant: Scoped Session</div></div>
          </header>
          <section class="summary">
            <div class="metric"><div class="metric-label">Active Sites</div><div class="metric-value">${activeSitesCount}</div></div>
            <div class="metric"><div class="metric-label">Total Sites</div><div class="metric-value">${safeSites.length}</div></div>
          </section>
          <section class="chart-card"><h2 class="section-title">Status Distribution</h2><div class="chart">${chartSvg}</div></section>
          <section>
            <h2 class="section-title">Site Roster</h2>
            <table>
              <thead><tr><th>Site Name</th><th>Location</th><th>Status</th></tr></thead>
              <tbody>${siteRows || '<tr><td class="empty" colspan="3">No sites to display</td></tr>'}</tbody>
            </table>
          </section>
          <script>window.onload = function() { window.print(); setTimeout(function() { window.close(); }, 500); };</script>
        </body>
      </html>
    `
    printWindow.document.write(reportHTML)
    printWindow.document.close()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Site Management</h1>
          <p className="text-sm text-muted-foreground">Monitor and manage construction sites</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button variant="outline" className="text-xs h-9" onClick={loadSites}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />Template
          </Button>
          <Button variant="outline" className="text-xs h-9" onClick={() => importFileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" />Import CSV
          </Button>
          <input
            ref={importFileInputRef}
            type="file"
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleImportFile}
          />
          <Button variant="outline" className="text-xs h-9" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />Export CSV
          </Button>
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
