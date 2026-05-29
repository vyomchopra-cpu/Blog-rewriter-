const axios = require('axios')
const path = require('path')

// Dynamic import for ESM data files
async function loadDataModules() {
  const promptBuilderPath = path.join(__dirname, '../data/prompt-builder.js')
  // Use a workaround since main process is CJS but data files are ESM
  // We'll inline the logic here to avoid ESM/CJS issues
  return null
}

// Inline data needed by api.js (avoids ESM import issues in CJS main process)
const productBlocks = {
  MIS: `PRODUCT CONTEXT - MOVEIN SYNC:
MoveInSync is an enterprise employee commute and transport management platform used by 300+ enterprises across India, US, and Southeast Asia.

Core capabilities (reference naturally where relevant, never in a bulleted feature list):
- Real-time vehicle tracking with live driver and vehicle location on employee app
- Route optimization engine (automated route planning, dynamic rerouting)
- Employee safety: SOS button in employee app, geofencing alerts, female employee transport compliance features, real-time ETA notifications
- Driver management: onboarding, compliance document tracking, behavior analytics
- Fleet analytics: utilization reports, trip logs, billing reconciliation, cost-per-seat
- HRMS integrations: SAP, Workday, Darwinbox, PeopleStrong, Keka
- Rostering: automated roster creation from shift schedules
- Multi-vendor management: single platform to manage multiple cab aggregators
- Employee self-service: mobile app for trip booking, live tracking, feedback

Key differentiators:
- Reduces billing fraud through GPS-verified km tracking
- Single platform replaces 3-7 fragmented vendor relationships
- Compliance-ready for POSH act requirements (female employee transport)
- Real-time visibility that WhatsApp groups and spreadsheets cannot provide

Do NOT claim specific cost savings percentages without data context. Do NOT mention competitors by name. Do NOT make up feature capabilities.`,

  WIS: `PRODUCT CONTEXT - WORK IN SYNC:
WorkInSync is an enterprise workplace management platform used by organizations managing hybrid work, office space, and visitor operations.

Core capabilities (reference naturally where relevant):
- Desk booking: hot desk and assigned desk management, floor plan view, team clustering
- Meeting room booking: real-time room availability, integrated display panels, Google Calendar and Microsoft Outlook sync
- Visitor management: digital check-in, badge printing, host notification, visitor logs
- Space analytics: occupancy heatmaps, utilization rates, peak hours analysis
- Parking management: slot booking, EV charging bay allocation
- Hybrid work scheduling: team availability calendar, in-office day coordination
- Integrations: Microsoft Teams, Slack, Google Workspace, Workday, ServiceNow, Okta SSO

Key differentiators:
- Unified platform (desk + room + visitor + parking in one system)
- Real occupancy data vs theoretical capacity planning
- Employee experience focus (mobile-first booking, frictionless check-in)
- Enterprise-grade integrations with existing HR and collaboration tools

Do NOT claim specific pricing. Do NOT mention competitors by name.`
}

const geoBlocks = {
  India: `GEO CONTEXT - INDIA:
Reference these real locations where relevant to the article topic:
- IT corridors: Outer Ring Road Bengaluru (ORR), HITEC City to Gachibowli corridor Hyderabad, NH-48 Gurugram, Rajiv Gandhi IT Park Chandigarh, GIFT City Gandhinagar, Manyata Tech Park, DLF Cyber City, Tidel Park Chennai, Magarpatta Pune, Cybercity Bengaluru
- Regulatory context: POSH Act compliance (female employee transport safety requirements), Motor Vehicles Act amendments, state-specific RTO regulations, Karnataka night shift transport guidelines, Maharashtra government transport mandates for IT companies
- Market reality: vendor fragmentation (most companies use 3-7 transport vendors managed via WhatsApp and spreadsheets), night shift transport as a critical retention factor for female employees, last-mile gap from metro stations (especially Bengaluru Metro Phase 2, Hyderabad Metro), monsoon disruption to fixed routes
- Terminology to use naturally: drop cabs, pickup and drop, roster management, cab aggregator, night shift transport, metro feeder service, employee cab, outstation travel
- Data sources to cite if relevant: NASSCOM (IT sector data), MoRTH (transport statistics), KPMG India (workforce mobility), Deloitte India (workplace reports)
- Cost context: per-seat cost in India typically Rs 3,000-8,000/month depending on city and coverage. Billing fraud (inflated km claims) is a major pain point.`,

  US: `GEO CONTEXT - UNITED STATES:
Reference these real locations and contexts where relevant:
- Corporate campuses and corridors: Bay Area (Caltrain last-mile gap, shuttle programs), Austin TX (suburb-to-campus commute, tech campus growth), Seattle (Microsoft campus, Amazon HQ, cross-lake commute), NYC (Hudson Yards corporate campus cluster), RTP Research Triangle Park NC, Tysons Corner VA, Irvine CA tech corridor
- Regulatory context: ADA transit accessibility compliance (paratransit requirements), OSHA recordkeeping for transit incidents, EPA Scope 3 emissions Category 7 (employee commuting) for ESG reporting, pre-tax commuter benefit FSA ($315/month 2024 limit), California CARB zero-emission fleet mandates, EEOC considerations for shift transport
- Market reality: 73% of US tech companies mandating some form of return-to-office in 2026, corporate shuttle programs at 40%+ of Fortune 500 companies, EV fleet transition pressure, last-mile from BART/Caltrain/Metro as a real estate decision factor
- Terminology to use naturally: corporate shuttle, employee commuter program, vanpool, last-mile transit, commuter benefits, rideshare management, campus connector
- Data sources to cite if relevant: BLS (labor statistics), Gartner (HR tech research), SHRM (HR benchmarks), EPA (emissions data), Forrester (workplace technology)
- Cost context: corporate shuttle programs cost $200-600 per employee per month in US markets. Scope 3 Category 7 reporting now mandatory for SEC climate disclosure filers.`
}

