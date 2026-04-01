import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format, startOfWeek, addWeeks, parseISO } from 'date-fns'

export function Grocery() {
  const { activeHome } = useHome()
  const [items, setItems] = useState([])
  const [weekOf, setWeekOf] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [formData, setFormData] = useState({ name: '', category: 'produce', quantity: '', unit: '', purchased: false })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const categories = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'household', 'other']
  const categoryIcons = { produce: 'nutrition', dairy: 'water_drop', meat: 'set_meal', pantry: 'kitchen', frozen: 'ac_unit', beverages: 'local_cafe', household: 'home', other: 'more_horiz' }

  useEffect(() => { if (!activeHome?.id) return; fetchGroceryItems() }, [activeHome?.id, weekOf])

  const fetchGroceryItems = async () => { const { data } = await supabase.from('grocery_items').select('*').eq('home_id', activeHome.id).eq('week_of', weekOf).order('category, name'); setItems(data || []) }

  const handleAddItem = async (e) => {
    e.preventDefault(); setError(null); setSuccess(null); setLoading(true)
    try {
      const { error } = await supabase.from('grocery_items').insert([{ home_id: activeHome.id, week_of: weekOf, ...formData }])
      if (error) throw error
      setSuccess('Item added'); setFormData({ name: '', category: 'produce', quantity: '', unit: '', purchased: false })
      setTimeout(() => setSuccess(null), 3000); await fetchGroceryItems()
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const togglePurchased = async (id, currentStatus) => {
    try { await supabase.from('grocery_items').update({ purchased: !currentStatus }).eq('id', id); await fetchGroceryItems() } catch (err) { console.error(err) }
  }

  const deleteItem = async (id) => {
    try { await supabase.from('grocery_items').delete().eq('id', id); await fetchGroceryItems() } catch (err) { console.error(err) }
  }

  const groupedItems = categories.reduce((acc, cat) => { acc[cat] = items.filter(item => item.category === cat); return acc }, {})
  const purchasedCount = items.filter(i => i.purchased).length
  const progress = items.length > 0 ? (purchasedCount / items.length) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Grocery List</h1>
        <p>Week of {format(parseISO(weekOf), 'MMM d')} – {format(addWeeks(parseISO(weekOf), 1), 'MMM d, yyyy')}</p>
      </div>

      {/* Week selector + progress */}
      <div className="card flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <input type="date" value={weekOf} onChange={(e) => setWeekOf(e.target.value)} className="form-input w-auto" />
        <div className="flex items-center gap-4 flex-1 md:justify-end">
          <div className="flex-1 max-w-48">
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--border-light)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary) 0%, var(--success) 100%)' }} />
            </div>
          </div>
          <span className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--primary)' }}>{purchasedCount}/{items.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--primary)' }}>add_shopping_cart</span>
              Add Item
            </h2>

            {error && <div className="alert alert-error mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>{error}</div>}
            {success && <div className="alert alert-success mb-4"><span className="material-symbols-rounded" style={{ fontSize: '18px' }}>check_circle</span>{success}</div>}

            <form onSubmit={handleAddItem} className="space-y-3 text-sm">
              <div><label className="form-label">Item Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="form-input" required /></div>
              <div><label className="form-label">Category</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="form-input">{categories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="form-label">Qty</label><input type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} className="form-input" min="1" /></div>
                <div><label className="form-label">Unit</label><input type="text" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="form-input" placeholder="lb, oz" /></div>
              </div>
              <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? 'Adding...' : 'Add Item'}</button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              categoryItems.length > 0 && (
                <div key={category} className="card">
                  <h3 className="font-semibold capitalize mb-3 flex items-center gap-2">
                    <span className="material-symbols-rounded" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>{categoryIcons[category]}</span>
                    {category}
                    <span className="badge badge-neutral ml-auto">{categoryItems.length}</span>
                  </h3>
                  <div className="space-y-1.5">
                    {categoryItems.map(item => (
                      <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-lg transition-all" style={{ background: item.purchased ? 'var(--success-light)' : 'var(--surface)', border: `1px solid ${item.purchased ? '#bbf7d0' : 'var(--border-light)'}` }}>
                        <input type="checkbox" checked={item.purchased} onChange={() => togglePurchased(item.id, item.purchased)} className="checkbox-custom" />
                        <div className="flex-1">
                          <p className="text-sm" style={{ color: item.purchased ? 'var(--success)' : 'var(--text-primary)', textDecoration: item.purchased ? 'line-through' : 'none' }}>{item.name}</p>
                          {(item.quantity || item.unit) && <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{item.quantity} {item.unit}</p>}
                        </div>
                        <button onClick={() => deleteItem(item.id)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-tertiary)' }}
                          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
                          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {items.length === 0 && (
              <div className="card empty-state"><span className="empty-icon material-symbols-rounded" style={{ fontSize: '48px' }}>shopping_bag</span><p>No items on list yet</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
