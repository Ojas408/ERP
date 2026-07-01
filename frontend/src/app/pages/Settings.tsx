import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Settings as SettingsIcon, User, Bell, Shield, Database, Globe, Palette, Mail } from "lucide-react"

const settingsSections = [
  {
    id: "profile",
    title: "Profile Settings",
    description: "Manage your account information and preferences",
    icon: User,
    items: [
      { label: "Name", value: "Admin User", editable: true },
      { label: "Email", value: "admin@omniflowerp.com", editable: true },
      { label: "Role", value: "System Administrator", editable: false },
      { label: "Department", value: "Management", editable: true },
    ]
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure alerts and notification preferences",
    icon: Bell,
    items: [
      { label: "Email Notifications", value: "Enabled", editable: true },
      { label: "SMS Alerts", value: "Enabled", editable: true },
      { label: "Production Alerts", value: "Enabled", editable: true },
      { label: "Expense Alerts", value: "Enabled", editable: true },
    ]
  },
  {
    id: "security",
    title: "Security & Privacy",
    description: "Manage security settings and access control",
    icon: Shield,
    items: [
      { label: "Two-Factor Authentication", value: "Enabled", editable: true },
      { label: "Session Timeout", value: "30 minutes", editable: true },
      { label: "Password Last Changed", value: "15 days ago", editable: false },
      { label: "Active Sessions", value: "2 devices", editable: false },
    ]
  },
  {
    id: "system",
    title: "System Configuration",
    description: "Configure system-wide settings and preferences",
    icon: Database,
    items: [
      { label: "Database Backup", value: "Daily at 2:00 AM", editable: true },
      { label: "Data Retention", value: "12 months", editable: true },
      { label: "System Language", value: "English", editable: true },
      { label: "Time Zone", value: "IST (UTC+5:30)", editable: true },
    ]
  },
  {
    id: "appearance",
    title: "Appearance",
    description: "Customize the look and feel of the application",
    icon: Palette,
    items: [
      { label: "Theme", value: "Light Mode", editable: true },
      { label: "Color Scheme", value: "Blue", editable: true },
      { label: "Font Size", value: "Medium", editable: true },
      { label: "Compact Mode", value: "Disabled", editable: true },
    ]
  },
  {
    id: "integrations",
    title: "Integrations",
    description: "Connect with third-party services and APIs",
    icon: Globe,
    items: [
      { label: "Payment Gateway", value: "Connected", editable: true },
      { label: "SMS Gateway", value: "Connected", editable: true },
      { label: "Email Service", value: "Connected", editable: true },
      { label: "GPS Tracking", value: "Not Connected", editable: true },
    ]
  },
]

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl mb-2">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure OmniFlow ERP system preferences
        </p>
      </div>

      {/* Settings Sections */}
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
                      {item.editable && (
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                          Edit
                        </Button>
                      )}
                      {!item.editable && (
                        <Badge variant="outline" className="text-xs">
                          Read Only
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Actions</CardTitle>
          <CardDescription>Perform system maintenance and administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="text-xs h-9">
              <Database className="h-4 w-4 mr-2" />
              Backup Database
            </Button>
            <Button variant="outline" className="text-xs h-9">
              <Mail className="h-4 w-4 mr-2" />
              Test Email Configuration
            </Button>
            <Button variant="outline" className="text-xs h-9">
              <SettingsIcon className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button variant="outline" className="text-xs h-9">
              Export System Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
