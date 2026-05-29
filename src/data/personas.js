export const personas = [
  {
    id: 'transport-manager',
    name: 'Transport Manager',
    primaryPain: 'manages daily vehicle dispatch, driver compliance, route SLAs, and incident reporting with fragmented tools and vendor chaos',
    keyConcerns: ['SLA adherence', 'driver compliance', 'incident reporting', 'vendor management', 'route efficiency', 'real-time tracking'],
    vocabulary: ['dispatch', 'SLA', 'route adherence', 'fleet utilization', 'driver onboarding', 'trip logs'],
    ctaAngle: 'See how MoveInSync replaces spreadsheets and WhatsApp groups with a single transport control platform'
  },
  {
    id: 'ehs-director',
    name: 'EHS Director',
    primaryPain: 'responsible for employee safety in transit, audit compliance, incident documentation, and reducing liability exposure',
    keyConcerns: ['safety incidents', 'audit trails', 'female employee transport compliance', 'SOS tracking', 'POSH compliance', 'carbon reporting'],
    vocabulary: ['incident log', 'safety audit', 'geofencing', 'SOS alert', 'compliance report', 'duty of care'],
    ctaAngle: 'See how MoveInSync gives EHS teams real-time safety visibility and automated compliance documentation'
  },
  {
    id: 'workplace-director',
    name: 'Workplace Director',
    primaryPain: 'managing space utilization, hybrid work schedules, visitor flows, and meeting room availability across multiple offices',
    keyConcerns: ['space utilization', 'desk availability', 'visitor management', 'meeting room conflicts', 'hybrid policy execution', 'employee experience'],
    vocabulary: ['utilization rate', 'occupancy data', 'hot desk', 'visitor flow', 'hybrid schedule', 'space planning'],
    ctaAngle: 'See how WorkInSync gives workplace teams real-time visibility into space, visitors, and desk bookings'
  },
  {
    id: 'hr-director',
    name: 'HR Director',
    primaryPain: 'reducing commute-driven attrition, enforcing transport policies, managing employee satisfaction with commute experience',
    keyConcerns: ['employee satisfaction', 'attrition linked to commute', 'transport policy compliance', 'benefit administration', 'employee NPS'],
    vocabulary: ['employee experience', 'attrition rate', 'commute benefit', 'policy enforcement', 'satisfaction score'],
    ctaAngle: 'See how organizations use MoveInSync to reduce commute-related attrition and improve employee experience scores'
  },
  {
    id: 'procurement',
    name: 'Procurement',
    primaryPain: 'vendor evaluation, contract management, total cost of ownership calculation, and reducing transport spend leakage',
    keyConcerns: ['TCO', 'vendor SLAs', 'contract compliance', 'spend visibility', 'vendor consolidation', 'audit readiness'],
    vocabulary: ['total cost of ownership', 'vendor SLA', 'contract terms', 'spend analysis', 'procurement audit', 'RFP criteria'],
    ctaAngle: 'See the TCO framework MoveInSync customers use to evaluate employee transport platforms'
  },
  {
    id: 'cfo',
    name: 'CFO',
    primaryPain: 'reducing transport cost per seat, eliminating billing fraud, getting visibility into fleet spend, and justifying commute program ROI',
    keyConcerns: ['cost per seat', 'billing fraud', 'fleet spend visibility', 'ROI justification', 'contract leakage', 'budgeting accuracy'],
    vocabulary: ['cost per trip', 'billing reconciliation', 'fleet spend', 'ROI', 'cost center', 'variance analysis'],
    ctaAngle: 'See how CFOs use MoveInSync data to cut transport spend by 20-30% without cutting employee coverage'
  },
  {
    id: 'cto-it',
    name: 'CTO/IT Director',
    primaryPain: 'integrating transport or workplace systems with existing HRMS, SSO, and enterprise stack without creating new security risks',
    keyConcerns: ['API integrations', 'SSO/SAML', 'data security', 'uptime SLA', 'HRMS integration', 'mobile app reliability'],
    vocabulary: ['API', 'SSO', 'SAML', 'data residency', 'uptime', 'HRMS integration', 'mobile SDK', 'webhook'],
    ctaAngle: 'See MoveInSync integration capabilities: HRMS, SSO, and enterprise security documentation'
  },
  {
    id: 'coo-vp-ops',
    name: 'COO/VP Ops',
    primaryPain: 'consolidating operational complexity, reducing vendor count, scaling commute or workplace operations across multiple sites without proportional cost increase',
    keyConcerns: ['operational efficiency', 'vendor consolidation', 'multi-site operations', 'scalability', 'cost per employee', 'process standardization'],
    vocabulary: ['operational efficiency', 'site operations', 'vendor rationalization', 'standardization', 'scale', 'process optimization'],
    ctaAngle: 'See how operations leaders use MoveInSync to standardize transport operations across 10+ sites from a single dashboard'
  }
]

export function getPersonaById(id) {
  return personas.find(p => p.id === id)
}

export function getDefaultPersonaForBrand(brand) {
  return brand === 'MIS' ? 'transport-manager' : 'workplace-director'
}
