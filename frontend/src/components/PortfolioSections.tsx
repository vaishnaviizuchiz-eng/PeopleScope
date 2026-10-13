export type PortfolioRecord = {
  country: string
  country_code: string
  year: number
  metric: string
  value: number
  unit: string
  source_name: string
  source_url: string
  definition: string
  methodology: string
  industry: string
  geography: string
  notes: string
}

type Props = { records: PortfolioRecord[]; countryA: string; countryB: string; year: number; industry: string }

const labels: Record<string, string> = {
  employee_engagement: 'Employee Engagement', employee_wellbeing: 'Employee Wellbeing', daily_stress: 'Daily Stress',
  overall_attrition: 'Overall Attrition', voluntary_attrition: 'Voluntary Attrition', involuntary_attrition: 'Involuntary Attrition', sector_attrition: 'Sector Attrition',
  genai_workplace_use: 'GenAI Workplace Use', unemployment_rate: 'Unemployment Rate', labour_force_participation: 'Labour Force Participation', employment_to_population: 'Employment-to-Population Ratio',
}
const groups = [
  { title: 'People Experience', metrics: ['employee_engagement', 'employee_wellbeing', 'daily_stress'] },
  { title: 'Retention', metrics: ['overall_attrition', 'voluntary_attrition', 'involuntary_attrition', 'sector_attrition'] },
  { title: 'Future of Work', metrics: ['genai_workplace_use'] },
  { title: 'Labour Market', metrics: ['unemployment_rate', 'labour_force_participation', 'employment_to_population'] },
]
const metricSource = (metric: string) => metric.startsWith('employee_') || metric === 'daily_stress' ? 'Gallup' : metric.endsWith('attrition') ? 'EY India' : metric === 'genai_workplace_use' ? 'Microsoft / LinkedIn Work Trend Index' : 'World Bank / ILO'
const fmt = (record?: PortfolioRecord) => record ? `${record.value}${record.unit === 'percent' ? '%' : ` ${record.unit}`}` : 'Data not available for this selection'

export function ExecutiveOverview({ records, countryA, year, industry }: Props) {
  const cards = [
    { metric: 'employee_engagement', country: countryA, year }, { metric: 'employee_wellbeing', country: countryA, year },
    { metric: 'daily_stress', country: countryA, year }, { metric: 'overall_attrition', country: 'India', year },
    { metric: 'genai_workplace_use', country: countryA, year: 2024 }, { metric: 'unemployment_rate', country: countryA, year },
    { metric: 'labour_force_participation', country: countryA, year },
  ]
  return <section id="executive-summary" className="dashboard-section portfolio-section" aria-labelledby="executive-overview-title">
    <div className="section-heading"><div><span className="section-eyebrow">SOURCE-BACKED INDICATORS</span><h2 id="executive-overview-title">PeopleScope Executive Overview</h2><p>Selected country context and the latest available year for each measure are shown with their source.</p></div></div>
    <div className="portfolio-overview-grid">{cards.map((card) => {
      const record = industry === 'All Industries' ? records.find((row) => row.metric === card.metric && row.country === card.country && row.year === card.year && (card.metric !== 'sector_attrition' || row.industry === industry)) : undefined
      return <article className="portfolio-kpi" key={`${card.metric}-${card.country}`}><span className="portfolio-kpi-source">{metricSource(card.metric)}</span><h3>{labels[card.metric]}</h3><strong>{fmt(record)}</strong><div className="portfolio-kpi-meta"><span>{card.country}</span><span>{record ? record.year : card.year}</span></div>{record && <p className="portfolio-kpi-definition">{record.definition}</p>}<small className="portfolio-kpi-scope">{record ? `${record.geography} · ${record.industry}` : 'Scope follows source availability'}</small><a href={record?.source_url || '#data-methodology'} target={record?.source_url ? '_blank' : undefined} rel="noreferrer">{record ? `${record.source_name} ↗` : 'Source details / availability'}</a></article>
    })}</div>
  </section>
}

export function WorkforceScorecard({ records, countryA, year, industry }: Props) {
  return <section id="scorecard" className="dashboard-section portfolio-section" aria-labelledby="scorecard-title"><div className="section-heading"><div><span className="section-eyebrow">COVERAGE MAP</span><h2 id="scorecard-title">Global Workforce Scorecard</h2><p>Coverage by topic. Availability reflects the selected country, year and industry.</p></div></div><div className="scorecard-grid">{groups.map((group) => <article className="scorecard-group" key={group.title}><h3>{group.title}</h3>{group.metrics.map((metric) => {
    const match = records.find((r) => r.metric === metric && r.country === (metric.endsWith('attrition') ? 'India' : countryA) && r.year === (metric === 'genai_workplace_use' ? 2024 : year) && (industry === 'All Industries' || r.industry === industry))
    const hasCountryPair = metric === 'genai_workplace_use' ? records.some((r) => r.metric === metric && r.country === countryA && r.year === 2024) : Boolean(match)
    return <div className="scorecard-row" key={metric}><span>{labels[metric]}</span><span className={hasCountryPair ? 'coverage-pill available' : 'coverage-pill pending'}>{hasCountryPair ? 'Available' : 'Pending'}</span><small>{metricSource(metric)}</small></div>
  })}</article>)}</div></section>
}