const personas = {
  'transport-manager': {
    name: 'Transport Manager',
    primaryPain: 'manages daily vehicle dispatch, driver compliance, route SLAs, and incident reporting with fragmented tools and vendor chaos',
    keyConcerns: ['SLA adherence', 'driver compliance', 'incident reporting', 'vendor management', 'route efficiency', 'real-time tracking'],
    vocabulary: ['dispatch', 'SLA', 'route adherence', 'fleet utilization', 'driver onboarding', 'trip logs'],
    ctaAngle: 'See how MoveInSync replaces spreadsheets and WhatsApp groups with a single transport control platform'
  },
  'ehs-director': {
    name: 'EHS Director',
    primaryPain: 'responsible for employee safety in transit, audit compliance, incident documentation, and reducing liability exposure',
    keyConcerns: ['safety incidents', 'audit trails', 'female employee transport compliance', 'SOS tracking', 'POSH compliance', 'carbon reporting'],
    vocabulary: ['incident log', 'safety audit', 'geofencing', 'SOS alert', 'compliance report', 'duty of care'],
    ctaAngle: 'See how MoveInSync gives EHS teams real-time safety visibility and automated compliance documentation'
  },
  'workplace-director': {
    name: 'Workplace Director',
    primaryPain: 'managing space utilization, hybrid work schedules, visitor flows, and meeting room availability across multiple offices',
    keyConcerns: ['space utilization', 'desk availability', 'visitor management', 'meeting room conflicts', 'hybrid policy execution', 'employee experience'],
    vocabulary: ['utilization rate', 'occupancy data', 'hot desk', 'visitor flow', 'hybrid schedule', 'space planning'],
    ctaAngle: 'See how WorkInSync gives workplace teams real-time visibility into space, visitors, and desk bookings'
  },
  'hr-director': {
    name: 'HR Director',
    primaryPain: 'reducing commute-driven attrition, enforcing transport policies, managing employee satisfaction with commute experience',
    keyConcerns: ['employee satisfaction', 'attrition linked to commute', 'transport policy compliance', 'benefit administration', 'employee NPS'],
    vocabulary: ['employee experience', 'attrition rate', 'commute benefit', 'policy enforcement', 'satisfaction score'],
    ctaAngle: 'See how organizations use MoveInSync to reduce commute-related attrition and improve employee experience scores'
  },
  'procurement': {
    name: 'Procurement',
    primaryPain: 'vendor evaluation, contract management, total cost of ownership calculation, and reducing transport spend leakage',
    keyConcerns: ['TCO', 'vendor SLAs', 'contract compliance', 'spend visibility', 'vendor consolidation', 'audit readiness'],
    vocabulary: ['total cost of ownership', 'vendor SLA', 'contract terms', 'spend analysis', 'procurement audit', 'RFP criteria'],
    ctaAngle: 'See the TCO framework MoveInSync customers use to evaluate employee transport platforms'
  },
  'cfo': {
    name: 'CFO',
    primaryPain: 'reducing transport cost per seat, eliminating billing fraud, getting visibility into fleet spend, and justifying commute program ROI',
    keyConcerns: ['cost per seat', 'billing fraud', 'fleet spend visibility', 'ROI justification', 'contract leakage', 'budgeting accuracy'],
    vocabulary: ['cost per trip', 'billing reconciliation', 'fleet spend', 'ROI', 'cost center', 'variance analysis'],
    ctaAngle: 'See how CFOs use MoveInSync data to cut transport spend by 20-30% without cutting employee coverage'
  },
  'cto-it': {
    name: 'CTO/IT Director',
    primaryPain: 'integrating transport or workplace systems with existing HRMS, SSO, and enterprise stack without creating new security risks',
    keyConcerns: ['API integrations', 'SSO/SAML', 'data security', 'uptime SLA', 'HRMS integration', 'mobile app reliability'],
    vocabulary: ['API', 'SSO', 'SAML', 'data residency', 'uptime', 'HRMS integration', 'mobile SDK', 'webhook'],
    ctaAngle: 'See MoveInSync integration capabilities: HRMS, SSO, and enterprise security documentation'
  },
  'coo-vp-ops': {
    name: 'COO/VP Ops',
    primaryPain: 'consolidating operational complexity, reducing vendor count, scaling commute or workplace operations across multiple sites without proportional cost increase',
    keyConcerns: ['operational efficiency', 'vendor consolidation', 'multi-site operations', 'scalability', 'cost per employee', 'process standardization'],
    vocabulary: ['operational efficiency', 'site operations', 'vendor rationalization', 'standardization', 'scale', 'process optimization'],
    ctaAngle: 'See how operations leaders use MoveInSync to standardize transport operations across 10+ sites from a single dashboard'
  }
}

