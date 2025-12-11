'use client'

import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, Tab, TabContent } from '@/components/ui/tabs'
import { calculateWinRate, calculatePPG } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function StatsPage() {
  const [member, setMember] = useState<any>(null)
  const [stats, setStats] = useState({
    totalPoints: 0,
    threePointers: 0,
    twoPointers: 0,
    freeThrows: 0,
    gamesPlayed: 0,
    wins: 0,
  })
  
  useEffect(() => {
    loadData()
  }, [])
  
  const loadData = async () => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    // Get all scores for this player
    const { data: scoresData } = await supabase
      .from('game_scores')
      .select('points')
      .eq('group_member_id', memberData.id)
    
    const totalPoints = scoresData?.reduce((sum, s) => sum + s.points, 0) || 0
    const threePointers = scoresData?.filter(s => s.points === 3).length || 0
    const twoPointers = scoresData?.filter(s => s.points === 2).length || 0
    const freeThrows = scoresData?.filter(s => s.points === 1).length || 0
    
    // Get games played and wins
    const { data: teamAssignments } = await supabase
      .from('session_team_players')
      .select('session_team_id')
      .eq('group_member_id', memberData.id)
    
    if (teamAssignments && teamAssignments.length > 0) {
      const teamIds = teamAssignments.map(t => t.session_team_id)
      
      const { data: gamesAsTeam1 } = await supabase
        .from('games')
        .select('id, winner_team_id, team1_id')
        .in('team1_id', teamIds)
        .eq('status', 'completed')
      
      const { data: gamesAsTeam2 } = await supabase
        .from('games')
        .select('id, winner_team_id, team2_id')
        .in('team2_id', teamIds)
        .eq('status', 'completed')
      
      const allGames = new Map()
      
      gamesAsTeam1?.forEach(g => {
        allGames.set(g.id, { ...g, playerTeamId: g.team1_id })
      })
      
      gamesAsTeam2?.forEach(g => {
        if (!allGames.has(g.id)) {
          allGames.set(g.id, { ...g, playerTeamId: g.team2_id })
        }
      })
      
      const gamesPlayed = allGames.size
      let wins = 0
      
      allGames.forEach(game => {
        if (game.winner_team_id === game.playerTeamId) {
          wins++
        }
      })
      
      setStats({
        totalPoints,
        threePointers,
        twoPointers,
        freeThrows,
        gamesPlayed,
        wins,
      })
    } else {
      setStats({
        totalPoints,
        threePointers,
        twoPointers,
        freeThrows,
        gamesPlayed: 0,
        wins: 0,
      })
    }
  }
  
  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  }
  
  return (
    <div className="min-h-screen">
      {/* iOS-style Header */}
      <header className="header-ios">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white text-center">Your Stats</h1>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Profile Summary */}
        <Card gradient className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff5722] flex items-center justify-center overflow-hidden ring-2 ring-[#2a3142] shadow-lg">
            {member?.avatar_url ? (
              <img src={member.avatar_url} alt={member?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">{getInitials(member?.name)}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{member?.name}</h2>
            <p className="text-sm text-[#6b7280]">{stats.gamesPlayed} games played</p>
          </div>
        </Card>
        
        <Tabs defaultValue="overview">
          <TabsList>
            <Tab value="overview">Overview</Tab>
            <Tab value="scoring">Scoring</Tab>
          </TabsList>
          
          <TabContent value="overview">
            <div className="grid grid-cols-2 gap-3">
              <Card gradient className="text-center py-5">
                <p className="text-3xl font-bold text-white stat-number">{stats.gamesPlayed}</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide mt-1">Games</p>
              </Card>
              <Card gradient className="text-center py-5">
                <p className="text-3xl font-bold text-green-400 stat-number">{stats.wins}</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide mt-1">Wins</p>
              </Card>
              <Card gradient className="text-center py-5">
                <p className="text-3xl font-bold text-[#ff6b35] stat-number">{calculateWinRate(stats.wins, stats.gamesPlayed)}%</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide mt-1">Win Rate</p>
              </Card>
              <Card gradient className="text-center py-5">
                <p className="text-3xl font-bold text-white stat-number">{calculatePPG(stats.totalPoints, stats.gamesPlayed)}</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide mt-1">PPG</p>
              </Card>
            </div>
            
            <Card gradient className="mt-3">
              <div className="flex justify-center">
                <div className="text-center">
                  <p className="text-5xl font-bold gradient-text stat-number">{stats.totalPoints}</p>
                  <p className="text-sm text-[#6b7280] uppercase tracking-wide mt-1">Total Points</p>
                </div>
              </div>
            </Card>
          </TabContent>
          
          <TabContent value="scoring">
            <Card gradient>
              <CardTitle>Points Breakdown</CardTitle>
              <div className="space-y-4 mt-4">
                <div className="flex items-center justify-between p-3 bg-[#252c3d]/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#ff6b35] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-glow-sm">3</div>
                    <div>
                      <span className="text-white font-medium">Three-pointers</span>
                      <p className="text-xs text-[#6b7280]">{stats.threePointers * 3} pts</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-white stat-number">{stats.threePointers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#252c3d]/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#ff6b35]/30 border border-[#ff6b35]/30 rounded-xl flex items-center justify-center text-[#ff6b35] font-bold text-lg">2</div>
                    <div>
                      <span className="text-white font-medium">Two-pointers</span>
                      <p className="text-xs text-[#6b7280]">{stats.twoPointers * 2} pts</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-white stat-number">{stats.twoPointers}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#252c3d]/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#252c3d] border border-[#363d4f] rounded-xl flex items-center justify-center text-[#a1a7b4] font-bold text-lg">1</div>
                    <div>
                      <span className="text-white font-medium">Free throws</span>
                      <p className="text-xs text-[#6b7280]">{stats.freeThrows} pts</p>
                    </div>
                  </div>
                  <span className="text-2xl font-bold text-white stat-number">{stats.freeThrows}</span>
                </div>
              </div>
              <div className="border-t border-[#2a3142] mt-4 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Total Points</span>
                  <span className="text-3xl font-bold gradient-text stat-number">{stats.totalPoints}</span>
                </div>
              </div>
            </Card>
          </TabContent>
        </Tabs>
      </div>
    </div>
  )
}
