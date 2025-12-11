'use client'

import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
}

export function StatCard({ label, value, icon, trend, className }: StatCardProps) {
  return (
    <div className={cn('card-gradient border border-[#2a3142] rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-[#6b7280]">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-white stat-number">{value}</p>
    </div>
  )
}

interface StatsRowProps {
  stats: Array<{ label: string; value: string | number }>
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="flex justify-between py-4">
      {stats.map((stat, i) => (
        <div key={i} className="text-center">
          <p className="text-xl font-bold text-white stat-number">{stat.value}</p>
          <p className="text-xs text-[#6b7280] uppercase tracking-wide">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}
