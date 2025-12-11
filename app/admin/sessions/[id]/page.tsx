'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminSessionRedirect() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    router.replace(`/sessions/${params.id}`)
  }, [router, params.id])
  
  return null
}
