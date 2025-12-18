'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { TeamCard } from '@/components/team/team-card'
import { ArrowLeft, Play, Trash2, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [member, setMember] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [host, setHost] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [games, setGames] = useState<any[]>([])
  const [scores, setScores] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    loadData()
  }, [sessionId])

  const loadData = async () => {
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (!sessionData) {
      router.push('/sessions')
      return
    }

    setSession(sessionData)

    // Get host
    if (sessionData.host_id) {
      const { data: hostData } = await supabase
        .from('group_members')
        .select('*')
        .eq('id', sessionData.host_id)
        .single()
      setHost(hostData)
    }

    // Load teams with players
    const { data: teamsData } = await supabase
      .from('session_teams')
      .select(`
        *,
        session_team_players (
          *,
          group_members (*)
        )
      `)
      .eq('session_id', sessionId)

    const formattedTeams = (teamsData as any[] || []).map(team => ({
      ...team,
      players: team.session_team_players?.map((tp: any) => ({
        ...tp,
        member: tp.group_members
      })) || []
    }))

    setTeams(formattedTeams)

    // Load games with scores
    const { data: gamesData } = await supabase
      .from('games')
      .select(`
        *,
        game_scores (*)
      `)
      .eq('session_id', sessionId)
      .order('created_at')

    setGames(gamesData || [])

    // Flatten scores for easy stats calc
    const allScores = (gamesData || []).flatMap((g: any) => g.game_scores || [])
    setScores(allScores)
    calculateStats(gamesData || [], allScores, formattedTeams)
  }

  const calculateStats = (gamesList: any[], scoresList: any[], teamsList: any[]) => {
    if (!gamesList.length) return

    // 1. Kings (Most Wins)
    const winCounts: Record<string, number> = {}
    gamesList.forEach(g => {
      if (g.winner_team_id) {
        winCounts[g.winner_team_id] = (winCounts[g.winner_team_id] || 0) + 1
      }
    })

    let kingTeamId: string | null = null
    let maxWins = -1
    Object.entries(winCounts).forEach(([teamId, wins]) => {
      if (wins > maxWins) {
        maxWins = wins
        kingTeamId = teamId
      }
    })
    const kingTeam = teamsList.find(t => t.id === kingTeamId)

    // 2. MVP (Most Points)
    const pointsMap: Record<string, number> = {}
    scoresList.forEach(s => {
      pointsMap[s.group_member_id] = (pointsMap[s.group_member_id] || 0) + s.points
    })

    let mvpId: string | null = null
    let maxPoints = -1
    Object.entries(pointsMap).forEach(([pid, pts]) => {
      if (pts > maxPoints) {
        maxPoints = pts
        mvpId = pid
      }
    })
    const mvpPlayer = teamsList.flatMap(t => t.players).find((p: any) => p.group_member_id === mvpId)

    // 3. Sniper (Most 2-pointers aka "3s")
    const sniperMap: Record<string, number> = {}
    scoresList.forEach(s => {
      if (s.points === 2) {
        sniperMap[s.group_member_id] = (sniperMap[s.group_member_id] || 0) + 1
      }
    })

    let sniperId: string | null = null
    let maxSnipes = -1
    Object.entries(sniperMap).forEach(([pid, count]) => {
      if (count > maxSnipes) {
        maxSnipes = count
        sniperId = pid
      }
    })
    // Only crown a sniper if they hit at least one
    const sniperPlayer = maxSnipes > 0 ? teamsList.flatMap(t => t.players).find((p: any) => p.group_member_id === sniperId) : null

    setStats({
      king: { team: kingTeam, wins: maxWins },
      mvp: { player: mvpPlayer, points: maxPoints },
      sniper: { player: sniperPlayer, count: maxSnipes }
    })
  }

  const handleCopyRecap = () => {
    if (!session || !stats) return

    const lines = [
      `🏀 Sesh Recap - ${formatDate(session.date)}`,
      ``,
      `👑 Kings: ${stats.king.team?.name || '-'} (${stats.king.wins} wins)`,
      `🔥 MVP: ${stats.mvp.player?.member?.name} (${stats.mvp.points}pts)`,
      stats.sniper.player ? `🎯 Sniper: ${stats.sniper.player?.member?.name} (${stats.sniper.count} 3s)` : null,
      ``,
      `Games:`,
      ...games.map((g, i) => {
        const t1 = teams.find(t => t.id === g.team1_id)?.name
        const t2 = teams.find(t => t.id === g.team2_id)?.name
        return `${i + 1}. ${t1} ${g.team1_score}-${g.team2_score} ${t2}`
      })
    ].filter(Boolean)

    navigator.clipboard.writeText(lines.join('\n'))
    alert('Recap copied to clipboard!')
  }

  const canManage = () => {
    if (!member || !session) return false
    if (member.role === 'admin') return true
    if (session.host_id === member.id) return true
    if (session.created_by === member.id) return true
    return false
  }

  const handleStartSession = async () => {
    await supabase
      .from('sessions')
      .update({ status: 'live' } as any)
      .eq('id', sessionId)

    router.push(`/sessions/${sessionId}/live`)
  }

  const handleDeleteSession = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return

    await supabase.from('sessions').delete().eq('id', sessionId)
    router.push('/sessions')
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-[#0f1219] safe-top pb-24">
      <div className="bg-[#1a1f2e] border-b border-[#2a3142]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/sessions" className="p-2 -ml-2 rounded-full hover:bg-[#252c3d] transition-colors">
              <ArrowLeft size={24} className="text-[#6b7280]" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">Session Details</h1>
              <p className="text-sm text-[#6b7280]">{formatDate(session.date)}</p>
            </div>
          </div>
          {canManage() && session.status === 'upcoming' && (
            <button onClick={handleDeleteSession} className="p-2 text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-xl font-bold text-white">{formatDate(session.date)}</p>
              <p className="text-[#6b7280]">{formatTime(session.date)} • {session.location}</p>
            </div>
            {session.status === 'upcoming' && (
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">Upcoming</span>
            )}
            {session.status === 'live' && (
              <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm font-medium rounded-full animate-pulse">🔴 Live</span>
            )}
            {session.status === 'completed' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">✓ Done</span>
            )}
          </div>

          {/* Host */}
          {host && (
            <div className="flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-sm">🎫</span>
              <Avatar src={host.avatar_url} name={host.name} size="xs" />
              <span className="text-sm text-blue-400">
                Hosted by <span className="font-medium">{host.name}</span>
              </span>
            </div>
          )}
        </Card>

        <div>
          <h2 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">Teams ({teams.length})</h2>
          <div className="space-y-3">
            {teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>

        {/* Session Recap - Only show if completed */}
        {session.status === 'completed' && stats && (
          <Card className="bg-gradient-to-br from-[#1e2433] to-[#0f1219] border-[#2a3142]">
            <div className="flex items-center justify-between mb-4">
              <CardTitle className="text-lg">Recap</CardTitle>
              <Button onClick={handleCopyRecap} variant="secondary" size="sm" className="h-8 text-xs border border-[#ffffff]/10 bg-[#ffffff]/5 hover:bg-[#ffffff]/10">
                Copy
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="text-center p-3 rounded-xl bg-[#252c3d]/50 border border-[#ffffff]/5">
                <div className="text-2xl mb-1">👑</div>
                <div className="text-xs text-[#a1a7b4] uppercase tracking-wider font-bold mb-1">Kings</div>
                <div className="font-bold text-white text-sm truncate">{stats.king.team?.name || '-'}</div>
                <div className="text-xs text-[#6b7280]">{stats.king.wins} wins</div>
              </div>

              <div className="text-center p-3 rounded-xl bg-[#252c3d]/50 border border-[#ffffff]/5">
                <div className="text-2xl mb-1">🔥</div>
                <div className="text-xs text-[#a1a7b4] uppercase tracking-wider font-bold mb-1">MVP</div>
                <div className="font-bold text-white text-sm truncate">{stats.mvp.player?.member?.name?.split(' ')[0] || '-'}</div>
                <div className="text-xs text-[#6b7280]">{stats.mvp.points} pts</div>
              </div>

              <div className="text-center p-3 rounded-xl bg-[#252c3d]/50 border border-[#ffffff]/5">
                <div className="text-2xl mb-1">🎯</div>
                <div className="text-xs text-[#a1a7b4] uppercase tracking-wider font-bold mb-1">Sniper</div>
                <div className="font-bold text-white text-sm truncate">{stats.sniper.player?.member?.name?.split(' ')[0] || '-'}</div>
                <div className="text-xs text-[#6b7280]">{stats.sniper.count > 0 ? `${stats.sniper.count} 3s` : '-'}</div>
              </div>
            </div>
          </Card>
        )}

        {games.length > 0 && (
          <Card>
            <CardTitle>Games ({games.length})</CardTitle>
            <div className="space-y-2 mt-3">
              {games.map((game, index) => {
                const team1 = teams.find(t => t.id === game.team1_id)
                const team2 = teams.find(t => t.id === game.team2_id)
                return (
                  <div className="flex items-center justify-between p-2 bg-[#252c3d] rounded-lg">
                    <span className="text-sm text-[#6b7280]">Game {index + 1}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-sm ${game.winner_team_id === game.team1_id ? 'font-bold text-white' : 'text-[#a1a7b4]'}`}>
                        {team1?.name} {game.team1_score}
                      </span>
                      <span className="text-[#6b7280]">-</span>
                      <span className={`font-mono text-sm ${game.winner_team_id === game.team2_id ? 'font-bold text-white' : 'text-[#a1a7b4]'}`}>
                        {game.team2_score} {team2?.name}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        )}
      </div>

      {canManage() && session.status !== 'completed' && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-[#2a3142] p-4 safe-bottom">
          <div className="max-w-lg mx-auto">
            {session.status === 'upcoming' ? (
              <Button onClick={handleStartSession} className="w-full" size="lg">
                <Play size={20} className="mr-2" />Start Live Session
              </Button>
            ) : (
              <Link href={`/sessions/${sessionId}/live`}>
                <Button className="w-full" size="lg"><Play size={20} className="mr-2" />Continue Scoring</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
