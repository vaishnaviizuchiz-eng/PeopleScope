import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Bar,
  BarChart,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import workforceCsv from '../../data/processed/workforce_metrics_template.csv?raw'
import { AiAdoptionModule } from './components/AiAdoptionModule'
import type { AiWorkforceRecord } from './utils/aiWorkforceInsights'
import { LabourMarketModule } from './components/LabourMarketModule'
import { DataMethodology, ExecutiveOverview, HrInvestigationAreas, KeyWorkforceInsights, WorkforceScorecard, type PortfolioRecord } from './components/PortfolioSections'
import type { LabourMarketRecord } from './utils/labourMarketInsights'
import {
  calculateComparisons,
  metricLabels,
  type MetricComparison,
  type MetricId,
  type WorkforceObservation,
} from './utils/workforceInsights'

type SelectOption = { label: string; value: string }
type AttritionRecord = {
  country: string; year: number; metric: string; value: number; unit: string
  source_name: string; source_url: string; definition: string; methodology: string
  industry: string; geography: string; notes: string
}

const countries = [
  { label: 'India', value: 'India' },
  { label: 'United States', value: 'United States' },
]
const years = ['2022', '2023', '2024', '2025'].map((year) => ({ label: year, value: year }))
const industries = [...new Set(parseCsv(workforceCsv).map((row) => row.industry).filter(Boolean))].sort((a, b) => a === 'All Industries' ? -1 : b === 'All Industries' ? 1 : a.localeCompare(b)).map((industry) => ({ label: industry, value: industry }))
const countryColors: Record<string, string> = { India: '#3c6fa5', 'United States': '#8795a8' }
const charts: { metric: MetricId; title: string; subtitle: string }[] = [
  { metric: 'employee_engagement', title: 'Engagement Trend', subtitle: 'Employees engaged at work · three-year rolling average' },
  { metric: 'employee_wellbeing', title: 'Wellbeing Trend', subtitle: 'Employees thriving in life · three-year rolling average' },
  { metric: 'daily_stress', title: 'Daily Stress Trend', subtitle: 'Experienced stress previous day · three-year rolling average' },
]
const navItems = [
  { label: 'Overview', href: '#executive-overview-title' },
  { label: 'Country Comparison', href: '#comparison' },
  { label: 'People Experience', href: '#trends' },
  { label: 'Attrition', href: '#attrition' },
  { label: 'AI & Future of Work', href: '#ai-adoption' },
  { label: 'Labour Market', href: '#labour-market' },
  { label: 'HR Insights', href: '#key-insights' },
  { label: 'Data & Methodology', href: '#data-methodology' },
]

function parseCsv(csv: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index]
    if (char === '"') {
      if (quoted && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(field)
      field = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && csv[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field.length || row.length) {
    row.push(field)
    rows.push(row)
  }
  const [headers, ...records] = rows
  if (!headers) return []
  return records.map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ''])))
}

const observations: WorkforceObservation[] = parseCsv(workforceCsv).flatMap((row) => {
  const metric = row.metric as MetricId
  const value = Number(row.value)
  if (!(metric in metricLabels) || !Number.isFinite(value)) return []
  return [{ country: row.country, year: Number(row.year), metric, value, unit: row.unit, source_name: row.source_name, source_url: row.source_url }]
})
const portfolioRecords: PortfolioRecord[] = parseCsv(workforceCsv).flatMap((row) => {
  const value = Number(row.value)
  if (!Number.isFinite(value)) return []
  return [{ country: row.country, country_code: row.country_code, year: Number(row.year), metric: row.metric, value, unit: row.unit, source_name: row.source_name, source_url: row.source_url, definition: row.definition, methodology: row.methodology, industry: row.industry, geography: row.geography, notes: row.notes }]
})
const attritionRecords: AttritionRecord[] = parseCsv(workforceCsv).flatMap((row) => {
  const value = Number(row.value)
  if (!row.metric.endsWith('_attrition') || !Number.isFinite(value)) return []
  return [{
    country: row.country, year: Number(row.year), metric: row.metric, value, unit: row.unit,
    source_name: row.source_name, source_url: row.source_url, definition: row.definition,
    methodology: row.methodology, industry: row.industry, geography: row.geography, notes: row.notes,
  }]
})
const attritionSourceUrl = 'https://www.ey.com/en_in/insights/workforce/how-competitive-compensation-is-reshaping-the-future-of-pay'
const aiWorkforceRecords: AiWorkforceRecord[] = parseCsv(workforceCsv).flatMap((row) => {
  const value = Number(row.value)
  if (row.metric !== 'genai_workplace_use' || !Number.isFinite(value)) return []
  return [{
    country: row.country, country_code: row.country_code, year: Number(row.year), metric: row.metric,
    value, unit: row.unit, source_name: row.source_name, source_url: row.source_url,
    definition: row.definition, methodology: row.methodology, industry: row.industry,
    geography: row.geography, notes: row.notes,
  }]
})
const labourMarketRecords: LabourMarketRecord[] = parseCsv(workforceCsv).flatMap((row) => {
  const value = Number(row.value)
  if (!['unemployment_rate', 'labour_force_participation', 'employment_to_population'].includes(row.metric) || !Number.isFinite(value)) return []
  return [{
    country: row.country, country_code: row.country_code, year: Number(row.year), metric: row.metric,
    value, unit: row.unit, source_name: row.source_name, source_url: row.source_url,
    definition: row.definition, methodology: row.methodology, industry: row.industry,
    geography: row.geography, notes: row.notes,
  }]
})

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: SelectOption[]; onChange: (value: string) => void }) {
  return <label className="filter-field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function SectionHeading({ eyebrow, title, description, id }: { eyebrow: string; title: string; description?: string; id?: string }) {
  return <div className="section-heading"><div><span className="section-eyebrow">{eyebrow}</span><h2 id={id}>{title}</h2>{description && <p>{description}</p>}</div></div>
}

