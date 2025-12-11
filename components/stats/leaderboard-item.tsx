'use client'

import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface LeaderboardItemProps {
  rank: number
  member: {
    id: string
    name: string
    avatar_url?: string | null
  }
  value: string | number
  label: string
  isCurrentUser?: boolean
}

export function LeaderboardItem({ rank, member, value, label, isCurrentUser }: LeaderboardItemProps) {
  const getRankDisplay = () => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `${rank}`
  }
  
  return (
    <div 
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl transition-colors',
        isCurrentUser && 'bg-primary-50'
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center">
        <span className={cn(
          'text-lg',
          rank > 3 && 'text-dark-400 font-medium'
        )}>
          {getRankDisplay()}
        </span>
      </div>
      
      {/* Avatar */}
      <Avatar
        src={member.avatar_url}
        name={member.name}
        size="md"
      />
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-dark-900 truncate',
          isCurrentUser && 'text-primary-600'
        )}>
          {member.name}
        </p>
      </div>
      
      {/* Value */}
      <div className="text-right">
        <p className="font-semibold text-dark-900">{value}</p>
        <p className="text-xs text-dark-400">{label}</p>
      </div>
    </div>
  )
}

