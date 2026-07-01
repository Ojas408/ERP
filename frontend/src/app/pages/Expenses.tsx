import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { KPICard } from "../components/dashboard/kpi-card"
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Upload, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Printer, 
  RefreshCw, 
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  CheckCircle,
  Clock
} from "lucide-react"
import { 
  fetchExpenses, 
  createExpense, 
  deleteRecord, 
  updateRecord,
  fetchRecords
} from "../services/api"
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
import { exportToExcel, downloadExcelTemplate, parseExcelFile, printReport } from "../lib/excel-helper"
import { ImportPreviewModal } from "../components/ImportPreviewModal"
import { toast } from "sonner"

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Dialog Controls
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  // CRUD Forms State
  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split('T')[0],
    category: "",
    amount: "",
    description: "",
    paymentStatus: "pending" // pending, approved, paid
  })

  // SheetJS Import Preview States
  const [importData, setImportData] = useState<any[]>([])
  const [isImportOpen, setIsImportOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [expenseData, catData] = await Promise.all([
        fetchExpenses(),
        fetchRecords("masters/expense-categories")
      ])
      setExpenses(Array.isArray(expenseData) ? expenseData : [])
      setCategories(Array.isArray(catData) ? catData : [])

      if (catData && catData.length > 0) {
        setNewExpense(prev => ({ ...prev, category: catData[0].name }))
      }
    } catch (error) {
      console.error("Failed to load expenses data:", error)
      toast.error("Failed to load operational expenses")
    } finally {
      setLoading(false)
    }
  }

  // Create
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createExpense({
        ...newExpense,
        amount: parseFloat(newExpense.amount) || 0
      })
      toast.success("Expense transaction logged successfully")
      setIsAddOpen(false)
      setNewExpense({
        date: new Date().toISOString().split('T')[0],
        category: categories[0]?.name || "Fuel",
        amount: "",
        description: "",
        paymentStatus: "pending"
      })
      loadData()
    } catch (error) {
      toast.error("Failed to record expense")
    }
  }

  // Edit
  const handleEdit = (item: any) => {
    setEditingItem({
      ...item,
      date: new Date(item.date).toISOString().split('T')[0],
      amount: String(item.amount)
    })
    setIsEditOpen(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    try {
      await updateRecord('expenses', editingItem.id, {
        ...editingItem,
        amount: parseFloat(editingItem.amount) || 0
      })
      toast.success("Expense transaction updated")
      setIsEditOpen(false)
      setEditingItem(null)
      loadData()
    } catch (error) {
      toast.error("Failed to update transaction")
    }
  }

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense entry?")) return
    try {
      await deleteRecord('expenses', id)
      toast.success("Expense transaction deleted")
      loadData()
    } catch (error) {
      toast.error("Failed to delete record")
    }
  }

  // Workflow Approval transition
  const handleTransitionStatus = async (item: any, newStatus: string) => {
    try {
      await updateRecord('expenses', item.id, {
        ...item,
        paymentStatus: newStatus
      })
      toast.success(`Expense marked as ${newStatus.toUpperCase()}`)
      loadData()
    } catch (err) {
      toast.error("Failed to update expense status")
    }
  }

  // Excel handlers
  const handleDownloadTemplate = () => {
    downloadExcelTemplate(
      ["date", "category", "amount", "description", "paymentStatus"],
      "expenses_import_template"
    )
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
      const formatted = parsedRows.map(row => ({
        date: row.date ? new Date(row.date).toISOString() : new Date().toISOString(),
        category: String(row.category || "Fuel"),
        amount: parseFloat(row.amount) || 0,
        description: String(row.description || ""),
        paymentStatus: String(row.paymentStatus || "pending").toLowerCase()
      }))
      await createExpense(formatted)
      toast.success(`Successfully imported ${formatted.length} expense rows`)
      setIsImportOpen(false)
      loadData()
    } catch (err) {
      toast.error("Import failed. Check columns formatting and try again.")
    }
  }

  const handleExportExcel = () => {
    const data = expenses.map(e => ({
      date: new Date(e.date).toLocaleDateString(),
      category: e.category,
      description: e.description,
      amount: e.amount,
      status: e.paymentStatus
    }))
    exportToExcel(data, "expenses_ledger_summary")
  }

  const handlePrint = () => {
    printReport("expenses-table", "OPERATIONAL EXPENSES LEDGER")
  }

  // Client side sorting & pagination
  const safeExpenses = Array.isArray(expenses) ? expenses : []
  const filteredExpenses = safeExpenses.filter(e => {
    const matchesSearch = 
      (e.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === "all" || e.category === categoryFilter
    const matchesStatus = statusFilter === "all" || e.paymentStatus === statusFilter
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const totalPages = Math.ceil(filteredExpenses.length / pageSize)
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  // Calculations for Widgets
  const totalExpensesAmount = safeExpenses.reduce((sum, item) => sum + (item.amount || 0), 0)
  const fuelCosts = safeExpenses.filter(e => e.category.toLowerCase() === "fuel").reduce((sum, item) => sum + (item.amount || 0), 0)
  const maintenanceCosts = safeExpenses.filter(e => e.category.toLowerCase() === "maintenance").reduce((sum, item) => sum + (item.amount || 0), 0)
  const pendingAmount = safeExpenses.filter(e => e.paymentStatus === "pending").reduce((sum, item) => sum + (item.amount || 0), 0)

  // Pie Chart category calculations
  const categoryTotals = safeExpenses.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + (item.amount || 0)
    return acc
  }, {})

  const chartColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6']
  const expenseByCategoryData = Object.entries(categoryTotals).map(([name, amount], index) => ({
    id: name,
    name,
    amount,
    value: totalExpensesAmount > 0 ? (amount / totalExpensesAmount) * 100 : 0,
    color: chartColors[index % chartColors.length]
  })).filter(item => item.amount > 0)

  // Line Chart monthly trend
  const monthlyTotals = safeExpenses.reduce((acc: Record<string, number>, item) => {
    const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' })
    acc[month] = (acc[month] || 0) + (item.amount || 0)
    return acc
  }, {})

  const monthlyTrendData = Object.entries(monthlyTotals).map(([month, amount]) => ({
    month,
    amount
  }))

  return (
    <div className="space-y-6">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl mb-1 font-bold tracking-tight text-slate-800 dark:text-white">Expense Tracker</h1>
          <p className="text-sm text-muted-foreground font-medium">Verify company operational expenses, fuel bills, payroll logs, and payment workflows</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={loadData}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleDownloadTemplate}>
            <Download className="h-4 w-4 mr-2" />
            Template
          </Button>
          <label className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-background text-xs font-semibold px-3 h-9 cursor-pointer hover:bg-muted">
            <Upload className="h-4 w-4 mr-2 text-muted-foreground" />
            Import Excel
            <input type="file" onChange={handleExcelImport} className="hidden" accept=".xlsx,.xls,.csv" />
          </label>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handleExportExcel}>
            <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
            Export Excel
          </Button>
          <Button variant="outline" className="text-xs h-9 border-slate-300" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="text-xs h-9 bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Expense Transaction</DialogTitle>
                <DialogDescription>Record a new cash, bank, or draft outflow voucher</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <Label htmlFor="date">Transaction Date *</Label>
                    <Input id="date" type="date" value={newExpense.date} onChange={e => setNewExpense({...newExpense, date: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="category">Expense Category *</Label>
                    <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})} required>
                      <SelectTrigger id="category"><SelectValue placeholder="Category" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="amount">Voucher Amount (₹) *</Label>
                    <Input id="amount" type="number" placeholder="5000" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="status">Voucher Payment Status</Label>
                    <Select value={newExpense.paymentStatus} onValueChange={v => setNewExpense({...newExpense, paymentStatus: v})}>
                      <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="paid">Settled / Paid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="description">Voucher Description *</Label>
                    <Input id="description" placeholder="e.g. Site generator fuel purchase slip no. 129" value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} required />
                  </div>
                </div>
                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button type="submit">Log Transaction</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Expenses" value={`₹${totalExpensesAmount.toLocaleString()}`} subtitle="overall logged transactions" icon={DollarSign} colorClass="bg-red-50 text-red-600" />
        <KPICard title="Fuel Expenses" value={`₹${fuelCosts.toLocaleString()}`} subtitle="diesel & generator costs" icon={TrendingUp} colorClass="bg-orange-50 text-orange-600" />
        <KPICard title="Machinery Maintenance" value={`₹${maintenanceCosts.toLocaleString()}`} subtitle="repairs & breakdowns" icon={CreditCard} colorClass="bg-blue-50 text-blue-600" />
        <KPICard title="Unpaid / Pending" value={`₹${pendingAmount.toLocaleString()}`} subtitle="awaiting settlement" icon={TrendingDown} colorClass="bg-yellow-50 text-yellow-600" />
      </div>

      {/* Chart Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold">Category Distribution</CardTitle>
            <CardDescription>Visual breakdown of expenditures by dynamic classifications</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseByCategoryData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">No data to display</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={expenseByCategoryData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value.toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {expenseByCategoryData.map((entry) => <Cell key={entry.id} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)}%`, 'Percentage']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-bold">Monthly Spending Trend</CardTitle>
            <CardDescription>Monthly aggregated overview of cash outflows</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyTrendData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-xs text-muted-foreground">No trend data to display</div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Total Spend']} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2.5} name="Spent Amount (₹)" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive Filters Panel */}
      <Card className="p-4 bg-muted/20 border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search description or category..."
              className="pl-9 text-xs h-9 bg-background border-slate-300"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto font-medium">
            <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setCurrentPage(1); }}>
              <SelectTrigger className="w-[180px] text-xs h-9 bg-background border-slate-300"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Ledger Grid */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-800 dark:text-white font-mono">Transactions Ledger</CardTitle>
          <CardDescription>Review receipts and approve expense requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-200 overflow-x-auto" id="expenses-table">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800">
                <TableRow>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Date</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Category Name</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Voucher Description</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Paid Amount</TableHead>
                  <TableHead className="font-bold text-slate-700 dark:text-slate-200">Voucher Status</TableHead>
                  <TableHead className="w-52 text-right font-bold text-slate-700 dark:text-slate-200 print:hidden">Voucher Approval</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">Loading transactions...</TableCell></TableRow>
                ) : paginatedExpenses.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-xs font-mono">No expense records found. Import sheet to load ledger.</TableCell></TableRow>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-xs">{new Date(expense.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-semibold">{expense.category}</TableCell>
                      <TableCell className="text-xs font-medium max-w-sm truncate text-slate-700 dark:text-slate-300" title={expense.description}>{expense.description}</TableCell>
                      <TableCell className="text-xs font-bold text-slate-900">₹{(expense.amount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={expense.paymentStatus === "paid" ? "secondary" : "outline"} 
                          className={`text-[10px] h-5 uppercase font-bold ${
                            expense.paymentStatus === "paid" ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400" :
                            expense.paymentStatus === "approved" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" :
                            "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                          }`}
                        >
                          {expense.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <div className="flex gap-1 justify-end items-center">
                          {/* Payment status workflow actions */}
                          {expense.paymentStatus === "pending" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-blue-200 hover:bg-blue-50 text-blue-600" onClick={() => handleTransitionStatus(expense, "approved")}>
                              Authorize
                            </Button>
                          )}
                          {expense.paymentStatus === "approved" && (
                            <Button size="sm" variant="outline" className="h-7 px-2 text-[10px] border-green-200 hover:bg-green-50 text-green-600" onClick={() => handleTransitionStatus(expense, "paid")}>
                              Disburse / Pay
                            </Button>
                          )}

                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleEdit(expense)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:text-destructive animate-none" onClick={() => handleDelete(expense.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredExpenses.length} transactions)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-300"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 border-slate-300"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Expense Voucher</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <form onSubmit={handleUpdate} className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <Label>Transaction Date *</Label>
                  <Input type="date" value={editingItem.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Category *</Label>
                  <Select value={editingItem.category} onValueChange={v => setEditingItem({...editingItem, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Voucher Amount (₹) *</Label>
                  <Input type="number" value={editingItem.amount} onChange={e => setEditingItem({...editingItem, amount: e.target.value})} required />
                </div>
                <div className="space-y-1">
                  <Label>Voucher Status</Label>
                  <Select value={editingItem.paymentStatus} onValueChange={v => setEditingItem({...editingItem, paymentStatus: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Description *</Label>
                  <Input value={editingItem.description || ""} onChange={e => setEditingItem({...editingItem, description: e.target.value})} required />
                </div>
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* SheetJS Import Preview Modal */}
      <ImportPreviewModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        data={importData}
        headers={["date", "category", "amount", "description", "paymentStatus"]}
        validationRules={(row, i) => {
          const errs: string[] = []
          if (!row.category) errs.push(`Row ${i + 1}: category is required`)
          if (!row.amount || isNaN(parseFloat(row.amount))) errs.push(`Row ${i + 1}: amount must be a number`)
          if (!row.description) errs.push(`Row ${i + 1}: description is required`)
          return errs
        }}
        onConfirm={handleConfirmImport}
        title="Import Expenses Vouchers Preview"
      />
    </div>
  )
}
