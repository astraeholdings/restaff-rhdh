// Logging utility for the application
class Logger {
  constructor() {
    this.logs = []
    this.maxLogs = 500
    this.isDev = import.meta.env.DEV
    this.loadFromStorage()
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('app_logs')
      if (stored) {
        this.logs = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load logs from storage:', e)
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem('app_logs', JSON.stringify(this.logs.slice(-this.maxLogs)))
    } catch (e) {
      console.error('Failed to save logs to storage:', e)
    }
  }

  addLog(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      url: window.location.pathname,
    }

    this.logs.push(logEntry)
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Always log to console
    const style = this.getConsoleStyle(level)
    console.log(
      `%c[${timestamp}] ${level}: ${message}`,
      style,
      data || ''
    )

    this.saveToStorage()
  }

  getConsoleStyle(level) {
    const styles = {
      DEBUG: 'color: #888; font-size: 12px;',
      INFO: 'color: #0066cc; font-weight: bold;',
      WARN: 'color: #ff9900; font-weight: bold;',
      ERROR: 'color: #cc0000; font-weight: bold;',
      SUCCESS: 'color: #00cc00; font-weight: bold;',
    }
    return styles[level] || styles.INFO
  }

  debug(message, data) {
    if (this.isDev) {
      this.addLog('DEBUG', message, data)
    }
  }

  info(message, data) {
    this.addLog('INFO', message, data)
  }

  warn(message, data) {
    this.addLog('WARN', message, data)
  }

  error(message, data) {
    this.addLog('ERROR', message, data)
  }

  success(message, data) {
    this.addLog('SUCCESS', message, data)
  }

  getLogs(filter = null) {
    if (!filter) return this.logs
    return this.logs.filter(log => log.level === filter)
  }

  getRecentLogs(count = 50) {
    return this.logs.slice(-count)
  }

  clearLogs() {
    this.logs = []
    localStorage.removeItem('app_logs')
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()
