import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  id: number
  phone_number: string
  full_name: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('admin_token')
  )
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('admin_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('admin_token', newToken)
    localStorage.setItem('admin_user', JSON.stringify(newUser))
    setToken(newToken)
    setUser(newUser)
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    setToken(null)
    setUser(null)
  }

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    const storedUser = localStorage.getItem('admin_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
