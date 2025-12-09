"use client"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'

export default function Page() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuthStore()

  useEffect(() => {
    if (loading) return
    
    if (!isAuthenticated) {
      router.replace('/login')
      return
    }

    router.replace('/documents')
  }, [isAuthenticated, loading, router])

  return null
}