function GallupSourceIndicator({ comparison }: { comparison: MetricComparison }) {
  const hasSource = Boolean(comparison.sourceA || comparison.sourceB)
  return (
    <span className="gallup-source-indicator">
      <span className="source-check" aria-hidden="true">{hasSource ? '✓' : '!'}</span>
      {hasSource ? 'Based on Gallup data' : 'No Gallup data for this selection'}
      {comparison.sourceA && <a href={comparison.sourceA.url} target="_blank" rel="noreferrer"> · {comparison.countryA} source</a>}
      {comparison.sourceB && <a href={comparison.sourceB.url} target="_blank" rel="noreferrer"> · {comparison.countryB} source</a>}
    </span>
  )
}
function ValueCell({ country, value }: { country: string; value: number | null }) {
  return <div className="comparison-value-cell"><span className={`country-marker ${country === 'India' ? 'marker-a' : 'marker-b'}`} /><span>{country}</span><strong>{value === null ? '—' : `${value}%`}</strong></div>
}

function ComparisonCard({ comparison, industry }: { comparison: MetricComparison; industry: string }) {
  const available = industry === 'All Industries'
  const gap = available ? comparison.percentagePointDifference : null
  const higher = comparison.higherValueCountry
  return <article className="comparison-card comparison-detail-card"><div className="comparison-card-heading"><h3>{metricLabels[comparison.metric]}</h3><span className="comparison-year">{comparison.year}</span></div><div className="comparison-columns"><div className="comparison-column-labels"><span>{comparison.countryA}</span><span>{comparison.countryB}</span><span>Gap</span></div><div className="comparison-column-values"><ValueCell country={comparison.countryA} value={available ? comparison.valueA : null} /><ValueCell country={comparison.countryB} value={available ? comparison.valueB : null} /><div className="comparison-gap"><strong>{gap === null ? '—' : `${gap} pp`}</strong><span>{gap === null ? 'Unavailable' : 'percentage points'}</span></div></div></div><div className="higher-value-line">Higher observed value: <strong>{!available ? 'Not available' : gap === 0 ? 'Equal values' : higher ?? 'Not available'}</strong></div><GallupSourceIndicator comparison={comparison} /></article>
}

