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
    const { data, error } = await supabase
      .from('clock_records')
      .select('*, profiles(full_name)')
      .eq('home_id', activeHome.id)
      .gte('created_at', `${today}T00:00:00`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
    } else {
      setStaffList(data || [])
    }
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
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('clock_records').insert([
        {
          home_id: activeHome.id,
          profile_id: profile.id,
          shift_type: shiftType,
          action,
          notes: notes || null,
        },
      ])

      if (error) throw error

      setSuccess(`Successfully clocked ${action}`)
      setNotes('')
      setTimeout(() => setSuccess(null), 3000)
      await fetchClockedInStaff()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Clock In/Out</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clock In/Out Form */}
        <div className="lg:col-span-1">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Record Time</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

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
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                  rows="3"
                  placeholder="Any notes about this time entry..."
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Submitting...' : 'Clock In/Out'}
              </button>
            </form>
          </div>
        </div>

        {/* Currently Clocked In Staff */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Currently Clocked In</h2>

            {staffList.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No staff clocked in today</p>
            ) : (
              <div className="space-y-2">
                {staffList.map((record) => {
                  const isClockedIn = ['arrived', 'break end'].includes(record.action)
                  if (!isClockedIn) return null

                  return (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{record.profiles?.full_name}</p>
                        <p className="text-xs text-gray-600 capitalize">
                          {record.shift_type} shift • {record.action}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-primary">{elapsedTimes[record.profile_id]}</p>
                        <p className="text-xs text-gray-600">
                          {format(parseISO(record.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Today's Clock Records */}
      <div className="card">
        <h2 className="font-serif font-bold text-lg mb-4">Today's Records</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium">Staff</th>
                <th className="text-left p-2 font-medium">Shift</th>
                <th className="text-left p-2 font-medium">Action</th>
                <th className="text-left p-2 font-medium">Time</th>
                <th className="text-left p-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {staffList.map(record => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{record.profiles?.full_name}</td>
                  <td className="p-2 capitalize">{record.shift_type}</td>
                  <td className="p-2 capitalize">{record.action}</td>
                  <td className="p-2 text-xs">{format(parseISO(record.created_at), 'h:mm a')}</td>
                  <td className="p-2 text-xs text-gray-600">{record.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