export function KeyWorkforceInsights({ records, countryA, countryB, year, industry }: Props) {
  const selected = industry === 'All Industries' && countryA !== countryB ? records.filter((r) => r.year === year && r.industry === 'All Industries') : []
  const gallup = ['employee_engagement', 'employee_wellbeing', 'daily_stress'].flatMap((metric) => {
    const a = selected.find((r) => r.metric === metric && r.country === countryA)
    const b = selected.find((r) => r.metric === metric && r.country === countryB)
    if (!a || !b) return []
    const gap = Math.abs(a.value - b.value)
    const text = gap === 0
      ? `${countryA} and ${countryB} have equal observed ${labels[metric].toLowerCase()} values in ${year}.`
      : `${countryA} and ${countryB} show different observed ${labels[metric].toLowerCase()} levels (${gap} percentage-point difference).`
    return [{ text, metric, country: `${countryA} and ${countryB}`, year, source: a.source_name, url: a.source_url }]
  })
  const insights = [...gallup]
  const sector = records.filter((r) => r.metric === 'sector_attrition' && r.year === 2025 && (industry === 'All Industries' || r.industry === industry))
  if (sector.length && industry === 'All Industries') insights.push({ text: `India's EY-reported attrition varies across the ${sector.length} sectors included in the dataset.`, metric: 'Sector Attrition', country: 'India', year: 2025, source: sector[0].source_name, url: sector[0].source_url })
  else if (sector.length) insights.push({ text: `${sector[0].industry} has a reported India attrition value of ${sector[0].value}% for 2025 in the EY dataset.`, metric: 'Sector Attrition', country: 'India', year: 2025, source: sector[0].source_name, url: sector[0].source_url })
  const ai = records.find((r) => r.metric === 'genai_workplace_use' && r.country === countryA && r.year === 2024)
  if (ai && year === 2024 && industry === 'All Industries') insights.push({ text: `${countryA} recorded ${ai.value}% reported GenAI workplace use among knowledge workers in this survey.`, metric: labels[ai.metric], country: ai.country, year: ai.year, source: ai.source_name, url: ai.source_url })
  const labourA = records.find((r) => r.metric === 'labour_force_participation' && r.country === countryA && r.year === year)
  const labourB = records.find((r) => r.metric === 'labour_force_participation' && r.country === countryB && r.year === year)
  if (labourA && labourB && industry === 'All Industries' && countryA !== countryB) insights.push({ text: `${countryA} and ${countryB} have different observed labour-force participation rates in the selected World Bank / ILO series.`, metric: labels[labourA.metric], country: `${countryA} and ${countryB}`, year, source: labourA.source_name, url: labourA.source_url })
  return <section id="key-insights" className="dashboard-section portfolio-section" aria-labelledby="key-insights-title"><div className="section-heading"><div><span className="section-eyebrow">OBSERVED DATA · NO CAUSAL CLAIMS</span><h2 id="key-insights-title">Key Workforce Insights</h2><p>Rule-based descriptions of available observations for the current filter selection.</p></div></div>{insights.length ? <div className="key-insights-grid">{insights.map((item, index) => <article className="key-insight-card" key={`${item.metric}-${item.country}-${index}`}><span className="coverage-pill available">Observed data</span><p>{item.text}</p><dl><div><dt>Metric</dt><dd>{labels[item.metric] || item.metric}</dd></div><div><dt>Country</dt><dd>{item.country}</dd></div><div><dt>Year</dt><dd>{item.year}</dd></div></dl><a href={item.url} target="_blank" rel="noreferrer">{item.source} ↗</a></article>)}</div> : <div className="empty-state"><strong>Data not available for this selection</strong><span>Choose a year and industry with verified observations to see rule-based insights.</span></div>}</section>
}

export function HrInvestigationAreas() {
  const areas = [
    ['Employee Experience', 'Investigate engagement drivers, manager effectiveness, recognition and career development.'],
    ['Retention', 'Review sector-specific retention risks and voluntary attrition patterns.'],
    ['Future of Work', 'Assess AI capability building, employee training and responsible AI adoption.'],
    ['Workforce Planning', 'Consider labour-market participation and unemployment conditions when planning hiring.'],
    ['Compensation', 'Review compensation competitiveness when reliable comparable wage data becomes available.'],
  ]
  return <section id="hr-actions" className="dashboard-section portfolio-section"><div className="section-heading"><div><span className="section-eyebrow">INVESTIGATION PROMPTS</span><h2>HR Investigation Areas</h2><p>These are prompts for further inquiry, not conclusions from the dataset.</p></div></div><div className="investigation-grid">{areas.map(([title, prompt]) => <article className="investigation-card" key={title}><span>Potential area to investigate</span><h3>{title}</h3><p>{prompt}</p></article>)}</div><p className="disclaimer-inline">HR investigation prompts are not conclusions from the dataset.</p></section>
}

