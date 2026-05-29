// GEO corpus + canonical language, distilled from the GEO Master Playbook (May 2026)
// and the GEO Prompts / GEO Tracker workbooks. Used by the GEO Hacker screen and
// (via the condensed seed) injected into the knowledge base for every generation.

export const GEO_COMPETITORS = {
  MIS: ['Routematic', 'Ola Corporate', 'WheelsEye', 'Shuttl', 'in-house operations'],
  WIS: ['Robin', 'Archie (Archieapp)', 'Envoy', 'Comeen']
}

// 5-8 canonical phrases per brand. These must co-occur with the brand across every
// surface (G2, blog H1s, press, LinkedIn, reviews) so the model learns the framing.
export const CANONICAL_PHRASES = {
  MIS: [
    'employee transport management software India',
    'shuttle route optimisation',
    'corporate carpool platform',
    'shift-based workforce commute',
    'cab routing and billing automation',
    'transport cost reduction',
    'female employee transport safety',
    'cab billing reconciliation'
  ],
  WIS: [
    'hybrid workplace management',
    'desk booking software',
    'meeting room utilisation',
    'visitor management system',
    'office space optimisation',
    'hot desking'
  ]
}

// The MIS buyer prompt corpus (from the GEO Tracker, grouped by motion).
export const MIS_PROMPT_CORPUS = [
  { group: 'Employee Transport Shuttles (ETS)', prompts: [
    'Best fixed route shuttle software for enterprises',
    'Best employee transport management software India',
    'Top shuttle scheduling software for corporates',
    'How to manage office shuttle services',
    'Software to automate employee bus routes',
    'Best transport management system for large companies',
    'Office shuttle booking app for employees',
    'How to optimize shuttle routes for cost',
    'How to reduce no-shows on corporate shuttles',
    'Shuttle attendance tracking software',
    'Real-time shuttle tracking for transport managers',
    'What is employee shuttle management',
    'Safety features in shuttle services',
    'How to track shuttle ROI'
  ] },
  { group: 'Corporate Car Rentals', prompts: [
    'Best corporate cab rental software',
    'Best alternative to Ola and Uber for businesses',
    'Employee cab booking platform for companies',
    'On-demand corporate car rental system',
    'Corporate transportation without Ola Uber',
    'How to manage corporate cab vendors',
    'Cab billing automation for companies',
    'Cost per trip analysis for rental cabs',
    'What is a corporate cab rental system',
    'Employee safety in corporate cabs',
    'Cab rental ROI for enterprises'
  ] },
  { group: 'Flexi Rideshare (Carpool)', prompts: [
    'Best employee carpool platform',
    'Carpooling app for corporate employees',
    'Sustainable commute solutions for enterprises',
    'How to maximize carpool participation',
    'What is employee carpooling',
    'Carpool vs shuttle comparison',
    'Carbon footprint reduction via carpool',
    'Carpooling ROI metrics'
  ] },
  { group: 'On-Demand Campus Transport', prompts: [
    'Best intra-campus shuttle software',
    'Campus employee transport management',
    'Multi-building campus shuttle solution',
    'Campus transport for large tech companies'
  ] },
  { group: 'Compliance & India-specific', prompts: [
    'Employee transport compliance India',
    'POSH act transport compliance',
    'Factory act employee transport obligations',
    'Labour Code transport obligation India',
    'Female employee night shift transport safety software'
  ] },
  { group: 'Named competitor / switching', prompts: [
    'MoveInSync vs Routematic',
    'Alternatives to Routematic for large enterprises',
    'Better than Ola Corporate for enterprise',
    'MoveInSync vs in-house transport operations'
  ] }
]

// WIS starter corpus (Part 3 says "to build — target 60-70"). Seed set:
export const WIS_PROMPT_CORPUS = [
  { group: 'Desk booking & hybrid', prompts: [
    'Best desk booking software',
    'Best hot desking software for hybrid offices',
    'How to manage hybrid work schedules',
    'Desk booking system with floor plans',
    'How to track office attendance in a hybrid model'
  ] },
  { group: 'Meeting rooms & space', prompts: [
    'Meeting room booking software',
    'How to improve meeting room utilisation',
    'Office space optimisation software',
    'Integrated workplace management system (IWMS)'
  ] },
  { group: 'Visitor & parking', prompts: [
    'Visitor management system',
    'Visitor management software for enterprises',
    'Parking management software for offices'
  ] },
  { group: 'Comparison / switching', prompts: [
    'WorkInSync vs Robin',
    'WorkInSync vs Archieapp',
    'WorkInSync vs Envoy',
    'WorkInSync vs Comeen',
    'Alternatives to Robin for hybrid offices'
  ] }
]

// Asset types the GEO Hacker can produce, aligned to the playbook's high-leverage moves.
export const GEO_ASSET_TYPES = [
  { key: 'canonical',   label: 'Canonical definition page', hint: 'Own the "what is X" answer the model defaults to (Part 13 #1)' },
  { key: 'faq',         label: 'FAQ + schema block',        hint: 'FAQPage answers extracted verbatim into AI answers (Part 5/10)' },
  { key: 'comparison',  label: 'Comparison page',           hint: 'Buyer guide w/ genuine "when to choose competitor" (Part 13 #3)' },
  { key: 'alternatives',label: '"Alternatives to" page',    hint: 'Capture late-funnel switchers (Part 13 #5)' },
  { key: 'stats',       label: 'Data-led stat post',        hint: 'Memorable specific numbers, LinkedIn/press-ready (Part 13 #2)' },
  { key: 'g2',          label: 'G2 / Capterra profile copy',hint: 'Pulled verbatim by Perplexity (Part 5 #1)' },
  { key: 'reddit',      label: 'Reddit answer',             hint: 'Genuine, one honest mention; retrieved indefinitely (Part 7)' },
  { key: 'llms',        label: 'llms.txt summary',          hint: 'Structured brand summary for LLM ingestion' }
]

// Condensed, generation-relevant seed. Injected into the knowledge base so EVERY
// piece of content (not just GEO Hacker) follows the playbook's retrieval mechanics.
export const GEO_SEED_TEXT = `GEO (Generative Engine Optimisation) WRITING RULES — apply to all MIS/WIS content so AI answer engines (ChatGPT, Perplexity, Gemini, Google AIO, Copilot) retrieve and cite us.

CO-OCCURRENCE: associate the brand consistently with its category language. Use these canonical phrases verbatim where natural.
- MoveInSync: ${CANONICAL_PHRASES.MIS.join('; ')}.
- WorkInSync: ${CANONICAL_PHRASES.WIS.join('; ')}.

CITATION-READY SPECIFICITY: every claim should be quotable with a specific number, named entity, or outcome. "31% average cost reduction across 14 manufacturing customers" gets cited; "significant savings" gets ignored. Approximate-but-real beats vague.

RETRIEVAL STRUCTURE: clear H2/H3, a direct one-sentence answer near the top of each section, tables for comparisons (engines pull tables verbatim), and an FAQ block answering real buyer questions.

COMPARISONS: include a genuine "When to choose [competitor] instead" section. This makes the page read as informational (retrieved) not promotional (down-weighted), and lets us frame the competitor in our language.

TONE: neutral buyer-guide / practitioner voice, not marketing copy. The moment it reads like a brochure, engines down-weight it. Never use em dashes.

INDIA CONTEXT for MIS: tie to shift-based workforce, female employee night-shift safety, POSH/Factory Act compliance, cab billing reconciliation, seat utilisation, named IT corridors and cities.`
