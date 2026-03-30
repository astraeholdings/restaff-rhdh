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

    if (autoRefresh) {
      const interval = setInterval(loadLogs, 1000)
      return () => clearInterval(interval)
    }
  }, [filter, autoRefresh])

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all logs?')) {
      logger.clearLogs()
      setLogs([])
    }
  }

  const handleExport = () => {
    const data = logger.exportLogs()
    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(data))
    element.setAttribute('download', `logs-${new Date().toISOString()}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'DEBUG':
        return 'text-gray-500'
      case 'INFO':
        return 'text-blue-600'
      case 'SUCCESS':
        return 'text-green-600'
      case 'WARN':
        return 'text-yellow-600'
      case 'ERROR':
        return 'text-red-600'
      default:
        return 'text-gray-700'
    }
  }

  const getLevelBg = (level) => {
    switch (level) {
      case 'DEBUG':
        return 'bg-gray-100'
      case 'INFO':
        return 'bg-blue-50'
      case 'SUCCESS':
        return 'bg-green-50'
      case 'WARN':
        return 'bg-yellow-50'
      case 'ERROR':
        return 'bg-red-50'
      default:
        return 'bg-gray-50'
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-serif font-bold mb-2">Application Logs</h1>
        <p className="text-gray-600">View real-time application logs for debugging</p>
      </div>

      {/* Controls */}
      <div className="card flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto-refresh</span>
          </label>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="form-input text-sm py-1 px-2"
          >
            <option value="all">All Logs</option>
            <option value="DEBUG">Debug Only</option>
            <option value="INFO">Info Only</option>
            <option value="SUCCESS">Success Only</option>
            <option value="WARN">Warnings Only</option>
            <option value="ERROR">Errors Only</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={handleExport} className="btn-secondary text-sm py-2">
            📥 Export
          </button>
          <button onClick={handleClearLogs} className="btn-secondary text-sm py-2">
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="card text-center">
          <p className="text-xs text-gray-600">Total</p>
          <p className="text-lg font-bold">{logs.length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-600">Errors</p>
          <p className="text-lg font-bold text-red-600">{logs.filter(l => l.level === 'ERROR').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-600">Warnings</p>
          <p className="text-lg font-bold text-yellow-600">{logs.filter(l => l.level === 'WARN').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-600">Success</p>
          <p className="text-lg font-bold text-green-600">{logs.filter(l => l.level === 'SUCCESS').length}</p>
        </div>
        <div className="card text-center">
          <p className="text-xs text-gray-600">Info</p>
          <p className="text-lg font-bold text-blue-600">{logs.filter(l => l.level === 'INFO').length}</p>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-1 max-h-[600px] overflow-y-auto">
        {logs.length === 0 ? (
          <div className="card text-center py-8 text-gray-600">
            No logs yet. Application logs will appear here.
          </div>
        ) : (
          logs.map((log, idx) => (
            <div
              key={idx}
              className={`${getLevelBg(log.level)} border-l-4 p-3 rounded text-sm font-mono`}
              style={{
                borderLeftColor: log.level === 'ERROR' ? '#dc2626' : log.level === 'WARN' ? '#f59e0b' : log.level === 'SUCCESS' ? '#16a34a' : '#3b82f6',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex gap-2 items-start">
                    <span className={`font-bold text-xs ${getLevelColor(log.level)} whitespace-nowrap`}>
                      {log.level}
                    </span>
                    <span className="text-gray-600 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-900 break-words mt-1">{log.message}</p>
                  {log.data && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-gray-600 hover:text-gray-900">
                        Details
                      </summary>
                      <pre className="bg-white p-2 rounded mt-1 text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border border-blue-200">
        <h3 className="font-medium mb-2">📋 How to Use Logs</h3>
        <ul className="text-sm space-y-1 text-gray-700">
          <li>• <strong>Auto-refresh:</strong> Automatically updates logs in real-time</li>
          <li>• <strong>Filter:</strong> View specific types of log messages</li>
          <li>• <strong>Export:</strong> Download logs as JSON for sharing/analysis</li>
          <li>• <strong>Details:</strong> Click "Details" to expand log data</li>
          <li>• <strong>Storage:</strong> Logs are saved in browser storage (up to 500 entries)</li>
        </ul>
      </div>
    </div>
  )
}
