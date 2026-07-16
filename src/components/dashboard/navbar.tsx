"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import {
  Bell,
  LogOut,
  Moon,
  Sun,
  User,
  Search,
  ChevronDown,
  Sparkles,
  Building,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/auth-context"
import type { UserRole } from "@/lib/types"

export function Navbar() {
  const { theme, setTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotif, setShowNotif] = useState(false)
  const [showRoleMenu, setShowRoleMenu] = useState(false)

  const {
    role,
    setRole,
    user,
    availableOPDs,
    perangkatDaerahId,
    setPerangkatDaerahId,
  } = useAuth()

  const rolesList: { value: UserRole; label: string; desc: string }[] = [
    { value: "super_admin", label: "Super Admin", desc: "Kelola Master Data & Pemda" },
    { value: "admin_pemda", label: "Admin Pemda", desc: "Verifikator & Pengaturan Periode" },
    { value: "perangkat_daerah", label: "Perangkat Daerah", desc: "Pengisi & Pengampu Asesmen" },
    { value: "viewer", label: "Viewer (Pimpinan)", desc: "Hanya Dashboard & Laporan" },
  ]

  const activeRoleInfo = rolesList.find((r) => r.value === role)
  const activeOPD = availableOPDs.find((o) => o.id === perangkatDaerahId)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-md px-6">
      {/* Search or Title */}
      <div className="flex-1 flex items-center gap-3">
        <div className="relative max-w-xs w-full hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            placeholder="Cari indikator, OPD..."
            className="h-9 w-full rounded-lg border border-input bg-transparent pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
      </div>

      {/* Switcher & Actions */}
      <div className="flex items-center gap-4">
        {/* Dynamic Simulator Role Selector */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 hover:bg-primary/10 transition-colors cursor-pointer text-xs font-semibold text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Mode: {activeRoleInfo?.label}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
          
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-card shadow-xl animate-fade-in p-1.5 z-50">
              <div className="px-3 py-2 border-b border-border mb-1.5">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Simulasikan Peran</p>
              </div>
              <div className="space-y-0.5">
                {rolesList.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => {
                      setRole(r.value)
                      setShowRoleMenu(false)
                    }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-xs transition-colors cursor-pointer block",
                      role === r.value
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <p>{r.label}</p>
                    <p className={cn("text-[9px] mt-0.5", role === r.value ? "text-primary-foreground/80" : "text-muted-foreground")}>
                      {r.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* OPD Simulator Dropdown (Only visible when simulated role is Perangkat Daerah) */}
        {role === "perangkat_daerah" && availableOPDs.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Building className="h-4 w-4 text-muted-foreground" />
            <select
              value={perangkatDaerahId}
              onChange={(e) => setPerangkatDaerahId(e.target.value)}
              className="text-xs bg-transparent border rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
            >
              {availableOPDs.map((opd) => (
                <option key={opd.id} value={opd.id} className="text-black">
                  {opd.nama}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="relative h-9 w-9 rounded-lg"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-foreground" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-foreground" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNotif(!showNotif)}
            className="relative h-9 w-9 rounded-lg"
          >
            <Bell className="h-4 w-4 text-foreground" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white animate-pulse-subtle">
              3
            </span>
          </Button>
          {showNotif && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-card shadow-xl animate-fade-in z-50">
              <div className="p-4 border-b border-border">
                <h3 className="text-sm font-semibold">Notifikasi</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {[
                  {
                    title: "Periode asesmen telah dibuka",
                    desc: "Semester 1 2026 - Tenggat: 30 Juni 2026",
                    time: "2 jam lalu",
                  },
                  {
                    title: "Skor I1.1 dikembalikan",
                    desc: "Mohon lengkapi bukti dukung kebijakan internal",
                    time: "5 jam lalu",
                  },
                  {
                    title: "3 OPD belum mengirim",
                    desc: "DISDIK, DISDUKCAPIL, BKD belum submit",
                    time: "1 hari lalu",
                  },
                ].map((notif, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border last:border-0"
                  >
                    <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div>
                      <p className="text-xs font-medium">{notif.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{notif.desc}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">{notif.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-colors cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-medium leading-tight">{user?.nama}</p>
              <p className="text-[9px] text-muted-foreground">{activeRoleInfo?.label}</p>
            </div>
            <ChevronDown className="h-3 w-3 text-muted-foreground hidden md:block" />
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-card shadow-xl animate-fade-in p-1.5 z-50">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-xs font-medium text-foreground">{user?.nama}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
              </div>
              <div className="mt-1">
                <button
                  onClick={() => setShowUserMenu(false)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted transition-colors cursor-pointer text-foreground text-left"
                >
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  Profil
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    window.location.href = "/login"
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Keluar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
