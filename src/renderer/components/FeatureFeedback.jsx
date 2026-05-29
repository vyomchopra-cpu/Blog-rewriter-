import React, { useState } from 'react'

// A tiny feedback affordance to drop beside any nascent / new feature.
// Clicking it opens a one-line note box; the note is saved into the
// blog-data/feedback/ folder (tagged with the feature name) so it shows up
// in the weekly tuning pull. Keeps every half-built feature improvable.
export default function FeatureFeedback({ feature, accentColor = '#6366f1', compact = false }) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!note.trim()) return
    await window.electron.invoke('save-feedback', {
      entry: {
        keyword: `[FEATURE] ${feature}`,
        brand: '',
        geo: '',
        persona: '',
        format: 'feature-feedback',
        rating: '',
        notes: note.trim(),
        worked: '',
        excerpt: `Feature feedback on "${feature}"`
      }
    })
    setSaved(true)
    setNote('')
    setTimeout(() => { setOpen(false); setSaved(false) }, 1400)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title={`Leave feedback on "${feature}" — saved for the weekly tuning pull`}
        className={`inline-flex items-center gap-1 rounded-md border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:border-[#3a3a3a] transition-colors ${compact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'}`}
      >
        <svg className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h6m-6 8l-3-3h13a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v13l4-4z" />
        </svg>
        Feedback
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5">
      <input
        autoFocus
        value={note}
        onChange={e => setNote(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
        placeholder={`What should change about "${feature}"?`}
        className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-[#f5f5f5] w-72"
      />
      <button onClick={save} disabled={!note.trim()} className="text-xs px-2.5 py-1 rounded-md text-white disabled:opacity-40" style={{ background: accentColor }}>Save</button>
      <button onClick={() => setOpen(false)} className="text-xs text-[#6b7280] hover:text-[#f5f5f5]">✕</button>
      {saved && <span className="text-xs text-[#22c55e]">✓ Saved</span>}
    </div>
  )
}