function ChartContainer({ metric, title, subtitle, countryA, countryB, selectedYear, industry }: { metric: MetricId; title: string; subtitle: string; countryA: string; countryB: string; selectedYear: number; industry: string }) {
  const chartData = useMemo(() => [2022, 2023, 2024, 2025].map((year) => {
    const a = observations.find((row) => row.country === countryA && row.metric === metric && row.year === year)
    const b = observations.find((row) => row.country === countryB && row.metric === metric && row.year === year)
    return { year: String(year), [countryA]: a?.value, [countryB]: b?.value }
  }), [countryA, countryB, metric])
  const hasData = countryA !== countryB && industry === 'All Industries' && chartData.some((point) => point[countryA] !== undefined || point[countryB] !== undefined)
  const sourceA = observations.find((row) => row.country === countryA && row.metric === metric && row.year === selectedYear)
  const sourceB = observations.find((row) => row.country === countryB && row.metric === metric && row.year === selectedYear)
  return <article className="chart-card"><div className="chart-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><span className="chart-period">Selected: {selectedYear}</span></div>{hasData ? <div className="chart-plot"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 18, bottom: 0, left: -18 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#e5eaf0' }} tick={{ fill: '#8794a4', fontSize: 10 }} /><YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: '#8794a4', fontSize: 9 }} tickFormatter={(value: number) => `${value}%`} /><Tooltip formatter={(value) => [`${value}%`, '']} contentStyle={{ border: '1px solid #e4e9ef', borderRadius: 6, fontSize: 10 }} /><Legend verticalAlign="top" height={30} iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: '#687990' }} /><ReferenceLine x={String(selectedYear)} stroke="#b6a16f" strokeDasharray="4 3" label={{ value: 'Selected', position: 'insideTopRight', fill: '#8b7954', fontSize: 8 }} /><Line type="monotone" dataKey={countryA} name={countryA} stroke={countryColors[countryA]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} connectNulls={false} /><Line type="monotone" dataKey={countryB} name={countryB} stroke={countryColors[countryB]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 4 }} connectNulls={false} /></LineChart></ResponsiveContainer></div> : <div className="chart-empty"><strong>{countryA === countryB ? 'Invalid filter combination' : industry !== 'All Industries' ? 'Data not available for this selection' : 'Data unavailable'}</strong><span>{countryA === countryB ? 'Choose two different countries to compare.' : 'No verified observation is shown for this selection.'}</span></div>}<div className="chart-source"><GallupSourceIndicator comparison={{ metric, year: selectedYear, countryA, countryB, valueA: null, valueB: null, absoluteDifference: null, percentagePointDifference: null, higherValueCountry: null, sourceA: industry === 'All Industries' && sourceA ? { name: sourceA.source_name, url: sourceA.source_url } : undefined, sourceB: industry === 'All Industries' && sourceB ? { name: sourceB.source_name, url: sourceB.source_url } : undefined }} /></div></article>
}

