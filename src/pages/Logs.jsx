import React, { useState, useEffect } from 'react'
import { logger } from '../lib/logger'

export function Logs() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const loadLogs = () => {
      const allLogs = logger.getLogs()
      setLogs(filter === 'all' ? allLogs : logger.getLogs(filter))
    }
    loadLogs()
    if (autoRefresh) { const interval = setInterval(loadLogs, 1000); return () => clearInterval(interval) }
  }, [filter, autoRefresh])

  const handleClearLogs = () => { if (window.confirm('Clear all logs?')) { logger.clearLogs(); setLogs([]) } }

  const handleExport = () => {
    const data = logger.exportLogs()
    const el = document.createElement('a')
    el.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data))
    el.setAttribute('download', `logs-${new Date().toISOString()}.json`)
    el.style.display = 'none'; document.body.appendChild(el); el.click(); document.body.removeChild(el)
  }

  const levelConfig = {
    DEBUG: { color: 'var(--text-tertiary)', bg: 'var(--surface)', icon: 'bug_report', border: 'var(--border)' },
    INFO: { color: 'var(--info)', bg: 'var(--info-light)', icon: 'info', border: '#93c5fd' },
    SUCCESS: { color: 'var(--success)', bg: 'var(--success-light)', icon: 'check_circle', border: '#86efac' },
    WARN: { color: '#d97706', bg: 'var(--warning-light)', icon: 'warning', border: '#fde68a' },
    ERROR: { color: 'var(--danger)', bg: 'var(--danger-light)', icon: 'error', border: '#fca5a5' },
  }

  const stats = [
    { label: 'Total', value: logs.length, color: 'var(--text-primary)', icon: 'analytics' },
    { label: 'Errors', value: logs.filter(l => l.level === 'ERROR').length, color: 'var(--danger)', icon: 'error' },
    { label: 'Warnings', value: logs.filter(l => l.level === 'WARN').length, color: '#d97706', icon: 'warning' },
    { label: 'Success', value: logs.filter(l => l.level === 'SUCCESS').length, color: 'var(--success)', icon: 'check_circle' },
    { label: 'Info', value: logs.filter(l => l.level === 'INFO').length, color: 'var(--info)', icon: 'info' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1>Application Logs</h1>
        <p>Real-time application logs for debugging</p>
      </div>

      {/* Controls */}
      <div className="card flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <div className="relative">
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} className="sr-only" />
              <div className="w-9 h-5 rounded-full transition-colors" style={{ background: autoRefresh ? 'var(--primary)' : 'var(--border)' }}>
                <div className="absolute w-4 h-4 bg-white rounded-full top-0.5 transition-transform shadow-sm" style={{ transform: autoRefresh ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
            </div>
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Live</span>
          </label>

          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="form-input text-xs py-1.5 px-3 w-auto">
            <option value="all">All Logs</option>
            <option value="DEBUG">Debug</option>
            <option value="INFO">Info</option>
            <option value="SUCCESS">Success</option>
            <option value="WARN">Warnings</option>
            <option value="ERROR">Errors</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-ghost btn-small flex items-center gap-1.5" style={{ border: '1px solid var(--border)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>download</span> Export
          </button>
          <button onClick={handleClearLogs} className="btn-ghost btn-small flex items-center gap-1.5" style={{ border: '1px solid var(--border)', color: 'var(--danger)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '16px' }}>delete</span> Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2">
        {stats.map(stat => (
          <div key={stat.label} className="card text-center py-3">
            <span className="material-symbols-rounded" style={{ fontSize: '18px', color: stat.color }}>{stat.icon}</span>
            <p className="text-xl font-bold mt-1" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Log Entries */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ background: '#0c1222', border: '1px solid #1e293b', maxHeight: '600px', overflowY: 'auto' }}
      >
        {logs.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-rounded" style={{ fontSize: '48px', color: '#334155', display: 'block', marginBottom: '8px' }}>terminal</span>
            <p className="text-sm" style={{ color: '#475569' }}>No logs yet. Application logs will appear here.</p>
          </div>
        ) : (
          <div className="p-2 space-y-0.5 font-mono text-xs">
            {logs.map((log, idx) => {
              const lc = levelConfig[log.level] || levelConfig.INFO
              return (
                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg transition-colors" style={{ background: 'transparent' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: '14px', color: lc.color, marginTop: '2px', flexShrink: 0 }}>{lc.icon}</span>
                  <span className="font-bold" style={{ color: lc.color, width: '56px', flexShrink: 0 }}>{log.level}</span>
                  <span style={{ color: '#64748b', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span style={{ color: '#e2e8f0', flex: 1, wordBreak: 'break-word' }}>{log.message}</span>
                  {log.data && (
                    <details className="inline ml-2 flex-shrink-0">
                      <summary className="cursor-pointer" style={{ color: '#64748b' }}>▸</summary>
                      <pre className="p-2 rounded mt-1 text-xs overflow-x-auto" style={{ background: '#1e293b', color: '#e2e8f0' }}>{JSON.stringify(log.data, null, 2)}</pre>
                    </details>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="alert alert-info">
        <span className="material-symbols-rounded" style={{ fontSize: '20px', color: 'var(--info)' }}>help</span>
        <div className="text-xs space-y-0.5">
          <p><strong>Live:</strong> Auto-updates logs in real-time</p>
          <p><strong>Filter:</strong> View specific log levels</p>
          <p><strong>Export:</strong> Download logs as JSON</p>
          <p><strong>Storage:</strong> Browser storage, up to 500 entries</p>
        </div>
      </div>
    </div>
  )
}
