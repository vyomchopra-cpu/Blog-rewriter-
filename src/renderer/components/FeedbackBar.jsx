import React, { useState } from 'react'

export default function FeedbackBar({ inputs, finalHTML, accentColor }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [worked, setWorked] = useState('')
  const [saved, setSaved] = useState(false)

  async function save() {
    const personaName = inputs.personaId
    await window.electron.invoke('save-feedback', {
      entry: {
        keyword: inputs.keyword,
        brand: inputs.brand,
        geo: inputs.geo,
        persona: personaName,
        format: inputs.format,
        rating,
        notes,
        worked,
        excerpt: finalHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      }
    })
    setSaved(true)
    setTimeout(() => { setOpen(false); setSaved(false); setRating(0); setNotes(''); setWorked('') }, 1500)
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-full text-sm text-[#9ca3af] hover:text-[#f5f5f5] transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h6m-6 8l-3-3h13a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v13l4-4z" />
          </svg>
          Rate this article (trains the generator)
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className="text-xl transition-transform hover:scale-110"
                style={{ color: n <= rating ? '#f59e0b' : '#3a3a3a' }}
              >
                ★
              </button>
            ))}
            <span className="text-xs text-[#6b7280] ml-2">{rating ? `${rating}/5` : 'Rate it'}</span>
          </div>
          <textarea
            rows={2}
            placeholder="What needs fixing? (this becomes a rule the generator follows next time)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] resize-none"
          />
          <textarea
            rows={2}
            placeholder="What worked well? (optional — reinforces good patterns)"
            value={worked}
            onChange={e => setWorked(e.target.value)}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={save}
              disabled={!rating && !notes.trim()}
              className="text-sm px-4 py-1.5 rounded-lg text-white disabled:opacity-40"
              style={{ background: accentColor }}
            >
              Save Feedback
            </button>
            <button onClick={() => setOpen(false)} className="text-sm px-4 py-1.5 rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5]">
              Cancel
            </button>
            {saved && <span className="text-sm text-[#22c55e]">✓ Saved to feedback folder</span>}
          </div>
        </div>
      )}
    </div>
  )
}
