'use client'

import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative w-full sm:max-w-md bg-[#1a1f2e] border border-[#2a3142] rounded-t-3xl sm:rounded-2xl p-6 pb-8 max-h-[85vh] overflow-y-auto',
          'animate-in slide-in-from-bottom duration-300 sm:zoom-in-95',
          'mb-[calc(60px+env(safe-area-inset-bottom))] sm:mb-0',
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-[#6b7280] hover:text-white rounded-full hover:bg-[#252c3d] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        {children}
      </div>
    </div>
  )
}
