import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useHome } from '../context/HomeContext'
import { format, startOfWeek, addWeeks } from 'date-fns'

export function Grocery() {
  const { activeHome } = useHome()
  const [items, setItems] = useState([])
  const [weekOf, setWeekOf] = useState(format(startOfWeek(new Date()), 'yyyy-MM-dd'))
  const [formData, setFormData] = useState({
    name: '',
    category: 'produce',
    quantity: '',
    unit: '',
    purchased: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const categories = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverages', 'household', 'other']

  useEffect(() => {
    if (!activeHome?.id) return
    fetchGroceryItems()
  }, [activeHome?.id, weekOf])

  const fetchGroceryItems = async () => {
    const { data, error } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('home_id', activeHome.id)
      .eq('week_of', weekOf)
      .order('category, name')

    if (error) console.error('Error:', error)
    else setItems(data || [])
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const { error } = await supabase.from('grocery_items').insert([
        {
          home_id: activeHome.id,
          week_of: weekOf,
          ...formData,
        },
      ])

      if (error) throw error

      setSuccess('Item added to list')
      setFormData({
        name: '',
        category: 'produce',
        quantity: '',
        unit: '',
        purchased: false,
      })
      setTimeout(() => setSuccess(null), 3000)
      await fetchGroceryItems()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const togglePurchased = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .update({ purchased: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await fetchGroceryItems()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase.from('grocery_items').delete().eq('id', id)
      if (error) throw error
      await fetchGroceryItems()
    } catch (err) {
      console.error('Error:', err)
    }
  }

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(item => item.category === cat)
    return acc
  }, {})

  const purchasedCount = items.filter(i => i.purchased).length

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-serif font-bold">Grocery List</h1>

      <div className="flex gap-4 items-center">
        <input
          type="date"
          value={weekOf}
          onChange={(e) => setWeekOf(e.target.value)}
          className="form-input w-32"
        />
        <div className="text-sm text-gray-600">
          Week of {format(new Date(weekOf), 'MMM d')} - {format(addWeeks(new Date(weekOf), 1), 'MMM d, yyyy')}
        </div>
        <div className="ml-auto text-sm font-medium">
          <span className="text-primary">{purchasedCount}</span> / <span className="text-gray-600">{items.length}</span> purchased
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Item Form */}
        <div className="lg:col-span-1">
          <div className="card sticky top-6">
            <h2 className="font-serif font-bold text-lg mb-4">Add Item</h2>

            {error && <div className="mb-4 p-3 bg-red-light text-white rounded text-sm">{error}</div>}
            {success && <div className="mb-4 p-3 bg-green-600 text-white rounded text-sm">{success}</div>}

            <form onSubmit={handleAddItem} className="space-y-3 text-sm">
              <div>
                <label className="form-label">Item Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="form-input"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="form-label">Qty</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="form-input"
                    min="1"
                  />
                </div>
                <div>
                  <label className="form-label">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-input"
                    placeholder="lb, oz, etc"
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Adding...' : 'Add Item'}
              </button>
            </form>
          </div>
        </div>

        {/* Grocery List */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              categoryItems.length > 0 && (
                <div key={category} className="card">
                  <h3 className="font-medium capitalize mb-3">{category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded border ${
                          item.purchased ? 'bg-gray-50 border-gray-200' : 'border-gray-200'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.purchased}
                          onChange={() => togglePurchased(item.id, item.purchased)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${item.purchased ? 'line-through text-gray-500' : ''}`}>
                            {item.name}
                          </p>
                          {(item.quantity || item.unit) && (
                            <p className="text-xs text-gray-600">
                              {item.quantity} {item.unit}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="text-gray-400 hover:text-red-600 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {items.length === 0 && (
              <div className="card text-center py-8">
                <p className="text-gray-600">No items on list yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
