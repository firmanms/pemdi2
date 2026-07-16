"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { UserRole, UserProfile, PerangkatDaerah, PeriodeAsesmen } from '@/lib/types'

interface AuthContextType {
  user: UserProfile | null
  role: UserRole
  perangkatDaerahId: string
  activePeriode: PeriodeAsesmen | null
  availableOPDs: PerangkatDaerah[]
  availablePeriodes: PeriodeAsesmen[]
  loading: boolean
  setRole: (role: UserRole) => void
  setPerangkatDaerahId: (id: string) => void
  setActivePeriode: (periode: PeriodeAsesmen) => void
  refreshData: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('admin_pemda')
  const [perangkatDaerahId, setPerangkatDaerahIdState] = useState<string>('')
  const [activePeriode, setActivePeriodeState] = useState<PeriodeAsesmen | null>(null)
  const [availableOPDs, setAvailableOPDs] = useState<PerangkatDaerah[]>([])
  const [availablePeriodes, setAvailablePeriodes] = useState<PeriodeAsesmen[]>([])
  const [loading, setLoading] = useState(true)

  // Demo user profile
  const [user, setUser] = useState<UserProfile | null>(null)

  const refreshData = async () => {
    try {
      setLoading(true)
      // 1. Fetch OPDs
      const { data: opds } = await supabase.from('perangkat_daerah').select('*')
      if (opds && opds.length > 0) {
        setAvailableOPDs(opds)
        // Default to first OPD if none is selected
        if (!perangkatDaerahId) {
          setPerangkatDaerahIdState(opds[0].id)
        }
      }

      // 2. Fetch Periodes
      const { data: periodes } = await supabase.from('periode_asesmen').select('*')
      if (periodes && periodes.length > 0) {
        setAvailablePeriodes(periodes)
        // Find active one or default to first
        const active = periodes.find(p => p.status === 'draft' || p.status === 'dibuka') || periodes[0]
        setActivePeriodeState(active)
      }
    } catch (e) {
      console.error('Error refreshing auth data:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
  }, [])

  // Sync state values with localStorage for persistence during test
  useEffect(() => {
    const savedRole = localStorage.getItem('pemdi_role') as UserRole
    if (savedRole) setRoleState(savedRole)

    const savedOpd = localStorage.getItem('pemdi_opd_id')
    if (savedOpd) setPerangkatDaerahIdState(savedOpd)
  }, [])

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
    localStorage.setItem('pemdi_role', newRole)
  }

  const setPerangkatDaerahId = (newOpdId: string) => {
    setPerangkatDaerahIdState(newOpdId)
    localStorage.setItem('pemdi_opd_id', newOpdId)
  }

  const setActivePeriode = (newPeriode: PeriodeAsesmen) => {
    setActivePeriodeState(newPeriode)
  }

  // Update user representation when role or OPD changes
  useEffect(() => {
    const selectedOPD = availableOPDs.find(o => o.id === perangkatDaerahId)
    const email = localStorage.getItem('pemdi_user_email') || 
                  (role === 'super_admin' ? 'super@pemdigital.go.id' :
                   role === 'admin_pemda' ? 'admin@diskominfo.go.id' :
                   role === 'viewer' ? 'kepaladaerah@pemkot.go.id' :
                   `operator@${selectedOPD?.kode?.toLowerCase() || 'opd'}.go.id`)
    const nama = localStorage.getItem('pemdi_user_name') ||
                 (role === 'super_admin' ? 'Super Admin' : 
                  role === 'admin_pemda' ? 'Admin Pemda (Diskominfo)' :
                  role === 'viewer' ? 'Pimpinan / Kepala Daerah' :
                  `Operator ${selectedOPD?.nama || 'OPD'}`)

    setUser({
      id: '00000000-0000-0000-0000-000000000001',
      auth_id: '00000000-0000-0000-0000-000000000001',
      instansi_id: 'd1000000-0000-0000-0000-000000000001',
      perangkat_daerah_id: role === 'perangkat_daerah' ? perangkatDaerahId : null,
      nama: nama,
      email: email,
      role: role,
      created_at: new Date().toISOString()
    })
  }, [role, perangkatDaerahId, availableOPDs])

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        perangkatDaerahId,
        activePeriode,
        availableOPDs,
        availablePeriodes,
        loading,
        setRole,
        setPerangkatDaerahId,
        setActivePeriode,
        refreshData
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
