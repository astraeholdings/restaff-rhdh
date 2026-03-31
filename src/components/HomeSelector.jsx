import React, { useState, useRef, useEffect } from 'react'
import { useHome } from '../context/HomeContext'
import { useAuth } from '../context/AuthContext'

export function HomeSelector({ variant = 'default' }) {
  const { homes, activeHome, selectHome } = useHome()
  const { profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!activeHome || homes.length === 0) return null

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin'
  const showAllHomes = isAdmin && homes.length > 1

  const isSidebar = variant === 'sidebar'

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-all w-full"
        style={isSidebar ? {
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '13px',
          fontWeight: 500,
        } : {
          padding: '6px 14px',
          borderRadius: 'var(--radius-full)',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          color: 'white',
          fontSize: '13px',
          fontWeight: 500,
          boxShadow: '0 2px 8px rgba(30, 122, 75, 0.2)',
        }}
      >
        <span
          className="material-symbols-rounded"
          style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20" }}
        >
          home
        </span>
        <span className="flex-1 text-left truncate">{activeHome?.name || 'Select Home'}</span>
        <span
          className="material-symbols-rounded transition-transform"
          style={{
            fontSize: '18px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>

      {isOpen && (
        <div
          className="absolute top-full mt-2 w-full min-w-[200px] rounded-xl overflow-hidden z-50"
          style={{
            background: 'var(--surface-raised)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)',
            animation: 'slideDown var(--duration-normal) var(--ease-out) both',
          }}
        >
          <div className="p-1.5">
            {homes.map(home => (
              <button
                key={home.id}
                onClick={() => {
                  selectHome(home)
                  setIsOpen(false)
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2"
                style={{
                  color: activeHome?.id === home.id ? 'var(--primary)' : 'var(--text-secondary)',
                  background: activeHome?.id === home.id ? 'var(--primary-50)' : 'transparent',
                  fontWeight: activeHome?.id === home.id ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (activeHome?.id !== home.id) {
                    e.currentTarget.style.background = 'var(--surface)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeHome?.id !== home.id) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                {activeHome?.id === home.id && (
                  <span
                    className="material-symbols-rounded"
                    style={{ fontSize: '16px', fontVariationSettings: "'FILL' 1, 'wght' 500" }}
                  >
                    check_circle
                  </span>
                )}
                {home.name}
              </button>
            ))}

            {showAllHomes && (
              <>
                <div className="divider my-1.5" />
                <button
                  onClick={() => {
                    selectHome(null)
                    setIsOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    color: !activeHome ? 'var(--primary)' : 'var(--text-secondary)',
                    background: !activeHome ? 'var(--primary-50)' : 'transparent',
                    fontWeight: !activeHome ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (activeHome) e.currentTarget.style.background = 'var(--surface)'
                  }}
                  onMouseLeave={(e) => {
                    if (activeHome) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  All Homes
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
