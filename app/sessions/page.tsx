'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { ArrowLeft, Plus, Calendar, Play } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatTime } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'

export default function SessionsPage() {
  const router = useRouter()
  const [member, setMember] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])

  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)

    // Only admin and hosts can access this page
    if (memberData.role !== 'admin' && memberData.role !== 'host') {
      router.push('/home')
      return
    }

    loadSessions(memberData.group_id)
  }, [router])

  const loadSessions = async (groupId: string) => {
    const { data } = await supabase
      .from('sessions')
      .select(`
        *,
        host:group_members!sessions_host_id_fkey(id, name, avatar_url)
      `)
      .eq('group_id', groupId)
      .order('date', { ascending: false })

    setSessions(data || [])
  }

  const canEditSession = (session: any) => {
    if (member?.role === 'admin') return true
    if (session.host_id === member?.id) return true
    if (session.created_by === member?.id) return true
    return false
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'live':
        return <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">🔴 Live</span>
      case 'upcoming':
        return <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />Upcoming</span>
      case 'completed':
        return <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">✓ Completed</span>
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-[#0f1219] safe-top">
      <div className="bg-[#1a1f2e] border-b border-[#2a3142]">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-[#252c3d] transition-colors">
              <ArrowLeft size={24} className="text-[#6b7280]" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-white">Sessions</h1>
              <p className="text-sm text-[#6b7280]">{sessions.length} sessions</p>
            </div>
          </div>
          <Link href="/sessions/new">
            <Button size="sm">
              <Plus size={18} className="mr-1" />
              New
            </Button>
          </Link>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {sessions.map((session) => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <Card hover className="mb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">{getStatusBadge(session.status)}</div>
                  <p className="font-semibold text-white">{formatDate(session.date)}</p>
                  <p className="text-sm text-[#6b7280]">{formatTime(session.date)} • {session.location}</p>

                  {/* Host info */}
                  {session.host && (
                    <div className="flex items-center gap-2 mt-2">
                      <Avatar src={session.host_id ? 'https://github.com/shadcn.png' : undefined} name="Host" size="sm" />
                      <span className="text-xs text-[#6b7280]">
                        <span className="w-4 h-4 bg-blue-500/30 rounded flex items-center justify-center text-[8px] font-bold text-blue-400">H</span>
                        {session.host.name}
                      </span>
                    </div>
                  )}
                </div>
                {session.status === 'live' && canEditSession(session) && (
                  <Button size="sm"><Play size={16} className="mr-1" />Score</Button>
                )}
                {session.status === 'upcoming' && canEditSession(session) && (
                  <Button size="sm" variant="secondary">Edit</Button>
                )}
              </div>
            </Card>
          </Link>
        ))}

        {sessions.length === 0 && (
          <Card className="text-center py-12">
            <Calendar size={48} className="mx-auto text-[#2a3142] mb-4" />
            <p className="text-[#6b7280] mb-4">No sessions yet</p>
            <Link href="/sessions/new">
              <Button><Plus size={18} className="mr-2" />Create First Session</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  )
}
