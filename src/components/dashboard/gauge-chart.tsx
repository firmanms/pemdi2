"use client"

import { PieChart, Pie, Cell } from "recharts"
import { getGaugeColor } from "@/lib/utils"

interface GaugeChartProps {
  value: number // 0-100
  label?: string
  size?: number
}

export function GaugeChart({ value, label = "Indeks Akhir", size = 220 }: GaugeChartProps) {
  const normalizedValue = Math.max(0, Math.min(100, value))
  const color = getGaugeColor(normalizedValue)

  const data = [
    { name: "value", value: normalizedValue },
    { name: "empty", value: 100 - normalizedValue },
  ]

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            cx={size / 2}
            cy={size / 2}
            startAngle={180}
            endAngle={0}
            innerRadius={size * 0.32}
            outerRadius={size * 0.42}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
            animationBegin={0}
            animationDuration={1200}
            animationEasing="ease-out"
          >
            <Cell fill={color} />
            <Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -20%)",
          }}
        >
          <span
            className="font-bold tracking-tight"
            style={{ fontSize: size * 0.16, color }}
          >
            {normalizedValue.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground mt-0.5">{label}</span>
        </div>
      </div>
    </div>
  )
}
