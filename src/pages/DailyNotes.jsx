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
  const [notes, setNotes] = useState({
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  })
  const [formData, setFormData] = useState({
    medications_given: '',
    activities: '',
    behaviors: '',
    medical_appointments: '',
    clothing_log: '',
  })
  const [dailyNotesList, setDailyNotesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClients()
    fetchDailyNotes()
  }, [activeHome?.id])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('home_id', activeHome.id)
      .eq('active', true)
      .order('first_name')

    if (error) console.error('Error fetching clients:', error)
    else setClients(data || [])
  }

  const fetchDailyNotes = async () => {
    const { data, error } = await supabase
      .from('daily_notes')
      .select('*, clients(first_name, last_name), profiles(full_name)')
      .eq('home_id', activeHome.id)
      .eq('date', today)
      .order('created_at', { ascending: false })

    if (error) console.error('Error fetching notes:', error)
    else setDailyNotesList(data || [])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedClient) {
      setError('Please select a client')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { error } = await supabase.from('daily_notes').insert([
        {
          home_id: activeHome.id,
          client_id: selectedClient,
          profile_id: profile.id,
          date: today,
          meals: notes,
          medications_given: formData.medications_given || null,
          activities: formData.activities || null,
          behaviors: formData.behaviors || null,
          medical_appointments: formData.medical_appointments || null,
          clothing_log: formData.clothing_log || null,
          supervisor_review_status: 'draft',
        },
      ])

      if (error) throw error

      setSuccess('Daily note created successfully')
      setNotes({ breakfast: '', lunch: '', dinner: '', snack: '' })
      setFormData({
        medications_given: '',
        activities: '',
        behaviors: '',
        medical_appointments: '',
        clothing_log: '',
      })
      setSelectedClient(null)
      setTimeout(() => setSuccess(null), 3000)
      await fetchDailyNotes()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const submitForReview = async (noteId) => {
    try {
      const { error } = await supabase
        .from('daily_notes')
        .update({ supervisor_review_status: 'submitted' })
        .eq('id', noteId)

      if (error) throw error
      await fetchDailyNotes()
      setSuccess('Note submitted for review')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Daily Notes</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Note Entry Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Create Note</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="form-label">Client</label>
                <select
                  value={selectedClient || ''}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="form-input"
                >
                  <option value="">Select client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Breakfast</label>
                <input
                  type="text"
                  value={notes.breakfast}
                  onChange={(e) => setNotes({ ...notes, breakfast: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Eggs, toast, juice"
                />
              </div>

              <div>
                <label className="form-label">Lunch</label>
                <input
                  type="text"
                  value={notes.lunch}
                  onChange={(e) => setNotes({ ...notes, lunch: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Chicken sandwich, salad"
                />
              </div>

              <div>
                <label className="form-label">Dinner</label>
                <input
                  type="text"
                  value={notes.dinner}
                  onChange={(e) => setNotes({ ...notes, dinner: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Fish, vegetables"
                />
              </div>

              <div>
                <label className="form-label">Snack</label>
                <input
                  type="text"
                  value={notes.snack}
                  onChange={(e) => setNotes({ ...notes, snack: e.target.value })}
                  className="form-input"
                  placeholder="e.g., Fruit, crackers"
                />
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary text-sm">
                {loading ? 'Creating...' : 'Create Note'}
              </button>
            </form>
          </div>
        </div>

        {/* Daily Notes List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Today's Notes</h2>

            {dailyNotesList.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No notes yet for today</p>
            ) : (
              <div className="space-y-4">
                {dailyNotesList.map(note => (
                  <div key={note.id} className="border border-gray-200 rounded p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">
                          {note.clients?.first_name} {note.clients?.last_name}
                        </h3>
                        <p className="text-xs text-gray-600">{note.profiles?.full_name}</p>
                      </div>
                      <span className={`badge ${
                        note.supervisor_review_status === 'draft' ? 'badge-info' :
                        note.supervisor_review_status === 'submitted' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {note.supervisor_review_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                        <div key={meal}>
                          <span className="text-gray-600 capitalize">{meal}:</span>
                          <p className="text-sm">{note.meals?.[meal] || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {note.medications_given && (
                      <div className="mb-2 text-sm">
                        <span className="text-gray-600">Medications:</span>
                        <p>{note.medications_given}</p>
                      </div>
                    )}

                    {note.activities && (
                      <div className="mb-2 text-sm">
                        <span className="text-gray-600">Activities:</span>
                        <p>{note.activities}</p>
                      </div>
                    )}

                    {note.supervisor_review_status === 'draft' && (
                      <button
                        onClick={() => submitForReview(note.id)}
                        className="btn-secondary text-xs py-1"
                      >
                        Submit for Review
                      </button>
                    )}
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
