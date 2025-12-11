'use client'

import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type, ...props }, ref) => {
    const isDateOrTime = type === 'date' || type === 'time'
    
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[#a1a7b4] mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'w-full px-4 py-3 bg-[#1e2433] border border-[#2a3142] rounded-xl text-white placeholder:text-[#6b7280]',
            'focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent',
            'transition-all duration-200',
            // Date/time specific styling
            isDateOrTime && [
              'appearance-none',
              '[color-scheme:dark]',
              '[&::-webkit-calendar-picker-indicator]:opacity-60',
              '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
              '[&::-webkit-calendar-picker-indicator]:filter',
              '[&::-webkit-calendar-picker-indicator]:invert',
            ],
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
