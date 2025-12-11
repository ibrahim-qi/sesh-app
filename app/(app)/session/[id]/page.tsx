'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { TeamCard } from '@/components/team/team-card'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Edit2 } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { getTeamColorHex } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

export default function PlayerSessionPage() {
  const params = useParams()
  const sessionId = params.id as string
  
  const [member, setMember] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [userTeam, setUserTeam] = useState<any>(null)
  const [games, setGames] = useState<any[]>([])
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [scoreboard, setScoreboard] = useState<any[]>([])
  const [editTeamNameModal, setEditTeamNameModal] = useState(false)
  const [newTeamName, setNewTeamName] = useState('')
  
  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [sessionId])
  
  const loadData = async () => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()
    
    setSession(sessionData)
    
    // Load teams
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
    
    const myTeam = formattedTeams.find(team =>
      team.players.some((p: any) => p.group_member_id === memberData.id)
    )
    setUserTeam(myTeam)
    if (myTeam) setNewTeamName(myTeam.name)
    
    // Load games
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at')
    
    const games = gamesData as any[] || []
    setGames(games)
    setCurrentGame(games.find((g: any) => g.status === 'in_progress') || null)
    
    // Calculate scoreboard
    if (games.length > 0) {
      const gameIds = games.map(g => g.id)
      const { data: scoresData } = await supabase
        .from('game_scores')
        .select('group_member_id, points')
        .in('game_id', gameIds)
      
      const { data: membersData } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', memberData.group_id)
      
      const scores = scoresData as any[] || []
      const members = membersData as any[] || []
      
      const playerPoints: Record<string, number> = {}
      scores.forEach(s => {
        playerPoints[s.group_member_id] = (playerPoints[s.group_member_id] || 0) + s.points
      })
      
      const board = Object.entries(playerPoints)
        .map(([memberId, points]) => ({
          member: members.find(m => m.id === memberId),
          points
        }))
        .sort((a, b) => (b.points as number) - (a.points as number))
      
      setScoreboard(board)
    }
  }
  
  const isCaptain = userTeam?.captain_id === member?.id
  
  const handleUpdateTeamName = async () => {
    if (!userTeam || !newTeamName.trim()) return
    
    await supabase
      .from('session_teams')
      .update({ name: newTeamName.trim() } as any)
      .eq('id', userTeam.id)
    
    loadData()
    setEditTeamNameModal(false)
  }
  
  if (!session) return null
  
  const team1 = currentGame ? teams.find(t => t.id === currentGame.team1_id) : null
  const team2 = currentGame ? teams.find(t => t.id === currentGame.team2_id) : null
  
  return (
    <div className="min-h-screen bg-dark-50 safe-top pb-20">
      <div className="bg-white border-b border-dark-100">
        <div className="flex items-center gap-4 p-4">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-dark-100 transition-colors">
            <ArrowLeft size={24} className="text-dark-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-dark-900">
              {session.status === 'live' ? '🔴 Live Session' : 'Session'}
            </h1>
            <p className="text-sm text-dark-500">{formatDate(session.date)}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Live Score */}
        {session.status === 'live' && currentGame && team1 && team2 && (
          <Card className="text-center py-6">
            <p className="text-xs font-medium text-red-500 uppercase tracking-wide mb-4">● LIVE</p>
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: getTeamColorHex(team1.color) }} />
                <p className="text-sm font-medium text-dark-600">{team1.name}</p>
                <p className="text-4xl font-bold" style={{ color: getTeamColorHex(team1.color) }}>{currentGame.team1_score}</p>
              </div>
              <span className="text-xl text-dark-400">vs</span>
              <div>
                <div className="w-4 h-4 rounded-full mx-auto mb-2" style={{ backgroundColor: getTeamColorHex(team2.color) }} />
                <p className="text-sm font-medium text-dark-600">{team2.name}</p>
                <p className="text-4xl font-bold" style={{ color: getTeamColorHex(team2.color) }}>{currentGame.team2_score}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* Your Team */}
        {userTeam && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-dark-500 uppercase tracking-wide">Your Team</p>
              {isCaptain && (
                <button onClick={() => setEditTeamNameModal(true)} className="text-sm text-primary-500 flex items-center gap-1">
                  <Edit2 size={14} />Edit Name
                </button>
              )}
            </div>
            <TeamCard team={userTeam} isYourTeam />
          </div>
        )}
        
        {/* Other Teams */}
        {teams.filter(t => t.id !== userTeam?.id).length > 0 && (
          <div>
            <p className="text-sm font-semibold text-dark-500 uppercase tracking-wide mb-2">Other Teams</p>
            <div className="space-y-2">
              {teams.filter(t => t.id !== userTeam?.id).map(team => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          </div>
        )}
        
        {/* Scoreboard */}
        {scoreboard.length > 0 && (
          <Card>
            <CardTitle>Today&apos;s Scoreboard</CardTitle>
            <div className="space-y-2 mt-3">
              {scoreboard.map((item, index) => (
                <div key={item.member?.id || index} className="flex items-center gap-3 p-2 rounded-lg bg-dark-50">
                  <span className="text-sm font-medium text-dark-400 w-6">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                  </span>
                  <Avatar src={item.member?.avatar_url} name={item.member?.name || 'Player'} size="sm" />
                  <span className="flex-1 font-medium text-dark-900">{item.member?.name}</span>
                  <span className="font-bold text-primary-500">{item.points} pts</span>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* No games yet */}
        {games.length === 0 && session.status !== 'live' && (
          <Card className="text-center py-8">
            <p className="text-dark-500">No games yet</p>
            <p className="text-sm text-dark-400 mt-1">Check back on game day!</p>
          </Card>
        )}
      </div>
      
      {/* Edit Team Name Modal */}
      <Modal open={editTeamNameModal} onClose={() => setEditTeamNameModal(false)} title="Edit Team Name">
        <div className="space-y-4">
          <Input label="Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} autoFocus />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setEditTeamNameModal(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleUpdateTeamName} disabled={!newTeamName.trim()}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
