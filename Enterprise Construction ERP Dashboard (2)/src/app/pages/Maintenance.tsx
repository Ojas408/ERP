import { MaintenanceOverview } from "../components/dashboard/maintenance-overview"
import { Button } from "../components/ui/button"
import { Download, Upload, Plus, Calendar, FileText } from "lucide-react"

export default function Maintenance() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Maintenance Report</h1>
          <p className="text-sm text-muted-foreground">
            Equipment health status and maintenance schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>
      <MaintenanceOverview />
    </div>
  )
}
