import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { HomeSelector } from './HomeSelector'

export function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isAdmin = profile?.role === 'admin'

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Clock In/Out', path: '/clockinout', icon: '🕐' },
    { label: 'Daily Notes', path: '/daily-notes', icon: '📝' },
    { label: 'MAR', path: '/mar', icon: '💊' },
    { label: 'Menu', path: '/menu', icon: '🍽️' },
    { label: 'Activities', path: '/activities', icon: '🎯' },
    { label: 'Cleaning', path: '/cleaning', icon: '🧹' },
    { label: 'NOC Cleaning', path: '/noc-cleaning', icon: '🌙' },
    { label: 'Incidents', path: '/incidents', icon: '⚠️' },
    { label: 'Clients', path: '/clients', icon: '👥' },
    { label: 'Grocery', path: '/grocery', icon: '🛒' },
    { label: 'Logs', path: '/logs', icon: '📋' },
  ]

  const adminItems = isAdmin ? [
    { label: 'Admin', path: '/admin', icon: '⚙️' },
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-6">
          <h1 className="text-2xl font-serif font-bold text-primary">Rising Hill</h1>
          <p className="text-sm text-gray-600">Staff Portal</p>
        </div>

        <div className="px-6 mb-6">
          <HomeSelector />
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {allItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded transition ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="text-sm text-gray-600 mb-3">
            <p className="font-medium">{profile?.full_name}</p>
            <p className="text-xs">{profile?.role}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full btn-secondary text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed top-0 left-0 h-screen w-64 bg-white transform transition-transform z-50 md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4">
            ✕
          </button>
          <h1 className="text-2xl font-serif font-bold text-primary">Rising Hill</h1>
          <p className="text-sm text-gray-600">Staff Portal</p>
        </div>

        <nav className="px-4 space-y-1">
          {allItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`block px-4 py-2 rounded transition ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col pb-20 md:pb-0">
        <div className="bg-white border-b border-gray-200 p-4 md:p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 hover:bg-gray-100 rounded"
            >
              ☰
            </button>
            <div className="hidden md:block">
              <h2 className="text-xl font-serif font-bold text-gray-900">Rising Hill Developmental Homes</h2>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <HomeSelector />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
        <div className="flex justify-around">
          {mobileItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 py-3 text-center text-sm transition ${
                isActive(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="text-lg">{item.icon}</div>
              <div className="text-xs">{item.label.split(' ')[0]}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
