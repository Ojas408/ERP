import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { DollarSign, RefreshCw, BarChart2, TrendingDown, Landmark, PieChart as PieIcon } from "lucide-react"
import { fetchExpenses, fetchEmployees } from "../services/api"
import { toast } from "sonner"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

export default function OverheadReport() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [expenseData, employeeData] = await Promise.all([
        fetchExpenses(),
        fetchEmployees()
      ])
      setExpenses(Array.isArray(expenseData) ? expenseData : [])
      setEmployees(Array.isArray(employeeData) ? employeeData : [])
    } catch (error) {
      console.error("Failed to load overhead data:", error)
      toast.error("Failed to load overhead report records")
    } finally {
      setLoading(false)
    }
  }

  // 1. Calculate salary overhead
  const totalSalaries = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0)

  // 2. Calculate expenses by category
  const expenseSummary = expenses.reduce((acc: Record<string, number>, exp) => {
    const cat = exp.category || "Miscellaneous"
    acc[cat] = (acc[cat] || 0) + (exp.amount || 0)
    return acc
  }, {})

  // Combine salaries (as labour wages overhead) with other categories
  const combinedOverheads: Record<string, number> = {
    "Labour Wages (Salaries)": totalSalaries,
    ...expenseSummary
  }

  const overheadData = Object.entries(combinedOverheads).map(([name, value]) => ({
    name,
    amount: value
  }))

  const totalOverhead = Object.values(combinedOverheads).reduce((sum, val) => sum + val, 0)

  // 3. Category distribution data for Pie Chart
  const pieData = Object.entries(combinedOverheads).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0)

  // 4. Monthly Trend mockup (aggregating expenses + salaries over time)
  // Let's create realistic trend data from actual expenses dates
  const monthlyTrendMap: Record<string, number> = {}
  expenses.forEach(exp => {
    if (exp.date) {
      const dateObj = new Date(exp.date)
      const monthYear = dateObj.toLocaleString('default', { month: 'short', year: '2-digit' })
      monthlyTrendMap[monthYear] = (monthlyTrendMap[monthYear] || 0) + (exp.amount || 0)
    }
  })

  // Add wages to each month
  const trendData = Object.entries(monthlyTrendMap).map(([month, amount]) => ({
    month,
    Overheads: amount + totalSalaries,
    ExpensesOnly: amount,
    WagesOnly: totalSalaries
  })).sort((a, b) => {
    // Basic sorting by date (we can sort simplified dates manually)
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const [aM, aY] = a.month.split(' ')
    const [bM, bY] = b.month.split(' ')
    if (aY !== bY) return aY.localeCompare(bY)
    return months.indexOf(aM) - months.indexOf(bM)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Total Overhead Report</h1>
          <p className="text-sm text-muted-foreground font-medium">Aggregated analysis of business operational overheads, labour costs, fuel, and site maintenance expenses</p>
        </div>
        <Button variant="outline" className="text-xs h-9" onClick={loadData}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Overhead Cost" value={`₹${totalOverhead.toLocaleString()}`} subtitle="combined wages & expenses" icon={Landmark} colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-700" />
        <KPICard title="Monthly Wage Overhead" value={`₹${totalSalaries.toLocaleString()}`} subtitle="active employee salaries" icon={DollarSign} colorClass="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700" />
        <KPICard title="Operational Expenses" value={`₹${expenses.reduce((sum, e) => sum + (e.amount || 0), 0).toLocaleString()}`} subtitle="vouchers and payments" icon={BarChart2} colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-700" />
        <KPICard title="Maintenance Overhead" value={`₹${(combinedOverheads["Maintenance"] || 0 + combinedOverheads["Equipment Maintenance"] || 0).toLocaleString()}`} subtitle="fleet & site repairs" icon={TrendingDown} colorClass="bg-rose-100 dark:bg-rose-900/30 text-rose-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Overhead Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overhead Breakdown</CardTitle>
            <CardDescription>Comparison of various overhead cost centres</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[350px] flex items-center justify-center text-xs text-muted-foreground">Loading charts...</div>
            ) : overheadData.length === 0 ? (
              <div className="h-[350px] flex items-center justify-center text-xs text-muted-foreground">No overhead data found.</div>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={overheadData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" className="text-[10px]" />
                  <YAxis className="text-[10px]" />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Cost (₹)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5">
              <PieIcon className="h-5 w-5 text-blue-600" />
              Cost Distribution
            </CardTitle>
            <CardDescription>Percentage share of overhead categories</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            {loading ? (
              <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">Loading distribution...</div>
            ) : pieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-xs text-muted-foreground">No distribution data.</div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 text-[10px] w-full mt-4">
                  {pieData.map((entry, idx) => (
                    <div key={entry.name} className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="truncate max-w-[100px] font-medium">{entry.name}</span>
                      <span className="text-muted-foreground ml-auto">({Math.round((entry.value / totalOverhead) * 100)}%)</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      {trendData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Overhead Trend</CardTitle>
            <CardDescription>Track how overhead costs change month-on-month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" className="text-[10px]" />
                <YAxis className="text-[10px]" />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="WagesOnly" stackId="a" fill="#8884d8" name="Wages (₹)" />
                <Bar dataKey="ExpensesOnly" stackId="a" fill="#82ca9d" name="Expenses (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
