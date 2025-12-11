'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const inviteCode = params.code as string
  
  const [group, setGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  
  useEffect(() => {
    loadGroup()
  }, [inviteCode])
  
  const loadGroup = async () => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()
    
    setGroup(data)
    setLoading(false)
  }
  
  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !group) return
    
    setJoining(true)
    setError('')
    
    // Check if name already exists
    const { data: existing } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', group.id)
      .ilike('name', name.trim())
      .single()
    
    if (existing) {
      // Name exists - log them in
      localStorage.setItem('hoops_member', JSON.stringify(existing))
      router.push('/home')
      return
    }
    
    setError('No player with that name. Ask your admin to add you first.')
    setJoining(false)
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1219] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full" />
      </div>
    )
  }
  
  if (!group) {
    return (
      <div className="min-h-screen bg-[#0f1219] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
          <span className="text-3xl">❌</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Invalid Invite</h1>
        <p className="text-[#6b7280] mb-6">This invite link is invalid or has expired.</p>
        <Link href="/"><Button>Go Home</Button></Link>
      </div>
    )
  }
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a1f2e] to-[#0f1219] flex flex-col overflow-hidden">
      {/* Safe area top */}
      <div className="pt-[env(safe-area-inset-top)]" />
      
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-[#6b7280] text-sm uppercase tracking-wide mb-2">Join</p>
        <h1 className="text-3xl font-bold text-white mb-2">{group.name}</h1>
        <p className="text-[#6b7280]">Enter your name to continue</p>
      </div>
      
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4">
        <form onSubmit={handleJoin} className="space-y-3 max-w-sm mx-auto">
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-14 px-5 bg-[#1e2433] border border-[#2a3142] rounded-2xl text-white placeholder-[#6b7280] text-center text-lg focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-colors"
            autoFocus
          />
          
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          
          <button
            type="submit"
            disabled={joining || !name.trim()}
            className="w-full h-14 bg-[#ff6b35] hover:bg-[#ff5722] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-lg transition-colors active:scale-[0.98]"
          >
            {joining ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Joining...
              </span>
            ) : (
              "Join Squad"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
