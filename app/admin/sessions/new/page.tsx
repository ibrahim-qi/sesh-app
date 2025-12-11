'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminNewSessionRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/sessions/new')
  }, [router])
  
  return null
}
