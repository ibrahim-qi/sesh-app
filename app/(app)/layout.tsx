'use client'

import { BottomNav } from '@/components/navigation/bottom-nav'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const member = localStorage.getItem('hoops_member')
    if (!member) {
      router.push('/')
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f1219] flex items-center justify-center safe-top">
        <div className="animate-spin w-8 h-8 border-4 border-[#ff6b35] border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1f2e] to-[#0f1219] pb-nav relative overflow-hidden">
      {/* Decorative elements - Global Aesthetic */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[50%] bg-[#ff6b35]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[50%] bg-[#ff6b35]/5 rounded-full blur-[120px]" />
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#2a3142 1px, transparent 1px), linear-gradient(90deg, #2a3142 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <div className="page-transition relative z-10">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
