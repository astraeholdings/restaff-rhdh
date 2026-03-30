import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { HomeProvider } from './context/HomeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { logger } from './lib/logger'

// Pages
import { Login } from './pages/Login'
import { Signup } from './pages/Signup'
import { Dashboard } from './pages/Dashboard'
import { ClockInOut } from './pages/ClockInOut'
import { DailyNotes } from './pages/DailyNotes'
import { MAR } from './pages/MAR'
import { Menu } from './pages/Menu'
import { Activities } from './pages/Activities'
import { Cleaning } from './pages/Cleaning'
import { NOCCleaning } from './pages/NOCCleaning'
import { Incidents } from './pages/Incidents'
import { Clients } from './pages/Clients'
import { Grocery } from './pages/Grocery'
import { Admin } from './pages/Admin'
import { Logs } from './pages/Logs'

export default function App() {
  useEffect(() => {
    logger.info('🚀 App initialized', {
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    })
  }, [])

  return (
    <Router>
      <AuthProvider>
        <HomeProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/clockinout" element={<ClockInOut />} />
                      <Route path="/daily-notes" element={<DailyNotes />} />
                      <Route path="/mar" element={<MAR />} />
                      <Route path="/menu" element={<Menu />} />
                      <Route path="/activities" element={<Activities />} />
                      <Route path="/cleaning" element={<Cleaning />} />
                      <Route path="/noc-cleaning" element={<NOCCleaning />} />
                      <Route path="/incidents" element={<Incidents />} />
                      <Route path="/clients" element={<Clients />} />
                      <Route path="/grocery" element={<Grocery />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/logs" element={<Logs />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </HomeProvider>
      </AuthProvider>
    </Router>
  )
}
