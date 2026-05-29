import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

const STATUS_COLORS = {
  draft: '#6b7280',
  generated: '#3b82f6',
  published: '#22c55e',
  review: '#f59e0b'
}

export default function Recents({ accentColor = '#6366f1', config }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  async function load() {
    setLoading(true)
    const list = await window.electron.invoke('state-get', { key: 'recents', def: [] })
    setItems(Array.isArray(list) ? list : [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function clearAll() {
    if (!confirm('Clear all recent history? This only clears the list, not published articles.')) return
    await window.electron.invoke('state-set', { key: 'recents', value: [] })
    load()
  }

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Recents</h1>
        <div className="flex items-center gap-3">
          <FeatureFeedback feature="Recents tab" accentColor={accentColor} />
          {items.length > 0 && (
            <button onClick={clearAll} className="text-xs text-[#9ca3af] hover:text-[#ef4444]">Clear history</button>
          )}
        </div>
      </div>
      <p className="text-sm text-[#9ca3af] mb-6">Every article you generate lands here, newest first. Like ChatGPT history, but for blogs.</p>

      {loading ? (
        <div className="text-sm text-[#6b7280]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-[#2a2a2a] rounded-xl p-10 text-center">
          <p className="text-sm text-[#9ca3af]">No articles yet.</p>
          <button onClick={() => navigate('/new')} className="mt-3 text-sm px-4 py-2 rounded-lg text-white" style={{ background: accentColor }}>Create your first article</button>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="flex items-center gap-3 bg-[#161616] border border-[#2a2a2a] rounded-xl px-4 py-3 hover:border-[#3a3a3a] transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#f5f5f5] truncate">{it.keyword || '(untitled)'}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full text-white" style={{ background: it.brand === 'WIS' ? '#10b981' : '#6366f1' }}>{it.brand || '—'}</span>
                  {it.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${STATUS_COLORS[it.status] || '#6b7280'}22`, color: STATUS_COLORS[it.status] || '#6b7280' }}>{it.status}</span>
                  )}
                </div>
                <div className="text-xs text-[#6b7280] mt-0.5">
                  {it.geo ? `${it.geo} · ` : ''}{it.format ? `${it.format} · ` : ''}{it.wordCount ? `${it.wordCount} words · ` : ''}{new Date(it.at).toLocaleString()}
                </div>
              </div>
              {it.wpUrl && (
                <button onClick={() => window.electron.invoke('open-external', it.wpUrl)} className="text-xs text-[#9ca3af] hover:text-[#f5f5f5] border border-[#2a2a2a] rounded-md px-2 py-1">Open in WP</button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-6 text-[11px] text-[#6b7280]">Nascent: stores metadata of each run locally. Re-opening the full editable draft from history arrives with the online migration (shared history across all three accounts).</p>
    </div>
  )
}