function AttritionIntelligence({ selectedYear, industry }: { selectedYear: number; industry: string }) {
  if (selectedYear !== 2025 || industry !== 'All Industries') {
    const overallForSelection = attritionRecords.find((record) => record.metric === 'overall_attrition' && record.year === selectedYear && record.industry === 'All Industries')
    const sectorForSelection = attritionRecords.find((record) => record.metric === 'sector_attrition' && record.year === selectedYear && record.industry === industry)
    const context = selectedYear !== 2025 && industry !== 'All Industries' ? `EY records for ${industry} are unavailable for ${selectedYear}.` : selectedYear !== 2025 ? `No EY attrition record is available for ${selectedYear}.` : `No sector attrition record is available for ${industry}.`
    return <section id="attrition" className="dashboard-section" aria-labelledby="attrition-heading"><SectionHeading eyebrow="INDIA · EY FUTURE OF PAY 2026" title="Attrition Intelligence" description="India-specific EY data. Comparable U.S. data pending." id="attrition-heading" /><div className="portfolio-overview-grid"><article className="portfolio-kpi"><span className="portfolio-kpi-source">EY India · All Industries</span><h3>Overall Attrition</h3><strong>{overallForSelection ? `${overallForSelection.value}%` : 'Data not available for this selection'}</strong><div className="portfolio-kpi-meta"><span>India</span><span>{selectedYear}</span></div>{overallForSelection && <a href={overallForSelection.source_url} target="_blank" rel="noreferrer">EY source ↗</a>}</article><article className="portfolio-kpi"><span className="portfolio-kpi-source">EY India · Sector</span><h3>Sector Attrition</h3><strong>{sectorForSelection ? `${sectorForSelection.value}%` : 'Data not available for this selection'}</strong><div className="portfolio-kpi-meta"><span>{industry}</span><span>{selectedYear}</span></div>{sectorForSelection && <a href={sectorForSelection.source_url} target="_blank" rel="noreferrer">EY source ↗</a>}</article><article className="portfolio-kpi"><span className="portfolio-kpi-source">Comparable data pending</span><h3>United States Attrition</h3><strong>Comparable U.S. data pending</strong><div className="portfolio-kpi-meta"><span>Comparable measure</span><span>{selectedYear}</span></div></article></div><div className="empty-state attrition-filter-state"><strong>{context}</strong><span>Voluntary/involuntary composition and the full sector distribution are available for 2025 and All Industries only.</span></div></section>
  }
  const overall = attritionRecords.filter((record) => record.metric === 'overall_attrition').sort((a, b) => a.year - b.year)
  const composition = attritionRecords.filter((record) => ['voluntary_attrition', 'involuntary_attrition'].includes(record.metric))
  const sectors = attritionRecords.filter((record) => record.metric === 'sector_attrition').sort((a, b) => b.value - a.value)
  const highest = sectors[0]
  const lowest = sectors[sectors.length - 1]
  const compositionData = composition.map((record) => ({ name: record.metric === 'voluntary_attrition' ? 'Voluntary' : 'Involuntary', value: record.value }))
  return <section id="attrition" className="dashboard-section" aria-labelledby="attrition-heading">
    <SectionHeading eyebrow="INDIA · EY FUTURE OF PAY 2026" title="Attrition Intelligence" description="India-specific employer survey/report figures. No U.S. attrition comparison is available in this release." id="attrition-heading" />
    <div className="attrition-top-grid">
      <article className="attrition-card"><div className="attrition-card-heading"><div><h3>Overall Attrition Trend</h3><p>Reported actuals · All Industries</p></div><span className="attrition-tag">India</span></div><div className="attrition-trend-plot"><ResponsiveContainer width="100%" height="100%"><LineChart data={overall.map((record) => ({ year: String(record.year), rate: record.value }))} margin={{ top: 12, right: 18, bottom: 0, left: -14 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#e5eaf0' }} tick={{ fill: '#8794a4', fontSize: 10 }} /><YAxis domain={[0, 30]} tickLine={false} axisLine={false} tick={{ fill: '#8794a4', fontSize: 9 }} tickFormatter={(value: number) => `${value}%`} /><Tooltip formatter={(value) => [`${value}%`, 'Overall attrition']} /><Line type="monotone" dataKey="rate" name="Overall attrition" stroke="#527da8" strokeWidth={2.5} dot={{ r: 4, fill: '#527da8' }} /></LineChart></ResponsiveContainer></div><div className="attrition-value-strip">{overall.map((record) => <div key={record.year}><span>{record.year}</span><strong>{record.value.toFixed(1)}%</strong></div>)}</div><a className="attrition-source" href={attritionSourceUrl} target="_blank" rel="noreferrer">EY India · Source and definitions below ↗</a></article>
      <article className="attrition-card"><div className="attrition-card-heading"><div><h3>Attrition Composition</h3><p>2025 · All Industries</p></div><span className="attrition-tag">India</span></div><div className="composition-visual"><div className="composition-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={compositionData} dataKey="value" nameKey="name" innerRadius="58%" outerRadius="82%" paddingAngle={2} stroke="none">{compositionData.map((entry, index) => <Cell key={entry.name} fill={index === 0 ? '#527da8' : '#b9c6d4'} />)}</Pie><Tooltip formatter={(value, name) => [`${value}%`, name]} /></PieChart></ResponsiveContainer><div className="composition-total"><strong>16.4%</strong><span>overall</span></div></div><div className="composition-legend">{composition.map((record) => <div key={record.metric}><span className={`composition-dot ${record.metric === 'voluntary_attrition' ? 'voluntary-dot' : 'involuntary-dot'}`} /><span>{record.metric === 'voluntary_attrition' ? 'Voluntary' : 'Involuntary'}<small>2025 · {record.industry}</small></span><strong>{record.value.toFixed(1)}%</strong></div>)}</div></div><a className="attrition-source" href={attritionSourceUrl} target="_blank" rel="noreferrer">EY India · Source and definitions below ↗</a></article>
    </div>
    <div className="attrition-sector-grid">
      <article className="attrition-card sector-chart-card"><div className="attrition-card-heading"><div><h3>Industry / Sector Comparison</h3><p>2025 reported sector attrition · sorted highest to lowest</p></div><span className="attrition-tag">16 sectors</span></div><div className="sector-chart" style={{ height: Math.max(430, sectors.length * 28) }}><ResponsiveContainer width="100%" height="100%"><BarChart data={sectors} layout="vertical" margin={{ top: 4, right: 35, bottom: 4, left: 2 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 3" horizontal={false} /><XAxis type="number" domain={[0, 30]} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={{ stroke: '#e5eaf0' }} tick={{ fill: '#8794a4', fontSize: 9 }} /><YAxis type="category" dataKey="industry" width={176} tickLine={false} axisLine={false} tick={{ fill: '#687990', fontSize: 9 }} /><Tooltip formatter={(value) => [`${value}%`, 'Attrition']} /><Bar dataKey="value" name="Attrition" fill="#6d8eaf" radius={[0, 3, 3, 0]} barSize={14} label={{ position: 'right', formatter: (value: number) => `${value.toFixed(1)}%`, fill: '#63768d', fontSize: 9 }} /></BarChart></ResponsiveContainer></div><a className="attrition-source" href={attritionSourceUrl} target="_blank" rel="noreferrer">EY India · 2025 Actual ↗</a></article>
      <div className="attrition-side-column"><article className="attrition-card sector-extremes"><div className="attrition-card-heading"><div><h3>Reported Sector Range</h3><p>Among sectors included in this dataset</p></div></div><div className="extreme-item"><span>Highest reported attrition</span><strong>{highest?.industry}</strong><b>{highest?.value.toFixed(1)}%</b></div><div className="extreme-item"><span>Lowest reported attrition</span><strong>{lowest?.industry}</strong><b>{lowest?.value.toFixed(1)}%</b></div><div className="extreme-gap">Difference <strong>{highest && lowest ? (highest.value - lowest.value).toFixed(1) : '—'} percentage points</strong></div></article><article className="attrition-card"><div className="attrition-card-heading"><div><h3>Country Comparison</h3><p>Comparable attrition measure coverage</p></div></div><div className="country-attrition-status"><span>India</span><strong>EY reported attrition data available</strong></div><div className="country-attrition-status pending"><span>United States</span><strong>Comparable data pending</strong></div></article><article className="attrition-card"><div className="attrition-card-heading"><div><h3>HR Investigation Prompts</h3><p>Observed differences only</p></div></div><p className="attrition-prompt">Potential area for retention investigation: {highest?.industry} reports the highest attrition among the sectors included in this dataset.</p><p className="attrition-prompt">Potential area for retention investigation: review sector-specific context and definitions before drawing comparisons or selecting actions.</p><span className="gallup-source-indicator"><span className="source-check" aria-hidden="true">✓</span>Based on EY India data · <a href={attritionSourceUrl} target="_blank" rel="noreferrer">source ↗</a></span></article></div>
    </div>
    <div className="attrition-method-warning"><strong>Methodology warning</strong><p>Attrition figures from EY are India-specific employer survey data and should not be treated as directly comparable with turnover or attrition figures from different studies unless definitions and methodology are aligned.</p></div>
    <details className="attrition-provenance"><summary>View metric definitions and source metadata for all attrition records ({attritionRecords.length})</summary><div className="attrition-table-wrap"><table><thead><tr><th>Year</th><th>Metric</th><th>Value</th><th>Industry</th><th>Geography</th><th>Definition / report context</th><th>Methodology</th><th>Source</th></tr></thead><tbody>{attritionRecords.map((record, index) => <tr key={`${record.metric}-${record.year}-${record.industry}-${index}`}><td>{record.year}</td><td>{record.metric}</td><td>{record.value.toFixed(1)}%</td><td>{record.industry}</td><td>{record.geography}</td><td>{record.definition}</td><td>{record.methodology}</td><td><a href={record.source_url} target="_blank" rel="noreferrer">{record.source_name} ↗</a></td></tr>)}</tbody></table></div></details>
  </section>
}

function App() {
  const [countryA, setCountryA] = useState('India')
  const [countryB, setCountryB] = useState('United States')
  const [year, setYear] = useState('2025')
  const [industry, setIndustry] = useState('All Industries')
  const comparisons = useMemo(() => countryA === countryB ? [] : calculateComparisons(industry === 'All Industries' ? observations : [], Number(year), countryA, countryB), [countryA, countryB, industry, year])

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#executive-summary" aria-label="PeopleScope overview"><span className="brand-mark"><span /></span><span className="brand-copy">PeopleScope<small>WORKFORCE INTELLIGENCE</small></span></a><span className="sidebar-label">WORKSPACE</span><nav className="side-nav" aria-label="Main navigation">{navItems.map((item, index) => <a className={index === 0 ? 'nav-link active' : 'nav-link'} href={item.href} key={item.href}><span className="nav-symbol" aria-hidden="true">{['◫', '◎', '↕', '✦', '◷', '⌁', '✧', '≡'][index]}</span>{item.label}</a>)}</nav><div className="sidebar-bottom"><span className="sidebar-avatar">PS</span><div><strong>PeopleScope</strong><small>Portfolio project</small></div><span className="more-icon">···</span></div></aside>
    <div className="main-column">
      <header className="topbar"><div className="breadcrumb"><span>Workspace</span><span className="crumb-separator">/</span><strong>Global Workforce Intelligence</strong></div><div className="topbar-actions"><span className="data-status"><i />Gallup data · 2022–2025</span><button className="avatar-button" aria-label="PeopleScope profile">PS</button></div></header>
      <main className="dashboard-content">
        <section className="page-intro" aria-labelledby="dashboard-title"><div><span className="section-eyebrow">PEOPLESCOPE · HR ANALYTICS / WORKFORCE INTELLIGENCE</span><h1 id="dashboard-title">Global Workforce Intelligence</h1><p>PeopleScope brings source-documented workforce measures into one view so HR teams can compare aligned indicators and examine country-specific context.</p><p className="page-scope-line"><strong>Currently covered:</strong> India and United States. Investigate employee experience, attrition, GenAI use and labour-market context.</p></div><a className="share-button report-link" href="#data-methodology">Explore data sources <span aria-hidden="true">↓</span></a></section>
        <section className="filter-bar" aria-label="Dashboard filters"><div className="filter-bar-heading"><span className="filter-glyph" aria-hidden="true">☷</span><strong>Filters</strong><span className="filter-count">4 active</span></div><div className="filter-controls"><FilterSelect label="Country A" value={countryA} options={countries} onChange={setCountryA} /><FilterSelect label="Country B" value={countryB} options={countries} onChange={setCountryB} /><FilterSelect label="Year" value={year} options={years} onChange={setYear} /><FilterSelect label="Industry" value={industry} options={industries} onChange={setIndustry} /></div></section>

        <ExecutiveOverview records={portfolioRecords} countryA={countryA} countryB={countryB} year={Number(year)} industry={industry} />
        <WorkforceScorecard records={portfolioRecords} countryA={countryA} countryB={countryB} year={Number(year)} industry={industry} />

        <section id="comparison" className="dashboard-section" aria-labelledby="comparison-heading"><div className="comparison-heading-row"><SectionHeading eyebrow="SIDE BY SIDE" title="Country Comparison" description={`${countryA} | ${countryB} | Gap · ${year} · percentage-point differences`} id="comparison-heading" /><span className="comparison-badge"><i /> Selected-year comparison</span></div>{comparisons.length ? <div className="comparison-detail-grid">{comparisons.map((comparison) => <ComparisonCard key={comparison.metric} comparison={comparison} industry={industry} />)}</div> : <div className="empty-state"><strong>{countryA === countryB ? 'Invalid filter combination' : 'Data not available for this selection'}</strong><span>{countryA === countryB ? 'Choose two different countries to compare.' : 'No comparable Gallup records match these filters.'}</span></div>}</section>

        <AttritionIntelligence selectedYear={Number(year)} industry={industry} />

        <AiAdoptionModule records={aiWorkforceRecords} selectedYear={Number(year)} industry={industry} />

        <LabourMarketModule records={labourMarketRecords} selectedYear={Number(year)} industry={industry} />

        <section id="trends" className="dashboard-section" aria-labelledby="trends-heading"><SectionHeading eyebrow="OVER TIME" title="Workforce Trends" description="Gallup three-year rolling averages ending in each year. The selected year is highlighted." id="trends-heading" /><div className="chart-grid">{charts.map((chart) => <ChartContainer key={chart.metric} {...chart} countryA={countryA} countryB={countryB} selectedYear={Number(year)} industry={industry} />)}</div></section>

        <KeyWorkforceInsights records={portfolioRecords} countryA={countryA} countryB={countryB} year={Number(year)} industry={industry} />
        <HrInvestigationAreas />

        <DataMethodology records={portfolioRecords} />
        <footer className="dashboard-footer"><div><strong>PeopleScope</strong><span>HR Analytics · Global Workforce Intelligence</span><small>Portfolio project. Data sources and methodology are documented in the dashboard.</small></div><nav aria-label="Footer links"><a href="#data-methodology">Data &amp; Methodology</a><a href="#data-methodology">Sources</a><span>Portfolio project</span></nav></footer>
      </main>
    </div>
  </div>
}

export default App

