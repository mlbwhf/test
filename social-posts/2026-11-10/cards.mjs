export const SERIES = 'Report AI research';
export const cards = [
 {n:1, series:'AI Market Pulse · Nov 2026', file:'pulse-capex-q3.png', eyebrow:'Big tech capex', headline:'Four companies spent about $207B on capex in one quarter', chart:'col', pre:'$', unit:'B', dec:1,
  rows:[{l:'Amazon',v:75.9,hl:1},{l:'Alphabet',v:51.4},{l:'Microsoft',v:45.2},{l:'Meta',v:34.9}],
  note:'Q3 2026 (Jul–Sep), as each company reports it: Amazon net of incentives; Microsoft and Meta include finance leases. Free cash flow was negative at Meta, Alphabet and Amazon.', conf:'MEDIUM', source:'Company results, Oct 2026; total is Report AI arithmetic'},
 {n:2, series:'Market research · Nov 2026', file:'agents-market-2030.png', eyebrow:'AI agents market', headline:'"The AI agents market in 2030" depends on what you count', chart:'hbar', pre:'$', unit:'B',
  rows:[{l:'Standalone agent revenue (median of 20 forecasts)',v:49,hl:1},{l:'Bank of America: value agents could capture',v:155},{l:'Goldman Sachs: agents’ implied share of app software',v:468,lab:'>$468B'},{l:'Gartner: all software with agentic features',v:985}],
  note:'Only the first bar measures an "AI agents market" in revenue. Research firms put it at about $7–8B in 2025.', conf:'DERIVED', source:'30 forecasts from 24 firms, compiled by Report AI'},
 {n:3, series:'AI Market Pulse · Nov 2026', file:'pulse-ai-job-cuts.png', eyebrow:'AI and jobs', headline:'AI-attributed US job cuts: 2026 is already twice 2025', chart:'col', unit:'',
  rows:[{l:'All of 2025',v:54836,lab:'54,836'},{l:'Jan–Oct 2026',v:121401,hl:1,lab:'121,401'}],
  note:'But October 2026 had just 1,265, the lowest month of the year, and "market/economic conditions" is now the top stated reason for cuts.', conf:'MEDIUM', source:'Challenger, Gray & Christmas, 5 Nov 2026'},
];
