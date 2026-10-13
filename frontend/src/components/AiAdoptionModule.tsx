import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { compareAiWorkplaceUse, type AiWorkforceRecord } from '../utils/aiWorkforceInsights'

const colors: Record<string, string> = { India: '#3c6fa5', 'United States': '#8795a8' }

export function AiAdoptionModule({ records, selectedYear, industry }: { records: AiWorkforceRecord[]; selectedYear: number; industry: string }) {
  const visibleRecords = industry === 'All Industries' ? records : []
  const comparison = compareAiWorkplaceUse(visibleRecords)
  const chartData = [...new Set(visibleRecords.map((record) => record.year))].sort((a, b) => a - b).map((year) => {
    const yearRecords = visibleRecords.filter((record) => record.year === year)
    return {
      year: String(year),
      India: yearRecords.find((record) => record.country === 'India')?.value,
      'United States': yearRecords.find((record) => record.country === 'United States')?.value,
    }
  })

  return <section id="ai-adoption" className="dashboard-section" aria-labelledby="ai-adoption-heading">
    <div className="section-heading"><div><span className="section-eyebrow">GENERATIVE AI · WORKPLACE USE</span><h2 id="ai-adoption-heading">AI Adoption &amp; Future of Work</h2><p>Verified knowledge-worker use from Microsoft and LinkedIn Work Trend Index 2024.</p></div></div>
    {selectedYear !== 2024 && industry === 'All Industries' && <div className="filter-context-note">No AI observation is available for selected year {selectedYear}. The labeled 2024 source observations below are retained as historical context.</div>}
    <div className="ai-overview-grid">
      {visibleRecords.map((record) => <article className="ai-data-card" key={`${record.country}-${record.year}`}><div className="attrition-card-heading"><div><h3>{record.country}</h3><p>Knowledge workers · {record.year}</p></div><span className="attrition-tag">Verified source</span></div><strong className="ai-value">{record.value}%</strong><p className="ai-definition"><strong>2024 knowledge-worker GenAI workplace use.</strong> Reported use of generative AI for work.</p><div className="ai-source-meta"><span>Source <b>Microsoft + LinkedIn</b></span><span>Year <b>{record.year}</b></span></div><a className="attrition-source" href={record.source_url} target="_blank" rel="noreferrer">View {record.country} source ↗</a></article>)}
      {visibleRecords.length === 0 && <div className="empty-state"><strong>Data not available for this selection</strong><span>The integrated AI survey observations cover All Industries.</span></div>}
    </div>

    <div className="ai-analysis-grid">
      <article className="ai-panel"><div className="attrition-card-heading"><div><h3>Country Comparison</h3><p>Same Work Trend Index measure · {comparison?.year ?? '—'}</p></div><span className="attrition-tag">Knowledge workers</span></div>
        {comparison ? <><div className="ai-comparison-values"><div><span>India</span><strong>{comparison.indiaValue}%</strong></div><div><span>United States</span><strong>{comparison.unitedStatesValue}%</strong></div><div><span>Gap</span><strong>{comparison.percentagePointDifference} pp</strong></div></div><p className="ai-neutral-note">Higher reported use: <strong>{comparison.higherValueCountry ?? 'Equal'}</strong>. A higher value describes reported use only; it does not establish better outcomes.</p></> : <p className="ai-neutral-note">Comparable country records are not currently available for the same definition, year, and methodology.</p>}
      </article>
      <article className="ai-panel"><div className="attrition-card-heading"><div><h3>AI Trend</h3><p>Reported workplace GenAI use by country</p></div><span className="attrition-tag">{chartData.length === 1 ? '1 year available' : `${chartData.length} years`}</span></div>
        {chartData.length ? <div className="ai-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 12, right: 16, bottom: 0, left: -12 }}><CartesianGrid stroke="#edf1f5" strokeDasharray="3 3" vertical={false} /><XAxis dataKey="year" tickLine={false} axisLine={{ stroke: '#e5eaf0' }} tick={{ fill: '#8794a4', fontSize: 10 }} /><YAxis domain={[0, 100]} tickFormatter={(value: number) => `${value}%`} tickLine={false} axisLine={false} tick={{ fill: '#8794a4', fontSize: 9 }} /><Tooltip formatter={(value) => [`${value}%`, 'Reported use']} /><Legend verticalAlign="top" height={28} iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 9, color: '#687990' }} /><Line type="monotone" dataKey="India" name="India" stroke={colors.India} strokeWidth={2} dot={{ r: 5 }} connectNulls={false} /><Line type="monotone" dataKey="United States" name="United States" stroke={colors['United States']} strokeWidth={2} dot={{ r: 5 }} connectNulls={false} /></LineChart></ResponsiveContainer></div> : <div className="empty-state ai-chart"><strong>Data not available for this selection</strong><span>The integrated AI survey observations cover All Industries.</span></div>}
        <p className="ai-chart-note">{chartData.length === 1 ? 'Only 2024 data is currently available; one year does not establish a trend.' : 'Only source-reported years are shown.'}</p>
      </article>
    </div>

    <div className="ai-hr-panel"><div className="attrition-card-heading"><div><h3>HR Implications</h3><p>Potential investigation topics; this dataset does not measure these outcomes.</p></div></div><div className="ai-prompt-grid">{['AI skills development', 'Employee training', 'Workforce capability', 'Job redesign', 'Responsible AI adoption'].map((topic) => <div className="ai-prompt" key={topic}><span aria-hidden="true">↗</span><p>Potential area to investigate: <strong>{topic.toLowerCase()}</strong>.</p></div>)}</div></div>

    <div className="ai-methodology"><strong>Methodology and comparability</strong><p>Both observations use the same Work Trend Index survey question and year, with knowledge workers defined as people who typically work at a desk. The 2024 survey was conducted online by Edelman Data &amp; Intelligence from February 15 to March 28 among 31,000 full-time employed or self-employed knowledge workers across 31 markets; 1,000 workers were surveyed in each market. The U.S. also had an additional 2,800-person sample across nine sub-regions/metros. The country comparison is aligned within this survey measure, but it represents knowledge workers rather than each country's entire workforce.</p><p className="ai-required-warning">This measure covers knowledge workers and should not be interpreted as adoption across the entire workforce.</p><p className="ai-required-warning">AI adoption metrics can vary substantially depending on whether they measure employee usage, employer adoption, frequency of use, access to AI tools, or organizational implementation. PeopleScope does not treat these measures as interchangeable.</p></div>

    <details className="attrition-provenance ai-provenance"><summary>View source metadata for AI records ({visibleRecords.length})</summary><div className="attrition-table-wrap"><table><thead><tr><th>Country</th><th>Year</th><th>Metric / value</th><th>Definition</th><th>Methodology</th><th>Industry</th><th>Geography</th><th>Source</th></tr></thead><tbody>{visibleRecords.map((record) => <tr key={record.country}><td>{record.country}</td><td>{record.year}</td><td>{record.metric}: {record.value}%</td><td>{record.definition}</td><td>{record.methodology}</td><td>{record.industry}</td><td>{record.geography}</td><td><a href={record.source_url} target="_blank" rel="noreferrer">{record.source_name} ↗</a></td></tr>)}</tbody></table></div></details>
  </section>
}
