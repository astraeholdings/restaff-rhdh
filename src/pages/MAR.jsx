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

  useEffect(() => {
    if (!activeHome?.id) return
    fetchClients()
  }, [activeHome?.id])

  useEffect(() => {
    if (selectedClient) {
      fetchMedications()
      fetchMARRecords()
    }
  }, [selectedClient])

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, first_name, last_name')
      .eq('home_id', activeHome.id)
      .eq('active', true)
      .order('first_name')

    if (error) console.error('Error:', error)
    else setClients(data || [])
  }

  const fetchMedications = async () => {
    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('active', true)

    if (error) console.error('Error:', error)
    else setMedications(data || [])
  }

  const fetchMARRecords = async () => {
    const { data, error } = await supabase
      .from('mar_records')
      .select('*')
      .eq('client_id', selectedClient)
      .eq('home_id', activeHome.id)
      .gte('administered_at', `${today}T00:00:00`)
      .order('administered_at', { ascending: false })

    if (error) console.error('Error:', error)
    else setMARRecords(data || [])
  }

  const markMedicationGiven = async (medicationId) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('mar_records').insert([
        {
          medication_id: medicationId,
          client_id: selectedClient,
          home_id: activeHome.id,
          administered_at: new Date().toISOString(),
          status: 'given',
          administered_by: profile.id,
        },
      ])

      if (error) throw error
      await fetchMARRecords()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const markMedicationRefused = async (medicationId) => {
    setLoading(true)
    try {
      const { error } = await supabase.from('mar_records').insert([
        {
          medication_id: medicationId,
          client_id: selectedClient,
          home_id: activeHome.id,
          administered_at: new Date().toISOString(),
          status: 'refused',
          administered_by: profile.id,
        },
      ])

      if (error) throw error
      await fetchMARRecords()
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Medication Administration Records</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Selection */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Select Client</h2>

            <select
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="form-input w-full"
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Medications */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="font-serif font-bold text-lg mb-4">Active Medications</h2>

            {!selectedClient ? (
              <p className="text-gray-600 text-center py-4">Select a client to view medications</p>
            ) : medications.length === 0 ? (
              <p className="text-gray-600 text-center py-4">No active medications</p>
            ) : (
              <div className="space-y-3">
                {medications.map(med => {
                  const todaysRecord = marRecords.find(r => r.medication_id === med.id)

                  return (
                    <div key={med.id} className="border border-gray-200 rounded p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium">{med.name}</h3>
                          <p className="text-sm text-gray-600">
                            {med.dosage} • {med.frequency}
                          </p>
                          <p className="text-xs text-gray-500">Prescriber: {med.prescriber}</p>
                        </div>
                        {todaysRecord && (
                          <span className={`badge ${
                            todaysRecord.status === 'given' ? 'badge-success' : 'badge-warning'
                          }`}>
                            {todaysRecord.status}
                          </span>
                        )}
                      </div>

                      {!todaysRecord ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => markMedicationGiven(med.id)}
                            disabled={loading}
                            className="flex-1 btn-primary text-xs py-2"
                          >
                            Mark Given
                          </button>
                          <button
                            onClick={() => markMedicationRefused(med.id)}
                            disabled={loading}
                            className="flex-1 btn-secondary text-xs py-2"
                          >
                            Refused
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-600">
                          {todaysRecord.status === 'given' ? 'Given' : 'Refused'} at{' '}
                          {format(new Date(todaysRecord.administered_at), 'h:mm a')}
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

      {/* Today's MAR Summary */}
      {selectedClient && (
        <div className="card">
          <h2 className="font-serif font-bold text-lg mb-4">Today's MAR Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Medication</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {marRecords.map(record => (
                  <tr key={record.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{record.medication_id}</td>
                    <td className="p-2">
                      <span className={`badge ${
                        record.status === 'given' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="p-2 text-xs">
                      {format(new Date(record.administered_at), 'h:mm a')}
                    </td>
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
