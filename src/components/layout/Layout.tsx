import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'

export interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileNav />
      <main className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}
