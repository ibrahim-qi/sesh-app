'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Camera, LogOut, Edit2, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

export default function ProfilePage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [member, setMember] = useState<any>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    const memberData = JSON.parse(localStorage.getItem('hoops_member') || '{}')
    setMember(memberData)
    setEditName(memberData.name || '')
    setAvatarPreview(memberData.avatar_url)
  }, [])
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  const handleSaveProfile = async () => {
    if (!member || !editName.trim()) return
    
    setLoading(true)
    
    let finalAvatarUrl = member.avatar_url
    
    // Upload new avatar if selected
    if (avatarFile) {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${member.group_id}/${member.id}_${Date.now()}.${fileExt}`
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile, {
          cacheControl: '3600',
          upsert: true,
        })
      
      if (uploadError) {
        console.error('Avatar upload error:', uploadError)
        alert(`Failed to upload avatar: ${uploadError.message}`)
        setLoading(false)
        return
      }
      
      if (uploadData) {
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        finalAvatarUrl = urlData.publicUrl
      }
    }
    
    // Update member
    const { data: updated, error: updateError } = await supabase
      .from('group_members')
      .update({
        name: editName.trim(),
        avatar_url: finalAvatarUrl,
      } as any)
      .eq('id', member.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Profile update error:', updateError)
      alert(`Failed to update profile: ${updateError.message}`)
      setLoading(false)
      return
    }
    
    if (updated) {
      const newMember = { ...updated, group_id: member.group_id }
      localStorage.setItem('hoops_member', JSON.stringify(newMember))
      setMember(newMember)
      setAvatarPreview(finalAvatarUrl)
      setAvatarFile(null)
    }
    
    setLoading(false)
    setEditModalOpen(false)
  }
  
  const handleLogout = () => {
    localStorage.removeItem('hoops_member')
    router.push('/')
  }
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }
  
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return { emoji: '👑', label: 'Admin', color: 'text-purple-400' }
      case 'host':
        return { emoji: '🎫', label: 'Host', color: 'text-blue-400' }
      case 'captain':
        return { emoji: '⚡', label: 'Captain', color: 'text-yellow-400' }
      default:
        return { emoji: '🏀', label: 'Player', color: 'text-[#6b7280]' }
    }
  }
  
  const role = getRoleBadge(member?.role)
  
  return (
    <div className="min-h-screen">
      {/* iOS-style Header */}
      <header className="header-ios">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-white text-center">Profile</h1>
        </div>
      </header>
      
      <div className="p-4 space-y-4">
        {/* Profile Card */}
        <Card gradient className="text-center py-8">
          <div className="relative inline-block mb-4">
            {/* Avatar */}
            <button 
              onClick={() => setEditModalOpen(true)}
              className="group relative"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff5722] flex items-center justify-center overflow-hidden ring-4 ring-[#2a3142] shadow-xl mx-auto">
                {member?.avatar_url ? (
                  <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {member?.name ? getInitials(member.name) : '?'}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-active:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={28} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-9 h-9 bg-[#ff6b35] rounded-full flex items-center justify-center text-white shadow-lg border-2 border-[#1e2433]">
                <Edit2 size={16} />
              </div>
            </button>
          </div>
          
          <h2 className="text-2xl font-bold text-white">{member?.name}</h2>
          <p className={`text-sm mt-1 ${role.color}`}>
            {role.emoji} {role.label}
          </p>
        </Card>
        
        {/* Settings List */}
        <Card className="p-0 overflow-hidden">
          <button
            onClick={() => setEditModalOpen(true)}
            className="w-full list-item border-b border-[#2a3142]"
          >
            <div className="w-9 h-9 bg-[#252c3d] rounded-xl flex items-center justify-center">
              <Edit2 size={18} className="text-[#6b7280]" />
            </div>
            <span className="flex-1 text-left text-white">Edit Profile</span>
            <ChevronRight size={20} className="text-[#363d4f]" />
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full list-item text-red-400"
          >
            <div className="w-9 h-9 bg-red-500/10 rounded-xl flex items-center justify-center">
              <LogOut size={18} className="text-red-400" />
            </div>
            <span className="flex-1 text-left">Log Out</span>
            <ChevronRight size={20} className="text-[#363d4f]" />
          </button>
        </Card>
        
        {/* App Info */}
        <div className="text-center pt-4">
          <p className="text-xs text-[#363d4f]">Sesh v1.0</p>
        </div>
      </div>
      
      <Modal open={editModalOpen} onClose={() => { setEditModalOpen(false); setAvatarFile(null); setAvatarPreview(member?.avatar_url) }} title="Edit Profile">
        <div className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff5722] flex items-center justify-center overflow-hidden ring-4 ring-[#2a3142] shadow-xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-white">
                    {member?.name ? getInitials(member.name) : '?'}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={28} className="text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#ff6b35] rounded-full flex items-center justify-center shadow-lg border-2 border-[#1a1f2e]">
                <Camera size={14} className="text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-sm text-[#6b7280] mt-3">Tap to change photo</p>
          </div>
          
          <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => { setEditModalOpen(false); setAvatarFile(null); setAvatarPreview(member?.avatar_url) }}>Cancel</Button>
            <Button className="flex-1" onClick={handleSaveProfile} loading={loading}>Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
