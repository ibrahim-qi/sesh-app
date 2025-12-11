'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Undo2, Trophy } from 'lucide-react'
import Link from 'next/link'
import { getTeamColorHex } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

export default function LiveScoringPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string
  
  const [member, setMember] = useState<any>(null)
  const [session, setSession] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [currentGame, setCurrentGame] = useState<any>(null)
  const [scores, setScores] = useState<any[]>([])
  const [streak, setStreak] = useState<{ teamId: string; count: number } | null>(null)
  const [showGameEndModal, setShowGameEndModal] = useState(false)
  const [winner, setWinner] = useState<any>(null)
  const [scoreAnimation, setScoreAnimation] = useState<string | null>(null)
  
  const TARGET_SCORE = 5
  
  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    loadData()
  }, [sessionId])
  
  const canManage = () => {
    if (!member || !session) return false
    if (member.role === 'admin') return true
    if (session.host_id === member.id) return true
    if (session.created_by === member.id) return true
    return false
  }
  
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
    
    if (sessionData.status === 'upcoming') {
      await supabase.from('sessions').update({ status: 'live' }).eq('id', sessionId)
      sessionData.status = 'live'
    }
    
    setSession(sessionData)
    
    const { data: teamsData } = await supabase
      .from('session_teams')
      .select(`*, session_team_players (*, group_members (*))`)
      .eq('session_id', sessionId)
    
    const formattedTeams = teamsData?.map(team => ({
      ...team,
      players: team.session_team_players?.map((tp: any) => ({
        ...tp,
        member: tp.group_members
      })) || []
    })) || []
    
    setTeams(formattedTeams)
    
    const { data: activeGame } = await supabase
      .from('games')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'in_progress')
      .single()
    
    if (activeGame) {
      setCurrentGame(activeGame)
      const { data: scoresData } = await supabase
        .from('game_scores')
        .select('*')
        .eq('game_id', activeGame.id)
        .order('created_at')
      setScores(scoresData || [])
    } else if (formattedTeams.length >= 2) {
      createNewGame(formattedTeams[0].id, formattedTeams[1].id)
    }
    
    const { data: completedGames } = await supabase
      .from('games')
      .select('*')
      .eq('session_id', sessionId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
    
    if (completedGames && completedGames.length > 0) {
      let streakTeamId = completedGames[0].winner_team_id
      let streakCount = 0
      for (const game of completedGames) {
        if (game.winner_team_id === streakTeamId) streakCount++
        else break
      }
      if (streakCount >= 2) setStreak({ teamId: streakTeamId, count: streakCount })
    }
  }
  
  const createNewGame = async (team1Id: string, team2Id: string) => {
    const { data: newGame } = await supabase
      .from('games')
      .insert({
        session_id: sessionId,
        team1_id: team1Id,
        team2_id: team2Id,
        team1_score: 0,
        team2_score: 0,
        status: 'in_progress',
      })
      .select()
      .single()
    
    if (newGame) {
      setCurrentGame(newGame)
      setScores([])
    }
  }
  
  const handleScore = useCallback(async (memberId: string, points: 1 | 2 | 3, teamId: string) => {
    if (!currentGame) return
    if (navigator.vibrate) navigator.vibrate(50)
    
    // Trigger score animation
    setScoreAnimation(teamId)
    setTimeout(() => setScoreAnimation(null), 300)
    
    const { data: newScore } = await supabase
      .from('game_scores')
      .insert({ game_id: currentGame.id, group_member_id: memberId, team_id: teamId, points })
      .select()
      .single()
    
    if (!newScore) return
    
    const isTeam1 = teamId === currentGame.team1_id
    const newTeam1Score = isTeam1 ? currentGame.team1_score + points : currentGame.team1_score
    const newTeam2Score = !isTeam1 ? currentGame.team2_score + points : currentGame.team2_score
    
    await supabase.from('games').update({ team1_score: newTeam1Score, team2_score: newTeam2Score }).eq('id', currentGame.id)
    
    setCurrentGame((prev: any) => ({ ...prev, team1_score: newTeam1Score, team2_score: newTeam2Score }))
    setScores(prev => [...prev, newScore])
    
    if (newTeam1Score >= TARGET_SCORE || newTeam2Score >= TARGET_SCORE) {
      const winnerTeamId = newTeam1Score >= TARGET_SCORE ? currentGame.team1_id : currentGame.team2_id
      setWinner(teams.find(t => t.id === winnerTeamId))
      setShowGameEndModal(true)
    }
  }, [currentGame, teams])
  
  const handleUndo = useCallback(async () => {
    if (!currentGame || scores.length === 0) return
    
    const lastScore = scores[scores.length - 1]
    await supabase.from('game_scores').delete().eq('id', lastScore.id)
    
    const isTeam1 = lastScore.team_id === currentGame.team1_id
    const newTeam1Score = isTeam1 ? currentGame.team1_score - lastScore.points : currentGame.team1_score
    const newTeam2Score = !isTeam1 ? currentGame.team2_score - lastScore.points : currentGame.team2_score
    
    await supabase.from('games').update({ team1_score: newTeam1Score, team2_score: newTeam2Score }).eq('id', currentGame.id)
    
    setCurrentGame((prev: any) => ({ ...prev, team1_score: newTeam1Score, team2_score: newTeam2Score }))
    setScores(prev => prev.slice(0, -1))
  }, [currentGame, scores])
  
  const handleEndGame = useCallback(async () => {
    if (!currentGame || !winner) return
    
    await supabase.from('games').update({
      status: 'completed',
      winner_team_id: winner.id,
      completed_at: new Date().toISOString(),
    }).eq('id', currentGame.id)
    
    if (streak?.teamId === winner.id) {
      setStreak({ teamId: winner.id, count: streak.count + 1 })
    } else {
      setStreak({ teamId: winner.id, count: 1 })
    }
    
    const waitingTeam = teams.find(t => t.id !== currentGame.team1_id && t.id !== currentGame.team2_id)
    if (waitingTeam) {
      await createNewGame(winner.id, waitingTeam.id)
    }
    
    setShowGameEndModal(false)
    setWinner(null)
  }, [currentGame, winner, teams, streak])
  
  const handleEndSession = async () => {
    if (!confirm('End this session?')) return
    
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId)
    
    if (currentGame?.status === 'in_progress') {
      await supabase.from('games').update({
        status: 'completed',
        winner_team_id: currentGame.team1_score > currentGame.team2_score ? currentGame.team1_id : currentGame.team2_id,
        completed_at: new Date().toISOString(),
      }).eq('id', currentGame.id)
    }
    
    router.push('/sessions')
  }
  
  const getPlayerPoints = (memberId: string) => scores.filter(s => s.group_member_id === memberId).reduce((sum, s) => sum + s.points, 0)
  
  const getLastScoreText = () => {
    if (scores.length === 0) return null
    const last = scores[scores.length - 1]
    const player = teams.flatMap(t => t.players || []).find(p => p.group_member_id === last.group_member_id)
    return `+${last.points} ${player?.member?.name?.split(' ')[0]}`
  }
  
  if (!session || !currentGame || teams.length < 2) {
    return (
      <div className="min-h-screen bg-[#0f1219] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full" />
      </div>
    )
  }
  
  const team1 = teams.find(t => t.id === currentGame.team1_id)
  const team2 = teams.find(t => t.id === currentGame.team2_id)
  const waitingTeam = teams.find(t => t.id !== currentGame.team1_id && t.id !== currentGame.team2_id)
  const team1Color = getTeamColorHex(team1?.color || 'red')
  const team2Color = getTeamColorHex(team2?.color || 'blue')
  
  return (
    <div className="min-h-screen bg-[#0f1219] text-white pb-24 relative">
      {/* Ambient glow effects */}
      <div 
        className="absolute top-0 left-0 w-1/2 h-64 blur-3xl opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: team1Color, opacity: scoreAnimation === currentGame.team1_id ? 0.4 : 0.15 }}
      />
      <div 
        className="absolute top-0 right-0 w-1/2 h-64 blur-3xl opacity-20 transition-opacity duration-500"
        style={{ backgroundColor: team2Color, opacity: scoreAnimation === currentGame.team2_id ? 0.4 : 0.15 }}
      />
      
      <div className="bg-[#1a1f2e]/80 backdrop-blur-sm border-b border-[#2a3142] relative z-10">
        <div className="flex items-center justify-between p-4">
          <Link href={`/sessions/${sessionId}`} className="p-2 -ml-2 rounded-full hover:bg-[#252c3d]">
            <ArrowLeft size={24} className="text-[#6b7280]" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium tracking-wide">LIVE</span>
          </div>
          <button onClick={handleEndSession} className="text-sm text-[#6b7280] hover:text-white transition-colors">End</button>
        </div>
      </div>
      
      <div className="py-10 text-center relative z-10">
        {streak && streak.count >= 2 && (
          <div className="flex items-center justify-center gap-2 mb-6 animate-float">
            <span className="text-xl animate-fire">🔥</span>
            <span className="text-sm font-medium text-yellow-400 tracking-wide">
              {teams.find(t => t.id === streak.teamId)?.name} • {streak.count} streak
            </span>
            <span className="text-xl animate-fire">🔥</span>
          </div>
        )}
        
        <div className="flex items-center justify-center gap-12">
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-3 shadow-lg" style={{ backgroundColor: team1Color, boxShadow: `0 0 20px ${team1Color}40` }} />
            <p className="text-sm font-medium text-[#6b7280] mb-2 tracking-wide uppercase">{team1?.name}</p>
            <p 
              className={`text-7xl font-bold score-big transition-transform duration-200 ${scoreAnimation === currentGame.team1_id ? 'scale-110' : ''}`}
              style={{ color: team1Color }}
            >
              {currentGame.team1_score}
            </p>
          </div>
          
          <div className="flex flex-col items-center">
            <span className="text-2xl font-light text-[#363d4f]">vs</span>
          </div>
          
          <div className="text-center">
            <div className="w-4 h-4 rounded-full mx-auto mb-3 shadow-lg" style={{ backgroundColor: team2Color, boxShadow: `0 0 20px ${team2Color}40` }} />
            <p className="text-sm font-medium text-[#6b7280] mb-2 tracking-wide uppercase">{team2?.name}</p>
            <p 
              className={`text-7xl font-bold score-big transition-transform duration-200 ${scoreAnimation === currentGame.team2_id ? 'scale-110' : ''}`}
              style={{ color: team2Color }}
            >
              {currentGame.team2_score}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-[#4b5563] mt-6 font-mono">First to {TARGET_SCORE}</p>
      </div>
      
      <div className="px-4 space-y-6 relative z-10">
        {[team1, team2].map((team, idx) => {
          const color = idx === 0 ? team1Color : team2Color
          return (
            <div key={team.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs font-semibold text-[#6b7280] tracking-wider uppercase">{team?.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {team?.players?.map((player: any) => (
                  <div key={player.id} className="card-gradient rounded-xl p-3 border border-[#2a3142]">
                    <div className="flex items-center gap-2 mb-3">
                      <Avatar src={player.member?.avatar_url} name={player.member?.name || ''} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{player.member?.name?.split(' ')[0]}</p>
                        <p className="text-xs text-[#6b7280] font-mono">{getPlayerPoints(player.group_member_id)} pts</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleScore(player.group_member_id, 1, team.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#252c3d] text-[#a1a7b4] hover:bg-[#2d3548] active:scale-95 transition-all font-mono">+1</button>
                      <button onClick={() => handleScore(player.group_member_id, 2, team.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all font-mono" style={{ backgroundColor: `${color}25`, color, borderWidth: 1, borderColor: `${color}40` }}>+2</button>
                      <button onClick={() => handleScore(player.group_member_id, 3, team.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white active:scale-95 transition-all font-mono shadow-lg" style={{ backgroundColor: color, boxShadow: `0 4px 15px ${color}40` }}>+3</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
        
        {waitingTeam && (
          <div className="p-4 bg-[#1e2433]/50 border border-[#2a3142] border-dashed rounded-xl text-center">
            <p className="text-sm text-[#6b7280]">
              <span className="inline-block animate-pulse mr-2">⏳</span>
              <span className="font-medium text-[#a1a7b4]">{waitingTeam.name}</span> next up
            </p>
          </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e]/90 backdrop-blur-sm border-t border-[#2a3142] p-4 safe-bottom z-20">
        <Button variant="secondary" onClick={handleUndo} disabled={scores.length === 0} className="w-full">
          <Undo2 size={18} className="mr-2" />
          {getLastScoreText() || 'Undo'}
        </Button>
      </div>
      
      {showGameEndModal && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="card-gradient border border-[#2a3142] rounded-3xl p-8 max-w-sm mx-4 text-center animate-score-pop">
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-float" style={{ boxShadow: '0 0 40px rgba(234, 179, 8, 0.4)' }}>
              <Trophy size={44} className="text-[#0f1219]" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{winner.name}</h2>
            <p className="text-lg text-[#6b7280] mb-2">wins!</p>
            <p className="text-4xl font-mono font-bold text-white mb-8">{currentGame.team1_score} - {currentGame.team2_score}</p>
            <Button onClick={handleEndGame} className="w-full shadow-glow" size="lg">Continue</Button>
          </div>
        </div>
      )}
    </div>
  )
}
