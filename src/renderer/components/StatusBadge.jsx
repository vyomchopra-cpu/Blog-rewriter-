import React from 'react'

const STATUS_STYLES = {
  Queued:      'bg-[#2a2a2a] text-[#9ca3af]',
  Researching: 'bg-[#1e3a5f] text-[#60a5fa]',
  Writing:     'bg-[#1e3a2a] text-[#34d399]',
  Humanizing:  'bg-[#2e1e4a] text-[#c084fc]',
  Done:        'bg-[#14532d] text-[#22c55e]',
  Failed:      'bg-[#450a0a] text-[#ef4444]'
}

const DOTS = ['Researching', 'Writing', 'Humanizing']

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || STATUS_STYLES.Queued
  const isActive = DOTS.includes(status)

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {status}
    </span>
  )
}
