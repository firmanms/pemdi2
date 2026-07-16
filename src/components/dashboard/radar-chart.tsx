"use client"

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import type { AspekScore } from "@/lib/types"

interface AspekRadarChartProps {
  data: AspekScore[]
}

export function AspekRadarChart({ data }: AspekRadarChartProps) {
  const chartData = data.map((d) => ({
    aspek: d.aspek_kode,
    nama: d.aspek_nama,
    skor: +d.skor_1_5.toFixed(2),
    fullMark: 5,
  }))

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height={320}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
          <PolarGrid stroke="var(--border)" strokeOpacity={0.5} />
          <PolarAngleAxis
            dataKey="aspek"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 5]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            tickCount={6}
          />
          <Radar
            name="Skor Aspek"
            dataKey="skor"
            stroke="var(--primary)"
            fill="var(--primary)"
            fillOpacity={0.2}
            strokeWidth={2}
            animationBegin={200}
            animationDuration={1000}
            animationEasing="ease-out"
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload
                return (
                  <div className="rounded-lg border bg-card p-3 shadow-lg">
                    <p className="text-sm font-medium">{d.nama}</p>
                    <p className="text-lg font-bold text-primary">{d.skor}</p>
                  </div>
                )
              }
              return null
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
