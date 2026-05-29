import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Scorecard from '../components/Scorecard.jsx'
import FeedbackBar from '../components/FeedbackBar.jsx'
import FeatureFeedback from '../components/FeatureFeedback.jsx'

function CharCount({ value, max }) {
  const len = value?.length || 0
  const over = len > max
  return (
    <span className={`text-xs ml-1 ${over ? 'text-[#ef4444]' : 'text-[#6b7280]'}`}>
      {len}/{max}{over ? ' ⚠' : ''}
    </span>
  )
}

export default function ArticleView({ articleState, setArticleState, accentColor, config }) {
  const navigate = useNavigate()
  const { inputs, finalHTML, metadata, linkCount, links, wordCount } = articleState

  const [meta, setMeta] = useState(metadata || {})
  const [wpStatus, setWpStatus] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [humanizing, setHumanizing] = useState(false)
  const [regenError, setRegenError] = useState('')
  const [linksExpanded, setLinksExpanded] = useState(false)
  const [lint, setLint] = useState(null)
  const [score, setScore] = useState(null)
  const [scoring, setScoring] = useState(false)

  // Inline highlight-edit state
  const [selText, setSelText] = useState('')
  const [selInstruction, setSelInstruction] = useState('')
  const [rewriting, setRewriting] = useState(false)
  const [rewriteMsg, setRewriteMsg] = useState('')
  const previewRef = useRef(null)
  const recordedRef = useRef(false)

  // Free instant lint whenever the article changes
  useEffect(() => {
    if (!finalHTML || !inputs) return
    setScore(null)
    window.electron.invoke('lint-article', { html: finalHTML, keyword: inputs.keyword })
      .then(setLint)
      .catch(() => setLint(null))
  }, [finalHTML])

  // Record this generation in Recents (once)
  useEffect(() => {
    if (!finalHTML || !inputs || recordedRef.current) return
    recordedRef.current = true
    window.electron.invoke('recent-add', {
      entry: { keyword: inputs.keyword, brand: inputs.brand, geo: inputs.geo, format: inputs.format, wordCount, status: 'generated' }
    }).catch(() => {})
  }, [finalHTML])

  function captureSelection() {
    const sel = window.getSelection ? window.getSelection().toString() : ''
    const t = (sel || '').trim()
    // Only offer rewrite when the exact text exists in the HTML (not split across tags)
    if (t && t.length >= 4 && finalHTML.includes(t)) {
      setSelText(t); setRewriteMsg('')
    }
  }

  async function applyRewrite() {
    if (!selText) return
    setRewriting(true); setRewriteMsg('')
    try {
      const replacement = await window.electron.invoke('rewrite-snippet', { snippet: selText, instruction: selInstruction, keyword: inputs.keyword, brand: inputs.brand })
      if (!finalHTML.includes(selText)) { setRewriteMsg('Selection no longer found — try reselecting.'); setRewriting(false); return }
      const updated = finalHTML.replace(selText, replacement)
      const wc = await window.electron.invoke('count-words', { html: updated })
      setArticleState(s => ({ ...s, finalHTML: updated, wordCount: wc }))
      setSelText(''); setSelInstruction(''); setRewriteMsg('✓ Rewritten')
    } catch (e) {
      setRewriteMsg(e.message || 'Rewrite failed')
    } finally {
      setRewriting(false)
    }
  }

  async function runScore() {
    setScoring(true)
    try {
      const result = await window.electron.invoke('score-article', { html: finalHTML, inputs })
      setScore(result)
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setScoring(false)
    }
  }

  if (!inputs || !finalHTML) {
    return (
      <div className="flex items-center justify-center h-full text-[#9ca3af] text-sm">
        No article generated. <button onClick={() => navigate('/new')} className="ml-2 underline">Start new</button>
      </div>
    )
  }

  async function runFullRegen() {
    setRegenError('')
    setRegenerating(true)
    try {
      const draft = await window.electron.invoke('generate-draft', {
        inputs,
        outlineJSON: articleState.outline,
        researchJSON: articleState.research
      })
      const shouldHumanize = await window.electron.invoke('should-humanize')
      const humanized = shouldHumanize
        ? await window.electron.invoke('humanize-draft', { draftHTML: draft, keyword: inputs.keyword, brand: inputs.brand })
        : draft
      const withLinks = await window.electron.invoke('replace-links', { html: humanized, brand: inputs.brand })
      const newMeta = await window.electron.invoke('generate-metadata', { inputs, finalHTML: withLinks })
      const schemaHTML = await window.electron.invoke('generate-schema', { metadata: newMeta, keyword: inputs.keyword, brand: inputs.brand })
      const finalHtml = withLinks + schemaHTML
      const { count, links } = await window.electron.invoke('count-links', { html: finalHtml })
      const wc = await window.electron.invoke('count-words', { html: finalHtml })
      setArticleState(s => ({ ...s, draft, finalHTML: finalHtml, metadata: newMeta, schemaHTML, linkCount: count, links, wordCount: wc }))
      setMeta(newMeta)
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setRegenerating(false)
    }
  }

  async function runHumanizeOnly() {
    setRegenError('')
    setHumanizing(true)
    try {
      const humanized = await window.electron.invoke('humanize-draft', {
        draftHTML: articleState.draft || finalHTML,
        keyword: inputs.keyword,
        brand: inputs.brand
      })
      const withLinks = await window.electron.invoke('replace-links', { html: humanized, brand: inputs.brand })
      const schemaHTML = articleState.schemaHTML || ''
      const finalHtml = withLinks + schemaHTML
      const { count, links } = await window.electron.invoke('count-links', { html: finalHtml })
      const wc = await window.electron.invoke('count-words', { html: finalHtml })
      setArticleState(s => ({ ...s, finalHTML: finalHtml, linkCount: count, links, wordCount: wc }))
    } catch (e) {
      setRegenError(e.message)
    } finally {
      setHumanizing(false)
    }
  }

  async function pushToWp() {
    setPublishing(true)
    setWpStatus(null)
    try {
      const result = await window.electron.invoke('push-to-wp', {
        articleData: {
          title: meta.titleTag || inputs.keyword,
          contentHTML: finalHTML,
          slug: meta.slug || '',
          metaDescription: meta.metaDescription || '',
          focusKeyword: inputs.keyword,
          tags: meta.suggestedTags || [],
          brand: inputs.brand
        }
      })
      setWpStatus(result)
      if (result?.success) {
        window.electron.invoke('recent-add', {
          entry: { keyword: inputs.keyword, brand: inputs.brand, geo: inputs.geo, format: inputs.format, wordCount, status: 'published', wpUrl: result.draftUrl || '' }
        }).catch(() => {})
      }
    } catch (e) {
      setWpStatus({ success: false, error: e.message })
    } finally {
      setPublishing(false)
    }
  }

  const isLoading = regenerating || humanizing

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Article preview */}
      <div className="flex-[65] flex flex-col overflow-hidden border-r border-[#2a2a2a]">
        <div className="px-6 py-3 border-b border-[#2a2a2a] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#f5f5f5]">{meta.titleTag || inputs.keyword}</h2>
            <p className="text-xs text-[#9ca3af]">{inputs.brand} · {inputs.geo} · {wordCount} words</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={runFullRegen}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs border border-[#2a2a2a] rounded-lg text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors"
            >
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
            <button
              onClick={runHumanizeOnly}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs border border-[#2a2a2a] rounded-lg text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors"
            >
              {humanizing ? 'Humanizing...' : 'Humanize Only'}
            </button>
            <button
              onClick={() => navigate('/revise')}
              disabled={isLoading}
              className="px-3 py-1.5 text-xs border border-[#2a2a2a] rounded-lg text-[#9ca3af] hover:text-[#f5f5f5] hover:bg-[#1f1f1f] disabled:opacity-40 transition-colors"
            >
              Revise
            </button>
          </div>
        </div>

        {/* Inline highlight-edit bar */}
        <div className="px-6 py-2 border-b border-[#2a2a2a] bg-[#121212] flex items-center gap-2">
          {!selText ? (
            <span className="text-xs text-[#6b7280]">Tip: select any sentence in the article to rewrite just that part.</span>
          ) : (
            <>
              <span className="text-xs text-[#9ca3af] truncate max-w-[200px]" title={selText}>“{selText.slice(0, 40)}{selText.length > 40 ? '…' : ''}”</span>
              <input
                value={selInstruction}
                onChange={e => setSelInstruction(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && applyRewrite()}
                placeholder="How should this change? (optional)"
                className="flex-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded-md px-2 py-1 text-xs text-[#f5f5f5]"
              />
              <button onClick={applyRewrite} disabled={rewriting} className="text-xs px-3 py-1 rounded-md text-white disabled:opacity-40" style={{ background: accentColor }}>{rewriting ? 'Rewriting…' : 'Rewrite'}</button>
              <button onClick={() => { setSelText(''); setSelInstruction('') }} className="text-xs text-[#6b7280] hover:text-[#f5f5f5]">✕</button>
            </>
          )}
          {rewriteMsg && <span className="text-xs text-[#22c55e]">{rewriteMsg}</span>}
        </div>

        {regenError && (
          <div className="mx-6 mt-3 p-3 bg-[#450a0a] border border-[#ef4444] rounded-lg text-sm text-[#ef4444]">{regenError}</div>
        )}

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center flex-col gap-3">
            <svg className="w-8 h-8 animate-spin text-[#4b5563]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <span className="text-sm text-[#9ca3af]">{regenerating ? 'Running full pipeline...' : 'Running humanization pass...'}</span>
          </div>
        ) : (
          <div
            ref={previewRef}
            onMouseUp={captureSelection}
            className="flex-1 overflow-y-auto px-8 py-6 article-preview"
            dangerouslySetInnerHTML={{ __html: finalHTML }}
          />
        )}
      </div>

      {/* Right: SEO + Publish */}
      <div className="flex-[35] overflow-y-auto px-5 py-5 space-y-4">
        <Scorecard lint={lint} score={score} scoring={scoring} onRunScore={runScore} />

        <FeedbackBar inputs={inputs} finalHTML={finalHTML} accentColor={accentColor} />

        <div className="flex justify-end">
          <FeatureFeedback feature="Article view (inline edit / revise)" accentColor={accentColor} />
        </div>

        <h3 className="text-sm font-semibold text-[#f5f5f5]">SEO Metadata</h3>

        {/* Title Tag */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9ca3af] flex items-center">
            Title Tag <CharCount value={meta.titleTag} max={60} />
          </label>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#4b5563]"
            value={meta.titleTag || ''}
            onChange={e => setMeta(m => ({ ...m, titleTag: e.target.value }))}
          />
        </div>

        {/* Meta Description */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9ca3af] flex items-center">
            Meta Description <CharCount value={meta.metaDescription} max={155} />
          </label>
          <textarea
            rows={3}
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#4b5563] resize-none"
            value={meta.metaDescription || ''}
            onChange={e => setMeta(m => ({ ...m, metaDescription: e.target.value }))}
          />
        </div>

        {/* Focus Keyword */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9ca3af]">Focus Keyword</label>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] focus:outline-none focus:border-[#4b5563]"
            value={inputs.keyword}
            readOnly
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#9ca3af]">URL Slug</label>
          <input
            className="w-full bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg px-3 py-2 text-sm text-[#f5f5f5] font-mono focus:outline-none focus:border-[#4b5563]"
            value={meta.slug || ''}
            onChange={e => setMeta(m => ({ ...m, slug: e.target.value }))}
          />
        </div>

        {/* Tags */}
        {meta.suggestedTags?.length > 0 && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#9ca3af]">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {meta.suggestedTags.map(t => (
                <span key={t} className="px-2 py-0.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-[#d1d5db]">{t}</span>
              ))}
            </div>
          </div>
        )}

        {/* Schema */}
        {meta.schemaType && (
          <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#9ca3af]">Schema Type</span>
              <span className="text-xs font-semibold text-[#f5f5f5]">{meta.schemaType}</span>
            </div>
            {meta.schemaReason && (
              <p className="text-xs text-[#6b7280] mt-1">{meta.schemaReason}</p>
            )}
          </div>
        )}

        {/* Internal Links */}
        <div className="space-y-1">
          <button
            onClick={() => setLinksExpanded(v => !v)}
            className="flex items-center justify-between w-full text-xs font-medium text-[#9ca3af] hover:text-[#f5f5f5] transition-colors"
          >
            <span>Internal Links: <span className="text-[#f5f5f5] font-semibold">{linkCount}</span></span>
            <svg className={`w-3.5 h-3.5 transition-transform ${linksExpanded ? '' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {linksExpanded && links?.map((l, i) => (
            <div key={i} className="pl-2 border-l border-[#2a2a2a] text-xs text-[#6b7280] py-0.5">
              <span className="text-[#818cf8]">{l.anchor}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-[#2a2a2a] pt-4">
          <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-1">
            <span>Word Count</span>
            <span className="font-semibold text-[#f5f5f5]">{wordCount?.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#9ca3af] mb-4">
            <span>Category</span>
            <span className="font-semibold text-[#f5f5f5]">{inputs.brand === 'MIS' ? 'MIS Blog' : 'WIS Blog'}</span>
          </div>

          {/* WordPress */}
          {config?.wpSiteUrl ? (
            <div className="space-y-3">
              <div className="text-xs text-[#9ca3af]">
                Publishing to: <span className="text-[#f5f5f5]">{config.wpSiteUrl}</span>
              </div>
              <button
                onClick={pushToWp}
                disabled={publishing}
                className="w-full py-2.5 text-sm font-semibold rounded-lg text-white transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
                style={{ background: accentColor }}
              >
                {publishing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Sending to WordPress...
                  </>
                ) : 'Send to WordPress as Draft'}
              </button>
              {wpStatus && (
                <div className={`p-3 rounded-lg text-sm ${wpStatus.success ? 'bg-[#14532d] text-[#22c55e]' : 'bg-[#450a0a] text-[#ef4444]'}`}>
                  {wpStatus.success ? (
                    <div>
                      <div className="font-semibold">✓ Draft created in WordPress</div>
                      <button
                        className="text-xs underline mt-1"
                        onClick={() => window.electron.invoke('open-external', wpStatus.draftUrl)}
                      >
                        Open in WordPress editor →
                      </button>
                    </div>
                  ) : (
                    <div>✗ {wpStatus.error}</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-xs text-[#9ca3af]">
              Configure WordPress in{' '}
              <button onClick={() => navigate('/settings')} className="underline text-[#f5f5f5]">Settings</button>{' '}
              to publish.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
