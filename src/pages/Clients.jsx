import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format, parseISO } from 'date-fns'

export function Clients() {
  const { activeHome } = useHome()
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClients()
  }, [activeHome?.id])

  const fetchClients = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('home_id', activeHome.id)
      .eq('active', true)
      .order('first_name')

    if (error) console.error('Error:', error)
    else setClients(data || [])
    setLoading(false)
  }

  if (loading) {
    return <div className="text-center py-8">Loading clients...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Client Directory</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600">
            No clients found
          </div>
        ) : (
          clients.map(client => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
              className="card cursor-pointer hover:shadow-lg transition"
            >
              <div className="mb-3">
                <h3 className="text-lg font-medium">{client.first_name} {client.last_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge badge-info text-xs">{client.support_level || 'TBD'}</span>
                  {client.dob && (
                    <span className="text-xs text-gray-600">
                      Age: {Math.floor((new Date() - parseISO(client.dob)) / (365.25 * 24 * 60 * 60 * 1000))}
                    </span>
                  )}
                </div>
              </div>

              {selectedClient?.id === client.id && (
                <div className="mt-4 space-y-3 pt-4 border-t">
                  {client.dob && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">DOB</p>
                      <p className="text-sm">{format(parseISO(client.dob), 'MMM d, yyyy')}</p>
                    </div>
                  )}

                  {client.emergency_contact_name && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Emergency Contact</p>
                      <p className="text-sm">{client.emergency_contact_name}</p>
                      {client.emergency_contact_phone && (
                        <p className="text-xs text-gray-600">{client.emergency_contact_phone}</p>
                      )}
                    </div>
                  )}

                  {client.medical_notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Medical Notes</p>
                      <p className="text-sm text-gray-700">{client.medical_notes}</p>
                    </div>
                  )}

                  {client.behavioral_notes && (
                    <div>
                      <p className="text-xs font-medium text-gray-600">Behavioral Notes</p>
                      <p className="text-sm text-gray-700">{client.behavioral_notes}</p>
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
