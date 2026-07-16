"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Navbar } from "@/components/dashboard/navbar"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import { usePathname, useRouter } from "next/navigation"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const { role, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    const permissions: Record<string, string[]> = {
      "/dashboard/asesmen": ["perangkat_daerah"],
      "/dashboard/konsolidasi": ["perangkat_daerah"],
      "/dashboard/review": ["admin_pemda"],
      "/dashboard/referensi": ["super_admin", "admin_pemda"],
      "/dashboard/pengguna": ["super_admin", "admin_pemda"],
      "/dashboard/periode": ["super_admin", "admin_pemda"],
    }

    const restrictedRoles = permissions[pathname]
    if (restrictedRoles && !restrictedRoles.includes(role)) {
      router.replace("/dashboard")
    }
  }, [role, pathname, loading, router])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          collapsed ? "pl-[68px]" : "pl-[250px]"
        )}
      >
        <Navbar />
        <main className="flex-1 p-6 gradient-mesh min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
