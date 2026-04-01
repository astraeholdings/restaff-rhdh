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

  const isSuperAdmin = profile?.role === 'superAdmin'
  const isAdmin = profile?.role === 'admin'

  // useEffect must be called before any early return to comply with React Rules of Hooks
  useEffect(() => {
    if (isAdmin || isSuperAdmin) { loadData() }
  }, [activeTab, isAdmin, isSuperAdmin])

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="card text-center py-12">
        <span className="material-symbols-rounded" style={{ fontSize: '48px', color: 'var(--danger)', display: 'block', marginBottom: '12px' }}>lock</span>
        <p className="font-semibold" style={{ color: 'var(--danger)' }}>Unauthorized: Admin access required</p>
      </div>
    )
  }

  const loadData = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'users': { const { data } = await supabase.from('profiles').select('*, homes(name)').order('full_name'); setStaff(data || []); break }
        case 'homes': { const { data } = await supabase.from('homes').select('*').order('name'); setHomes(data || []); break }
        case 'staff': { const { data } = await supabase.from('profiles').select('*, homes(name)').order('full_name'); setStaff(data || []); break }
        case 'clients': { const { data } = await supabase.from('clients').select('*, homes(name)').eq('active', true).order('first_name'); setClients(data || []); break }
        case 'notes': { const { data } = await supabase.from('daily_notes').select('*, clients(first_name, last_name), profiles(full_name), homes(name)').eq('supervisor_review_status', 'submitted').order('created_at', { ascending: false }); setPendingNotes(data || []); break }
      }
    } catch (error) { console.error('Error loading data:', error) }
    finally { setLoading(false) }
  }

  const approveNote = async (noteId) => { try { const { error } = await supabase.from('daily_notes').update({ supervisor_review_status: 'approved', supervisor_id: profile.id, supervisor_signed_at: new Date().toISOString() }).eq('id', noteId); if (error) throw error; await loadData() } catch (err) { console.error(err) } }
  const rejectNote = async (noteId) => { try { const { error } = await supabase.from('daily_notes').update({ supervisor_review_status: 'draft' }).eq('id', noteId); if (error) throw error; await loadData() } catch (err) { console.error(err) } }
  const updateUserRole = async (userId, newRole) => { try { const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId); if (error) throw error; await loadData() } catch (err) { console.error(err) } }
  const toggleUserActive = async (userId, currentStatus) => { try { const { error } = await supabase.from('profiles').update({ active: !currentStatus }).eq('id', userId); if (error) throw error; await loadData() } catch (err) { console.error(err) } }

  const tabs = [
    ...(isSuperAdmin ? [{ id: 'users', label: 'Users', icon: 'manage_accounts' }] : []),
    { id: 'homes', label: 'Homes', icon: 'home' },
    { id: 'staff', label: 'Staff', icon: 'badge' },
    { id: 'clients', label: 'Clients', icon: 'group' },
    { id: 'notes', label: 'Reviews', icon: 'rate_review' },
  ]

  const tabIcons = { users: 'manage_accounts', homes: 'home', staff: 'badge', clients: 'group', notes: 'rate_review' }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Administration</h1>
        <p>Manage homes, staff, clients, and reviews</p>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
            style={activeTab === tab.id ? {
              background: 'var(--surface-raised)', color: 'var(--primary)',
              boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)',
            } : {
              background: 'transparent', color: 'var(--text-tertiary)', border: '1px solid transparent',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>{tab.icon}</span>
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div>
          {/* Users Tab */}
          {activeTab === 'users' && isSuperAdmin && (
            <div className="space-y-4">
              <div className="card">
                <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>manage_accounts</span>
                  All Users
                </h2>
                <div className="table-container">
                  <table className="table-styled">
                    <thead><tr><th>Name</th><th>Role</th><th>Home</th><th>Position</th><th>Status</th></tr></thead>
                    <tbody>
                      {staff.map(person => (
                        <tr key={person.id}>
                          <td className="font-medium">{person.full_name}</td>
                          <td>
                            <select value={person.role} onChange={(e) => updateUserRole(person.id, e.target.value)} disabled={person.role === 'superAdmin' && person.id !== profile?.id} className="form-input text-xs py-1 px-2 w-auto">
                              <option value="staff">Staff</option><option value="supervisor">Supervisor</option><option value="admin">Admin</option>
                              {person.role === 'superAdmin' && <option value="superAdmin">Super Admin</option>}
                            </select>
                          </td>
                          <td className="text-sm">{person.homes?.name || '—'}</td>
                          <td className="text-sm">{person.position || '—'}</td>
                          <td>
                            <button onClick={() => toggleUserActive(person.id, person.active)} disabled={person.role === 'superAdmin'} className={`badge cursor-pointer ${person.active ? 'badge-success' : 'badge-warning'}`}>
                              {person.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="alert alert-info">
                <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--info)' }}>info</span>
                <div className="text-xs space-y-1">
                  <p><strong>Super Admin:</strong> Full system access</p>
                  <p><strong>Admin:</strong> Manage home staff and clients</p>
                  <p><strong>Supervisor:</strong> Approve daily notes</p>
                  <p><strong>Staff:</strong> Clock in/out, create notes, log meds</p>
                </div>
              </div>
            </div>
          )}

          {/* Homes Tab */}
          {activeTab === 'homes' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
              {homes.map(home => (
                <div key={home.id} className="card-elevated">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>home</span>
                    </div>
                    <span className={`badge ${home.active ? 'badge-success' : 'badge-warning'}`}>{home.active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{home.name}</h3>
                  <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>{home.address}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>License: {home.license_number}</p>
                </div>
              ))}
            </div>
          )}

          {/* Staff Tab */}
          {activeTab === 'staff' && (
            <div className="card">
              <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>badge</span>
                Staff Directory
              </h2>
              <div className="table-container">
                <table className="table-styled">
                  <thead><tr><th>Name</th><th>Role</th><th>Position</th><th>Home</th><th>Phone</th><th>Status</th></tr></thead>
                  <tbody>
                    {staff.map(person => (
                      <tr key={person.id}>
                        <td className="font-medium">{person.full_name}</td>
                        <td><span className="badge badge-info">{person.role}</span></td>
                        <td className="text-sm">{person.position || '—'}</td>
                        <td className="text-sm">{person.homes?.name || '—'}</td>
                        <td className="text-sm">{person.phone || '—'}</td>
                        <td><span className={`badge ${person.active ? 'badge-success' : 'badge-warning'}`}>{person.active ? 'Active' : 'Inactive'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clients Tab */}
          {activeTab === 'clients' && (
            <div className="card">
              <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>group</span>
                All Clients
              </h2>
              <div className="table-container">
                <table className="table-styled">
                  <thead><tr><th>Name</th><th>Support Level</th><th>Home</th><th>Emergency Contact</th><th>DOB</th></tr></thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}>
                        <td className="font-medium">{client.first_name} {client.last_name}</td>
                        <td><span className="badge badge-info">{client.support_level}</span></td>
                        <td className="text-sm">{client.homes?.name}</td>
                        <td className="text-sm">{client.emergency_contact_name}{client.emergency_contact_phone && <><br /><span style={{ color: 'var(--text-tertiary)' }}>{client.emergency_contact_phone}</span></>}</td>
                        <td className="text-xs">{client.dob ? format(parseISO(client.dob), 'MMM d, yyyy') : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes Review Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              {pendingNotes.length === 0 ? (
                <div className="card empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>task_alt</span><p>No pending reviews</p></div>
              ) : (
                pendingNotes.map(note => (
                  <div key={note.id} className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-base">{note.clients?.first_name} {note.clients?.last_name}</h3>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{note.homes?.name} &bull; {format(parseISO(note.created_at), 'MMM d, yyyy h:mm a')}</p>
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>By: {note.profiles?.full_name}</p>
                      </div>
                      <span className="badge badge-warning"><span className="material-symbols-rounded" style={{ fontSize: '14px' }}>schedule_send</span>Submitted</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 p-3 rounded-lg" style={{ background: 'var(--surface)' }}>
                      {['breakfast', 'lunch', 'dinner', 'snack'].map(meal => (
                        <div key={meal}><span className="text-xs font-semibold capitalize" style={{ color: 'var(--text-tertiary)' }}>{meal}:</span><p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{note.meals?.[meal] || '—'}</p></div>
                      ))}
                    </div>

                    {note.medications_given && <div className="mb-2 text-sm"><span className="font-semibold text-xs" style={{ color: 'var(--text-tertiary)' }}>Medications:</span> <span style={{ color: 'var(--text-secondary)' }}>{note.medications_given}</span></div>}
                    {note.activities && <div className="mb-2 text-sm"><span className="font-semibold text-xs" style={{ color: 'var(--text-tertiary)' }}>Activities:</span> <span style={{ color: 'var(--text-secondary)' }}>{note.activities}</span></div>}
                    {note.behaviors && <div className="mb-2 text-sm"><span className="font-semibold text-xs" style={{ color: 'var(--text-tertiary)' }}>Behaviors:</span> <span style={{ color: 'var(--text-secondary)' }}>{note.behaviors}</span></div>}

                    <div className="flex gap-2 mt-3">
                      <button onClick={() => approveNote(note.id)} className="btn-primary btn-small flex items-center gap-1">
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>check</span> Approve &amp; Sign
                      </button>
                      <button onClick={() => rejectNote(note.id)} className="btn-ghost btn-small" style={{ border: '1px solid var(--border)' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>undo</span> Return
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
