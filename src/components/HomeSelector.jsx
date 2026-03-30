import React, { useState } from 'react'
import { useHome } from '../context/HomeContext'
import { useAuth } from '../context/AuthContext'

export function HomeSelector() {
  const { homes, activeHome, selectHome } = useHome()
  const { profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!activeHome || homes.length === 0) return null

  const isAdmin = profile?.role === 'admin' || profile?.role === 'superAdmin'
  const displayHomes = homes
  const showAllHomes = isAdmin && homes.length > 1

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 bg-primary text-white rounded flex items-center gap-2 hover:bg-primary-dark transition"
      >
        <span className="font-medium">{activeHome?.name || 'Select Home'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {displayHomes.map(home => (
            <button
              key={home.id}
              onClick={() => {
                selectHome(home)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                activeHome?.id === home.id ? 'bg-primary-light text-white' : ''
              }`}
            >
              {home.name}
            </button>
          ))}

          {showAllHomes && (
            <>
              <div className="border-t my-2"></div>
              <button
                onClick={() => {
                  selectHome(null)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 hover:bg-gray-100 transition ${
                  !activeHome ? 'bg-primary-light text-white' : ''
                }`}
              >
                All Homes
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
