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
                <Card hover className="flex items-center gap-3 p-4">
                  <div className="w-11 h-11 bg-[#ff6b35]/20 rounded-2xl flex items-center justify-center">
                    <Users size={22} className="text-[#ff6b35]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Roster</p>
                    <p className="text-xs text-[#6b7280]">Manage players</p>
                  </div>
                </Card>
              </Link>
            )}
            <Link href="/sessions" className="flex-1">
              <Card hover className="flex items-center gap-3 p-4">
                <div className="w-11 h-11 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <Calendar size={22} className="text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Sessions</p>
                  <p className="text-xs text-[#6b7280]">{isAdmin ? 'Create & manage' : 'Manage'}</p>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Upcoming Session */}
        {upcomingSession ? (
          <Card gradient>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                {upcomingSession.status === 'live' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Live Now
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    Next Up
                  </span>
                )}
              </CardTitle>
              {canManageSession && upcomingSession.status === 'upcoming' && (
                <Link href={`/sessions/${upcomingSession.id}/live`}>
                  <Button size="sm">
                    <Play size={16} className="mr-1" />
                    Start
                  </Button>
                </Link>
              )}
              {upcomingSession.status === 'live' && (
                <Link href={canManageSession ? `/sessions/${upcomingSession.id}/live` : `/session/${upcomingSession.id}`}>
                  <Button size="sm">
                    {canManageSession ? 'Score' : 'Watch'}
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-lg font-semibold text-white">
              {formatDate(upcomingSession.date)}
            </p>
            <p className="text-sm text-[#6b7280] mb-3">
              {formatTime(upcomingSession.date)} • {upcomingSession.location}
            </p>

            {/* Session Host */}
            {sessionHost && (
              <div className="flex items-center gap-2 mb-4 p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <span className="w-5 h-5 bg-blue-500/30 rounded flex items-center justify-center text-[10px] font-bold text-blue-400">H</span>
                <Avatar src={sessionHost.avatar_url} name={sessionHost.name} size="sm" />
                <span className="text-sm text-blue-400">
                  Hosted by <span className="font-medium">{sessionHost.name}</span>
                </span>
              </div>
            )}

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
          <Card className="relative overflow-hidden min-h-[160px] flex flex-col items-center justify-center p-6 text-center group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#252c3d]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#2a3142] to-transparent" />

            <div className="w-16 h-16 bg-[#252c3d] rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-300">
              <Calendar size={32} className="text-[#6b7280]" />
            </div>

            <p className="text-[#9ca3af] font-medium mb-1">No upcoming session</p>
            <p className="text-sm text-[#6b7280] mb-5">Rest up for the next one</p>

            {canManage && (
              <Link href="/sessions/new">
                <Button className="shadow-lg hover:shadow-glow-sm transition-all">
                  <Plus size={18} className="mr-2" />
                  Create Session
                </Button>
              </Link>
            )}
          </Card>
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
