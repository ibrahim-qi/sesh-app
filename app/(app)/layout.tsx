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
    <div className="min-h-screen bg-[#0f1219] pb-nav">
      <div className="page-transition">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
