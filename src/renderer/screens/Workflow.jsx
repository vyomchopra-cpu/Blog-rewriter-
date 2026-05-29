import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

// Jira-style pipeline. Spectator drops keywords -> Admin assigns -> Writer drafts
// -> submits for review -> Admin approves/publishes. Nascent: local store only;
// real cross-account sync arrives with the online backend.
const COLUMNS = [
  { key: 'backlog',  label: 'Keywords',   hint: 'Spectator adds lost/target keywords' },
  { key: 'assigned', label: 'Assigned',   hint: 'Admin assigns to a writer' },
  { key: 'drafting', label: 'Drafting',   hint: 'Writer is generating' },
  { key: 'review',   label: 'In Review',  hint: 'Submitted to admin' },
  { key: 'done',     label: 'Approved / Published', hint: 'Admin approved' }
]
const ORDER = COLUMNS.map(c => c.key)

export default function Workflow({ accentColor = '#6366f1', config }) {
  const role = config?.currentRole || 'admin'
  const me = config?.accountName || config?.accountId || role
  const [items, setItems] = useState([])
  const [kw, setKw] = useState('')
  const [brand, setBrand] = useState('MIS')
  const [geo, setGeo] = useState('India')
  const navigate = useNavigate()

  async function load() {
    const list = await window.electron.invoke('state-get', { key: 'workflowItems', def: [] })
    setItems(Array.isArray(list) ? list : [])
  }
  useEffect(() => { load() }, [])

  async function persist(next) {
    setItems(next)
    await window.electron.invoke('state-set', { key: 'workflowItems', value: next })
  }

  async function addKeyword() {
    if (!kw.trim()) return
    const item = {
      id: Date.now().toString(36),
      keyword: kw.trim(), brand, geo,
      status: 'backlog', assignee: '', createdBy: me, at: new Date().toISOString()
    }
    await persist([item, ...items])
    setKw('')
  }

  async function move(id, dir) {
    const next = items.map(it => {
      if (it.id !== id) return it
      const i = ORDER.indexOf(it.status)
      const ni = Math.max(0, Math.min(ORDER.length - 1, i + dir))
      return { ...it, status: ORDER[ni] }
    })
    await persist(next)
  }

  async function assignTo(id, name) {
    const next = items.map(it => it.id === id ? { ...it, assignee: name, status: it.status === 'backlog' ? 'assigned' : it.status } : it)
    await persist(next)
  }

  async function remove(id) {
    await persist(items.filter(it => it.id !== id))
  }

  const colItems = key => items.filter(it => it.status === key)

  return (
    <div className="h-full flex flex-col">
      <div className="px-8 py-5 border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#f5f5f5]">Workflow</h1>
            <p className="text-sm text-[#9ca3af] mt-0.5">Keywords → assign → draft → review → publish. You are acting as <span style={{ color: accentColor }}>{role}</span>.</p>
          </div>
          <FeatureFeedback feature="Workflow board (Jira-style)" accentColor={accentColor} />
        </div>

        {/* Add keyword (spectator / admin) */}
        {(role === 'spectator' || role === 'admin') && (
          <div className="flex items-center gap-2 mt-4">
            <input value={kw} onChange={e => setKw(e.target.value)} onKeyDown={e => e.key === 'Enter' && addKeyword()} placeholder="Add a lost/target keyword…" className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5]" />
            <select value={brand} onChange={e => setBrand(e.target.value)} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-2 text-sm text-[#f5f5f5]">
              <option value="MIS">MoveInSync</option>
              <option value="WIS">WorkInSync</option>
            </select>
            <select value={geo} onChange={e => setGeo(e.target.value)} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-2 py-2 text-sm text-[#f5f5f5]">
              <option value="India">India</option>
              <option value="US">US</option>
            </select>
            <button onClick={addKeyword} className="text-sm px-4 py-2 rounded-lg text-white" style={{ background: accentColor }}>Add</button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-6 py-4 min-w-max">
          {COLUMNS.map(col => (
            <div key={col.key} className="w-64 flex-shrink-0 flex flex-col bg-[#141414] border border-[#2a2a2a] rounded-xl">
              <div className="px-3 py-2.5 border-b border-[#2a2a2a]">
                <div className="text-sm font-medium text-[#f5f5f5] flex items-center justify-between">
                  {col.label}
                  <span className="text-xs text-[#6b7280]">{colItems(col.key).length}</span>
                </div>
                <div className="text-[10px] text-[#6b7280] mt-0.5">{col.hint}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colItems(col.key).map(it => (
                  <div key={it.id} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-sm text-[#f5f5f5] leading-snug">{it.keyword}</span>
                      <button onClick={() => remove(it.id)} className="text-[#6b7280] hover:text-[#ef4444] text-xs">✕</button>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: it.brand === 'WIS' ? '#10b981' : '#6366f1' }}>{it.brand}</span>
                      <span className="text-[10px] text-[#6b7280]">{it.geo}</span>
                    </div>
                    {it.assignee && <div className="text-[10px] text-[#9ca3af] mt-1">→ {it.assignee}</div>}

                    {/* Admin assign */}
                    {role === 'admin' && col.key === 'backlog' && (
                      <input placeholder="assign to…" onKeyDown={e => { if (e.key === 'Enter') assignTo(it.id, e.target.value) }} className="mt-1.5 w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded px-1.5 py-1 text-[11px] text-[#f5f5f5]" />
                    )}

                    <div className="flex items-center justify-between mt-2">
                      <button onClick={() => move(it.id, -1)} disabled={col.key === 'backlog'} className="text-[11px] text-[#9ca3af] hover:text-[#f5f5f5] disabled:opacity-30">‹ back</button>
                      {col.key === 'drafting' && (
                        <button onClick={() => navigate('/new')} className="text-[11px] px-2 py-0.5 rounded text-white" style={{ background: accentColor }}>Write</button>
                      )}
                      <button onClick={() => move(it.id, 1)} disabled={col.key === 'done'} className="text-[11px] text-[#9ca3af] hover:text-[#f5f5f5] disabled:opacity-30">next ›</button>
                    </div>
                  </div>
                ))}
                {colItems(col.key).length === 0 && <div className="text-[11px] text-[#6b7280] text-center py-4">Empty</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
