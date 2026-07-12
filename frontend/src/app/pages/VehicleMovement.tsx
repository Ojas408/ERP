import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Truck, TruckIcon, Activity, Clock, Upload, Download, Plus, Edit, Trash2, RefreshCw, MapPin, FileSpreadsheet } from "lucide-react"
import { fetchVehicles, createVehicle, fetchVehicleMovements, createVehicleMovement, deleteRecord, updateRecord } from "../services/api"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { exportToExcel, downloadExcelTemplate } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { useExcelImport } from "../hooks/use-excel-import"
import { toDateTimeInputValue } from "../lib/date"

export default function VehicleMovement() {
  const [vehicles, setVehicles] = useState<any[]>([])
  const [movements, setMovements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false)
  const [isAddMovementOpen, setIsAddMovementOpen] = useState(false)
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: "",
    model: "",
    status: "available"
  })
  const [newMovement, setNewMovement] = useState({
    vehicleId: "",
    fromLocation: "",
    toLocation: "",
    startTime: toDateTimeInputValue(),
    endTime: "",
    distance: "",
    fuelConsumed: ""
  })

  const { importData, isImportOpen, setIsImportOpen, handleExcelImport } = useExcelImport({
    onError: (error) => console.error("Failed to parse excel file", error),
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [vData, mData] = await Promise.all([
        fetchVehicles(),
        fetchVehicleMovements()
      ])
      setVehicles(Array.isArray(vData) ? vData : [])
      setMovements(Array.isArray(mData) ? mData : [])
    } catch (error) {
      console.error("Failed to load vehicle data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVehicle(newVehicle)
      setIsAddVehicleOpen(false)
      setNewVehicle({ plateNumber: "", model: "", status: "available" })
      loadData()
    } catch (error) {
      console.error("Failed to add vehicle:", error)
    }
  }

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createVehicleMovement(newMovement)
      setIsAddMovementOpen(false)
      setNewMovement({
        vehicleId: "",
        fromLocation: "",
        toLocation: "",
        startTime: toDateTimeInputValue(),
        endTime: "",
        distance: "",
        fuelConsumed: ""
      })
      loadData()
    } catch (error) {
      console.error("Failed to record movement:", error)
    }
  }

  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["plateNumber", "model", "status"],
      "vehicles_import_template"
    )
  }

  const handleConfirmImport = async (parsedRows: any[]) => {
    try {
      const formatted = parsedRows.map(row => ({
        plateNumber: String(row.plateNumber || ""),
        model: String(row.model || ""),
        status: String(row.status || "available")
      }))
      
      for (const item of formatted) {
        if (!item.plateNumber) continue
        await createVehicle(item)
      }
      
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      console.error("Import failed.", err)
    }
  }

  const handleExportExcel = () => {
    const data = vehicles.map(v => ({
      PlateNumber: v.plateNumber,
      Model: v.model,
      Status: v.status
    }))
    exportToExcel(data, "vehicles_report")
  }

  const availableCount = vehicles.filter(v => v.status === "available").length
  const inUseCount = vehicles.filter(v => v.status === "in-use").length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Vehicle & Fleet</h1>
          <p className="text-sm text-muted-foreground">Fleet management and movement tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <label className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-background text-xs font-semibold px-3 h-9 cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
            Import
            <input type="file" onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls,.csv" />
          </label>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Available" value={availableCount.toString()} subtitle="ready" icon={Truck} colorClass="bg-green-100 dark:bg-green-900/30" />
        <KPICard title="In-Use" value={inUseCount.toString()} subtitle="assigned" icon={TruckIcon} colorClass="bg-blue-100 dark:bg-blue-900/30" />
        <KPICard title="Total Fleet" value={vehicles.length.toString()} icon={Activity} colorClass="bg-purple-100 dark:bg-purple-900/30" />
        <KPICard title="Maintenance" value={vehicles.filter(v => v.status === "maintenance").length.toString()} icon={Clock} colorClass="bg-orange-100 dark:bg-orange-900/30" />
      </div>

      <Tabs defaultValue="fleet">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="fleet">Fleet Directory</TabsTrigger>
          <TabsTrigger value="movements">Movement Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fleet" className="space-y-4">
          <div className="flex justify-end">
             <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Vehicle</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Vehicle</DialogTitle>
                  <DialogDescription>Register a new vehicle to the fleet</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddVehicle} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2"><Label>Plate Number</Label><Input value={newVehicle.plateNumber} onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})} required /></div>
                    <div className="space-y-2 col-span-2"><Label>Model</Label><Input value={newVehicle.model} onChange={e => setNewVehicle({...newVehicle, model: e.target.value})} required /></div>
                    <div className="space-y-2 col-span-2">
                      <Label>Status</Label>
                      <Select value={newVehicle.status} onValueChange={v => setNewVehicle({...newVehicle, status: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="in-use">In-Use</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter><Button type="submit">Add Vehicle</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plate Number</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.plateNumber}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell><Badge variant={vehicle.status === "available" ? "default" : "outline"}>{vehicle.status}</Badge></TableCell>
                      <TableCell>
                         <div className="flex gap-1">
                           <Button variant="ghost" size="sm" className="h-7 w-7 p-0"><Edit className="h-3.5 w-3.5" /></Button>
                           <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteRecord('vehicles', vehicle.id).then(loadData)}><Trash2 className="h-3.5 w-3.5" /></Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddMovementOpen} onOpenChange={setIsAddMovementOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><MapPin className="h-4 w-4 mr-2" />Record Movement</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Movement Record</DialogTitle>
                  <DialogDescription>Track a vehicle's trip details</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddMovement} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2">
                      <Label>Vehicle</Label>
                      <Select value={newMovement.vehicleId} onValueChange={v => setNewMovement({...newMovement, vehicleId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select Vehicle" /></SelectTrigger>
                        <SelectContent>
                          {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plateNumber}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>From</Label><Input value={newMovement.fromLocation} onChange={e => setNewMovement({...newMovement, fromLocation: e.target.value})} required /></div>
                    <div className="space-y-2"><Label>To</Label><Input value={newMovement.toLocation} onChange={e => setNewMovement({...newMovement, toLocation: e.target.value})} required /></div>
                    <div className="space-y-2 col-span-2"><Label>Start Time</Label><Input type="datetime-local" value={newMovement.startTime} onChange={e => setNewMovement({...newMovement, startTime: e.target.value})} required /></div>
                  </div>
                  <DialogFooter><Button type="submit">Save Log</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.vehicle?.plateNumber}</TableCell>
                      <TableCell>{m.fromLocation}</TableCell>
                      <TableCell>{m.toLocation}</TableCell>
                      <TableCell>{new Date(m.startTime).toLocaleString()}</TableCell>
                      <TableCell><Badge variant="outline">In Transit</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["plateNumber", "model", "status"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.plateNumber) errs.push(`Row ${i + 1}: plateNumber is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Vehicles"
      />
    </div>
  )
}
