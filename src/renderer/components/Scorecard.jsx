import React from 'react'

function scoreColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function sevColor(sev) {
  return sev === 'high' ? '#ef4444' : sev === 'medium' ? '#f59e0b' : '#9ca3af'
}

export default function Scorecard({ lint, score, scoring, onRunScore }) {
  return (
    <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#f5f5f5]">Quality Check</h3>
        {lint && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6b7280]">Lint</span>
            <span className="text-sm font-bold" style={{ color: scoreColor(lint.score) }}>{lint.score}</span>
          </div>
        )}
      </div>

      {/* Free local lint */}
      {lint && (
        <div className="space-y-1.5">
          {lint.issues.length === 0 ? (
            <div className="text-xs text-[#22c55e]">No AI-tells detected. Clean.</div>
          ) : (
            lint.issues.map((iss, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: sevColor(iss.severity) }} />
                <span className="text-[#d1d5db]">{iss.label}</span>
              </div>
            ))
          )}
          <div className="text-xs text-[#6b7280] pt-1">
            {lint.stats.wordCount} words · {lint.stats.headings} H2s · keyword ×{lint.stats.keywordCount}
          </div>
        </div>
      )}

      <div className="border-t border-[#2a2a2a] pt-3">
        {!score ? (
          <button
            onClick={onRunScore}
            disabled={scoring}
            className="w-full py-2 text-xs font-medium rounded-lg border border-[#2a2a2a] text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {scoring ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Scoring…
              </>
            ) : 'Run AI Self-Critique (1 API call)'}
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#6b7280] uppercase tracking-wide">AI Critique</span>
              <span className="text-lg font-bold" style={{ color: scoreColor(score.overall) }}>{score.overall}</span>
            </div>
            {score.dimensions && Object.entries(score.dimensions).map(([key, dim]) => (
              <div key={key}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#d1d5db] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className="font-medium" style={{ color: scoreColor(dim.score) }}>{dim.score}</span>
                </div>
                <div className="h-1 bg-[#0f0f0f] rounded mt-1 overflow-hidden">
                  <div className="h-full rounded" style={{ width: `${dim.score}%`, background: scoreColor(dim.score) }} />
                </div>
                {dim.note && <p className="text-xs text-[#6b7280] mt-0.5">{dim.note}</p>}
              </div>
            ))}

            {score.topFixes?.length > 0 && (
              <div>
                <div className="text-xs font-medium text-[#9ca3af] uppercase tracking-wide mb-1">Top Fixes</div>
                <ul className="space-y-1">
                  {score.topFixes.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#d1d5db]">
                      <span className="text-[#f59e0b] flex-shrink-0">→</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button onClick={onRunScore} disabled={scoring} className="text-xs text-[#6b7280] hover:text-[#9ca3af] transition-colors">
              {scoring ? 'Re-scoring…' : 'Re-run critique'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