const formatBlocks = {
  Informational: `This is an informational article. Open with a hook (stat or real scenario), not a definition. Cover the topic thoroughly. End with a CTA to explore the brand's solution.`,
  Listicle: `This is a listicle. Number each major section. Each item needs a specific example, not generic advice. Minimum 7 items for a listicle.`,
  'How-To Guide': `This is a how-to guide. Use numbered steps for processes. Each step needs a concrete action, not a vague direction. Include a 'Before You Start' or 'What You Need' section as the first H2.`,
  'Definitive Guide': `This is a comprehensive definitive guide. Cover the topic exhaustively. Use H3 subheadings extensively. This should be the most complete resource on this topic.`,
  Comparison: `This is a comparison article. Include a comparison table. Be balanced but lean toward the brand's strengths naturally. End with a clear recommendation section.`,
  Newsletter: `This is an email NEWSLETTER edition, not a blog post. Open with a punchy 1-2 sentence hook. Keep it scannable: short segments with bold mini-headers, each 1-3 sentences. Conversational, direct, first person ('we', 'you'). Include 3-5 short segments and exactly one clear CTA at the end. Keep it SHORT — respect the target word count strictly, do not pad with long expository paragraphs.`,
  'One-Pager': `This is a ONE-PAGE enablement asset (sales/tech informatics), not a blog article. Lead with one sharp value-proposition headline. Use tight, labelled sections in this order: Problem, Solution, How It Works, Key Capabilities, Proof/Stats, CTA. Use crisp bullet points with bold labels. Dense and skimmable. Respect the target word count strictly — do not pad.`
}

// Content-size length tiers (word-count + token ceiling). Used to keep output on-target.
const LENGTH_TIERS = {
  small:  { label: 'Small (snippet / social / blurb)', words: 350,  min: 250,  max: 500 },
  medium: { label: 'Medium (newsletter / short blog)', words: 900,  min: 700,  max: 1100 },
  large:  { label: 'Large (standard blog)',            words: 1500, min: 1250, max: 1750 },
  xlarge: { label: 'X-Large (definitive guide)',       words: 2600, min: 2200, max: 3000 }
}

// Resolve a built-in persona by id, or fall back to a user-defined custom persona
// object (passed through inputs.customPersona), or a safe default.
function resolvePersona(personaId, customPersona) {
  if (personas[personaId]) return personas[personaId]
  if (customPersona && customPersona.name) {
    const toArr = v => Array.isArray(v) ? v : (v ? String(v).split(',').map(s => s.trim()).filter(Boolean) : [])
    return {
      name: customPersona.name,
      primaryPain: customPersona.primaryPain || 'has goals relevant to this topic',
      keyConcerns: toArr(customPersona.keyConcerns),
      vocabulary: toArr(customPersona.vocabulary),
      ctaAngle: customPersona.ctaAngle || `See how the brand helps ${customPersona.name}`
    }
  }
  return personas['transport-manager']
}

function buildSystemPrompt(inputs, opts = {}) {
  const { keyword, brand, geo, personaId, format, lostKeywordMode } = inputs
  const { extraContext = '', customInstructions = '', readingLevel = '', tone = '' } = opts
  const persona = resolvePersona(personaId, inputs.customPersona)
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const parts = []

  parts.push(`You are a senior B2B content strategist writing for ${brandName}.
Write authoritatively and specifically. Use 'we' and 'our' (first-person plural) when referencing the brand. This article targets ${persona.name} who ${persona.primaryPain}.
Never recommend competitor products. Never use generic filler content.`)

  parts.push(productBlocks[brand])

  parts.push(`PERSONA CONTEXT:
Target reader: ${persona.name}
Primary pain: ${persona.primaryPain}
Key concerns: ${persona.keyConcerns.join(', ')}
Vocabulary they use: ${persona.vocabulary.join(', ')}
CTA angle: ${persona.ctaAngle}`)

  parts.push(geoBlocks[geo])

  const formatBlock = formatBlocks[format]
  if (formatBlock) {
    parts.push(`FORMAT INSTRUCTIONS:\n${formatBlock}`)
  }

  if (lostKeywordMode) {
    parts.push(`IMPORTANT: This keyword has lost ranking position. The article must outperform current SERP leaders in depth and specificity. Go deeper than the top 3 results. Cover angles they miss. Use more specific data, more named examples, more actionable detail.`)
  }

  parts.push(`WRITING RULES - follow all of these exactly:
- Never open any sentence with: Furthermore, Moreover, Additionally, In conclusion, It is important to, It is worth noting, In today's world, In today's fast-paced
- Never use these words: leverage/leverages, seamlessly, robust, comprehensive, delve, harness, utilize (use 'use' instead), facilitate (use a direct verb instead)
- Never use em dashes
- Vary sentence length aggressively within every paragraph. Some sentences must be under 8 words. Some must be over 30 words. No paragraph should have uniform sentence length.
- Use specific numbers, not 'many', 'several', 'various', 'numerous'
- Reference named real entities: specific places, specific regulations, specific named reports
- The intro must NOT begin with the keyword or with a definition. Open with a scenario, a stat, or a provocative claim.`)

  if (readingLevel) {
    parts.push(`READING LEVEL: Write for a ${readingLevel} reading level.`)
  }
  if (tone) {
    parts.push(`TONE: ${tone}.`)
  }
  if (customInstructions && customInstructions.trim()) {
    parts.push(`ADDITIONAL STANDING INSTRUCTIONS FROM THE EDITORIAL TEAM (highest priority — follow exactly):\n${customInstructions.trim()}`)
  }
  // NOTE: extraContext (the brand knowledge base) is NOT embedded here anymore.
  // It's passed separately to callClaude as a cached block to cut repeat cost.

  return parts.join('\n\n')
}

