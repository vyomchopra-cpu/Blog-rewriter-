import React from 'react'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

// Keep this in sync with CHANGELOG.md at the project root.
const RELEASES = [
  {
    version: 'v2.1 — "First week updates" (nascent)',
    date: '2026-05-28',
    groups: [
      { tag: 'Fixed', items: [
        'Length control: target word count is now enforced (dynamic token ceiling + hard min/max range). No more 1200 → 1800 overshoot.',
        'Em dashes: a deterministic cleanup now strips every em/en dash regardless of the humanization toggle, so the AI lint and the actual copy finally agree.'
      ] },
      { tag: 'New', items: [
        'Newsletter and One-Pager (tech informatics) article formats.',
        'Content-size length tiers (small / medium / large / x-large).',
        'Recents tab — ChatGPT-style history of every generation.',
        'Roles (Admin / Writer / Spectator) with a local role switcher.',
        'Workflow board — Jira-style keywords → assign → draft → review → publish.',
        'Usage dashboard — API calls, estimated tokens and cost, last-7-days.',
        'GEO Hacker — citation-ready collateral for AI answer engines.',
        'Knowledge base categories (files / documents / collaterals / specs) + per-format folders.',
        'Editable custom personas, keywords, and writing styles.',
        'Inline highlight-edit and a Revise page on the article.',
        'A “Feedback” button beside every new feature — notes save to your weekly tuning folder.'
      ] },
      { tag: 'Note', items: [
        'Cross-account features (shared workflow, admin-sees-all, central usage) run as local scaffolds until the online backend is switched on.'
      ] }
    ]
  },
  {
    version: 'v2.0 — Context & quality layer',
    date: '2026-05-27',
    groups: [
      { tag: 'New', items: [
        'Live blog-data/ knowledge folder injected into every generation.',
        'Feedback bar + auto-saved feedback files.',
        'Free local lint + on-demand AI self-critique scorecard.',
        'Output controls: temperature, max tokens, humanization toggle, reading level, tone, standing instructions.'
      ] }
    ]
  },
  {
    version: 'v1.0 — Core',
    date: '2026-05-26',
    groups: [
      { tag: 'New', items: [
        '3-pass pipeline (research/outline → draft → humanize).',
        'WordPress draft publishing with Yoast/RankMath meta.',
        'Brand / geo / persona / format selection and bulk queue.'
      ] }
    ]
  }
]

const TAG_COLOR = { Fixed: '#22c55e', New: '#3b82f6', Note: '#f59e0b' }

export default function Changelog({ accentColor = '#6366f1' }) {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-[#f5f5f5]">Changelog</h1>
        <FeatureFeedback feature="Changelog screen" accentColor={accentColor} />
      </div>
      <p className="text-sm text-[#9ca3af] mb-6">Every feature and fix, logged. Newest first.</p>

      <div className="space-y-6 max-w-3xl">
        {RELEASES.map(rel => (
          <div key={rel.version} className="bg-[#161616] border border-[#2a2a2a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-[#f5f5f5]">{rel.version}</h2>
              <span className="text-xs text-[#6b7280]">{rel.date}</span>
            </div>
            {rel.groups.map(g => (
              <div key={g.tag} className="mb-3 last:mb-0">
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded" style={{ background: `${TAG_COLOR[g.tag] || '#6b7280'}22`, color: TAG_COLOR[g.tag] || '#6b7280' }}>{g.tag}</span>
                <ul className="mt-2 space-y-1.5">
                  {g.items.map((it, i) => (
                    <li key={i} className="text-sm text-[#d1d5db] flex gap-2">
                      <span className="text-[#6b7280] mt-1">·</span><span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
