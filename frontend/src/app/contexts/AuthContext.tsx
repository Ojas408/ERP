import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export type UserRole = "Super Admin" | "Admin" | "HR" | "Accounts" | "Purchase" | "Site Engineer" | "Manager" | "Viewer"

interface User {
  email: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string, companyName: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_URL = "http://localhost:5000"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("erp_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const mapRole = (backendRole: string): UserRole => {
    const roleMap: Record<string, UserRole> = {
      'super admin': 'Super Admin',
      'admin': 'Admin',
      'hr': 'HR',
      'accounts': 'Accounts',
      'purchase': 'Purchase',
      'site engineer': 'Site Engineer',
      'manager': 'Manager',
      'viewer': 'Viewer'
    }
    return roleMap[backendRole.toLowerCase()] || 'Viewer'
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        throw new Error("Invalid credentials")
      }

      const data = await response.json()
      const newUser = { 
        email: data.user.email, 
        role: mapRole(data.user.role) 
      }
      
      setUser(newUser)
      localStorage.setItem("erp_user", JSON.stringify(newUser))
      localStorage.setItem("erp_token", data.token)
    } catch (error) {
      console.error("Login failed:", error)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string, companyName: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name, companyName }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.message || "Registration failed")
      }

      // Automatically login after successful registration, or handle similarly
      const data = await response.json()
      // Note: we'd ideally get token back, but for simplicity we can just call login or expect token in response.
      // We updated backend register to not return a token, so we can just login.
      await login(email, password)
    } catch (error) {
      console.error("Registration failed:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("erp_user")
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
