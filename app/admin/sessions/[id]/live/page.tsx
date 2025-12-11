'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function AdminLiveSessionRedirect() {
  const router = useRouter()
  const params = useParams()
  
  useEffect(() => {
    router.replace(`/sessions/${params.id}/live`)
  }, [router, params.id])
  
  return null
}
