import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useHome } from '../context/HomeContext'
import { format, parseISO } from 'date-fns'

export function Admin() {
  const { profile } = useAuth()
  const { activeHome } = useHome()
  const [activeTab, setActiveTab] = useState('homes')
  const [homes, setHomes] = useState([])
  const [staff, setStaff] = useState([])
  const [clients, setClients] = useState([])
  const [pendingNotes, setPendingNotes] = useState([])
  const [loading, setLoading] = useState(false)

  // Check admin
  if (profile?.role !== 'admin') {
    return (
      <div className="card text-center py-8">
        <p className="text-red-light font-medium">Unauthorized: Admin access required</p>
      </div>
    )
  }

  useEffect(() => {
    loadData()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'homes':
          const { data: homesData } = await supabase.from('homes').select('*').order('name')
          setHomes(homesData || [])
          break
        case 'staff':
          const { data: staffData } = await supabase
            .from('profiles')
            .select('*, homes(name)')
            .order('full_name')
          setStaff(staffData || [])
          break
        case 'clients':
          const { data: clientsData } = await supabase
            .from('clients')
            .select('*, homes(name)')
            .eq('active', true)
            .order('first_name')
          setClients(clientsData || [])
          break
        case 'notes':
          const { data: notesData } = await supabase
            .from('daily_notes')
            .select('*, clients(first_name, last_name), profiles(full_name), homes(name)')
            .eq('supervisor_review_status', 'submitted')
            .order('created_at', { ascending: false })
          setPendingNotes(notesData || [])
          break
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const approveNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from('daily_notes')
        .update({
          supervisor_review_status: 'approved',
          supervisor_id: profile.id,
          supervisor_signed_at: new Date().toISOString(),
        })
        .eq('id', noteId)

      if (error) throw error
      await loadData()
    } catch (err) {
      console.error('Error approving note:', err)
    }
  }

  const rejectNote = async (noteId) => {
    try {
      const { error } = await supabase
        .from('daily_notes')
        .update({ supervisor_review_status: 'draft' })
        .eq('id', noteId)

      if (error) throw error
      await loadData()
    } catch (err) {
      console.error('Error rejecting note:', err)
    }
  }

  const tabs = [
    { id: 'homes', label: 'Homes' },
    { id: 'staff', label: 'Staff' },
    { id: 'clients', label: 'Clients' },
    { id: 'notes', label: 'Daily Notes Review' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Administration</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 border-b-2 transition ${
              activeTab === tab.id
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div>
          {/* Homes Tab */}
          {activeTab === 'homes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homes.map(home => (
                <div key={home.id} className="card">
                  <h3 className="font-medium text-lg mb-2">{home.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>{home.address}</p>
                    <p>License: {home.license_number}</p>
                    <p className={`font-medium ${home.active ? 'text-green-600' : 'text-gray-400'}`}>
                      {home.active ? '✓ Active' : 'Inactive'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="card">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Role</th>
                    <th className="text-left p-3 font-medium">Position</th>
                    <th className="text-left p-3 font-medium">Home</th>
                    <th className="text-left p-3 font-medium">Phone</th>
                    <th className="text-left p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map(person => (
                    <tr key={person.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{person.full_name}</td>
                      <td className="p-3">
                        <span className="badge badge-info text-xs">{person.role}</span>
                      </td>
                      <td className="p-3 text-sm">{person.position || '—'}</td>
                      <td className="p-3 text-sm">{person.homes?.name || '—'}</td>
                      <td className="p-3 text-sm">{person.phone || '—'}</td>
                      <td className="p-3">
                        <span className={`badge ${person.active ? 'badge-success' : 'badge-warning'}`}>
                          {person.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="card">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium">Name</th>
                    <th className="text-left p-3 font-medium">Support Level</th>
                    <th className="text-left p-3 font-medium">Home</th>
                    <th className="text-left p-3 font-medium">Emergency Contact</th>
                    <th className="text-left p-3 font-medium">DOB</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">{client.first_name} {client.last_name}</td>
                      <td className="p-3">
                        <span className="badge badge-info text-xs">{client.support_level}</span>
                      </td>
                      <td className="p-3">{client.homes?.name}</td>
                      <td className="p-3 text-xs">
                        {client.emergency_contact_name}
                        {client.emergency_contact_phone && <br />}
                        {client.emergency_contact_phone}
                      </td>
                      <td className="p-3 text-xs">
                        {client.dob ? format(parseISO(client.dob), 'MMM d, yyyy') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Daily Notes Review Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {pendingNotes.length === 0 ? (
                <div className="card text-center py-8 text-gray-600">
                  No pending notes for review
                </div>
              ) : (
                pendingNotes.map(note => (
                  <div key={note.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium text-lg">
                          {note.clients?.first_name} {note.clients?.last_name}
                        </h3>
                        <p className="text-xs text-gray-600">
                          {note.homes?.name} • {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}
                        </p>
                        <p className="text-xs text-gray-600">By: {note.profiles?.full_name}</p>
                      </div>
                      <span className="badge badge-warning">Submitted</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm bg-gray-50 p-3 rounded">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                        <div key={meal}>
                          <span className="font-medium capitalize text-xs text-gray-600">{meal}:</span>
                          <p>{note.meals?.[meal] || '—'}</p>
                        </div>
                      ))}
                    </div>

                    {note.medications_given && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium">Medications:</span>
                        <p>{note.medications_given}</p>
                      </div>
                    )}

                    {note.activities && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium">Activities:</span>
                        <p>{note.activities}</p>
                      </div>
                    )}

                    {note.behaviors && (
                      <div className="mb-3 text-sm">
                        <span className="font-medium">Behaviors:</span>
                        <p>{note.behaviors}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => approveNote(note.id)}
                        className="btn-primary text-sm py-2"
                      >
                        Approve & Sign
                      </button>
                      <button
                        onClick={() => rejectNote(note.id)}
                        className="btn-secondary text-sm py-2"
                      >
                        Return for Revision
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