async function callClaude(apiKey, model, systemPrompt, userMessage, maxTokens = 8000, temperature, cacheContext = '') {
  // Prompt caching: the (large, stable) brand context block is sent as a cached
  // system block so repeated calls (bulk runs, multi-pass on one article) reuse it
  // at ~10% of the input cost instead of re-paying for it every time.
  let system = systemPrompt
  if (cacheContext && cacheContext.trim()) {
    system = [{ type: 'text', text: cacheContext, cache_control: { type: 'ephemeral' } }]
    if (systemPrompt && systemPrompt.trim()) system.push({ type: 'text', text: systemPrompt })
  }
  const payload = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: userMessage }]
  }
  if (typeof temperature === 'number') payload.temperature = temperature

  const response = await axios.post(
    'https://api.anthropic.com/v1/messages',
    payload,
    {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      timeout: 120000
    }
  )
  return response.data.content[0].text
}

async function generateOutline(apiKey, model, inputs, opts = {}) {
  const { keyword, brand, geo, format, wordCount } = inputs
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'

  let systemPrompt = `You are an SEO research analyst. Analyze the keyword provided and return a structured research summary and article outline in valid JSON only. No markdown, no explanation, just the JSON object.`
  if (opts.customInstructions && opts.customInstructions.trim()) {
    systemPrompt += `\n\nStanding editorial instructions:\n${opts.customInstructions.trim()}`
  }

  const userMessage = `Keyword: ${keyword}
Target market: ${geo === 'India' ? 'India' : 'United States'}
Brand: ${brandName}
Article format: ${format}
Target word count: ${wordCount} (this is a HARD target — recommendedWordCount must stay within 10% of it; size the outline so the finished piece lands near ${wordCount} words, NOT longer)

Return this exact JSON structure (use the real target word count, do not default to 1800):
{
  "searchIntent": "informational|commercial|navigational",
  "avgCompetitorWordCount": ${wordCount},
  "entitiesCommonly": ["entity1", "entity2"],
  "competitorGaps": ["what top results miss 1", "what top results miss 2"],
  "geoSignals": ["geo context 1", "geo context 2"],
  "recommendedWordCount": ${wordCount},
  "outline": [
    {
      "level": "h2",
      "text": "Heading text",
      "contentBrief": "What to cover in this section",
      "flags": ["GEO DATA", "STAT NEEDED", "PRODUCT MENTION", "COMPETITOR GAP"],
      "children": [
        {
          "level": "h3",
          "text": "Subheading text",
          "contentBrief": "Brief for this subsection",
          "flags": []
        }
      ]
    }
  ]
}`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, 4000, undefined, opts.extraContext)

  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    // Attempt to extract JSON from the response
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error(`Failed to parse outline JSON: ${e.message}\nRaw: ${raw.substring(0, 500)}`)
  }
}

async function generateDraft(apiKey, model, inputs, outlineJSON, researchJSON, opts = {}) {
  const { keyword, format, wordCount } = inputs
  const excludeData = Array.isArray(inputs.excludeData) ? inputs.excludeData.filter(Boolean) : []
  const systemPrompt = buildSystemPrompt(inputs, opts)
  const target = Number(wordCount) || 1200
  const minWords = Math.round(target * 0.9)
  const maxWords = Math.round(target * 1.1)
  // Cap tokens to the target so the model physically can't run long.
  const maxTokens = wordCountToMaxTokens(target, opts.maxTokens || 8000)

  const userMessage = `Write a complete ${format} article on '${keyword}' following the outline below exactly.

HARD LENGTH CONSTRAINT: The finished article must be between ${minWords} and ${maxWords} words (target ${target}). Do NOT exceed ${maxWords} words. If you are running long, cut depth per section rather than overshooting. Prioritise specificity over padding. Roughly track your word count as you write.

Research context: ${JSON.stringify(researchJSON)}
Outline to follow: ${JSON.stringify(outlineJSON.outline)}
${excludeData.length ? `\nEXCLUDED DATA POINTS (the editor crossed these out, do NOT include them or any claim that depends on them; if a section relied on one, rewrite it without it):\n- ${excludeData.join('\n- ')}\n` : ''}
Output the article in clean HTML only. Use proper tags: <h2>, <h3>, <p>, <ul>, <li>, <ol>, <strong>, <em>.
Never use em dashes (—) or en dashes (–). Use commas or split sentences instead.
No markdown. No explanation. No preamble. Start directly with the article HTML.
For internal links, use this exact placeholder format where relevant: {{LINK:anchor text|URL}}`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, maxTokens, opts.temperature, opts.extraContext)
  return sanitizeArticle(raw)
}

