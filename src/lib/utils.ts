import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { RubrikLevel } from './types'

// ---- Tailwind class merge utility ----
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ---- Scoring Engine Utilities ----

/**
 * Convert a 1-5 score to 0-100 scale
 */
export function convertToScale100(skor: number): number {
  return (skor / 5) * 100
}

/**
 * Convert a 0-100 score back to 1-5 scale
 */
export function convertToScale5(skor100: number): number {
  return (skor100 / 100) * 5
}

/**
 * Calculate weighted contribution of an indicator
 * skor: 1-5, bobot: percentage (e.g., 0.05 for 5%)
 */
export function calculateWeightedScore(skor: number, bobot: number): number {
  return convertToScale100(skor) * bobot
}

/**
 * Get maturity level and predikat from rubrik_level data
 * Uses configurable ranges from database
 */
export function getPredikatFromRubrik(
  skor: number,
  rubrikLevels: RubrikLevel[]
): { level: number; predikat: string } {
  // Sort by level ascending
  const sorted = [...rubrikLevels].sort((a, b) => a.level - b.level)

  for (const rubrik of sorted) {
    if (skor >= rubrik.batas_bawah && skor <= rubrik.batas_atas) {
      return { level: rubrik.level, predikat: rubrik.predikat }
    }
  }

  // Fallback: highest level if score exceeds all ranges
  if (sorted.length > 0) {
    const last = sorted[sorted.length - 1]
    if (skor >= last.batas_atas) {
      return { level: last.level, predikat: last.predikat }
    }
    const first = sorted[0]
    if (skor <= first.batas_bawah) {
      return { level: first.level, predikat: first.predikat }
    }
  }

  return { level: 1, predikat: 'Belum Dinilai' }
}

/**
 * Default maturity level lookup (used when rubrik data is unavailable)
 */
export function getDefaultPredikat(skor: number): { level: number; predikat: string } {
  if (skor >= 4.5) return { level: 5, predikat: 'Memuaskan' }
  if (skor >= 3.5) return { level: 4, predikat: 'Sangat Baik' }
  if (skor >= 2.5) return { level: 3, predikat: 'Baik' }
  if (skor >= 1.5) return { level: 2, predikat: 'Cukup' }
  return { level: 1, predikat: 'Kurang' }
}

// ---- UI Color Utilities ----

/**
 * Get color based on score (1-5 scale) for charts and badges
 */
export function getScoreColor(skor: number): string {
  if (skor >= 4.5) return 'var(--color-score-5)'
  if (skor >= 3.5) return 'var(--color-score-4)'
  if (skor >= 2.5) return 'var(--color-score-3)'
  if (skor >= 1.5) return 'var(--color-score-2)'
  return 'var(--color-score-1)'
}

/**
 * Get Tailwind color class for score-based badges
 */
export function getScoreBadgeClass(skor: number): string {
  if (skor >= 4.5) return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  if (skor >= 3.5) return 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
  if (skor >= 2.5) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
  if (skor >= 1.5) return 'bg-orange-500/15 text-orange-700 dark:text-orange-400'
  return 'bg-red-500/15 text-red-700 dark:text-red-400'
}

/**
 * Get color for gauge chart (0-100 scale)
 */
export function getGaugeColor(value: number): string {
  if (value >= 90) return '#10b981' // emerald
  if (value >= 70) return '#3b82f6' // blue
  if (value >= 50) return '#f59e0b' // amber
  if (value >= 30) return '#f97316' // orange
  return '#ef4444' // red
}

/**
 * Get status badge styling for penilaian status
 */
export function getStatusConfig(status: string): { label: string; className: string } {
  const configs: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-500/15 text-gray-700 dark:text-gray-400' },
    terkirim: { label: 'Terkirim', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
    disetor: { label: 'Disetor', className: 'bg-purple-500/15 text-purple-700 dark:text-purple-400' },
    dikembalikan: { label: 'Dikembalikan', className: 'bg-orange-500/15 text-orange-700 dark:text-orange-400' },
    disetujui: { label: 'Disetujui', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    dibuka: { label: 'Dibuka', className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
    ditutup: { label: 'Ditutup', className: 'bg-red-500/15 text-red-700 dark:text-red-400' },
    final: { label: 'Final', className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400' },
  }
  return configs[status] || { label: status, className: 'bg-gray-500/15 text-gray-600' }
}

/**
 * Format number as Indonesian locale
 */
export function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/**
 * Format percentage
 */
export function formatPercent(num: number): string {
  return `${formatNumber(num, 1)}%`
}