export function DataMethodology({ records }: { records: PortfolioRecord[] }) {
  const sourceConfigs = [
    { match: (r: PortfolioRecord) => r.source_name === 'Gallup', title: 'Gallup' },
    { match: (r: PortfolioRecord) => r.source_name === 'EY India', title: 'EY' },
    { match: (r: PortfolioRecord) => r.source_name.includes('Microsoft'), title: 'Microsoft / LinkedIn Work Trend Index' },
    { match: (r: PortfolioRecord) => r.source_name.includes('World Bank'), title: 'World Bank / ILO' },
  ]
  const sources = sourceConfigs.map((config) => {
    const rows = records.filter(config.match)
    const first = rows[0]
    return { ...config, rows, first, metrics: [...new Set(rows.map((r) => labels[r.metric] || r.metric))], countries: [...new Set(rows.map((r) => r.country))].join(', '), years: [...new Set(rows.map((r) => r.year))].sort().join(', '), definitions: [...new Set(rows.map((r) => r.definition))], geographies: [...new Set(rows.map((r) => r.geography))].join(', '), industries: [...new Set(rows.map((r) => r.industry))].join(', '), methods: [...new Set(rows.map((r) => r.methodology))] }
  }).filter((source) => source.rows.length)
  return <section id="data-methodology" className="dashboard-section portfolio-section" aria-labelledby="data-methodology-title"><div className="section-heading"><div><span className="section-eyebrow">SOURCE AND MEASUREMENT DETAILS</span><h2 id="data-methodology-title">Data &amp; Methodology</h2><p>Definitions and provenance remain attached to each record. Comparability is assessed metric by metric.</p></div></div><div className="comparability-legend"><span className="coverage-pill available">Comparable</span><span className="coverage-pill context">Partially comparable / context only</span><span className="coverage-pill pending">Comparable data pending</span></div><div className="data-principles"><p>PeopleScope does not treat similarly named metrics from different sources as automatically comparable.</p><p>Observed differences do not establish causation.</p></div><div className="source-grid">{sources.length ? sources.map((source) => <article className="source-card" key={source.title}><div className="source-card-heading"><h3>{source.title}</h3><span className="coverage-pill context">Review at metric level</span></div><dl><div><dt>Metric(s)</dt><dd>{source.metrics.join(', ')}</dd></div><div><dt>Country</dt><dd>{source.countries}</dd></div><div><dt>Year(s)</dt><dd>{source.years}</dd></div><div><dt>Definition</dt><dd>{source.definitions.slice(0, 3).join(' · ')}{source.definitions.length > 3 ? ` · +${source.definitions.length - 3} more definitions` : ''}</dd></div><div><dt>Geography</dt><dd>{source.geographies}</dd></div><div><dt>Industry coverage</dt><dd>{source.industries}</dd></div><div><dt>Methodology</dt><dd>{source.methods.slice(0, 2).join(' · ')}{source.methods.length > 2 ? ` · +${source.methods.length - 2} more record-level methods` : ''}</dd></div></dl>{source.first ? <a href={source.first.source_url} target="_blank" rel="noreferrer">Open source ↗</a> : <span className="source-unavailable">Source unavailable</span>}</article>) : <div className="empty-state"><strong>Source unavailable</strong><span>No source records are currently loaded.</span></div>}</div><div className="methodology-detail-grid"><article><h3>Comparable</h3><p>Gallup country values are compared within the same Gallup measure and period. Work Trend Index India and U.S. workplace-use values share a survey definition and 2024 methodology. World Bank / ILO labour indicators use matched annual modelled series and definitions.</p></article><article><h3>Partially comparable / context only</h3><p>EY attrition values describe India-specific employer survey/report figures. Sector values provide within-source context only; they are not compared with another country's turnover or attrition measure.</p></article><article><h3>Comparable data pending</h3><p>U.S. attrition, annual working-hours comparisons, and matched wage-growth comparisons are not currently available in this dataset.</p></article></div><details className="attrition-provenance methodology-records"><summary>Inspect all source records ({records.length})</summary><div className="attrition-table-wrap"><table><thead><tr><th>Country</th><th>Year</th><th>Metric</th><th>Value</th><th>Definition</th><th>Methodology</th><th>Geography</th><th>Industry</th><th>Source</th></tr></thead><tbody>{records.map((r, i) => <tr key={`${r.country}-${r.metric}-${r.year}-${r.industry}-${i}`}><td>{r.country}</td><td>{r.year}</td><td>{labels[r.metric] || r.metric}</td><td>{fmt(r)}</td><td>{r.definition}</td><td>{r.methodology}</td><td>{r.geography}</td><td>{r.industry}</td><td><a href={r.source_url} target="_blank" rel="noreferrer">{r.source_name} ↗</a></td></tr>)}</tbody></table></div></details></section>
}
