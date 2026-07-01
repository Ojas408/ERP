You are extending an existing Enterprise Construction ERP Dashboard built in React + TypeScript + Tailwind + shadcn/ui. The current codebase has 16 pages. Add the following missing modules and fixes without breaking existing code.

---

## 1. AUTHENTICATION & RBAC

Create a Login page (`src/app/pages/Login.tsx`) with:
- Email + password form
- Role selector: Admin, Site Manager, Finance, Operator, Viewer
- On submit, store user role in localStorage and redirect to Dashboard
- Create a ProtectedRoute wrapper that checks login state
- Hide sidebar menu items based on role:
  - Viewer: Dashboard, Production, Efficiency only
  - Operator: + Consumption, Work Hours, Vehicle Movement
  - Site Manager: + Site Management, Employee Management, Maintenance
  - Finance: + Expenses, Business Analytics, Vendor Management, Challan
  - Admin: all modules

---

## 2. GLOBAL DATE RANGE FILTER

Add a date range picker to the Navbar (right side, before user avatar):
- Presets: Today, This Week, This Month, Last Month, Custom Range
- Store selected range in a React Context (`DateRangeContext`)
- All pages should read from this context and display the selected range label under their page title

---

## 3. PURCHASE ORDER MODULE

Create `src/app/pages/PurchaseOrder.tsx` with:

KPI cards: Total POs This Month, Pending Approval, POs Raised Today, Total PO Value (₹)

Table of POs with columns: PO Number, Date, Vendor Name, Material, Quantity, Unit, Total Value (₹), Status (Draft / Pending Approval / Approved / Rejected / GRN Done), Actions (View, Approve, Reject)

Status badges with colors:
- Draft: gray
- Pending Approval: amber
- Approved: blue
- Rejected: red
- GRN Done: green

"Create PO" button opens a modal/dialog with fields:
- Vendor (dropdown from vendor list)
- Material Name
- Quantity + Unit
- Expected Delivery Date
- Remarks

Bar chart: Monthly PO value vs actual spend (last 6 months)

Add "Purchase Orders" to sidebar nav with ShoppingCart icon, id: "purchase-order"

---

## 4. PAYROLL MODULE

Create `src/app/pages/Payroll.tsx` with:

KPI cards: Total Salary This Month (₹), Employees Paid, Pending Disbursement, Total Deductions (₹)

Payroll table with columns: Employee Name, Department, Basic Salary, HRA, PF Deduction, ESI Deduction, TDS, Net Payable, Status (Paid / Pending / On Hold), Payslip (Download button)

"Process Payroll" and "Export to Bank" buttons in header

Compute net payable as: Basic + HRA - PF - ESI - TDS

Pie chart: Salary breakdown by department

Add "Payroll" to sidebar nav with Banknote icon, id: "payroll"

---

## 5. WORK ORDER MODULE (inside Maintenance)

Replace the existing Maintenance page content with a full maintenance work order system:

KPI cards: Open Work Orders, Completed This Month, Overdue, Avg Resolution Time (hrs)

Work Orders table: WO Number, Equipment Name, Issue Description, Assigned To (technician), Priority (Critical/High/Medium/Low), Status (Open/In Progress/Completed/Overdue), Raised Date, Target Close Date

Priority badge colors: Critical=red, High=amber, Medium=blue, Low=gray

"Raise Work Order" button with modal: Equipment, Issue Type (Breakdown/Preventive/Predictive), Description, Priority, Assign To, Target Date

Monthly work orders trend chart (bar: Raised vs Completed per month)

---

## 6. FINANCIAL ACCOUNTS MODULE

Create `src/app/pages/Accounts.tsx` with:

KPI cards: Total Revenue (₹), Total Expenses (₹), Net Profit (₹), Profit Margin (%)

Tabs: P&L Summary | Cash Flow | GST Summary | Outstanding Payments

P&L Summary tab:
- Table with Income heads and Expense heads
- Net Profit row highlighted in green

Cash Flow tab:
- Line chart: Monthly cash inflow vs outflow (last 6 months)
- Running balance indicator

GST Summary tab:
- Table: Month, Taxable Value, CGST, SGST, IGST, Total GST, Filing Status

Outstanding Payments tab:
- Two tables side by side: Receivables (clients who owe us) and Payables (vendors we owe)
- Each row: Party Name, Invoice No, Amount, Due Date, Days Overdue, Status

Add "Accounts & Finance" to sidebar nav with Landmark icon, id: "accounts"

---

## 7. FUNCTIONAL TABLE FEATURES (apply to ALL existing pages)

For every page that has a data table, add:
- A search input above the table that filters rows by any text field
- Column header click to sort ascending/descending (show ↑↓ arrows)
- Row count label: "Showing X of Y records"
- Pagination: 10 rows per page with Previous/Next buttons

---

## 8. FUNCTIONAL CRUD MODALS (apply to ALL existing pages)

Every existing "Add / Create / Generate" button must open a Dialog (use shadcn Dialog component) with appropriate form fields and a Save button. On Save, push the new record to the top of the local state array and show a toast notification "Record added successfully".

Pages to fix:
- Expenses → Add Expense (Date, Category dropdown, Description, Amount, Payment Mode)
- Challan → Generate Challan (Vehicle No, Material, Quantity, Unit, Rate)
- Inventory → Add Stock (Material, Type, Quantity, Unit, Supplier, Date)
- Vehicle Movement → Add Entry (Vehicle No, Type, Direction: Incoming/Outgoing, Material, Weight, Time)
- Work Hours → Mark Attendance (Employee, Date, Shift, Hours Worked, Overtime)
- Employee Management → Add Employee (Name, Role, Department, Phone, Join Date)
- Vendor Management → Add Vendor (Company Name, Category, Contact Person, Phone, Email)
- Site Management → Add Site (Site Name, Location, Project Type, Start Date, Site In-charge)

---

## 9. INVENTORY ALERTS & NOTIFICATIONS

In the Inventory page, add:
- A red banner at the top listing all materials where current stock < minimum stock: "⚠ Low Stock Alert: Steel Rods (45T < 50T min), Sand (65T < 80T min)"
- Auto-reorder suggestion: "Suggested PO: Raise PO for Steel Rods — 105T to reach maximum"
- A notification bell icon in the Navbar showing count of active alerts
- Clicking the bell shows a dropdown list of all alerts

---

## 10. MOBILE SIDEBAR

Add a hamburger menu button (Menu icon) in the Navbar, visible only on mobile (md:hidden).
On click, open the full sidebar as a Sheet (use shadcn Sheet component) sliding from the left.
The Sheet should contain the same SidebarNav component.
Close the sheet when a menu item is selected.

---

## SIDEBAR ADDITIONS SUMMARY

Add these items to the sidebar menuItems array in `sidebar-nav.tsx`:
- { icon: ShoppingCart, label: "Purchase Orders", id: "purchase-order" }
- { icon: Banknote, label: "Payroll", id: "payroll" }
- { icon: Landmark, label: "Accounts & Finance", id: "accounts" }

Add corresponding routes in `App.tsx` to render the new pages.

---

## STYLE RULES

- Match the existing design system exactly: same card styles, same KPI card component, same badge styles, same table styles
- Use shadcn Dialog for all modals
- Use shadcn Toast (Sonner) for all success/error notifications
- All new charts use Recharts, matching existing chart styles
- All monetary values formatted as ₹X.XL or ₹X,XX,XXX
- All dates in DD MMM YYYY format
- No new dependencies — use only what is already in package.json