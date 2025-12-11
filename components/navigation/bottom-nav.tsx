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
      <div className="absolute inset-0 bg-[#1a1f2e]/90 backdrop-blur-2xl border-t border-[#2a3142]/30" />
      
      {/* Safe area padding handled via CSS */}
      <div className="relative pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-[60px] max-w-lg mx-auto px-4">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = pathname.startsWith(href)
            
            return (
              <Link
                key={href}
                href={href}
                onClick={handleClick}
                prefetch={true}
                className={cn(
                  // Touch target: minimum 44x44px for iOS
                  'flex flex-col items-center justify-center min-w-[60px] min-h-[44px] py-1.5 rounded-2xl',
                  'transition-all duration-300 ease-out',
                  'active:scale-90 active:opacity-70',
                  isActive 
                    ? 'text-[#ff6b35]' 
                    : 'text-[#6b7280]'
                )}
              >
                <div className={cn(
                  'relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300',
                  isActive && 'bg-[#ff6b35]/15'
                )}>
                  <Icon 
                    size={22} 
                    strokeWidth={isActive ? 2.5 : 1.8} 
                    className={cn(
                      'relative z-10 transition-transform duration-300',
                      isActive && 'scale-110'
                    )} 
                  />
                  {isActive && (
                    <div className="absolute inset-0 bg-[#ff6b35]/20 rounded-xl blur-md animate-pulse" />
                  )}
                </div>
                <span className={cn(
                  'text-[10px] mt-0.5 tracking-wide transition-all duration-300',
                  isActive ? 'font-bold opacity-100' : 'font-medium opacity-70'
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
