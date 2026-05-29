export const keywords = {
  MIS: {
    US: {
      target: [
        'company shuttle',
        'corporate shuttle service',
        'employee shuttles',
        'staff shuttle service',
        'employee shuttle service',
        'employee transportation services',
        'transportation for employees',
        'employee transportation solutions',
        'employee transport management system'
      ],
      lost: [
        'vehicle fleet management',
        'employee transportation solution',
        'employee transportation services',
        'employee transportation software',
        'operations management',
        'what is fleet management system'
      ]
    },
    India: {
      target: [
        'sustainable transportation',
        'employee transportation services',
        'employee transport services',
        'commute to office',
        'commuting to office',
        'corporate employee transportation',
        'employee transport management system',
        'employee transport solution',
        'employee transportation solutions',
        'transport management solution',
        'drop cabs',
        'metro feeder bus',
        'metro feeder bus service',
        'business car rental',
        'corporate car rental services',
        'employee shuttle services',
        'fleet management software',
        'transport management software',
        'transportation management system software',
        'route optimization software',
        'vehicle tracking software',
        'employee transport management software'
      ],
      lost: [
        'transport services',
        'ets meaning',
        'employee transport solution'
      ]
    }
  },
  WIS: {
    US: {
      target: [
        'hot desking',
        'visitor management system',
        'integrated workplace management system',
        'meeting room booking software',
        'parking management software',
        'visitor management software',
        'space management software',
        'desk booking software',
        'desk booking system',
        'iwms software',
        'workplace experience platform'
      ],
      lost: [
        'intelligent workplace',
        'hybrid schedule meaning',
        'paperless office solutions',
        'staff booking system',
        'visitor management solution',
        'visitor management system',
        'workplace management solutions',
        'desk sharing',
        'space management tools',
        'space management software',
        'visitor management solutions',
        'visitor management software',
        'office hoteling software'
      ]
    },
    India: {
      target: [
        'workplace management system',
        'workplace management software',
        'hot desking',
        'meeting room booking software',
        'visitor management system',
        'hybrid workplace',
        'workplace experience'
      ],
      lost: [
        'office space management',
        'work efficiency',
        'hot desking software',
        'visitor management system',
        'space management',
        'flexible workspace',
        'work automation',
        'collaborative workspace',
        'office space standards and guidelines',
        'increase efficiency'
      ]
    }
  }
}

export function getKeywordsForBrandGeo(brand, geo) {
  const data = keywords[brand]?.[geo]
  if (!data) return []
  const lostSet = new Set(data.lost.map(k => k.toLowerCase()))
  const allKeywords = [
    ...data.lost.map(k => ({ keyword: k, isLost: true })),
    ...data.target
      .filter(k => !lostSet.has(k.toLowerCase()))
      .map(k => ({ keyword: k, isLost: false }))
  ]
  return allKeywords
}

export function isLostKeyword(keyword, brand, geo) {
  const data = keywords[brand]?.[geo]
  if (!data) return false
  return data.lost.some(k => k.toLowerCase() === keyword.toLowerCase())
}
