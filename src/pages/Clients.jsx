import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format, parseISO } from 'date-fns'

export function Clients() {
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', dob: '', support_level: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    medical_notes: '', behavioral_notes: '',
  })

  useEffect(() => { if (!activeHome?.id) return; fetchClients() }, [activeHome?.id])

  const fetchClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').eq('home_id', activeHome.id).eq('active', true).order('first_name')
    setClients(data || []); setLoading(false)
  }

  const resetForm = () => {
    setFormData({ first_name: '', last_name: '', dob: '', support_level: '', emergency_contact_name: '', emergency_contact_phone: '', medical_notes: '', behavioral_notes: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First and last name are required'); return
    }
    setFormLoading(true); setError(null); setSuccess(null)
    try {
      const { error } = await supabase.from('clients').insert([{
        home_id: activeHome.id,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        dob: formData.dob || null,
        support_level: formData.support_level || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        medical_notes: formData.medical_notes || null,
        behavioral_notes: formData.behavioral_notes || null,
        active: true,
      }])
      if (error) throw error
      setSuccess('Client added successfully')
      resetForm()
      setShowForm(false)
      setTimeout(() => setSuccess(null), 3000)
      await fetchClients()
    } catch (err) { setError(err.message) }
    finally { setFormLoading(false) }
  }

  const getInitials = (first, last) => `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
  const colors = ['#1e7a4b', '#3b82f6', '#7c3aed', '#d4a02e', '#dc2626', '#0891b2']

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="skeleton h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-32 rounded-xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Client Directory</h1>
          <p>{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setError(null) }}
          className={showForm ? 'btn-ghost' : 'btn-primary'}
          style={showForm ? { border: '1px solid var(--border)' } : {}}
        >
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{showForm ? 'close' : 'person_add'}</span>
            {showForm ? 'Cancel' : 'Add Client'}
          </span>
        </button>
      </div>

      {success && (
        <div className="alert alert-success">
          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>
          {success}
        </div>
      )}

      {/* Add Client Form */}
      {showForm && (
        <div className="card" style={{ animation: 'fadeIn var(--duration-normal) var(--ease-out) both' }}>
          <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>person_add</span>
            New Client
          </h2>

          {error && (
            <div className="alert alert-error mb-4">
              <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">First Name *</label>
                <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="form-input" placeholder="First name" required />
              </div>
              <div>
                <label className="form-label">Last Name *</label>
                <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="form-input" placeholder="Last name" required />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Date of Birth</label>
                <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="form-input" />
              </div>
              <div>
                <label className="form-label">Support Level</label>
                <select value={formData.support_level} onChange={(e) => setFormData({ ...formData, support_level: e.target.value })} className="form-input">
                  <option value="">Select level...</option>
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 3">Level 3</option>
                  <option value="Level 4">Level 4</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Emergency Contact Name</label>
                <input type="text" value={formData.emergency_contact_name} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} className="form-input" placeholder="Contact name" />
              </div>
              <div>
                <label className="form-label">Emergency Contact Phone</label>
                <input type="tel" value={formData.emergency_contact_phone} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} className="form-input" placeholder="(555) 123-4567" />
              </div>
            </div>

            <div>
              <label className="form-label">Medical Notes</label>
              <textarea value={formData.medical_notes} onChange={(e) => setFormData({ ...formData, medical_notes: e.target.value })} className="form-input" rows="2" placeholder="Allergies, conditions, medications..." />
            </div>

            <div>
              <label className="form-label">Behavioral Notes</label>
              <textarea value={formData.behavioral_notes} onChange={(e) => setFormData({ ...formData, behavioral_notes: e.target.value })} className="form-input" rows="2" placeholder="Behavioral patterns, triggers, strategies..." />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={formLoading} className="btn-primary">
                {formLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Adding...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check</span>
                    Add Client
                  </span>
                )}
              </button>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); setError(null) }} className="btn-ghost" style={{ border: '1px solid var(--border)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {clients.length === 0 ? (
          <div className="col-span-full empty-state">
            <span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>group_off</span>
            <p>No clients found</p>
            {!showForm && (
              <button onClick={() => setShowForm(true)} className="btn-primary mt-4">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>person_add</span>
                  Add Your First Client
                </span>
              </button>
            )}
          </div>
        ) : (
          clients.map((client, idx) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
              className="card-interactive"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: colors[idx % colors.length] }}>
                  {getInitials(client.first_name, client.last_name)}
                </div>
                <div>
                  <h3 className="font-semibold">{client.first_name} {client.last_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="badge badge-info">{client.support_level || 'TBD'}</span>
                    {client.dob && <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Age: {Math.floor((new Date() - parseISO(client.dob)) / (365.25 * 24 * 60 * 60 * 1000))}</span>}
                  </div>
                </div>
              </div>

              {selectedClient?.id === client.id && (
                <div className="mt-3 pt-3 space-y-3" style={{ borderTop: '1px solid var(--border-light)', animation: 'fadeIn var(--duration-normal) var(--ease-out) both' }}>
                  {client.dob && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>cake</span>
                      <div><p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>DOB</p><p className="text-sm">{format(parseISO(client.dob), 'MMM d, yyyy')}</p></div>
                    </div>
                  )}
                  {client.emergency_contact_name && (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--danger)' }}>emergency</span>
                      <div><p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Emergency Contact</p><p className="text-sm">{client.emergency_contact_name}</p>{client.emergency_contact_phone && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{client.emergency_contact_phone}</p>}</div>
                    </div>
                  )}
                  {client.medical_notes && (
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--info)', marginTop: '2px' }}>medical_information</span>
                      <div><p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Medical Notes</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{client.medical_notes}</p></div>
                    </div>
                  )}
                  {client.behavioral_notes && (
                    <div className="flex items-start gap-2">
                      <span className="material-symbols-rounded" style={{ fontSize: '16px', color: 'var(--warning)', marginTop: '2px' }}>psychology</span>
                      <div><p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Behavioral Notes</p><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{client.behavioral_notes}</p></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
