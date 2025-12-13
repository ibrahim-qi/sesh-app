'use client'

import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  gradient?: boolean
}

export function Card({ className, hover, gradient, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl p-4 border border-[#2a3142] relative overflow-hidden',
        'bg-[#1e2433]/60 backdrop-blur-md shadow-lg',
        hover && 'transition-all duration-200 hover:bg-[#252c3d]/70 hover:border-[#363d4f] hover:shadow-xl cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-3', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-xs font-semibold text-[#6b7280] uppercase tracking-wider', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