async function humanizeDraft(apiKey, model, draftHTML, keyword, brand, opts = {}) {
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const geoLabel = brand === 'MIS' ? 'India or US' : 'US'
  // Cap to roughly the draft's own size so the humanizer can't pad the article longer.
  const maxTokens = Math.min(opts.maxTokens || 8000, Math.ceil((draftHTML || '').length / 3) + 800)

  let systemPrompt = `You are a human editor. Your job is to revise AI-generated B2B content so it passes AI detection tools by eliminating structural AI patterns. Make ONLY the changes listed. Do not add new sections. Do not change the outline structure. Do not alter facts or data.`
  // Cost optimisation: humanization only edits existing text, so we do NOT inject
  // the full brand knowledge base here (it already shaped the draft). Standing
  // instructions are small and kept.
  if (opts.customInstructions && opts.customInstructions.trim()) {
    systemPrompt += `\n\nStanding editorial instructions (highest priority):\n${opts.customInstructions.trim()}`
  }

  const userMessage = `Revise this article about '${keyword}' for ${brandName}.

Apply ALL of these changes:
1. Find every paragraph where sentences are similar length. Rewrite so lengths vary dramatically within each paragraph (mix 6-word and 35-word sentences).
2. Find sections that follow topic-sentence > 3-support-sentences > summary pattern. Break this pattern in at least 4 places by restructuring the paragraph.
3. Add one specific data point with a named authoritative source not already in the article. For India content use: NASSCOM, MoRTH, KPMG India, Deloitte India. For US content use: BLS, Gartner, SHRM, EPA, Forrester.
4. Add one sentence that expresses a light opinion or mild contrarianism. Examples: 'Most companies get this completely backwards.' or 'The conventional wisdom here is wrong more often than people admit.'
5. Replace any of these phrases found in the article:
   'In today's world' -> remove and rewrite sentence
   'In today's fast-paced' -> remove and rewrite sentence
   'It's worth noting' -> remove entirely
   'It is important to note' -> remove entirely
   'plays a crucial role' -> replace with a specific active verb
   'leverages' -> replace with 'uses' or 'runs on'
   'seamlessly' -> remove
   'robust' -> replace with a specific descriptive word
   'comprehensive solution' -> remove
   'delve into' -> replace with 'cover' or 'look at'
   'Furthermore' -> remove or replace with a specific transition
   'Moreover' -> remove or replace
   'In conclusion' -> replace with a direct closing statement
6. Check the article intro. If it opens with the keyword or with a definition, rewrite the first sentence only to open with a specific scenario, stat, or provocative claim.
7. Verify each H2 section delivers on the promise of its heading. If any section drifts, add one focused sentence that directly answers the heading.
8. Remove EVERY em dash (—), en dash (–), and horizontal bar (―). Replace each with a comma, or split the sentence in two. Zero dashes of these types may remain in the output.
9. Do NOT increase the overall length. Stay within 5% of the input word count. Trimming weak words is welcome; expanding the article is not.

Return the complete revised article in the same HTML format. Nothing else.

ARTICLE TO REVISE:
${draftHTML}`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, maxTokens, opts.temperature)
  return sanitizeArticle(raw)
}

