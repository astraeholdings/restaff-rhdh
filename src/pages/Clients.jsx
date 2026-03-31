import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format, parseISO } from 'date-fns'

export function Clients() {
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (!activeHome?.id) return; fetchClients() }, [activeHome?.id])

  const fetchClients = async () => {
    setLoading(true)
    const { data } = await supabase.from('clients').select('*').eq('home_id', activeHome.id).eq('active', true).order('first_name')
    setClients(data || []); setLoading(false)
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
      <div className="page-header">
        <h1>Client Directory</h1>
        <p>{clients.length} active client{clients.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
        {clients.length === 0 ? (
          <div className="col-span-full empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>group_off</span><p>No clients found</p></div>
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
