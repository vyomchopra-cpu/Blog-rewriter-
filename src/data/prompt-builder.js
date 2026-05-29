import { productBlocks } from './product-blocks.js'
import { geoBlocks } from './geo-blocks.js'
import { personas, getPersonaById } from './personas.js'

const formatBlocks = {
  Informational: `This is an informational article. Open with a hook (stat or real scenario), not a definition. Cover the topic thoroughly. End with a CTA to explore the brand's solution.`,

  Listicle: `This is a listicle. Number each major section. Each item needs a specific example, not generic advice. Minimum 7 items for a listicle.`,

  'How-To Guide': `This is a how-to guide. Use numbered steps for processes. Each step needs a concrete action, not a vague direction. Include a 'Before You Start' or 'What You Need' section as the first H2.`,

  'Definitive Guide': `This is a comprehensive definitive guide. Cover the topic exhaustively. Use H3 subheadings extensively. This should be the most complete resource on this topic.`,

  Comparison: `This is a comparison article. Include a comparison table. Be balanced but lean toward the brand's strengths naturally. End with a clear recommendation section.`
}

const recoveryBlock = `IMPORTANT: This keyword has lost ranking position. The article must outperform current SERP leaders in depth and specificity. Go deeper than the top 3 results. Cover angles they miss. Use more specific data, more named examples, more actionable detail.`

const antiPatternBlock = `WRITING RULES - follow all of these exactly:
- Never open any sentence with: Furthermore, Moreover, Additionally, In conclusion, It is important to, It is worth noting, In today's world, In today's fast-paced
- Never use these words: leverage/leverages, seamlessly, robust, comprehensive, delve, harness, utilize (use 'use' instead), facilitate (use a direct verb instead)
- Never use em dashes
- Vary sentence length aggressively within every paragraph. Some sentences must be under 8 words. Some must be over 30 words. No paragraph should have uniform sentence length.
- Use specific numbers, not 'many', 'several', 'various', 'numerous'
- Reference named real entities: specific places, specific regulations, specific named reports
- The intro must NOT begin with the keyword or with a definition. Open with a scenario, a stat, or a provocative claim.`

export function buildSystemPrompt(inputs) {
  const { keyword, brand, geo, personaId, format, lostKeywordMode } = inputs
  const persona = getPersonaById(personaId)
  const brandName = brand === 'MIS' ? 'MoveInSync' : 'WorkInSync'

  const parts = []

  // Core identity
  parts.push(`You are a senior B2B content strategist writing for ${brandName}.
Write authoritatively and specifically. Use 'we' and 'our' (first-person plural) when referencing the brand. This article targets ${persona.name} who ${persona.primaryPain}.
Never recommend competitor products. Never use generic filler content.`)

  // Product block
  parts.push(productBlocks[brand])

  // Persona block
  parts.push(`PERSONA CONTEXT:
Target reader: ${persona.name}
Primary pain: ${persona.primaryPain}
Key concerns: ${persona.keyConcerns.join(', ')}
Vocabulary they use: ${persona.vocabulary.join(', ')}
CTA angle: ${persona.ctaAngle}`)

  // Geo block
  parts.push(geoBlocks[geo])

  // Format block
  const formatBlock = formatBlocks[format]
  if (formatBlock) {
    parts.push(`FORMAT INSTRUCTIONS:\n${formatBlock.replace('[brand]', brandName)}`)
  }

  // Recovery block
  if (lostKeywordMode) {
    parts.push(recoveryBlock)
  }

  // Anti-pattern block
  parts.push(antiPatternBlock)

  return parts.join('\n\n')
}