async function generateMetadata(apiKey, model, inputs, finalHTML) {
  const { keyword, brand, geo, personaId } = inputs
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const persona = resolvePersona(personaId, inputs.customPersona)

  const systemPrompt = `You are an SEO specialist. Return valid JSON only. No markdown, no explanation.`

  const userMessage = `Given this article about '${keyword}' for ${brandName} targeting ${geo === 'India' ? 'India' : 'US'} market (persona: ${persona.name}), generate SEO metadata. Return JSON only:
{
  "titleTag": "under 60 chars, includes keyword, compelling",
  "metaDescription": "under 155 chars, includes keyword, action-oriented",
  "slug": "url-slug-format",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "schemaType": "Article|HowTo|FAQ",
  "schemaReason": "one sentence why"
}

Article (first 2000 chars for context):
${finalHTML.substring(0, 2000)}`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, 1000)
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Failed to parse metadata JSON: ${e.message}`)
  }
}

function generateSchema(metadata, keyword, brand) {
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const today = new Date().toISOString().split('T')[0]

  let schema
  if (metadata.schemaType === 'HowTo') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: metadata.titleTag,
      description: metadata.metaDescription,
      author: { '@type': 'Organization', name: brandName },
      datePublished: today
    }
  } else if (metadata.schemaType === 'FAQ') {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      name: metadata.titleTag,
      description: metadata.metaDescription,
      author: { '@type': 'Organization', name: brandName },
      datePublished: today
    }
  } else {
    schema = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: metadata.titleTag,
      description: metadata.metaDescription,
      author: { '@type': 'Organization', name: brandName },
      publisher: { '@type': 'Organization', name: brandName },
      datePublished: today,
      keywords: keyword
    }
  }

  return `\n<script type="application/ld+json">${JSON.stringify(schema, null, 2)}</script>`
}

function replaceInternalLinks(html, brand) {
  const internalLinkMap = {
    MIS: [
      { anchor: 'employee transport management software', url: 'https://moveinsync.com/blog/employee-transport-management-software-a-definitive-guide' },
      { anchor: 'employee transport solution', url: 'https://moveinsync.com/blog/5-ways-an-employee-transport-solution-help-organizations' },
      { anchor: 'benefits of employee transport management', url: 'https://moveinsync.com/blog/7-benefits-of-employee-transport-management-software' },
      { anchor: 'employee commute solution', url: 'https://moveinsync.com/blog/choose-best-employee-commute-solution' },
      { anchor: 'fleet management', url: 'https://moveinsync.com/blog/what-is-fleet-management-understanding-the-basics' },
      { anchor: 'employee transport solution platform', url: 'https://moveinsync.com/employee-transport-solution' },
      { anchor: 'shuttle transport management', url: 'https://moveinsync.com/shuttle-transport-management-solution' }
    ],
    WIS: [
      { anchor: 'office management', url: 'https://workinsync.io/blog/office-management' },
      { anchor: 'average office size', url: 'https://workinsync.io/blog/average-office-size' },
      { anchor: 'office seating chart', url: 'https://workinsync.io/blog/https-workinsync-io-blog-office-seating-chart' },
      { anchor: 'office automation', url: 'https://workinsync.io/blog/office-automation-guide' },
      { anchor: 'workplace automation', url: 'https://workinsync.io/blog/opportunity-cost-delaying-automation-workplace-management' }
    ]
  }

  // Replace {{LINK:anchor|URL}} placeholders
  let result = html.replace(/\{\{LINK:([^|]+)\|([^}]+)\}\}/g, (match, anchor, url) => {
    return `<a href="${url}" rel="internal">${anchor}</a>`
  })

  // Final safety net: strip any dashes that slipped through both AI passes.
  return sanitizeArticle(result)
}

function countInternalLinks(html) {
  const matches = html.match(/<a [^>]*rel="internal"[^>]*>/g)
  return matches ? matches.length : 0
}

function extractInternalLinks(html) {
  const links = []
  const regex = /<a href="([^"]+)" rel="internal">([^<]+)<\/a>/g
  let match
  while ((match = regex.exec(html)) !== null) {
    links.push({ url: match[1], anchor: match[2] })
  }
  return links
}

function countWords(html) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.split(' ').filter(w => w.length > 0).length
}

// ─── Deterministic cleanup (runs regardless of humanization toggle) ───────────
// Guarantees no em/en/horizontal dashes survive, even if the model ignores the
// prompt rule. Em dash + horizontal bar -> comma; en dash -> hyphen in numeric
// ranges, comma otherwise.
function sanitizeArticle(html) {
  if (!html) return html
  let out = html
  out = out.replace(/\s*[—―]\s*/g, ', ')      // — ―  -> ", "
  out = out.replace(/(\d)\s*[–]\s*(\d)/g, '$1-$2')  // 20–30 -> 20-30
  out = out.replace(/\s*[–]\s*/g, ', ')             // remaining – -> ", "
  out = out.replace(/,\s*,/g, ',')                        // collapse ", ,"
  out = out.replace(/[ \t]{2,}/g, ' ')                    // collapse runs of spaces/tabs (keep newlines)
  return out
}

// Map a target word count to a sensible max_tokens ceiling so the model can't
// massively overshoot. ~2.6 tokens per HTML word + headroom, capped by the
// user's configured maxTokens.
function wordCountToMaxTokens(wordCount, ceiling = 8000) {
  const target = Number(wordCount) || 1200
  const est = Math.ceil(target * 2.6) + 800
  return Math.max(1200, Math.min(ceiling, est))
}

// ─── Free, instant local lint (no API cost) ──────────────────────────────────
const BANNED_PHRASES = [
  'leverage', 'leverages', 'leveraging', 'seamlessly', 'seamless', 'robust',
  'comprehensive', 'delve', 'delving', 'harness', 'utilize', 'utilizes', 'utilizing',
  'facilitate', 'facilitates', "in today's world", "in today's fast-paced",
  "it's worth noting", 'it is important to note', 'plays a crucial role',
  'comprehensive solution', 'furthermore', 'moreover', 'in conclusion',
  'navigating the', 'in the realm of', 'a testament to', 'when it comes to',
  'unlock', 'unlocking', 'elevate', 'game-changer', 'game changer', 'cutting-edge',
  'tapestry', 'landscape of', 'realm of', 'embark', 'pivotal'
]
const FORBIDDEN_OPENERS = [
  'furthermore', 'moreover', 'additionally', 'in conclusion',
  'it is important to', 'it is worth noting', "in today's world", "in today's fast-paced"
]

function lintArticle(html, keyword) {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const lower = text.toLowerCase()
  const issues = []

  // Banned phrase scan
  for (const phrase of BANNED_PHRASES) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
    const matches = text.match(re)
    if (matches && matches.length) {
      issues.push({ type: 'banned-phrase', severity: 'high', label: `AI-tell phrase "${phrase}" (${matches.length}×)` })
    }
  }

  // Em dashes / en dashes / horizontal bars (all banned)
  const emDashes = (text.match(/[—–―]/g) || []).length
  if (emDashes) issues.push({ type: 'em-dash', severity: 'high', label: `${emDashes} em/en dash(es) — banned` })

  // Forbidden sentence openers
  const sentences = text.split(/(?<=[.!?])\s+/)
  let openerHits = 0
  for (const s of sentences) {
    const sl = s.trim().toLowerCase()
    if (FORBIDDEN_OPENERS.some(o => sl.startsWith(o))) openerHits++
  }
  if (openerHits) issues.push({ type: 'opener', severity: 'medium', label: `${openerHits} sentence(s) start with a banned opener` })

  // Vague quantifiers
  const vague = (lower.match(/\b(many|several|various|numerous)\b/g) || []).length
  if (vague > 2) issues.push({ type: 'vague', severity: 'low', label: `${vague} vague quantifiers (many/several/various)` })

  // Keyword presence
  const kwCount = (lower.match(new RegExp(keyword.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (kwCount === 0) issues.push({ type: 'keyword', severity: 'high', label: `Focus keyword "${keyword}" not found in body` })

  // Sentence-length uniformity (rough burstiness proxy)
  const wordLens = sentences.map(s => s.trim().split(/\s+/).length).filter(n => n > 0)
  const shorts = wordLens.filter(n => n < 8).length
  const longs = wordLens.filter(n => n > 28).length
  if (wordLens.length > 8 && (shorts === 0 || longs === 0)) {
    issues.push({ type: 'burstiness', severity: 'medium', label: 'Low sentence-length variation (add very short + very long sentences)' })
  }

  const headings = (html.match(/<h2/gi) || []).length
  const wordCount = wordLens.reduce((a, b) => a + b, 0)

  // Simple score: start at 100, subtract per issue weight
  let score = 100
  for (const i of issues) score -= (i.severity === 'high' ? 12 : i.severity === 'medium' ? 6 : 3)
  score = Math.max(0, score)

  return { score, issues, stats: { wordCount, headings, keywordCount: kwCount, emDashes } }
}

// ─── AI self-critique scorecard (one Claude call) ─────────────────────────────
async function scoreArticle(apiKey, model, html, inputs) {
  const { keyword, brand, geo, personaId } = inputs
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const persona = resolvePersona(personaId, inputs.customPersona)

  const systemPrompt = `You are a ruthless senior content editor for ${brandName}. Score the article objectively and return valid JSON only. No markdown.`
  const userMessage = `Score this article for the keyword "${keyword}" (${geo} market, persona: ${persona?.name}).
