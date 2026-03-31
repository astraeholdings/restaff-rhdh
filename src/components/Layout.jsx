import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HomeSelector } from './HomeSelector'

const Icon = ({ name, className = '' }) => (
  <span className={`material-symbols-rounded ${className}`} style={{ fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}>
    {name}
  </span>
)

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin'

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
    { label: 'Clock In/Out', path: '/clockinout', icon: 'schedule' },
    { label: 'Daily Notes', path: '/daily-notes', icon: 'edit_note' },
    { label: 'MAR', path: '/mar', icon: 'medication' },
    { label: 'Menu', path: '/menu', icon: 'restaurant' },
    { label: 'Activities', path: '/activities', icon: 'directions_run' },
    { label: 'Cleaning', path: '/cleaning', icon: 'cleaning_services' },
    { label: 'NOC Cleaning', path: '/noc-cleaning', icon: 'dark_mode' },
    { label: 'Incidents', path: '/incidents', icon: 'warning' },
    { label: 'Clients', path: '/clients', icon: 'group' },
    { label: 'Grocery', path: '/grocery', icon: 'shopping_cart' },
    { label: 'Logs', path: '/logs', icon: 'terminal' },
  ]

  const adminItems = isAdmin ? [
    { label: 'Admin', path: '/admin', icon: 'admin_panel_settings' },
  ] : []

  const allItems = [...navItems, ...adminItems]
  const mobileItems = allItems.slice(0, 5)

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const isActive = (path) => location.pathname === path

  const initials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || '?'

  return (
    <div className="flex h-screen" style={{ background: 'var(--surface)' }}>
      {/* ── Desktop Sidebar ── */}
      <div className="hidden md:flex flex-col sidebar">
        {/* Brand */}
        <div className="px-6 pt-7 pb-5">
          <h1 className="text-xl font-serif font-bold text-white tracking-tight">Rising Hill</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Staff Portal</p>
        </div>

        {/* Home Selector */}
        <div className="px-4 mb-4">
          <HomeSelector variant="sidebar" />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {allItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
                color: 'var(--primary-900)',
              }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.full_name}</p>
              <p className="text-xs capitalize" style={{ color: 'rgba(255,255,255,0.4)' }}>{profile?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            <Icon name="logout" />
            Sign Out
          </button>
        </div>
      </div>

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ── */}
      <div
        className={`fixed top-0 left-0 h-screen w-64 sidebar transform transition-transform duration-300 z-50 md:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6">
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ color: 'rgba(255,255,255,0.6)' }}
          >
            <Icon name="close" />
          </button>
          <h1 className="text-xl font-serif font-bold text-white tracking-tight">Rising Hill</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Staff Portal</p>
        </div>

        <nav className="px-3 space-y-0.5">
          {allItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col pb-16 md:pb-0 min-w-0">
        {/* Top Header */}
        <header
          className="glass px-4 md:px-8 py-4 flex items-center justify-between z-10"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Icon name="menu" />
            </button>
            <div className="hidden md:block">
              <h2 className="text-lg font-serif font-bold" style={{ color: 'var(--text-primary)' }}>
                Rising Hill Developmental Homes
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="md:hidden">
              <HomeSelector />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          {children}
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="fixed bottom-0 left-0 right-0 mobile-nav md:hidden z-40">
        <div className="flex">
          {mobileItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Icon name={item.icon} />
              <span className="text-[10px] mt-0.5">{item.label.split(' ')[0]}</span>
            </Link>
          ))}
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-nav-item"
          >
            <Icon name="more_horiz" />
            <span className="text-[10px] mt-0.5">More</span>
          </button>
        </div>
      </div>
    </div>
  )
}
