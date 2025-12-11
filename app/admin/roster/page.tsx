'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Modal } from '@/components/ui/modal'
import { ArrowLeft, Plus, UserPlus, Trash2, Shield, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function RosterPage() {
  const router = useRouter()
  const [member, setMember] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any>(null)
  const [newPlayerName, setNewPlayerName] = useState('')
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    if (memberData.role !== 'admin') {
      router.push('/home')
      return
    }
    
    loadMembers(memberData.group_id)
  }, [router])
  
  const loadMembers = async (groupId: string) => {
    const { data } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('name')
    
    setMembers(data || [])
  }
  
  const handleAddPlayer = async () => {
    if (!newPlayerName.trim() || !member?.group_id) return
    
    setLoading(true)
    
    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: member.group_id,
        name: newPlayerName.trim(),
        role: 'player',
      } as any)
    
    if (!error) {
      await loadMembers(member.group_id)
      setNewPlayerName('')
      setAddModalOpen(false)
    }
    
    setLoading(false)
  }
  
  const handleDeletePlayer = async (memberId: string) => {
    if (!confirm('Remove this player from the roster?')) return
    
    await supabase
      .from('group_members')
      .delete()
      .eq('id', memberId)
    
    setMembers(members.filter(m => m.id !== memberId))
  }
  
  const handleChangeRole = async (newRole: string) => {
    if (!selectedMember) return
    
    await supabase
      .from('group_members')
      .update({ role: newRole } as any)
      .eq('id', selectedMember.id)
    
    setMembers(members.map(m => 
      m.id === selectedMember.id ? { ...m, role: newRole } : m
    ))
    
    setRoleModalOpen(false)
    setSelectedMember(null)
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full font-medium">👑 Admin</span>
      case 'host':
        return <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-medium">🎫 Host</span>
      case 'captain':
        return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">⚡ Captain</span>
      default:
        return <span className="text-xs bg-[#252c3d] text-[#6b7280] px-2 py-0.5 rounded-full font-medium">Player</span>
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
              <h1 className="text-lg font-semibold text-white">Roster</h1>
              <p className="text-sm text-[#6b7280]">{members.length} players</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setAddModalOpen(true)}>
            <Plus size={18} className="mr-1" />
            Add
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Hosts Section */}
        {members.filter(m => m.role === 'host').length > 0 && (
          <Card>
            <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              🎫 Hosts ({members.filter(m => m.role === 'host').length})
            </h3>
            <p className="text-xs text-[#6b7280] mb-3">Can create and manage sessions</p>
            <div className="space-y-2">
              {members.filter(m => m.role === 'host').map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#252c3d]">
                  <Avatar src={m.avatar_url} name={m.name} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{m.name}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedMember(m); setRoleModalOpen(true) }}
                    className="p-2 text-[#6b7280] hover:text-white hover:bg-[#2a3142] rounded-lg transition-colors"
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        {/* All Players */}
        {members.length > 0 ? (
          <Card>
            <h3 className="text-sm font-semibold text-[#6b7280] uppercase tracking-wide mb-3">
              All Players ({members.length})
            </h3>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#252c3d]">
                  <Avatar src={m.avatar_url} name={m.name} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-white">{m.name}</p>
                    {getRoleBadge(m.role)}
                  </div>
                  {m.role !== 'admin' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setSelectedMember(m); setRoleModalOpen(true) }}
                        className="p-2 text-[#6b7280] hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        title="Change role"
                      >
                        <Shield size={18} />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(m.id)}
                        className="p-2 text-[#6b7280] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <UserPlus size={48} className="mx-auto text-[#2a3142] mb-4" />
            <p className="text-[#6b7280] mb-4">No players in roster yet</p>
            <Button onClick={() => setAddModalOpen(true)}>
              <Plus size={18} className="mr-2" />
              Add First Player
            </Button>
          </Card>
        )}
      </div>
      
      {/* Add Player Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Player">
        <div className="space-y-4">
          <p className="text-sm text-[#6b7280]">
            Add a player by their full name. They can login using this name.
          </p>
          <Input
            label="Full Name"
            placeholder="e.g. Ahmed Khan"
            value={newPlayerName}
            onChange={(e) => setNewPlayerName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleAddPlayer} disabled={!newPlayerName.trim()} loading={loading}>Add Player</Button>
          </div>
        </div>
      </Modal>
      
      {/* Change Role Modal */}
      <Modal open={roleModalOpen} onClose={() => { setRoleModalOpen(false); setSelectedMember(null) }} title="Change Role">
        <div className="space-y-3">
          <p className="text-sm text-[#6b7280] mb-4">
            Select a role for <span className="font-medium text-white">{selectedMember?.name}</span>
          </p>
          
          <button
            onClick={() => handleChangeRole('host')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedMember?.role === 'host' ? 'border-blue-500 bg-blue-500/10' : 'border-[#2a3142] hover:border-[#363d4f] bg-[#1e2433]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎫</span>
              <div>
                <p className="font-semibold text-white">Host</p>
                <p className="text-sm text-[#6b7280]">Can create & manage sessions</p>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleChangeRole('player')}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedMember?.role === 'player' ? 'border-[#ff6b35] bg-[#ff6b35]/10' : 'border-[#2a3142] hover:border-[#363d4f] bg-[#1e2433]'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏀</span>
              <div>
                <p className="font-semibold text-white">Player</p>
                <p className="text-sm text-[#6b7280]">View only - see teams & stats</p>
              </div>
            </div>
          </button>
          
          <Button variant="secondary" className="w-full mt-4" onClick={() => { setRoleModalOpen(false); setSelectedMember(null) }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
