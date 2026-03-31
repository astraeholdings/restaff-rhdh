import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format } from 'date-fns'

export function MAR() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [medications, setMedications] = useState([])
  const [marRecords, setMARRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => { if (!activeHome?.id) return; fetchClients() }, [activeHome?.id])
  useEffect(() => { if (selectedClient) { fetchMedications(); fetchMARRecords() } }, [selectedClient])

  const fetchClients = async () => { const { data } = await supabase.from('clients').select('id, first_name, last_name').eq('home_id', activeHome.id).eq('active', true).order('first_name'); setClients(data || []) }
  const fetchMedications = async () => { const { data } = await supabase.from('medications').select('*').eq('client_id', selectedClient).eq('active', true); setMedications(data || []) }
  const fetchMARRecords = async () => { const { data } = await supabase.from('mar_records').select('*').eq('client_id', selectedClient).eq('home_id', activeHome.id).gte('administered_at', `${today}T00:00:00`).order('administered_at', { ascending: false }); setMARRecords(data || []) }

  const markMedication = async (medicationId, status) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('mar_records').insert([{ medication_id: medicationId, client_id: selectedClient, home_id: activeHome.id, administered_at: new Date().toISOString(), status, administered_by: profile.id }])
      if (error) throw error
      await fetchMARRecords()
    } catch (err) { console.error('Error:', err) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Medication Administration</h1>
        <p>Record medication administration</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>person_search</span>
              Select Client
            </h2>
            <select value={selectedClient || ''} onChange={(e) => setSelectedClient(e.target.value)} className="form-input w-full">
              <option value="">Choose a client...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--info)' }}>medication</span>
              Active Medications
            </h2>

            {!selectedClient ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>person</span><p>Select a client to view medications</p></div>
            ) : medications.length === 0 ? (
              <div className="empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>medication_liquid</span><p>No active medications</p></div>
            ) : (
              <div className="space-y-3">
                {medications.map(med => {
                  const todaysRecord = marRecords.find(r => r.medication_id === med.id)
                  return (
                    <div key={med.id} className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-raised)' }}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--primary)' }}>pill</span>
                            {med.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="tag">{med.dosage}</span>
                            <span className="tag">{med.frequency}</span>
                          </div>
                          <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Prescriber: {med.prescriber}</p>
                        </div>
                        {todaysRecord && (
                          <span className={`badge ${todaysRecord.status === 'given' ? 'badge-success' : 'badge-warning'}`}>
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>{todaysRecord.status === 'given' ? 'check_circle' : 'do_not_disturb'}</span>
                            {todaysRecord.status}
                          </span>
                        )}
                      </div>

                      {!todaysRecord ? (
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => markMedication(med.id, 'given')} disabled={loading} className="flex-1 btn-primary btn-small">
                            <span className="material-symbols-rounded" style={{ fontSize: '14px' }}>check</span> Mark Given
                          </button>
                          <button onClick={() => markMedication(med.id, 'refused')} disabled={loading} className="flex-1 btn-ghost btn-small" style={{ border: '1px solid var(--border)' }}>
                            Refused
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                          {todaysRecord.status === 'given' ? 'Given' : 'Refused'} at {format(new Date(todaysRecord.administered_at), 'h:mm a')}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedClient && marRecords.length > 0 && (
        <div className="card">
          <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
            <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--gold-dark)' }}>summarize</span>
            Today&apos;s MAR Summary
          </h2>
          <div className="table-container">
            <table className="table-styled">
              <thead><tr><th>Medication</th><th>Status</th><th>Time</th></tr></thead>
              <tbody>
                {marRecords.map(record => (
                  <tr key={record.id}>
                    <td className="font-medium">{record.medication_id}</td>
                    <td><span className={`badge ${record.status === 'given' ? 'badge-success' : 'badge-warning'}`}>{record.status}</span></td>
                    <td className="text-xs">{format(new Date(record.administered_at), 'h:mm a')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
