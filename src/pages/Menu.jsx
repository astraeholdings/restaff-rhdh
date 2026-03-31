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
  const [formData, setFormData] = useState({ breakfast: '', lunch: '', dinner: '', snack: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [menus, setMenus] = useState([])

  useEffect(() => { if (!activeHome?.id) return; fetchMenusForWeek(); fetchMenuForDate() }, [activeHome?.id, selectedDate])

  const fetchMenusForWeek = async () => {
    const weekStart = format(new Date(selectedDate), 'yyyy-MM-dd')
    const weekEnd = format(addDays(new Date(selectedDate), 7), 'yyyy-MM-dd')
    const { data } = await supabase.from('menus').select('*').eq('home_id', activeHome.id).gte('date', weekStart).lte('date', weekEnd)
    setMenus(data || [])
  }

  const fetchMenuForDate = async () => {
    const { data } = await supabase.from('menus').select('*').eq('home_id', activeHome.id).eq('date', selectedDate).single()
    if (data) { setMenu(data); setFormData({ breakfast: data.breakfast || '', lunch: data.lunch || '', dinner: data.dinner || '', snack: data.snack || '' }) }
    else { setMenu(null); setFormData({ breakfast: '', lunch: '', dinner: '', snack: '' }) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      if (menu) { const { error } = await supabase.from('menus').update(formData).eq('id', menu.id); if (error) throw error }
      else { const { error } = await supabase.from('menus').insert([{ home_id: activeHome.id, date: selectedDate, created_by: profile.id, ...formData }]); if (error) throw error }
      setSuccess('Menu saved successfully'); setTimeout(() => setSuccess(null), 3000)
      await fetchMenuForDate(); await fetchMenusForWeek()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const mealIcons = { breakfast: 'egg_alt', lunch: 'lunch_dining', dinner: 'dinner_dining', snack: 'cookie' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Daily Menu</h1>
        <p>Plan and manage meals</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>edit_calendar</span>
              {menu ? 'Edit Menu' : 'Create Menu'}
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Date</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="form-input" />
              </div>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                <div key={meal}>
                  <label className="form-label capitalize flex items-center gap-1.5">
                    <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>{mealIcons[meal]}</span>
                    {meal}
                  </label>
                  <textarea value={formData[meal]} onChange={(e) => setFormData({ ...formData, [meal]: e.target.value })} className="form-input" rows="2" placeholder={`What's for ${meal}?`} />
                </div>
              ))}
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Saving...' : 'Save Menu'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>calendar_month</span>
              This Week&apos;s Menus
            </h2>

            {menus.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>restaurant</span><p>No menus planned yet</p></div>
            ) : (
              <div className="space-y-3">
                {menus.map(m => (
                  <div
                    key={m.id}
                    onClick={() => setSelectedDate(m.date)}
                    className="p-4 rounded-xl cursor-pointer transition-all"
                    style={{
                      background: selectedDate === m.date ? 'var(--primary-50)' : 'var(--surface)',
                      border: `1.5px solid ${selectedDate === m.date ? 'var(--primary-200)' : 'var(--border-light)'}`,
                    }}
                  >
                    <h3 className="font-semibold mb-2" style={{ color: selectedDate === m.date ? 'var(--primary)' : 'var(--text-primary)' }}>
                      {format(new Date(m.date), 'EEEE, MMM d')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                        <div key={meal} className="flex items-start gap-1.5">
                          <span className="material-symbols-rounded" style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{mealIcons[meal]}</span>
                          <div>
                            <span className="text-xs font-medium capitalize" style={{ color: 'var(--text-tertiary)' }}>{meal}:</span>
                            <p style={{ color: 'var(--text-secondary)' }}>{m[meal] || '—'}</p>
                          </div>
                        </div>
                      ))}
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