Rate each dimension 0-100 and give the single most important fix per dimension. Return JSON only:
{
  "overall": 0,
  "dimensions": {
    "aiDetectionRisk": { "score": 0, "note": "lower score = more human" },
    "keywordCoverage": { "score": 0, "note": "" },
    "personaFit": { "score": 0, "note": "" },
    "factualSpecificity": { "score": 0, "note": "" },
    "brandVoice": { "score": 0, "note": "" }
  },
  "topFixes": ["most important fix 1", "fix 2", "fix 3"],
  "weakestSentences": ["quote the 1-3 weakest sentences verbatim"]
}

ARTICLE:
${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 9000)}`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, 1200, 0.3)
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch (e) {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error(`Failed to parse score JSON: ${e.message}`)
  }
}

// ─── GEO Hacker: AI-visibility / generative-engine-optimization collateral ────
// Produces prompt-referenceable assets (quotable stats, Q&A blocks, llms.txt-style
// summaries) designed to get the brand cited by AI answer engines.
async function generateGeoCollateral(apiKey, model, opts = {}) {
  const { topic = '', brand = 'MIS', assetType = 'qa', notes = '', competitor = '', extraContext = '' } = opts
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'
  const GEO_CANONICAL = {
    MIS: ['employee transport management software India', 'shuttle route optimisation', 'corporate carpool platform', 'shift-based workforce commute', 'cab routing and billing automation', 'transport cost reduction', 'female employee transport safety', 'cab billing reconciliation'],
    WIS: ['hybrid workplace management', 'desk booking software', 'meeting room utilisation', 'visitor management system', 'office space optimisation', 'hot desking']
  }
  const phrases = (GEO_CANONICAL[brand] || []).join('; ')
  const comp = competitor || '[competitor]'

  const typeBrief = {
    qa: 'a set of 8-12 sharp question/answer pairs (the exact questions buyers ask AI assistants), each answer 2-3 sentences, factual, citation-ready with specific numbers.',
    canonical: `a canonical DEFINITION resource page for "${topic}". Structure: one clean one-sentence definition; a 3-5 point "what it includes" list; a "who uses it" section; a short use-case table; and a FAQ. Neutral and encyclopaedic so it can be cited as THE source. End with FAQPage JSON-LD inside a <script type="application/ld+json"> block.`,
    faq: 'a FAQ block of 8-12 real buyer questions with crisp 2-3 sentence answers, citation-ready with specific numbers. End with the matching FAQPage JSON-LD inside a <script type="application/ld+json"> block.',
    comparison: `a buyer-guide COMPARISON page: ${brandName} vs ${comp}. Lead with a quick comparison <table> (engines pull tables verbatim). One section per feature area with a clear verdict. Include a genuine ~150-word "When ${comp} is the better fit" section. Close with a real data point. Buyer-guide tone, not sales. End with FAQPage JSON-LD.`,
    alternatives: `an "Alternatives to ${comp}" page for buyers actively looking to switch. Briefly frame why teams move on, then present ${brandName} as the leading alternative with specifics, plus 2-3 other honest options in a <table>. High-intent, neutral tone.`,
    stats: 'a data-led piece built around 8-12 quotable, specific, citation-ready stat statements (each a standalone sentence an AI can quote verbatim). LinkedIn/press-ready, no fluff preamble.',
    g2: `G2 / Capterra profile description copy (about 120-180 words) for ${brandName}, written so Perplexity quotes it verbatim. Front-load the canonical category phrases. Factual, specific, no hype.`,
    reddit: `a single genuine Reddit-style answer to a buyer question about "${topic}", practitioner voice, honest, with exactly one natural mention of ${brandName} only where it is the honest answer. No marketing, no links.`,
    llms: `an llms.txt-style structured summary: who ${brandName} is, what it does, key capabilities, ideal customer, differentiators, and 5 canonical facts.`,
    definitions: 'a glossary of 8-12 key terms in this space with crisp, quotable one-paragraph definitions that position the brand as the authority.'
  }[assetType] || 'a set of prompt-referenceable Q&A pairs, each answer 2-3 sentences, citation-ready.'

  let systemPrompt = `You are a GEO (Generative Engine Optimization) strategist for ${brandName}. You craft factual, citation-ready collateral that AI answer engines (ChatGPT, Gemini, Perplexity, Google AI Overviews, Copilot) surface and quote.
