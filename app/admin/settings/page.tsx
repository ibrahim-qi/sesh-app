'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'

export default function AdminSettingsPage() {
  const router = useRouter()
  const [member, setMember] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [groupName, setGroupName] = useState('')
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  
  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    
    if (memberData.role !== 'admin') {
      router.push('/home')
      return
    }
    
    loadGroup(memberData.group_id)
  }, [router])
  
  const loadGroup = async (groupId: string) => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single()
    
    setGroup(data)
    setGroupName(data?.name || '')
  }
  
  const copyInviteLink = async () => {
    if (!group) return
    const link = `${window.location.origin}/join/${group.invite_code}`
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleSaveGroupName = async () => {
    if (!group || !groupName.trim()) return
    
    setSaving(true)
    
    await supabase
      .from('groups')
      .update({ name: groupName.trim() })
      .eq('id', group.id)
    
    setGroup({ ...group, name: groupName.trim() })
    setSaving(false)
  }
  
  const handleLogout = () => {
    localStorage.removeItem('hoops_member')
    router.push('/')
  }
  
  return (
    <div className="min-h-screen bg-dark-50 safe-top">
      <div className="bg-white border-b border-dark-100">
        <div className="flex items-center gap-4 p-4">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-dark-100 transition-colors">
            <ArrowLeft size={24} className="text-dark-600" />
          </Link>
          <h1 className="text-lg font-semibold text-dark-900">Settings</h1>
        </div>
      </div>
      
      <div className="p-4 space-y-4">
        <Card>
          <CardTitle>Squad Name</CardTitle>
          <div className="mt-3 flex gap-2">
            <Input
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Squad name"
            />
            <Button onClick={handleSaveGroupName} disabled={!groupName.trim()} loading={saving}>
              Save
            </Button>
          </div>
        </Card>
        
        <Card>
          <CardTitle>Invite Link</CardTitle>
          <p className="text-sm text-dark-500 mt-2 mb-3">
            Share this link for players to join your squad
          </p>
          <Button onClick={copyInviteLink} variant="secondary" className="w-full">
            {copied ? <><Check size={18} className="mr-2" />Copied!</> : <><Copy size={18} className="mr-2" />Copy Invite Link</>}
          </Button>
          <p className="text-xs text-dark-400 mt-2 text-center">
            Code: <span className="font-mono font-bold">{group?.invite_code}</span>
          </p>
        </Card>
        
        <Card>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            Log Out
          </button>
        </Card>
      </div>
    </div>
  )
}
