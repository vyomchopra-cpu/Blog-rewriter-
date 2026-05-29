import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Browser/localhost shim: when not running inside Electron (no preload bridge),
// route window.electron.invoke(channel, ...args) to the local web server's HTTP API.
// The same renderer build then works in BOTH the desktop app and the localhost server.
if (!window.electron) {
  window.electron = {
    invoke: async (channel, ...args) => {
      if (channel === 'open-external') { try { window.open(args[0], '_blank') } catch (e) {} return }
      const res = await fetch('/api/' + channel, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args)
      })
      const data = await res.json().catch(() => ({ ok: false, error: 'Bad response from server' }))
      if (!data.ok) throw new Error(data.error || 'Request failed')
      return data.result
    }
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
