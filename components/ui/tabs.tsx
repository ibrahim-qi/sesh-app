'use client'

import { cn } from '@/lib/utils'
import { createContext, useContext, useState } from 'react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-1 p-1 bg-[#1e2433] border border-[#2a3142] rounded-xl', className)}>
      {children}
    </div>
  )
}

interface TabProps {
  value: string
  children: React.ReactNode
}

export function Tab({ value, children }: TabProps) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')
  
  const isActive = context.activeTab === value
  
  return (
    <button
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
        isActive 
          ? 'bg-[#ff6b35] text-white' 
          : 'text-[#6b7280] hover:text-[#a1a7b4]'
      )}
    >
      {children}
    </button>
  )
}

export function TabContent({ value, children }: { value: string; children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabContent must be used within Tabs')
  
  if (context.activeTab !== value) return null
  
  return <div className="mt-4">{children}</div>
}
