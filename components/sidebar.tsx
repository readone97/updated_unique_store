"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/logout-button"
import { LayoutDashboard, Package, ShoppingCart, BarChart3, Users, Settings, Store, ChevronLeft, ChevronRight } from 'lucide-react'

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Products", href: "/products", icon: Package },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Customers", href: "/customers", icon: Users },
]

const adminOnlyNavigation = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const [role, setRole] = useState<'admin' | 'user' | null>(null)

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )auth-token=([^;]+)/)
    if (!match) {
      setRole(null)
      return
    }
    try {
      const token = decodeURIComponent(match[1])
      const payload = JSON.parse(atob(token.split('.')[1]))
      setRole(payload.role || 'user')
    } catch {
      setRole('user')
    }
  }, [])

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Store className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">AutoView </span>
            </div>
          )}
          <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {[...baseNavigation, ...(role === 'admin' ? adminOnlyNavigation : [])].map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  collapsed && "px-2",
                  isActive && "bg-blue-600 text-white hover:bg-blue-700",
                )}
              >
                <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                {!collapsed && item.name}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {!collapsed && <LogoutButton />}
        {!collapsed && <div className="text-xs text-gray-500 text-center">AutoView</div>}
      </div>
    </div>
  )
}
