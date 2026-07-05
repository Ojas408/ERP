import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Settings as SettingsIcon, User, Bell, Database, Globe, Palette, Mail, RefreshCw } from "lucide-react"
import { fetchSettingsReport } from "../services/api"
import { useAuth } from "../contexts/AuthContext"

export default function Settings() {
  const { user } = useAuth()
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettingsReport()
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const profile = report?.profile
  const system = report?.system

  const settingsSections = [
    {
      id: "profile",
      title: "Profile Settings",
      description: "Manage your account information and preferences",
      icon: User,
      items: [
        { label: "Name", value: profile?.name || user?.email || "—", editable: false },
        { label: "Email", value: profile?.email || user?.email || "—", editable: false },
        { label: "Role", value: profile?.role || user?.role || "—", editable: false },
        { label: "Department", value: profile?.department || "Management", editable: false },
      ]
    },
    {
      id: "system",
      title: "System Configuration",
      description: "Workspace statistics and system preferences",
      icon: Database,
      items: [
        { label: "Total Records", value: system?.databaseRecords?.toLocaleString() || "—", editable: false },
        { label: "Database Backup", value: system?.backupSchedule || "Daily at 2:00 AM", editable: false },
        { label: "Data Retention", value: system?.retention || "12 months", editable: false },
        { label: "Time Zone", value: system?.timezone || "IST (UTC+5:30)", editable: false },
      ]
    },
    {
      id: "notifications",
      title: "Notifications",
      description: "Alert preferences (configure after go-live)",
      icon: Bell,
      items: [
        { label: "Email Notifications", value: "Enabled", editable: false },
        { label: "Low Stock Alerts", value: "Enabled", editable: false },
        { label: "Maintenance Alerts", value: "Enabled", editable: false },
      ]
    },
    {
      id: "appearance",
      title: "Appearance",
      description: "Use the theme toggle in the top navigation bar",
      icon: Palette,
      items: [
        { label: "Theme", value: "Light / Dark (navbar toggle)", editable: false },
      ]
    },
    {
      id: "integrations",
      title: "Integrations",
      description: "External services (available in future releases)",
      icon: Globe,
      items: [
        { label: "GPS Tracking", value: "Not Connected", editable: false },
        { label: "Email Service", value: "Not Connected", editable: false },
      ]
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            System preferences and workspace information
          </p>
        </div>
        <Button variant="outline" className="text-xs h-9" disabled={loading} onClick={() => fetchSettingsReport().then(setReport)}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle>{section.title}</CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {section.items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div className="flex-1">
                        <p className="text-xs mb-1">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.value}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">Read Only</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Advanced Actions</CardTitle>
          <CardDescription>Available in a future release</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="text-xs h-9" disabled>
              <Database className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
            <Button variant="outline" className="text-xs h-9" disabled>
              <Mail className="h-4 w-4 mr-2" />
              Test Email Configuration
            </Button>
            <Button variant="outline" className="text-xs h-9" disabled>
              <SettingsIcon className="h-4 w-4 mr-2" />
              Export System Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
