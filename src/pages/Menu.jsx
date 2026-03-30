import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format, addDays } from 'date-fns'

export function Menu() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [menu, setMenu] = useState(null)
  const [formData, setFormData] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [menus, setMenus] = useState([])

  useEffect(() => {
    if (!activeHome?.id) return
    fetchMenusForWeek()
    fetchMenuForDate()
  }, [activeHome?.id, selectedDate])

  const fetchMenusForWeek = async () => {
    const weekStart = format(new Date(selectedDate), 'yyyy-MM-dd')
    const weekEnd = format(addDays(new Date(selectedDate), 7), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('home_id', activeHome.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    if (error) console.error('Error:', error)
    else setMenus(data || [])
  }

  const fetchMenuForDate = async () => {
    const { data, error } = await supabase
      .from('menus')
      .select('*')
      .eq('home_id', activeHome.id)
      .eq('date', selectedDate)
      .single()

    if (data) {
      setMenu(data)
      setFormData({
        breakfast: data.breakfast || '',
        lunch: data.lunch || '',
        dinner: data.dinner || '',
        snack: data.snack || '',
      })
    } else {
      setMenu(null)
      setFormData({
        breakfast: '',
        lunch: '',
        dinner: '',
        snack: '',
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (menu) {
        const { error } = await supabase
          .from('menus')
          .update(formData)
          .eq('id', menu.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('menus').insert([
          {
            home_id: activeHome.id,
            date: selectedDate,
            created_by: profile.id,
            ...formData,
          },
        ])
        if (error) throw error
      }

      setSuccess('Menu saved successfully')
      setTimeout(() => setSuccess(null), 3000)
      await fetchMenuForDate()
      await fetchMenusForWeek()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Daily Menu</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Create/Edit Menu</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Breakfast</label>
                <textarea
                  value={formData.breakfast}
                  onChange={(e) => setFormData({ ...formData, breakfast: e.target.value })}
                  className="form-input"
                  rows="2"
                  placeholder="e.g., Scrambled eggs, toast, orange juice"
                />
              </div>

              <div>
                <label className="form-label">Lunch</label>
                <textarea
                  value={formData.lunch}
                  onChange={(e) => setFormData({ ...formData, lunch: e.target.value })}
                  className="form-input"
                  rows="2"
                  placeholder="e.g., Turkey sandwich, chips, fruit"
                />
              </div>

              <div>
                <label className="form-label">Dinner</label>
                <textarea
                  value={formData.dinner}
                  onChange={(e) => setFormData({ ...formData, dinner: e.target.value })}
                  className="form-input"
                  rows="2"
                  placeholder="e.g., Grilled chicken, vegetables, rice"
                />
              </div>

              <div>
                <label className="form-label">Snack</label>
                <textarea
                  value={formData.snack}
                  onChange={(e) => setFormData({ ...formData, snack: e.target.value })}
                  className="form-input"
                  rows="2"
                  placeholder="e.g., Apple, crackers, milk"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Saving...' : 'Save Menu'}
              </button>
            </form>
          </div>
        </div>

        {/* Weekly Menus */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">This Week's Menus</h2>

            {menus.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No menus planned yet</p>
            ) : (
              <div className="space-y-4">
                {menus.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedDate(m.date)}
                    className={`p-4 border rounded cursor-pointer transition ${
                      selectedDate === m.date ? 'bg-primary-light text-white border-primary' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium mb-2">{format(new Date(m.date), 'EEEE, MMM d')}</h3>
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Breakfast:</span> {m.breakfast || '—'}</p>
                      <p><span className="font-medium">Lunch:</span> {m.lunch || '—'}</p>
                      <p><span className="font-medium">Dinner:</span> {m.dinner || '—'}</p>
                      <p><span className="font-medium">Snack:</span> {m.snack || '—'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
