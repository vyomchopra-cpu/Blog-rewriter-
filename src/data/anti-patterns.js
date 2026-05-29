export const antiPatternPhrases = [
  { find: "In today's world", replace: null, action: 'rewrite' },
  { find: "In today's fast-paced", replace: null, action: 'rewrite' },
  { find: "It's worth noting", replace: '', action: 'remove' },
  { find: "It is important to note", replace: '', action: 'remove' },
  { find: 'plays a crucial role', replace: null, action: 'replace_verb' },
  { find: 'leverages', replace: 'uses', action: 'replace' },
  { find: 'leverage', replace: 'use', action: 'replace' },
  { find: 'seamlessly', replace: '', action: 'remove' },
  { find: 'robust', replace: null, action: 'describe_specifically' },
  { find: 'comprehensive solution', replace: '', action: 'remove' },
  { find: 'delve into', replace: 'cover', action: 'replace' },
  { find: 'Furthermore', replace: null, action: 'replace_transition' },
  { find: 'Moreover', replace: null, action: 'replace_transition' },
  { find: 'In conclusion', replace: null, action: 'direct_close' },
  { find: 'utilize', replace: 'use', action: 'replace' },
  { find: 'utilizes', replace: 'uses', action: 'replace' },
  { find: 'facilitate', replace: null, action: 'replace_verb' },
  { find: 'harness', replace: 'use', action: 'replace' }
]

export const forbiddenOpeners = [
  'Furthermore',
  'Moreover',
  'Additionally',
  'In conclusion',
  'It is important to',
  'It is worth noting',
  "In today's world",
  "In today's fast-paced"
]
