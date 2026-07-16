"use client"

import { Fragment } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn, formatNumber, getScoreBadgeClass } from "@/lib/utils"
import type { IndikatorScore } from "@/lib/types"

interface IndikatorTableProps {
  scores: IndikatorScore[]
}

export function IndikatorTable({ scores }: IndikatorTableProps) {
  // Group by aspek
  const grouped = scores.reduce(
    (acc, s) => {
      if (!acc[s.aspek_id]) {
        acc[s.aspek_id] = { aspek_nama: s.aspek_nama, items: [] }
      }
      acc[s.aspek_id].items.push(s)
      return acc
    },
    {} as Record<string, { aspek_nama: string; items: IndikatorScore[] }>
  )

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[60px]">Kode</TableHead>
          <TableHead>Indikator</TableHead>
          <TableHead className="text-center w-[80px]">Bobot</TableHead>
          <TableHead className="text-center w-[80px]">Skor</TableHead>
          <TableHead className="text-center w-[100px]">Predikat</TableHead>
          <TableHead className="text-right w-[100px]">Kontribusi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Object.entries(grouped).map(([aspekId, group]) => (
          <Fragment key={`group-${aspekId}`}>
            {/* Aspek header row */}
            <TableRow key={`aspek-${aspekId}`} className="bg-muted/30 hover:bg-muted/40">
              <TableCell colSpan={6} className="font-semibold text-sm py-2.5">
                {group.aspek_nama}
              </TableCell>
            </TableRow>
            {/* Indikator rows */}
            {group.items.map((score) => (
              <TableRow key={score.indikator_id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {score.indikator_kode}
                </TableCell>
                <TableCell className="text-sm">{score.indikator_nama}</TableCell>
                <TableCell className="text-center text-xs text-muted-foreground">
                  {(score.bobot * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold tabular-nums">
                    {formatNumber(score.skor)}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-medium",
                      getScoreBadgeClass(score.skor)
                    )}
                  >
                    {score.predikat}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-sm tabular-nums">
                  {formatNumber(score.kontribusi)}
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  )
}
