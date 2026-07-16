"use client"

import {
  BarChart3,
  Building2,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Activity,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatNumber, formatPercent } from "@/lib/utils"
import type { DashboardStats } from "@/lib/types"

interface StatsCardsProps {
  stats: DashboardStats
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Indeks Akhir",
      value: formatNumber(stats.indeksAkhir),
      subtitle: "dari 5.00",
      icon: BarChart3,
      gradient: "from-teal-500 to-emerald-500",
      iconBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
    },
    {
      title: "Progres Pengisian",
      value: formatPercent(stats.progresIsi),
      subtitle: `${stats.indikatorDisetujui}/${stats.totalIndikator} indikator`,
      icon: Activity,
      gradient: "from-blue-500 to-indigo-500",
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total OPD",
      value: stats.totalOPD.toString(),
      subtitle: "perangkat daerah",
      icon: Building2,
      gradient: "from-violet-500 to-purple-500",
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    },
    {
      title: "Periode Aktif",
      value: stats.periodeAktif,
      subtitle: "sedang berjalan",
      icon: Calendar,
      gradient: "from-amber-500 to-orange-500",
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className="relative overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            {/* Gradient accent bar */}
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-80 group-hover:opacity-100 transition-opacity",
                card.gradient
              )}
            />
            <CardContent className="p-5 pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {card.title}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <div className={cn("rounded-xl p-2.5", card.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
