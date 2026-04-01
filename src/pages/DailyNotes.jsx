import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function DailyNotes() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [notes, setNotes] = useState({ breakfast: '', lunch: '', dinner: '', snack: '' })
  const [formData, setFormData] = useState({ medications_given: '', activities: '', behaviors: '', medical_appointments: '', clothing_log: '' })
  const [dailyNotesList, setDailyNotesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { if (!activeHome?.id) return; fetchClients(); fetchDailyNotes() }, [activeHome?.id])

  const fetchClients = async () => {
    const { data } = await supabase.from('clients').select('id, first_name, last_name').eq('home_id', activeHome.id).eq('active', true).order('first_name')
    setClients(data || [])
  }

  const fetchDailyNotes = async () => {
    const { data } = await supabase.from('daily_notes').select('*, clients(first_name, last_name), profiles(full_name)').eq('home_id', activeHome.id).eq('date', today).order('created_at', { ascending: false })
    setDailyNotesList(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient) { setError('Please select a client'); return }
    setLoading(true); setError(null); setSuccess(null)
    try {
      const { error } = await supabase.from('daily_notes').insert([{ home_id: activeHome.id, client_id: selectedClient, profile_id: profile.id, date: today, meals: notes, medications_given: formData.medications_given || null, activities: formData.activities || null, behaviors: formData.behaviors || null, medical_appointments: formData.medical_appointments || null, clothing_log: formData.clothing_log || null, supervisor_review_status: 'draft' }])
      if (error) throw error
      setSuccess('Daily note created successfully')
      setNotes({ breakfast: '', lunch: '', dinner: '', snack: '' })
      setFormData({ medications_given: '', activities: '', behaviors: '', medical_appointments: '', clothing_log: '' })
      setSelectedClient(null)
      setTimeout(() => setSuccess(null), 3000)
      await fetchDailyNotes()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const submitForReview = async (noteId) => {
    try {
      const { error } = await supabase.from('daily_notes').update({ supervisor_review_status: 'submitted' }).eq('id', noteId)
      if (error) throw error
      await fetchDailyNotes()
      setSuccess('Note submitted for review')
    } catch (err) { setError(err.message) }
  }

  const statusConfig = {
    draft: { badge: 'badge-info', icon: 'edit', label: 'Draft' },
    submitted: { badge: 'badge-warning', icon: 'schedule_send', label: 'Submitted' },
    approved: { badge: 'badge-success', icon: 'check_circle', label: 'Approved' },
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Daily Notes</h1>
        <p>{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>note_add</span>
              Create Note
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="form-label">Client</label>
                <select value={selectedClient || ''} onChange={(e) => setSelectedClient(e.target.value)} className="form-input">
                  <option value="">Select client...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                <div key={meal}>
                  <label className="form-label capitalize">{meal}</label>
                  <input type="text" value={notes[meal]} onChange={(e) => setNotes({ ...notes, [meal]: e.target.value })} className="form-input" placeholder={`e.g., ${meal === 'breakfast' ? 'Eggs, toast, juice' : meal === 'lunch' ? 'Chicken sandwich' : meal === 'dinner' ? 'Fish, vegetables' : 'Fruit, crackers'}`} />
                </div>
              ))}
              <div>
                <label className="form-label">Medications Given</label>
                <textarea value={formData.medications_given} onChange={(e) => setFormData({ ...formData, medications_given: e.target.value })} className="form-input" rows="2" placeholder="List medications administered..." />
              </div>
              <div>
                <label className="form-label">Activities</label>
                <textarea value={formData.activities} onChange={(e) => setFormData({ ...formData, activities: e.target.value })} className="form-input" rows="2" placeholder="Activities completed today..." />
              </div>
              <div>
                <label className="form-label">Behaviors</label>
                <textarea value={formData.behaviors} onChange={(e) => setFormData({ ...formData, behaviors: e.target.value })} className="form-input" rows="2" placeholder="Behavioral observations..." />
              </div>
              <div>
                <label className="form-label">Medical Appointments</label>
                <input type="text" value={formData.medical_appointments} onChange={(e) => setFormData({ ...formData, medical_appointments: e.target.value })} className="form-input" placeholder="Any appointments today..." />
              </div>
              <div>
                <label className="form-label">Clothing Log</label>
                <input type="text" value={formData.clothing_log} onChange={(e) => setFormData({ ...formData, clothing_log: e.target.value })} className="form-input" placeholder="Clothing worn today..." />
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary text-sm">{loading ? 'Creating...' : 'Create Note'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>description</span>
              Today&apos;s Notes
            </h2>

            {dailyNotesList.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>note</span>
                <p>No notes yet for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyNotesList.map(note => {
                  const sc = statusConfig[note.supervisor_review_status] || statusConfig.draft
                  return (
                    <div key={note.id} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold">{note.clients?.first_name} {note.clients?.last_name}</h3>
                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>By {note.profiles?.full_name}</p>
                          </div>
                          <span className={`badge ${sc.badge}`}>
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{sc.icon}</span>
                            {sc.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                            <div key={meal} className="p-2 rounded-lg" style={{ background: 'var(--surface)' }}>
                              <span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-tertiary)' }}>{meal}</span>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{note.meals?.[meal] || '—'}</p>
                            </div>
                          ))}
                        </div>

                        {note.medications_given && <div className="mb-2 text-sm"><span style={{ color: 'var(--text-tertiary)' }}>Medications:</span> <span style={{ color: 'var(--text-secondary)' }}>{note.medications_given}</span></div>}
                        {note.activities && <div className="mb-2 text-sm"><span style={{ color: 'var(--text-tertiary)' }}>Activities:</span> <span style={{ color: 'var(--text-secondary)' }}>{note.activities}</span></div>}

                        {note.supervisor_review_status === 'draft' && (
                          <button onClick={() => submitForReview(note.id)} className="btn-secondary btn-small mt-2">
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>send</span>
                            Submit for Review
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
