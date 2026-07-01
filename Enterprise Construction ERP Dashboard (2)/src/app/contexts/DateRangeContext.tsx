import { createContext, useContext, useState, ReactNode } from "react"

interface DateRange {
  from: Date
  to: Date
  label: string
}

interface DateRangeContextType {
  dateRange: DateRange
  setDateRange: (range: DateRange) => void
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(2026, 4, 1), // May 1, 2026
    to: new Date(2026, 4, 25),  // May 25, 2026
    label: "This Month"
  })

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange() {
  const context = useContext(DateRangeContext)
  if (context === undefined) {
    throw new Error("useDateRange must be used within a DateRangeProvider")
  }
  return context
}

// Preset date ranges
export const dateRangePresets = {
  today: () => {
    const today = new Date()
    return {
      from: today,
      to: today,
      label: "Today"
    }
  },
  thisWeek: () => {
    const today = new Date()
    const firstDay = new Date(today.setDate(today.getDate() - today.getDay()))
    const lastDay = new Date(today.setDate(today.getDate() - today.getDay() + 6))
    return {
      from: firstDay,
      to: lastDay,
      label: "This Week"
    }
  },
  thisMonth: () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return {
      from: firstDay,
      to: lastDay,
      label: "This Month"
    }
  },
  lastMonth: () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
    return {
      from: firstDay,
      to: lastDay,
      label: "Last Month"
    }
  }
}

export function formatDateRange(from: Date, to: Date): string {
  const formatDate = (date: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}`
  }

  if (from.getTime() === to.getTime()) {
    return formatDate(from)
  }

  return `${formatDate(from)} - ${formatDate(to)}, ${from.getFullYear()}`
}
