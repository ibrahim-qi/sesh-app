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
    <div className="fixed inset-0 bg-gradient-to-b from-[#1a1f2e] to-[#0f1219] flex flex-col overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#ff6b35]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-40 right-0 w-96 h-96 bg-[#ff6b35]/3 rounded-full blur-3xl pointer-events-none" />
      
      {/* Safe area top spacer */}
      <div className="pt-[env(safe-area-inset-top)]" />
      
      {/* Hero - centered content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
        <button 
          onClick={handleTitleTap}
          className="focus:outline-none select-none group"
        >
          {/* Animated glow ring */}
          <div className="absolute inset-0 -m-8 bg-[#ff6b35]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <h1 className="text-6xl sm:text-7xl font-bold tracking-tight relative">
            <span className="gradient-text">Sesh</span>
          </h1>
        </button>
        
        <p className="text-[#6b7280] text-base sm:text-lg mt-3 tracking-wide text-center">
          Track your sessions. Know your stats.
        </p>
        
        {/* Animated basketball divider */}
        <div className="mt-8 flex items-center gap-4">
          <div className="w-12 h-[1px] bg-gradient-to-r from-transparent to-[#2a3142]" />
          
          {/* Custom dark basketball design */}
          <div className="relative w-11 h-11 animate-float">
            {/* Dark ball with subtle border */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#252c3d] to-[#1a1f2e] border border-[#363d4f]" 
                 style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              {/* Basketball seam lines in accent color */}
              <svg viewBox="0 0 44 44" className="w-full h-full">
                {/* Horizontal seam */}
                <path d="M5 22 Q22 20, 39 22" stroke="#ff6b35" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                {/* Vertical seam */}
                <path d="M22 5 Q20 22, 22 39" stroke="#ff6b35" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />
                {/* Left curve */}
                <path d="M10 10 Q14 22, 10 34" stroke="#ff6b35" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
                {/* Right curve */}
                <path d="M34 10 Q30 22, 34 34" stroke="#ff6b35" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.3" />
              </svg>
            </div>
            {/* Subtle top highlight */}
            <div className="absolute top-1.5 left-3 w-3 h-1.5 bg-white/5 rounded-full blur-[1px]" />
          </div>
          
          <div className="w-12 h-[1px] bg-gradient-to-l from-transparent to-[#2a3142]" />
        </div>
      </div>
      
      {/* Login Form - fixed at bottom */}
      <div className="px-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] pt-4 relative">
        {!showAdminCode ? (
          <form onSubmit={handleLogin} className="space-y-3 max-w-sm mx-auto">
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-14 px-5 bg-[#1e2433]/80 backdrop-blur-sm border border-[#2a3142] rounded-2xl text-white placeholder-[#4b5563] text-center text-lg focus:outline-none focus:border-[#ff6b35] focus:ring-1 focus:ring-[#ff6b35] transition-all duration-200"
              autoFocus
            />
            
            {error && (
              <p className="text-sm text-red-400 text-center animate-slide-up">{error}</p>
            )}
            
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full h-14 bg-gradient-to-r from-[#ff6b35] to-[#ff5722] hover:from-[#ff5722] hover:to-[#e64a19] disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl text-white font-semibold text-lg transition-all duration-200 shadow-glow-sm hover:shadow-glow active:scale-[0.98]"
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
          <div className="space-y-3 max-w-sm mx-auto animate-slide-up">
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
                className="flex-1 h-14 bg-[#1e2433] border border-[#2a3142] rounded-2xl text-[#6b7280] font-semibold transition-colors hover:bg-[#252c3d] active:scale-[0.98]"
              >
                Cancel
              </button>
              <button
                onClick={handleAdminAccess}
                className="flex-1 h-14 bg-gradient-to-r from-[#ff6b35] to-[#ff5722] rounded-2xl text-white font-semibold transition-all duration-200 shadow-glow-sm hover:shadow-glow active:scale-[0.98]"
              >
                Enter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
