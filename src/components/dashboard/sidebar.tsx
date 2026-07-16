"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ClipboardCheck,
  FileCheck2,
  Shield,
  FolderCog,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gauge,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import type { UserRole } from "@/lib/types"

interface MenuItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

interface MenuGroup {
  group: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    group: "Utama",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["super_admin", "admin_pemda", "perangkat_daerah", "viewer"] },
      { label: "Self-Assessment", href: "/dashboard/asesmen", icon: ClipboardCheck, roles: ["perangkat_daerah"] },
      { label: "Konsolidasi", href: "/dashboard/konsolidasi", icon: FileCheck2, roles: ["perangkat_daerah"] },
      { label: "Review & Approval", href: "/dashboard/review", icon: Shield, roles: ["admin_pemda"] },
    ],
  },
  {
    group: "Manajemen",
    items: [
      { label: "Referensi", href: "/dashboard/referensi", icon: FolderCog, roles: ["super_admin", "admin_pemda"] },
      { label: "Pengguna", href: "/dashboard/pengguna", icon: Users, roles: ["super_admin", "admin_pemda"] },
      { label: "Periode", href: "/dashboard/periode", icon: Calendar, roles: ["super_admin", "admin_pemda"] },
    ],
  },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
}

export function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { role } = useAuth()

  // Filter menu groups and items based on role
  const filteredGroups = menuGroups
    .map((group) => {
      const items = group.items.filter((item) => item.roles.includes(role))
      return { ...group, items }
    })
    .filter((group) => group.items.length > 0)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[68px]" : "w-[250px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-primary">
          <Gauge className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col animate-fade-in text-left">
            <span className="text-sm font-bold tracking-tight text-foreground">
              PEMDI
            </span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest leading-none">
              Pemerintah Digital
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <p className="mb-2 px-2 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </p>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span className="text-xs">Perkecil</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
