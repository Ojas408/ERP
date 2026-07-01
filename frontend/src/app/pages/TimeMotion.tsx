import { VehicleTimeMotionStudy } from "../components/dashboard/vehicle-time-motion"
import { Button } from "../components/ui/button"
import { Download, Upload, FileText, Printer } from "lucide-react"

export default function TimeMotion() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Vehicle Time Motion Study</h1>
          <p className="text-sm text-muted-foreground">
            Detailed analysis of vehicle movement, efficiency, and delays
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import Data
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Printer className="h-4 w-4 mr-2" />
            Print Report
          </Button>
        </div>
      </div>
      <VehicleTimeMotionStudy />
    </div>
  )
}
