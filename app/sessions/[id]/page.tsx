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
    
    // Load games
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at')
    
    setGames(gamesData || [])
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
              <span className="w-5 h-5 bg-blue-500/30 rounded flex items-center justify-center text-[10px] font-bold text-blue-400">H</span>
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
        
        {(() => {
          // Only show completed games with an actual winner
          const completedGames = games.filter(g => g.status === 'completed' && g.winner_team_id)
          if (completedGames.length === 0) return null
          
          return (
            <Card>
              <CardTitle>Games ({completedGames.length})</CardTitle>
              <div className="space-y-2 mt-3">
                {completedGames.map((game, index) => {
                  const team1 = teams.find(t => t.id === game.team1_id)
                  const team2 = teams.find(t => t.id === game.team2_id)
                  const winnerTeam = teams.find(t => t.id === game.winner_team_id)
                  return (
                    <div key={game.id} className="flex items-center justify-between p-2 bg-[#252c3d] rounded-lg">
                      <span className="text-sm text-[#6b7280]">Game {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <span className={game.winner_team_id === game.team1_id ? 'font-bold text-white' : 'text-[#a1a7b4]'}>
                          {team1?.name} {game.team1_score}
                        </span>
                        <span className="text-[#6b7280]">-</span>
                        <span className={game.winner_team_id === game.team2_id ? 'font-bold text-white' : 'text-[#a1a7b4]'}>
                          {game.team2_score} {team2?.name}
                        </span>
                        {winnerTeam && <span className="w-4 h-4 bg-yellow-500/30 rounded flex items-center justify-center text-[8px] font-bold text-yellow-400">W</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })()}
      </div>
      
      {canManage() && session.status !== 'completed' && (() => {
        const sessionDate = new Date(session.date)
        const now = new Date()
        const canStartNow = now >= sessionDate || session.status === 'live'
        const timeUntilStart = sessionDate.getTime() - now.getTime()
        const hoursUntil = Math.ceil(timeUntilStart / (1000 * 60 * 60))
        
        return (
          <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-[#2a3142] p-4 safe-bottom">
            <div className="max-w-lg mx-auto">
              {session.status === 'upcoming' ? (
                canStartNow ? (
                  <Button onClick={handleStartSession} className="w-full" size="lg">
                    <Play size={20} className="mr-2" />Start Live Session
                  </Button>
                ) : (
                  <div className="text-center">
                    <p className="text-[#6b7280] text-sm mb-2">Session starts in ~{hoursUntil}h</p>
                    <Button disabled className="w-full opacity-50 cursor-not-allowed" size="lg">
                      <Play size={20} className="mr-2" />Not Yet
                    </Button>
                  </div>
                )
              ) : (
                <Link href={`/sessions/${sessionId}/live`}>
                  <Button className="w-full" size="lg"><Play size={20} className="mr-2" />Continue Scoring</Button>
                </Link>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
