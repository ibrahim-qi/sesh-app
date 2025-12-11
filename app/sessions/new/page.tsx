'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react'
import Link from 'next/link'
import { TEAM_COLORS, TeamColor } from '@/lib/types'
import { supabase } from '@/lib/supabase/client'

export default function NewSessionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  
  const [date, setDate] = useState('')
  const [time, setTime] = useState('19:00')
  const [location, setLocation] = useState('')
  const [hostId, setHostId] = useState<string | null>(null)
  
  const [members, setMembers] = useState<any[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  
  const [teams, setTeams] = useState<{
    id: string
    name: string
    color: TeamColor
    players: string[]
    captainId: string | null
  }[]>([
    { id: 'team1', name: 'Team 1', color: 'red', players: [], captainId: null },
    { id: 'team2', name: 'Team 2', color: 'blue', players: [], captainId: null },
    { id: 'team3', name: 'Team 3', color: 'white', players: [], captainId: null },
  ])
  
  const [member, setMember] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    if (memberData.role !== 'admin' && memberData.role !== 'host') {
      router.push('/home')
      return
    }
    
    // Default host to self if user is a host
    if (memberData.role === 'host') {
      setHostId(memberData.id)
    }
    
    loadMembers(memberData.group_id)
    
    const today = new Date()
    const nextSat = new Date(today)
    nextSat.setDate(today.getDate() + (6 - today.getDay() + 7) % 7 || 7)
    setDate(nextSat.toISOString().split('T')[0])
  }, [router])
  
  const loadMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('name')
    
    setMembers(data || [])
  }
  
  const togglePlayer = (memberId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }
  
  const assignToTeam = (playerId: string, teamId: string) => {
    setTeams(prev => prev.map(team => ({
      ...team,
      players: team.id === teamId
        ? [...team.players.filter(p => p !== playerId), playerId]
        : team.players.filter(p => p !== playerId)
    })))
  }
  
  const removeFromTeam = (playerId: string) => {
    setTeams(prev => prev.map(team => ({
      ...team,
      players: team.players.filter(p => p !== playerId),
      captainId: team.captainId === playerId ? null : team.captainId
    })))
  }
  
  const toggleCaptain = (teamId: string, playerId: string) => {
    setTeams(prev => prev.map(team => ({
      ...team,
      captainId: team.id === teamId
        ? (team.captainId === playerId ? null : playerId)
        : team.captainId
    })))
  }
  
  const updateTeamName = (teamId: string, name: string) => {
    setTeams(prev => prev.map(team =>
      team.id === teamId ? { ...team, name } : team
    ))
  }
  
  const updateTeamColor = (teamId: string, color: TeamColor) => {
    setTeams(prev => prev.map(team =>
      team.id === teamId ? { ...team, color } : team
    ))
  }
  
  const unassignedPlayers = selectedPlayers.filter(
    playerId => !teams.some(team => team.players.includes(playerId))
  )
  
  const handleCreateSession = async () => {
    if (!member?.group_id) return
    
    setLoading(true)
    
    try {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          group_id: member.group_id,
          host_id: hostId,
          created_by: member.id,
          date: `${date}T${time}:00`,
          location,
          status: 'upcoming',
        } as any)
        .select()
        .single()
      
      if (sessionError) throw sessionError
      
      for (const team of teams) {
        if (team.players.length === 0) continue
        
        const { data: teamData, error: teamError } = await supabase
          .from('session_teams')
          .insert({
            session_id: session.id,
            name: team.name,
            color: team.color,
            captain_id: team.captainId,
          } as any)
          .select()
          .single()
        
        if (teamError) throw teamError
        
        const playerInserts = team.players.map(playerId => ({
          session_team_id: teamData.id,
          group_member_id: playerId,
        }))
        
        await supabase.from('session_team_players').insert(playerInserts as any)
      }
      
      router.push('/sessions')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }
  
  const getMember = (id: string) => members.find(m => m.id === id)
  const isAdmin = member?.role === 'admin'
  
  return (
    <div className="min-h-screen bg-[#0f1219] safe-top pb-24">
      <div className="bg-[#1a1f2e] border-b border-[#2a3142]">
        <div className="flex items-center gap-4 p-4">
          <Link href="/sessions" className="p-2 -ml-2 rounded-full hover:bg-[#252c3d] transition-colors">
            <ArrowLeft size={24} className="text-[#6b7280]" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">New Session</h1>
            <p className="text-sm text-[#6b7280]">Step {step} of 4</p>
          </div>
        </div>
        
        <div className="flex gap-1 px-4 pb-4">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${s <= step ? 'bg-[#ff6b35]' : 'bg-[#2a3142]'}`}
            />
          ))}
        </div>
      </div>
      
      <div className="p-4">
        {/* Step 1: Details */}
        {step === 1 && (
          <Card>
            <CardTitle>Session Details</CardTitle>
            <div className="space-y-4 mt-4">
              <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <Input label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              <Input label="Location" placeholder="e.g. Sports Hall" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
          </Card>
        )}
        
        {/* Step 2: Select Host */}
        {step === 2 && (
          <Card>
            <CardTitle>Who&apos;s Hosting?</CardTitle>
            <p className="text-sm text-[#6b7280] mb-4">The host is who paid/booked the court</p>
            
            <div className="space-y-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setHostId(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    hostId === m.id
                      ? 'bg-blue-500/10 ring-2 ring-blue-500'
                      : 'bg-[#252c3d] hover:bg-[#2d3548]'
                  }`}
                >
                  <Avatar src={m.avatar_url} name={m.name} size="md" />
                  <span className="flex-1 text-left font-medium text-white">{m.name}</span>
                  {hostId === m.id && <span className="text-blue-400">🎫 Host</span>}
                </button>
              ))}
            </div>
          </Card>
        )}
        
        {/* Step 3: Select Players */}
        {step === 3 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Select Players</CardTitle>
              <span className="text-sm text-[#6b7280]">{selectedPlayers.length} selected</span>
            </div>
            
            <div className="space-y-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => togglePlayer(m.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                    selectedPlayers.includes(m.id)
                      ? 'bg-[#ff6b35]/10 ring-2 ring-[#ff6b35]'
                      : 'bg-[#252c3d] hover:bg-[#2d3548]'
                  }`}
                >
                  <Avatar src={m.avatar_url} name={m.name} size="md" />
                  <span className="flex-1 text-left font-medium text-white">{m.name}</span>
                  {m.id === hostId && <span className="text-xs text-blue-400">🎫</span>}
                  {selectedPlayers.includes(m.id) && <Check size={20} className="text-[#ff6b35]" />}
                </button>
              ))}
            </div>
          </Card>
        )}
        
        {/* Step 4: Assign Teams */}
        {step === 4 && (
          <div className="space-y-4">
            {unassignedPlayers.length > 0 && (
              <Card>
                <CardTitle>Unassigned ({unassignedPlayers.length})</CardTitle>
                <div className="flex flex-wrap gap-2 mt-3">
                  {unassignedPlayers.map(playerId => {
                    const m = getMember(playerId)
                    return (
                      <div key={playerId} className="flex items-center gap-2 bg-[#252c3d] rounded-full pl-1 pr-3 py-1">
                        <Avatar src={m?.avatar_url} name={m?.name || ''} size="sm" />
                        <span className="text-sm text-[#a1a7b4]">{m?.name?.split(' ')[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
            
            {teams.map((team) => (
              <Card key={team.id}>
                <div className="flex items-center gap-2 mb-3">
                  {TEAM_COLORS.slice(0, 6).map(c => (
                    <button
                      key={c.value}
                      onClick={() => updateTeamColor(team.id, c.value)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        team.color === c.value ? 'scale-125 ring-2 ring-offset-2 ring-offset-[#1e2433] ring-[#6b7280]' : ''
                      }`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                
                <Input
                  value={team.name}
                  onChange={(e) => updateTeamName(team.id, e.target.value)}
                  className="mb-3 font-semibold"
                />
                
                <div className="space-y-2">
                  {team.players.map(playerId => {
                    const m = getMember(playerId)
                    return (
                      <div key={playerId} className="flex items-center gap-2 bg-[#252c3d] rounded-xl p-2">
                        <Avatar src={m?.avatar_url} name={m?.name || ''} size="sm" />
                        <span className="flex-1 text-sm font-medium text-white">{m?.name}</span>
                        {playerId === hostId && <span className="text-xs text-blue-400">🎫</span>}
                        <button
                          onClick={() => toggleCaptain(team.id, playerId)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            team.captainId === playerId
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'text-[#6b7280] hover:text-yellow-400 hover:bg-yellow-500/10'
                          }`}
                        >
                          👑
                        </button>
                        <button
                          onClick={() => removeFromTeam(playerId)}
                          className="p-1.5 text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )
                  })}
                </div>
                
                {unassignedPlayers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {unassignedPlayers.map(playerId => {
                      const m = getMember(playerId)
                      return (
                        <button
                          key={playerId}
                          onClick={() => assignToTeam(playerId, team.id)}
                          className="flex items-center gap-1 text-xs bg-[#252c3d] hover:bg-[#2d3548] rounded-full pl-1 pr-2 py-1 transition-colors"
                        >
                          <Avatar src={m?.avatar_url} name={m?.name || ''} size="sm" />
                          <span className="text-[#a1a7b4]">+ {m?.name?.split(' ')[0]}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1f2e] border-t border-[#2a3142] p-4 safe-bottom">
        <div className="flex gap-3 max-w-lg mx-auto">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
              Back
            </Button>
          )}
          
          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!date || !location)) ||
                (step === 3 && selectedPlayers.length < 2)
              }
              className="flex-1"
            >
              Continue
              <ArrowRight size={18} className="ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateSession}
              disabled={teams.some(t => t.players.length === 0)}
              loading={loading}
              className="flex-1"
            >
              Create Session
              <Check size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