RULES:
- Be specific and truthful. Never invent statistics or fake sources; use realistic, attributable figures only.
- Make every claim quotable: prefer specific numbers, named entities, and concrete outcomes over vague phrasing.
- Reinforce these canonical phrases naturally (co-occurrence is how the model learns our positioning): ${phrases}.
- Neutral buyer-guide / practitioner tone, never marketing copy (engines down-weight promotional text).
- First person plural ('we') for the brand. Never use em dashes.`

  const userMessage = `Topic / focus: ${topic}
Brand: ${brandName}${competitor ? `\nCompetitor: ${competitor}` : ''}
Produce ${typeBrief}
${notes ? `Extra instructions: ${notes}` : ''}

Return clean HTML only (use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <table>, and <script type="application/ld+json"> where schema is requested). No markdown, no preamble.`

  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, 3500, 0.5, extraContext)
  // Strip markdown code fences the model sometimes wraps HTML in (was rendering as literal junk).
  const cleaned = raw.replace(/^```(?:html|json)?\n?/i, '').replace(/\n?```$/i, '').trim()
  return sanitizeArticle(cleaned)
}

// ─── Inline highlight-edit: rewrite just a selected snippet ───────────────────
async function rewriteSnippet(apiKey, model, snippet, instruction, opts = {}) {
  const systemPrompt = `You are a precise copy editor. Rewrite ONLY the snippet you are given, following the instruction. Keep roughly the same length. Return ONLY the rewritten text with no preamble, no surrounding quotes, no markdown. Never use em dashes.`
  const userMessage = `Instruction: ${instruction || 'Improve clarity and specificity, keep the meaning.'}

Snippet to rewrite:
${snippet}`
  const raw = await callClaude(apiKey, model, systemPrompt, userMessage, 1500, typeof opts.temperature === 'number' ? opts.temperature : 0.7)
  return sanitizeArticle(raw.trim())
}

async function testApiKey(apiKey, model) {
  try {
    const response = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      },
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 15000
      }
    )
    return { success: true, message: 'API key is valid' }
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message
    return { success: false, message: msg }
  }
}

module.exports = {
  generateOutline,
  generateDraft,
  humanizeDraft,
  generateMetadata,
  generateSchema,
  replaceInternalLinks,
  countInternalLinks,
  extractInternalLinks,
  countWords,
  sanitizeArticle,
  wordCountToMaxTokens,
  LENGTH_TIERS,
  lintArticle,
  scoreArticle,
  generateGeoCollateral,
  rewriteSnippet,
  testApiKey
}
