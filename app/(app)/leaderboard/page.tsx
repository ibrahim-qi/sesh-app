'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, Tab, TabContent } from '@/components/ui/tabs'
import { supabase } from '@/lib/supabase/client'
import { calculateWinRate } from '@/lib/utils'

export default function LeaderboardPage() {
  const [member, setMember] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<{
    points: any[]
    wins: any[]
    winRate: any[]
  }>({ points: [], wins: [], winRate: [] })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    if (!memberData.group_id) return
    
    const { data: members } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', memberData.group_id)
    
    if (!members) return
    
    const memberIds = members.map(m => m.id)
    const { data: scores } = await supabase
      .from('game_scores')
      .select('group_member_id, points')
      .in('group_member_id', memberIds)
    
    const { data: teamAssignments } = await supabase
      .from('session_team_players')
      .select('group_member_id, session_team_id')
      .in('group_member_id', memberIds)
    
    const { data: allGames } = await supabase
      .from('games')
      .select('id, team1_id, team2_id, winner_team_id')
      .eq('status', 'completed')
    
    const memberStats = members.map(m => {
      const memberScores = scores?.filter(s => s.group_member_id === m.id) || []
      const totalPoints = memberScores.reduce((sum, s) => sum + s.points, 0)
      
      const memberTeams = teamAssignments?.filter(t => t.group_member_id === m.id).map(t => t.session_team_id) || []
      
      let gamesPlayed = 0
      let wins = 0
      
      allGames?.forEach(game => {
        const isOnTeam1 = memberTeams.includes(game.team1_id)
        const isOnTeam2 = memberTeams.includes(game.team2_id)
        
        if (isOnTeam1 || isOnTeam2) {
          gamesPlayed++
          const playerTeamId = isOnTeam1 ? game.team1_id : game.team2_id
          if (game.winner_team_id === playerTeamId) {
            wins++
          }
        }
      })
      
      return {
        ...m,
        totalPoints,
        gamesPlayed,
        wins,
        winRate: calculateWinRate(wins, gamesPlayed),
      }
    })
    
    setLeaderboard({
      points: [...memberStats].sort((a, b) => b.totalPoints - a.totalPoints),
      wins: [...memberStats].sort((a, b) => b.wins - a.wins),
      winRate: [...memberStats]
        .filter(m => m.gamesPlayed >= 3)
        .sort((a, b) => b.winRate - a.winRate),
    })
  }
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }
  
  const LeaderboardItem = ({ rank, m, value, label, isCurrentUser }: any) => (
    <div className={`flex items-center gap-3 p-3 min-h-[60px] ${isCurrentUser ? 'bg-[#ff6b35]/10' : ''}`}>
      <div className="w-8 text-center">
        {rank <= 3 ? (
          <span className="text-xl">{rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}</span>
        ) : (
          <span className="text-[#6b7280] font-mono font-medium">{rank}</span>
        )}
      </div>
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff5722] flex items-center justify-center overflow-hidden ring-2 ring-[#2a3142]">
        {m.avatar_url ? (
          <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-bold text-white">{getInitials(m.name)}</span>
        )}
      </div>
      <span className={`flex-1 font-medium truncate ${isCurrentUser ? 'text-[#ff6b35]' : 'text-white'}`}>
        {m.name}
      </span>
      <div className="text-right">
        <p className="font-bold text-white stat-number">{value}</p>
        <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">{label}</p>
      </div>
    </div>
  )
  
  return (
    <div className="min-h-screen">
      {/* iOS-style Header */}
      <header className="header-ios">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white text-center">Leaderboard</h1>
        </div>
      </header>
      
      <div className="p-4">
        <Tabs defaultValue="points">
          <TabsList className="mb-4">
            <Tab value="points">Points</Tab>
            <Tab value="wins">Wins</Tab>
            <Tab value="winrate">Win %</Tab>
          </TabsList>
          
          <TabContent value="points">
            <Card gradient className="p-0 overflow-hidden">
              {leaderboard.points.length > 0 ? (
                <div className="divide-y divide-[#2a3142]">
                  {leaderboard.points.map((m, i) => (
                    <LeaderboardItem
                      key={m.id}
                      rank={i + 1}
                      m={m}
                      value={m.totalPoints}
                      label="pts"
                      isCurrentUser={m.id === member?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-[#6b7280]">
                  <p className="text-4xl mb-3">🏀</p>
                  <p>No stats yet</p>
                  <p className="text-sm">Play some games!</p>
                </div>
              )}
            </Card>
          </TabContent>
          
          <TabContent value="wins">
            <Card gradient className="p-0 overflow-hidden">
              {leaderboard.wins.length > 0 ? (
                <div className="divide-y divide-[#2a3142]">
                  {leaderboard.wins.map((m, i) => (
                    <LeaderboardItem
                      key={m.id}
                      rank={i + 1}
                      m={m}
                      value={m.wins}
                      label={`${m.gamesPlayed} games`}
                      isCurrentUser={m.id === member?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-[#6b7280]">
                  <p className="text-4xl mb-3">🏆</p>
                  <p>No games played yet!</p>
                </div>
              )}
            </Card>
          </TabContent>
          
          <TabContent value="winrate">
            <Card gradient className="p-0 overflow-hidden">
              {leaderboard.winRate.length > 0 ? (
                <div className="divide-y divide-[#2a3142]">
                  {leaderboard.winRate.map((m, i) => (
                    <LeaderboardItem
                      key={m.id}
                      rank={i + 1}
                      m={m}
                      value={`${m.winRate}%`}
                      label={`${m.wins}W ${m.gamesPlayed - m.wins}L`}
                      isCurrentUser={m.id === member?.id}
                    />
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-[#6b7280]">
                  <p className="text-4xl mb-3">📊</p>
                  <p>Min 3 games required</p>
                </div>
              )}
            </Card>
          </TabContent>
        </Tabs>
      </div>
    </div>
  )
}
