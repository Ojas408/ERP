import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { MapPin, Building2, Users, TrendingUp, Upload, Download, Plus, Eye, Edit, Trash2 } from "lucide-react"

const sites = [
  { id: "s1", name: "Main Crusher Plant", location: "Pune, MH", status: "active", workers: 85, completion: 100, revenue: "₹28.5L" },
  { id: "s2", name: "Site A - Highway Project", location: "Mumbai-Pune Highway", status: "active", workers: 62, completion: 78, revenue: "₹18.2L" },
  { id: "s3", name: "Site B - Building Construction", location: "Hinjewadi, Pune", status: "active", workers: 45, completion: 65, revenue: "₹12.8L" },
  { id: "s4", name: "Site C - Infrastructure", location: "Wakad, Pune", status: "active", workers: 38, completion: 42, revenue: "₹8.6L" },
  { id: "s5", name: "Site D - Bridge Construction", location: "Bhor, Pune", status: "paused", workers: 15, completion: 25, revenue: "₹3.2L" },
]

const sitePerformance = [
  { id: "sp1", site: "Main Plant", productivity: 98, safety: 96, quality: 94 },
  { id: "sp2", site: "Site A", productivity: 92, safety: 94, quality: 90 },
  { id: "sp3", site: "Site B", productivity: 88, safety: 92, quality: 89 },
  { id: "sp4", site: "Site C", productivity: 85, safety: 90, quality: 87 },
  { id: "sp5", site: "Site D", productivity: 75, safety: 88, quality: 82 },
]

const resourceAllocation = [
  { id: "ra1", name: "Workers", value: 35, color: "#3b82f6" },
  { id: "ra2", name: "Equipment", value: 28, color: "#10b981" },
  { id: "ra3", name: "Materials", value: 22, color: "#f59e0b" },
  { id: "ra4", name: "Supervision", value: 15, color: "#ef4444" },
]

const safetyIncidents = [
  { id: "si1", site: "Main Crusher Plant", date: "May 15", type: "Minor Injury", severity: "low", status: "resolved" },
  { id: "si2", site: "Site A - Highway Project", date: "May 18", type: "Near Miss", severity: "low", status: "resolved" },
  { id: "si3", site: "Site B - Building Construction", date: "May 20", type: "Equipment Damage", severity: "medium", status: "investigating" },
  { id: "si4", site: "Site C - Infrastructure", date: "May 22", type: "Safety Violation", severity: "low", status: "resolved" },
]

export default function SiteManagement() {
  const activeSites = sites.filter(s => s.status === "active").length
  const totalWorkers = sites.reduce((sum, s) => sum + s.workers, 0)
  const avgCompletion = Math.round(sites.reduce((sum, s) => sum + s.completion, 0) / sites.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2">Site Management</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and manage all construction sites
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs h-9">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button variant="outline" className="text-xs h-9">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button className="text-xs h-9">
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Active Sites"
          value={activeSites.toString()}
          subtitle={`of ${sites.length} total`}
          icon={MapPin}
          colorClass="bg-blue-100 dark:bg-blue-900/30"
        />
        <KPICard
          title="Total Workers"
          value={totalWorkers.toString()}
          subtitle="across all sites"
          icon={Users}
          colorClass="bg-green-100 dark:bg-green-900/30"
        />
        <KPICard
          title="Avg Completion"
          value={`${avgCompletion}%`}
          subtitle="project progress"
          icon={TrendingUp}
          colorClass="bg-purple-100 dark:bg-purple-900/30"
          trend={{ value: 12.5, isPositive: true }}
        />
        <KPICard
          title="Total Revenue"
          value="₹71.3L"
          subtitle="this month"
          icon={Building2}
          colorClass="bg-orange-100 dark:bg-orange-900/30"
          trend={{ value: 8.7, isPositive: true }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Performance Metrics</CardTitle>
            <CardDescription>Productivity, safety, and quality scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sitePerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="site" className="text-xs" angle={-15} textAnchor="end" height={80} />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar dataKey="productivity" fill="#3b82f6" name="Productivity" />
                <Bar dataKey="safety" fill="#10b981" name="Safety" />
                <Bar dataKey="quality" fill="#f59e0b" name="Quality" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resource Allocation</CardTitle>
            <CardDescription>Distribution of resources across sites</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={resourceAllocation}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {resourceAllocation.map((entry) => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Sites Overview Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sites Overview</CardTitle>
          <CardDescription>Complete status of all construction sites</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Workers</TableHead>
                  <TableHead>Completion</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sites.map((site) => (
                  <TableRow key={site.id}>
                    <TableCell className="text-xs">{site.name}</TableCell>
                    <TableCell className="text-xs">{site.location}</TableCell>
                    <TableCell>
                      <Badge
                        variant={site.status === "active" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {site.status.charAt(0).toUpperCase() + site.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{site.workers}</TableCell>
                    <TableCell className="text-xs">{site.completion}%</TableCell>
                    <TableCell className="text-xs">{site.revenue}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-xs w-10">{site.completion}%</span>
                        <div className="w-20">
                          <Progress value={site.completion} className="h-2" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Safety Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Safety Incidents</CardTitle>
          <CardDescription>Safety monitoring and incident tracking</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Site</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safetyIncidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="text-xs">{incident.site}</TableCell>
                    <TableCell className="text-xs">{incident.date}</TableCell>
                    <TableCell className="text-xs">{incident.type}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          incident.severity === "low" ? "secondary" :
                          incident.severity === "medium" ? "outline" :
                          "destructive"
                        }
                        className="text-xs"
                      >
                        {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={incident.status === "resolved" ? "default" : "outline"}
                        className="text-xs"
                      >
                        {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
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
  )
}
