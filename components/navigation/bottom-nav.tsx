'use client'

import { cn } from '@/lib/utils'
import { Home, BarChart3, Trophy, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/leaderboard', icon: Trophy, label: 'Board' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const pathname = usePathname()
  
  const handleClick = () => {
    // Haptic feedback on iOS
    if (navigator.vibrate) {
      navigator.vibrate(10)
    }
  }
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-[#1a1f2e]/80 backdrop-blur-xl border-t border-[#2a3142]/50" />
      
      {/* Safe area padding handled via CSS */}
      <div className="relative pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[56px] max-w-lg mx-auto px-2">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            
            return (
              <Link
                key={href}
                href={href}
                onClick={handleClick}
                className={cn(
                  // Touch target: minimum 44x44px for iOS
                  'flex flex-col items-center justify-center min-w-[64px] min-h-[44px] py-1 rounded-xl',
                  'transition-all duration-200 active:scale-95',
                  isActive 
                    ? 'text-[#ff6b35]' 
                    : 'text-[#6b7280] active:text-[#a1a7b4]'
                )}
              >
                <div className={cn(
                  'relative flex items-center justify-center w-7 h-7',
                  isActive && 'after:absolute after:inset-0 after:bg-[#ff6b35]/20 after:rounded-full after:blur-lg'
                )}>
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10" />
                </div>
                <span className={cn(
                  'text-[10px] mt-0.5 tracking-wide',
                  isActive ? 'font-semibold' : 'font-medium'
                )}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
