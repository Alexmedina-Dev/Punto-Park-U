import React from 'react'
import { Header } from './Header'
import { Footer } from './Footer'
import { MobileNav } from './MobileNav'

export interface LayoutProps {
  children: React.ReactNode
  /** Remove top padding so hero sections sit behind the fixed header */
  noHeaderPadding?: boolean
}

export function Layout({ children, noHeaderPadding = false }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <MobileNav />
      <main className={`flex-1 ${noHeaderPadding ? '' : 'pt-16'}`}>
        {children}
      </main>
      <Footer />
    </div>
  )
}
