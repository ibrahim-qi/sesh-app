'use client'

import { useEffect, useState } from 'react'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { StatsRow } from '@/components/stats/stat-card'
import { TeamCard } from '@/components/team/team-card'
import { Plus, Users, Calendar, Play, Settings, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime, calculateWinRate } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function HomePage() {
  const [member, setMember] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [upcomingSession, setUpcomingSession] = useState<any>(null)
  const [sessionHost, setSessionHost] = useState<any>(null)
  const [userTeam, setUserTeam] = useState<any>(null)
  const [allTeams, setAllTeams] = useState<any[]>([])
  const [stats, setStats] = useState({ games: 0, wins: 0, points: 0 })
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)

    if (!memberData.group_id) return

    // Get group
    const { data: groupData } = await supabase
      .from('groups')
      .select('*')
      .eq('id', memberData.group_id)
      .single()

    setGroup(groupData)

    // Get upcoming/live session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('group_id', memberData.group_id)
      .or('status.eq.upcoming,status.eq.live')
      .order('date', { ascending: true })
      .limit(1)

    const session = sessionData?.[0] as any
    setUpcomingSession(session)

    if (session) {
      // Get session host
      if (session.host_id) {
        const { data: hostData } = await supabase
          .from('group_members')
          .select('*')
          .eq('id', session.host_id)
          .single()
        setSessionHost(hostData)
      }

      // Get teams with players
      const { data: teamsData } = await supabase
        .from('session_teams')
        .select(`
          *,
          session_team_players (
            *,
            group_members (*)
          )
        `)
        .eq('session_id', session.id)

      if (teamsData) {
        const formattedTeams = (teamsData as any[]).map(team => ({
          ...team,
          players: team.session_team_players?.map((tp: any) => ({
            ...tp,
            member: tp.group_members
          })) || []
        }))

        setAllTeams(formattedTeams)

        const myTeam = formattedTeams.find(team =>
          team.players.some((p: any) => p.group_member_id === memberData.id)
        )
        setUserTeam(myTeam)
      }
    }

    // Get stats
    const { data: scoresData } = await supabase
      .from('game_scores')
      .select('points')
      .eq('group_member_id', memberData.id)

    const totalPoints = (scoresData as any[] || []).reduce((sum, s) => sum + s.points, 0)

    setStats({
      games: 0,
      wins: 0,
      points: totalPoints,
    })
  }

  const copyInviteLink = async () => {
    if (!group) return
    const link = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50)
    setTimeout(() => setCopied(false), 2000)
  }

  const isAdmin = member?.role === 'admin'
  const isHost = member?.role === 'host'
  const canManage = isAdmin || isHost

  // Check if user can manage this specific session
  const canManageSession = isAdmin || (upcomingSession?.host_id === member?.id) || (upcomingSession?.created_by === member?.id)

  return (
    <div className="min-h-screen">
      {/* iOS-style Header */}
      <header className="header-ios">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold gradient-text">
                {group?.name || 'Sesh'}
              </h1>
              <p className="text-sm text-[#6b7280]">
                Hey, {member?.name?.split(' ')[0]}
              </p>
            </div>
            {isAdmin && (
              <Link href="/admin/settings">
                <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#252c3d] active:bg-[#2d3548] transition-colors">
                  <Settings size={22} className="text-[#6b7280]" />
                </button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Quick Actions for Admin/Host */}
        {canManage && (
          <div className="flex gap-3">
            {isAdmin && (
              <Link href="/admin/roster" className="flex-1">
                <Card hover className="flex flex-col items-center justify-center gap-2 p-4 h-full aspect-square sm:aspect-auto sm:h-auto">
                  <div className="w-10 h-10 bg-[#ff6b35]/10 rounded-xl flex items-center justify-center mb-1">
                    <Users size={20} className="text-[#ff6b35]" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-white text-sm">Roster</p>
                  </div>
                </Card>
              </Link>
            )}
            <Link href="/sessions" className="flex-1">
              <Card hover className="flex flex-col items-center justify-center gap-2 p-4 h-full aspect-square sm:aspect-auto sm:h-auto">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-1">
                  <Calendar size={20} className="text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-white text-sm">Sessions</p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Upcoming Session */}
        {upcomingSession ? (
          <Card gradient className="relative overflow-hidden group">
            <div className="flex flex-col items-center text-center p-2">
              <div className="mb-4">
                {upcomingSession.status === 'live' ? (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider animate-pulse-live">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live Now
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    Next Session
                  </span>
                )}
              </div>

              <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {formatDate(upcomingSession.date)}
              </h2>
              <div className="flex items-center gap-2 text-[#a1a7b4] text-sm mb-6">
                <span className="bg-[#252c3d] px-2 py-0.5 rounded text-xs font-mono">{formatTime(upcomingSession.date)}</span>
                <span className="text-[#6b7280]">•</span>
                <span>{upcomingSession.location}</span>
              </div>

              {/* Session Host Pill */}
              {sessionHost && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252c3d]/50 rounded-full mb-6 border border-[#ffffff]/5">
                  <Avatar src={sessionHost.avatar_url} name={sessionHost.name} size="xs" />
                  <span className="text-xs text-[#a1a7b4]">
                    Prefix by <span className="text-white">{sessionHost.name?.split(' ')[0]}</span>
                  </span>
                </div>
              )}

              {/* Primary Action Button */}
              <div className="w-full">
                {upcomingSession.status === 'live' && (
                  <Link href={canManageSession ? `/sessions/${upcomingSession.id}/live` : `/session/${upcomingSession.id}`} className="block w-full">
                    <Button className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg">
                      <Play size={18} className="mr-2 fill-current" />
                      {canManageSession ? 'Resume Session' : 'Watch Live'}
                    </Button>
                  </Link>
                )}
                {canManageSession && upcomingSession.status === 'upcoming' && (
                  <Link href={`/sessions/${upcomingSession.id}/live`} className="block w-full">
                    <Button className="w-full h-12 text-base shadow-glow hover:shadow-glow-lg">
                      <Play size={18} className="mr-2 fill-current" />
                      Start Session
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {userTeam && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                  Your Team
                </p>
                <TeamCard team={userTeam} isYourTeam />
              </div>
            )}

            {allTeams.filter(t => t.id !== userTeam?.id).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mb-2">
                  Other Teams
                </p>
                <div className="space-y-2">
                  {allTeams.filter(t => t.id !== userTeam?.id).map((team) => (
                    <TeamCard key={team.id} team={team} />
                  ))}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 relative">
            {/* Animated basketball from landing page */}
            <div className="relative w-16 h-16 animate-float mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#252c3d] to-[#1a1f2e] border border-[#363d4f]"
                style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                <svg viewBox="0 0 44 44" className="w-full h-full">
                  <path d="M5 22 Q22 20, 39 22" stroke="#ff6b35" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                  <path d="M22 5 Q20 22, 22 39" stroke="#ff6b35" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                  <path d="M10 10 Q14 22, 10 34" stroke="#ff6b35" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
                  <path d="M34 10 Q30 22, 34 34" stroke="#ff6b35" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
                </svg>
              </div>
              <div className="absolute top-1.5 left-3 w-4 h-2 bg-white/5 rounded-full blur-[1px]" />
            </div>

            <p className="text-lg font-medium text-white mb-2">No active sessions</p>
            <p className="text-sm text-[#6b7280] mb-8 text-center max-w-[200px]">
              The court is quiet. Time to make some noise?
            </p>

            {canManage && (
              <Link href="/sessions/new">
                <Button className="h-12 px-8 shadow-glow hover:shadow-glow-lg transition-all text-base">
                  <Plus size={20} className="mr-2" />
                  Create Session
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Your Stats */}
        <Card gradient>
          <CardTitle>Your Stats</CardTitle>
          <StatsRow
            stats={[
              { label: 'Games', value: stats.games },
              { label: 'Wins', value: stats.wins },
              { label: 'Win %', value: `${calculateWinRate(stats.wins, stats.games)}` },
            ]}
          />
          <div className="border-t border-[#2a3142] pt-4 mt-2">
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-white stat-number">{stats.points}</p>
                <p className="text-xs text-[#6b7280] uppercase tracking-wide">Total Pts</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Invite Link (Admin only) */}
        {isAdmin && group && (
          <Card>
            <CardTitle>Invite Players</CardTitle>
            <p className="text-sm text-[#6b7280] mb-3">
              Share this link for players to join
            </p>
            <Button
              variant="secondary"
              className="w-full justify-center"
              onClick={copyInviteLink}
            >
              {copied ? (
                <>
                  <Check size={18} className="mr-2 text-green-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={18} className="mr-2" />
                  Copy Invite Link
                </>
              )}
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
