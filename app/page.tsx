'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function LandingPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showAdminCode, setShowAdminCode] = useState(false)
  const [adminCode, setAdminCode] = useState('')
  const [tapCount, setTapCount] = useState(0)
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    
    setLoading(true)
    setError('')
    
    try {
      const { data: member, error: memberError } = await supabase
        .from('group_members')
        .select('*, groups(*)')
        .ilike('name', name.trim())
        .single()
      
      if (memberError || !member) {
        setError('No player found with that name. Ask your admin to add you.')
        setLoading(false)
        return
      }
      
      localStorage.setItem('hoops_member', JSON.stringify(member))
      router.push('/home')
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  const handleTitleTap = () => {
    const newCount = tapCount + 1
    setTapCount(newCount)
    if (newCount >= 5) {
      setShowAdminCode(true)
      setTapCount(0)
    }
  }
  
  const handleAdminAccess = () => {
    if (adminCode.toLowerCase() === 'newsesh') {
      router.push('/admin/setup')
    } else {
      setError('Invalid admin code')
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f2e] to-[#0f1219] flex flex-col relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#ff6b35]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-[#ff6b35]/3 rounded-full blur-3xl" />
      
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 relative">
        <button 
          onClick={handleTitleTap}
          className="focus:outline-none select-none group"
        >
          {/* Animated glow ring */}
          <div className="absolute inset-0 -m-8 bg-[#ff6b35]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <h1 className="text-7xl font-bold tracking-tight relative">
            <span className="gradient-text">Sesh</span>
          </h1>
        </button>
        
        <p className="text-[#6b7280] text-lg mt-4 tracking-wide">
          Track your sessions. Know your stats.
        </p>
        
        {/* Decorative basketball lines */}
        <div className="mt-8 flex items-center gap-3 text-[#2a3142]">
          <div className="w-8 h-[2px] bg-current rounded-full" />
          <span className="text-2xl">🏀</span>
          <div className="w-8 h-[2px] bg-current rounded-full" />
        </div>
      </div>
      
      {/* Login Form */}
      <div className="px-6 pb-12 pt-8 relative">
        {!showAdminCode ? (
          <form onSubmit={handleLogin} className="space-y-4 max-w-sm mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-14 px-5 bg-[#1e2433]/80 backdrop-blur-sm border border-[#2a3142] rounded-2xl text-white placeholder-[#4b5563] text-center text-lg focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all duration-200"
                autoFocus
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-400 text-center animate-slide-up">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full h-14 bg-gradient-to-r from-[#ff6b35] to-[#ff5722] hover:from-[#ff5722] hover:to-[#e64a19] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-lg transition-all duration-200 shadow-glow-sm hover:shadow-glow"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </span>
              ) : (
                "Let's Go"
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 max-w-sm mx-auto animate-slide-up">
            <p className="text-[#6b7280] text-center text-sm mb-2">🔐 Admin Access</p>
            <input
              type="text"
              placeholder="Enter admin code"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              className="w-full h-14 px-5 bg-[#1e2433]/80 backdrop-blur-sm border border-[#2a3142] rounded-2xl text-white placeholder-[#4b5563] text-center text-lg focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all duration-200 font-mono tracking-widest"
              autoFocus
            />
            
            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAdminCode(false); setAdminCode(''); setError('') }}
                className="flex-1 h-14 bg-[#1e2433] border border-[#2a3142] rounded-2xl text-[#6b7280] font-semibold transition-colors hover:bg-[#252c3d]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAccess}
                className="flex-1 h-14 bg-gradient-to-r from-[#ff6b35] to-[#ff5722] rounded-2xl text-white font-semibold transition-all duration-200 shadow-glow-sm hover:shadow-glow"
              >
                Enter
              </button>
            </div>
          </div>
        )}
        
        {/* Safe area spacer */}
        <div className="h-4" />
      </div>
    </div>
  )
}
