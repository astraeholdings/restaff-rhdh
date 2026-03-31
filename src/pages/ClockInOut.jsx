import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format, parseISO, differenceInSeconds } from 'date-fns'

export function ClockInOut() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [shiftType, setShiftType] = useState('day')
  const [action, setAction] = useState('arrived')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [staffList, setStaffList] = useState([])
  const [elapsedTimes, setElapsedTimes] = useState({})
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClockedInStaff()
    const interval = setInterval(updateElapsedTimes, 1000)
    return () => clearInterval(interval)
  }, [activeHome?.id])

  const fetchClockedInStaff = async () => {
    if (!activeHome?.id) return
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data, error } = await supabase.from('clock_records').select('*, profiles(full_name)').eq('home_id', activeHome.id).gte('created_at', `${today}T00:00:00`).order('created_at', { ascending: false })
    if (error) console.error('Error fetching staff:', error)
    else setStaffList(data || [])
  }

  const updateElapsedTimes = () => {
    const times = {}
    staffList.forEach(record => {
      if (['arrived', 'break end'].includes(record.action)) {
        const created = parseISO(record.created_at)
        const seconds = differenceInSeconds(new Date(), created)
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)
        times[record.profile_id] = `${hours}h ${minutes}m`
      }
    })
    setElapsedTimes(times)
  }

  const handleClockInOut = async (e) => {
    e.preventDefault()
    setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('clock_records').insert([{ home_id: activeHome.id, profile_id: profile.id, shift_type: shiftType, action, notes: notes || null }])
      if (error) throw error
      setSuccess(`Successfully clocked ${action}`)
      setNotes('')
      setTimeout(() => setSuccess(null), 3000)
      await fetchClockedInStaff()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Clock In/Out</h1>
        <p>Record your shift times</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>schedule</span>
              Record Time
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleClockInOut} className="space-y-4">
              <div>
                <label className="form-label">Shift Type</label>
                <select value={shiftType} onChange={(e) => setShiftType(e.target.value)} className="form-input">
                  <option value="day">Day (6 AM - 6 PM)</option>
                  <option value="swing">Swing (2 PM - 10 PM)</option>
                  <option value="grave">Grave (10 PM - 6 AM)</option>
                </select>
              </div>
              <div>
                <label className="form-label">Action</label>
                <select value={action} onChange={(e) => setAction(e.target.value)} className="form-input">
                  <option value="arrived">Arrived</option>
                  <option value="left">Left</option>
                  <option value="break start">Break Start</option>
                  <option value="break end">Break End</option>
                </select>
              </div>
              <div>
                <label className="form-label">Notes (Optional)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-input" rows="3" placeholder="Any notes about this time entry..." />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Clock In/Out'}
              </button>
            </form>
          </div>
        </div>

        {/* Currently Clocked In */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--success)' }}>groups</span>
              Currently Clocked In
            </h2>

            {staffList.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>schedule_off</span>
                <p>No staff clocked in today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffList.map((record) => {
                  const isClockedIn = ['arrived', 'break end'].includes(record.action)
                  if (!isClockedIn) return null
                  return (
                    <div key={record.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border-light)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                        {getInitials(record.profiles?.full_name)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{record.profiles?.full_name}</p>
                        <p className="text-xs capitalize" style={{ color: 'var(--text-tertiary)' }}>{record.shift_type} shift &bull; {record.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold" style={{ color: 'var(--primary)' }}>{elapsedTimes[record.profile_id]}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{format(parseISO(record.created_at), 'h:mm a')}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Records Table */}
      <div className="card">
        <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
          <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--info)' }}>history</span>
          Today&apos;s Records
        </h2>
        <div className="table-container">
          <table className="table-styled">
            <thead>
              <tr>
                <th>Staff</th>
                <th>Shift</th>
                <th>Action</th>
                <th>Time</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(record => (
                <tr key={record.id}>
                  <td className="font-medium">{record.profiles?.full_name}</td>
                  <td className="capitalize">{record.shift_type}</td>
                  <td><span className="tag capitalize">{record.action}</span></td>
                  <td className="text-xs">{format(parseISO(record.created_at), 'h:mm a')}</td>
                  <td className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{record.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
