'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import { generateInviteCode } from '@/lib/utils'

export default function AdminSetupPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)
  const [squadName, setSquadName] = useState('')
  const [adminName, setAdminName] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }
  
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!squadName.trim() || !adminName.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: squadName.trim(),
          invite_code: generateInviteCode(),
        })
        .select()
        .single()
      
      if (groupError) throw groupError
      
      // Upload avatar if exists
      let finalAvatarUrl = null
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${group.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, {
            cacheControl: '3600',
            upsert: true,
          })
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName)
          finalAvatarUrl = urlData.publicUrl
        }
      }
      
      // Create admin member
      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          name: adminName.trim(),
          avatar_url: finalAvatarUrl,
          role: 'admin',
        })
        .select()
        .single()
      
      if (memberError) throw memberError
      
      // Save to session with group info
      localStorage.setItem('hoops_member', JSON.stringify({ ...member, group_id: group.id }))
      router.push('/home')
    } catch (err: any) {
      setError(err.message || 'Failed to create squad')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-[#0f1219] safe-top">
      <div className="bg-[#1a1f2e] border-b border-[#2a3142]">
        <div className="flex items-center gap-4 p-4">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-[#252c3d] transition-colors">
            <ArrowLeft size={24} className="text-[#6b7280]" />
          </Link>
          <h1 className="text-lg font-semibold text-white">Create Squad</h1>
        </div>
      </div>
      
      <div className="p-6">
        {step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2) }} className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Name your squad</h2>
              <p className="text-sm text-[#6b7280] mb-4">This is what your group will be called</p>
              <Input
                placeholder="e.g. Sunday Ballers"
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                className="text-lg"
                autoFocus
              />
            </div>
            
            <Button type="submit" className="w-full" size="lg" disabled={!squadName.trim()}>
              Continue
            </Button>
          </form>
        )}
        
        {step === 2 && (
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-white mb-2">Your profile</h2>
              <p className="text-sm text-[#6b7280] mb-6">You&apos;ll be the admin of {squadName}</p>
              
              {/* Avatar Upload */}
              <div className="flex flex-col items-center mb-6">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group"
                >
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#ff6b35] to-[#ff5722] flex items-center justify-center overflow-hidden ring-4 ring-[#2a3142] shadow-xl">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={36} className="text-white" />
                    )}
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera size={28} className="text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#ff6b35] rounded-full flex items-center justify-center shadow-lg border-2 border-[#0f1219]">
                    <span className="text-white text-lg">+</span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <p className="text-sm text-[#6b7280] mt-3">Tap to add your photo</p>
              </div>
            </div>
            
            <Input
              label="Your full name"
              placeholder="e.g. Ahmed Khan"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
            
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>
            )}
            
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button type="submit" className="flex-1" size="lg" loading={loading} disabled={!adminName.trim()}>
                Create Squad
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
