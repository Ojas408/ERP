import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { fetchSites, fetchInventory } from "../services/api"
import { useAuth } from "./AuthContext"

interface Site {
  id: string
  name: string
  location?: string
}

interface SiteFilterContextType {
  sites: Site[]
  selectedSiteId: string
  selectedSiteName: string
  setSelectedSiteId: (id: string) => void
  lowStockCount: number
}

const SiteFilterContext = createContext<SiteFilterContextType | undefined>(undefined)

export function SiteFilterProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [selectedSiteId, setSelectedSiteId] = useState("all")
  const [lowStockCount, setLowStockCount] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return
    fetchSites()
      .then((data) => setSites(Array.isArray(data) ? data : []))
      .catch(() => setSites([]))

    fetchInventory()
      .then((data) => {
        const items = Array.isArray(data) ? data : []
        setLowStockCount(items.filter((i: any) => i.quantity < (i.minThreshold || 0)).length)
      })
      .catch(() => setLowStockCount(0))
  }, [isAuthenticated])

  const selectedSiteName =
    selectedSiteId === "all"
      ? "All Sites"
      : sites.find((s) => s.id === selectedSiteId)?.name || "All Sites"

  return (
    <SiteFilterContext.Provider
      value={{ sites, selectedSiteId, selectedSiteName, setSelectedSiteId, lowStockCount }}
    >
      {children}
    </SiteFilterContext.Provider>
  )
}

export function useSiteFilter() {
  const ctx = useContext(SiteFilterContext)
  if (!ctx) throw new Error("useSiteFilter must be used within SiteFilterProvider")
  return ctx
}
