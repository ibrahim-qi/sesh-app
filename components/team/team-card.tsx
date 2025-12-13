'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'

interface TeamCardProps {
  team: {
    id: string
    name: string
    color: string
    players: Array<{
      member: {
        id: string
        name: string
        avatar_url?: string
      }
      is_captain?: boolean
    }>
  }
  isYourTeam?: boolean
  score?: number
  isWinner?: boolean
  className?: string
}

const teamColors: Record<string, { bg: string; border: string; text: string; glow?: string }> = {
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-300', glow: 'shadow-red-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-300', glow: 'shadow-blue-500/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300', glow: 'shadow-green-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
  white: { bg: 'bg-[#252c3d]/60', border: 'border-[#363d4f]/60', text: 'text-[#a1a7b4]' },
}

export function TeamCard({ team, isYourTeam, score, isWinner, className }: TeamCardProps) {
  const colors = teamColors[team.color] || teamColors.white

  return (
    <div
      className={cn(
        'rounded-xl border p-3 transition-all',
        colors.bg,
        colors.border,
        isYourTeam && 'ring-2 ring-[#ff6b35]/50',
        isWinner && 'ring-2 ring-green-500/50',
        className
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={cn('font-semibold', colors.text)}>{team.name}</span>
          {isYourTeam && (
            <span className="text-xs bg-[#ff6b35]/20 text-[#ff6b35] px-1.5 py-0.5 rounded-full">You</span>
          )}
          {isWinner && (
            <span className="w-4 h-4 bg-yellow-500/30 rounded flex items-center justify-center text-[8px] font-bold text-yellow-400">W</span>
          )}
        </div>
        {score !== undefined && (
          <span className="text-xl font-bold text-white">{score}</span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {team.players.map((player) => (
          <div key={player.member.id} className="flex items-center gap-1.5">
            <Avatar
              src={player.member.avatar_url}
              name={player.member.name}
              size="sm"
            />
            <span className="text-sm text-[#a1a7b4]">
              {player.member.name.split(' ')[0]}
              {player.is_captain && <span className="ml-1 w-4 h-4 bg-yellow-500/30 rounded flex items-center justify-center text-[7px] font-bold text-yellow-400">C</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
