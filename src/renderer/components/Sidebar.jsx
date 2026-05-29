import React from 'react'
import { NavLink } from 'react-router-dom'

function Icon({ d }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={d} />
    </svg>
  )
}

const NAV = [
  { to: '/new', label: 'New Article', d: 'M12 4v16m8-8H4' },
  { to: '/recents', label: 'Recents', d: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/bulk', label: 'Bulk Queue', d: 'M4 6h16M4 10h16M4 14h8' },
  { to: '/workflow', label: 'Workflow', d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { to: '/geo', label: 'GEO Hacker', d: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: '/knowledge', label: 'Context & Feedback', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { to: '/customize', label: 'Customize', d: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z' },
  { to: '/usage', label: 'Usage', d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { to: '/changelog', label: 'Changelog', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { to: '/settings', label: 'Settings', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
]

// Nascent (early-build) sections get an amber dot so writers know what's still raw.
const NASCENT = new Set(['/recents', '/workflow', '/geo', '/usage', '/customize', '/changelog'])

function modelLabel(m) {
  if (!m) return 'Sonnet 4.5'
  if (m.includes('haiku')) return 'Haiku 4.5'
  if (m.includes('opus')) return 'Opus'
  if (m.includes('sonnet')) return 'Sonnet 4.5'
  return m
}

const ROLES = [
  { key: 'admin', label: 'Admin (review + publish)' },
  { key: 'writer', label: 'Writer (draft + submit)' },
  { key: 'spectator', label: 'Spectator (keywords + SEO geo)' }
]

export default function Sidebar({ config, accentColor, onRoleChange }) {
  async function changeRole(e) {
    await window.electron.invoke('save-config', { currentRole: e.target.value })
    if (onRoleChange) onRoleChange()
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-[#141414] border-r border-[#2a2a2a] flex flex-col">
      <div className="px-5 pt-6 pb-4 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: accentColor }}>
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <span className="font-semibold text-sm text-[#f5f5f5]">Blog Generator</span>
        </div>
      </div>

      {/* Role switcher (nascent local sim of the 3 accounts) */}
      <div className="px-3 pt-3">
        <label className="block text-[10px] uppercase tracking-wide text-[#6b7280] px-1 mb-1">Acting as</label>
        <select value={config?.currentRole || 'admin'} onChange={changeRole} className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-xs text-[#f5f5f5]">
          {ROLES.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </div>

      <nav className="flex-1 px-3 pt-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive ? 'text-[#f5f5f5] font-medium' : 'text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#1f1f1f]'
              }`
            }
            style={({ isActive }) => isActive ? { background: `${accentColor}22`, color: accentColor } : {}}
          >
            <Icon d={item.d} />
            <span className="flex-1">{item.label}</span>
            {NASCENT.has(item.to) && <span title="Nascent — early build, shape it with the Feedback button" className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#f59e0b' }} />}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-[#2a2a2a] space-y-2">
        <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${config?.anthropicApiKey ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
          <span>{config?.anthropicApiKey ? 'API Connected' : 'No API Key'}</span>
        </div>
        <div className="text-xs text-[#6b7280] truncate">
          {modelLabel(config?.model)}{config?.fastModel ? ` + ${modelLabel(config.fastModel)}` : ''}
        </div>
      </div>
    </aside>
  )
}
