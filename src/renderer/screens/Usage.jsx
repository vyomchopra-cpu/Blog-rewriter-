import React, { useEffect, useState } from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

// Rough token estimate per call type (input+output) for a cost ballpark.
// Real per-token billing comes from the Anthropic console; this is a local guide.
const EST_TOKENS = { outline: 4000, draft: 9000, humanize: 9000, metadata: 2500, score: 10000, geo: 4000, other: 3000 }
// Sonnet 4.5 approx blended $/1M tokens (input+output mixed). Adjust as needed.
const USD_PER_MTOK = 9

export default function Usage({ accentColor = '#6366f1', config }) {
  const [usage, setUsage] = useState(null)
  const role = config?.currentRole || 'admin'

  async function load() {
    const u = await window.electron.invoke('usage-get')
    setUsage(u)
  }
  useEffect(() => { load() }, [])

  async function reset() {
    if (!confirm('Reset usage counters?')) return
    await window.electron.invoke('usage-reset')
    load()
  }

  if (!usage) return <div className="px-8 py-6 text-sm text-[#6b7280]">Loading…</div>

  const byType = usage.byType || {}
  const estTok = Object.entries(byType).reduce((sum, [t, n]) => sum + (EST_TOKENS[t] || EST_TOKENS.other) * n, 0)
  const estCost = (estTok / 1_000_000) * USD_PER_MTOK
  const days = Object.entries(usage.byDay || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7)
  const maxDay = Math.max(1, ...days.map(d => d[1]))

  const Stat = ({ label, value, sub }) => (
    <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
      <div className="text-xs text-[#9ca3af]">{label}</div>
      <div className="text-2xl font-semibold text-[#f5f5f5] mt-1">{value}</div>
      {sub && <div className="text-[11px] text-[#6b7280] mt-0.5">{sub}</div>}
    </div>
  )

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Usage & API Calls</h1>
        <div className="flex items-center gap-3">
          <FeatureFeedback feature="Usage dashboard" accentColor={accentColor} />
          <button onClick={reset} className="text-xs text-[#9ca3af] hover:text-[#ef4444]">Reset</button>
        </div>
      </div>
      <p className="text-sm text-[#9ca3af] mb-6">Tracks every Claude call this app makes. Cost is an estimate, the exact figure lives in your Anthropic console.</p>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Stat label="Total API calls" value={usage.totalCalls || 0} />
        <Stat label="Est. tokens" value={estTok.toLocaleString()} sub="input + output, rough" />
        <Stat label="Est. cost" value={`$${estCost.toFixed(2)}`} sub={`~$${USD_PER_MTOK}/M tokens`} />
        <Stat label="Last call" value={usage.lastCall ? new Date(usage.lastCall).toLocaleDateString() : '—'} sub={usage.lastCall ? new Date(usage.lastCall).toLocaleTimeString() : ''} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-sm font-medium text-[#f5f5f5] mb-3">Calls by type</div>
          {Object.keys(byType).length === 0 ? <div className="text-xs text-[#6b7280]">No calls yet.</div> : (
            <div className="space-y-2">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([t, n]) => (
                <div key={t} className="flex items-center justify-between text-sm">
                  <span className="text-[#9ca3af] capitalize">{t}</span>
                  <span className="text-[#f5f5f5]">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-4">
          <div className="text-sm font-medium text-[#f5f5f5] mb-3">Last 7 days</div>
          {days.length === 0 ? <div className="text-xs text-[#6b7280]">No activity yet.</div> : (
            <div className="space-y-2">
              {days.map(([d, n]) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="text-[11px] text-[#6b7280] w-16">{d.slice(5)}</span>
                  <div className="flex-1 h-2 bg-[#0f0f0f] rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(n / maxDay) * 100}%`, background: accentColor }} />
                  </div>
                  <span className="text-[11px] text-[#f5f5f5] w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-[11px] text-[#6b7280]">
        Nascent: counts are tracked per machine. {role === 'admin' ? 'Admin view of every writer’s usage' : 'Cross-account roll-up'} arrives with the online backend, where each account’s calls aggregate centrally.
      </p>
    </div>
  )
}
